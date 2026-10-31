import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { calculateNextBillingDate } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customerId");

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(status ? { status: status as any } : {}),
        ...(customerId ? { customerId } : {}),
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: { product: true, variant: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: subscriptions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      customerId,
      planId,
      billingFrequency,
      startDate,
      endDate,
      paymentTerms,
      notes,
      lines,
    } = body;

    if (!customerId || !planId || !lines || lines.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer, plan, and at least one line item are required." },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, organizationId: user!.organizationId! },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }

    const count = await prisma.subscription.count({
      where: { organizationId: user!.organizationId! },
    });
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const parsedStart = startDate ? new Date(startDate) : new Date();
    const frequency = billingFrequency || plan.billingInterval;
    const nextBillingDate = calculateNextBillingDate(parsedStart, frequency);

    // Calculate lines
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const processedLines = lines.map((line: any) => {
      const qty = parseInt(line.quantity || 1);
      const unitPrice = parseFloat(line.unitPrice || 0);
      const discountRate = parseFloat(line.discountRate || 0);
      const taxRate = parseFloat(line.taxRate || 0);

      const lineSubtotal = qty * unitPrice;
      const lineDiscount = lineSubtotal * (discountRate / 100);
      const afterDiscount = lineSubtotal - lineDiscount;
      const lineTax = afterDiscount * (taxRate / 100);
      const lineTotal = afterDiscount + lineTax;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
      grandTotal += lineTotal;

      return {
        productId: line.productId,
        variantId: line.variantId || null,
        description: line.description || null,
        quantity: qty,
        unitPrice,
        discountRate,
        taxRate,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    const subscription = await prisma.$transaction(async (tx) => {
      const created = await tx.subscription.create({
        data: {
          organizationId: user!.organizationId!,
          subscriptionNumber,
          customerId,
          planId,
          status: "ACTIVE",
          billingFrequency: frequency,
          startDate: parsedStart,
          endDate: endDate ? new Date(endDate) : null,
          nextBillingDate,
          paymentTerms: paymentTerms || "Immediate",
          subtotal,
          discountAmount: totalDiscount,
          taxAmount: totalTax,
          totalAmount: grandTotal,
          notes: notes || null,
          lines: {
            create: processedLines,
          },
        },
        include: {
          customer: true,
          plan: true,
          lines: { include: { product: true, variant: true } },
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: created.id,
          action: "CREATED",
          newStatus: "ACTIVE",
          reason: `Manual subscription creation by ${user!.name}`,
          actorEmail: user!.email,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: subscription });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "Subscription ID and action are required." }, { status: 400 });
    }

    const sub = await prisma.subscription.findFirst({
      where: { id, organizationId: user!.organizationId! },
      include: { plan: true },
    });

    if (!sub) {
      return NextResponse.json({ success: false, error: "Subscription not found." }, { status: 404 });
    }

    let newStatus = sub.status;
    let nextBillingDate = sub.nextBillingDate;

    if (action === "PAUSE") {
      if (!sub.plan.allowPause) {
        return NextResponse.json({ success: false, error: "This subscription's plan does not allow pausing." }, { status: 400 });
      }
      newStatus = "PAUSED";
    } else if (action === "RESUME") {
      newStatus = "ACTIVE";
    } else if (action === "CANCEL") {
      if (!sub.plan.allowEarlyCancellation && sub.endDate && new Date() < sub.endDate) {
        return NextResponse.json({ success: false, error: "Early cancellation is not permitted for this plan." }, { status: 400 });
      }
      newStatus = "CLOSED";
    } else if (action === "RENEW") {
      newStatus = "ACTIVE";
      nextBillingDate = calculateNextBillingDate(new Date(), sub.billingFrequency);
    } else if (action === "CONFIRM") {
      newStatus = "CONFIRMED";
    } else if (action === "ACTIVATE") {
      newStatus = "ACTIVE";
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subscription.update({
        where: { id },
        data: {
          status: newStatus,
          nextBillingDate,
        },
        include: { customer: true, plan: true, lines: true },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: id,
          action,
          previousStatus: sub.status,
          newStatus,
          reason: reason || `Action '${action}' triggered by ${user!.name}`,
          actorEmail: user!.email,
        },
      });

      return s;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
