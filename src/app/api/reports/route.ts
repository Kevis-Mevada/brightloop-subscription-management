export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const orgId = user!.organizationId!;

  try {
    const now = new Date();

    // Counts
    const totalCustomers = await prisma.customer.count({
      where: { organizationId: orgId },
    });

    const activeSubscriptionsCount = await prisma.subscription.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    });

    const totalSubscriptionsCount = await prisma.subscription.count({
      where: { organizationId: orgId },
    });

    // Subscriptions for MRR / ARR calculation
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      select: {
        totalAmount: true,
        billingFrequency: true,
      },
    });

    let mrr = 0;
    activeSubscriptions.forEach((sub) => {
      const amount = Number(sub.totalAmount);
      switch (sub.billingFrequency) {
        case "DAILY":
          mrr += amount * 30;
          break;
        case "WEEKLY":
          mrr += amount * 4.3333;
          break;
        case "MONTHLY":
          mrr += amount;
          break;
        case "YEARLY":
          mrr += amount / 12;
          break;
        default:
          mrr += amount;
      }
    });

    const arr = mrr * 12;

    // Payments collected
    const payments = await prisma.payment.findMany({
      where: { organizationId: orgId, status: "COMPLETED" },
      select: { amount: true },
    });
    const totalRevenueCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Invoices for outstanding and overdue
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["CONFIRMED", "OVERDUE"] },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
      },
    });

    let outstandingPayments = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    unpaidInvoices.forEach((inv) => {
      const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
      outstandingPayments += balance;
      if (new Date(inv.dueDate) < now) {
        overdueCount++;
        overdueAmount += balance;
      }
    });

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { organizationId: orgId },
      include: {
        customer: { select: { name: true, email: true } },
        invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 5,
    });

    // Upcoming renewals (in next 30 days)
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const upcomingRenewals = await prisma.subscription.findMany({
      where: {
        organizationId: orgId,
        status: "ACTIVE",
        nextBillingDate: {
          gte: now,
          lte: thirtyDaysAhead,
        },
      },
      include: {
        customer: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
      orderBy: { nextBillingDate: "asc" },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalCustomers,
          activeSubscriptions: activeSubscriptionsCount,
          totalSubscriptions: totalSubscriptionsCount,
          mrr: Math.round(mrr * 100) / 100,
          arr: Math.round(arr * 100) / 100,
          revenueCollected: Math.round(totalRevenueCollected * 100) / 100,
          outstandingPayments: Math.round(outstandingPayments * 100) / 100,
          overdueInvoices: overdueCount,
          overdueAmount: Math.round(overdueAmount * 100) / 100,
        },
        recentPayments,
        upcomingRenewals,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

