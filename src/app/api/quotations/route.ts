import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { calculateNextBillingDate } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  try {
    const quotations = await prisma.quotation.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: { product: true, variant: true },
        },
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: quotations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { customerId, planId, validUntil, notes, terms, lines } = body;

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer and at least one line item are required." },
        { status: 400 }
      );
    }

    // Auto-generate quotation number
    const count = await prisma.quotation.count({
      where: { organizationId: user!.organizationId! },
    });
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Calculate line subtotals, taxes, discounts, totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const processedLines = lines.map((line: any) => {
      const qty = parseInt(line.quantity || 1);
      const unitPrice = parseFloat(line.unitPrice || 0);
      const discountRate = parseFloat(line.discountRate || 0); // e.g. 10 for 10%
      const taxRate = parseFloat(line.taxRate || 0); // e.g. 18 for 18%

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

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          organizationId: user!.organizationId!,
          quotationNumber,
          customerId,
          planId: planId || null,
          status: "DRAFT",
          validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 86400000),
          subtotal,
          discountAmount: totalDiscount,
          taxAmount: totalTax,
          totalAmount: grandTotal,
          notes: notes || null,
          terms: terms || null,
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

      await tx.auditLog.create({
        data: {
          organizationId: user!.organizationId!,
          userId: user!.id,
          action: "CREATE_QUOTATION",
          entity: "Quotation",
          entityId: created.id,
          details: JSON.stringify({ number: quotationNumber, total: grandTotal }),
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: quotation });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, status, convertToSubscription } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Quotation ID is required." }, { status: 400 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, organizationId: user!.organizationId! },
      include: {
        customer: true,
        plan: true,
        lines: true,
        subscription: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found." }, { status: 404 });
    }

    // Handle 1-click Conversion of ACCEPTED quotation into Subscription
    if (convertToSubscription) {
      if (quotation.subscription) {
        return NextResponse.json(
          { success: false, error: "A subscription has already been created for this quotation." },
          { status: 400 }
        );
      }

      if (!quotation.planId) {
        return NextResponse.json(
          { success: false, error: "Quotation must have an associated subscription plan to convert." },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Mark quotation as ACCEPTED
        await tx.quotation.update({
          where: { id: quotation.id },
          data: { status: "ACCEPTED" },
        });

        // Generate subscription number
        const subCount = await tx.subscription.count({
          where: { organizationId: user!.organizationId! },
        });
        const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 1).padStart(4, "0")}`;

        const plan = await tx.plan.findUniqueOrThrow({
          where: { id: quotation.planId! },
        });

        const startDate = new Date();
        const nextBillingDate = calculateNextBillingDate(startDate, plan.billingInterval);

        const newSubscription = await tx.subscription.create({
          data: {
            organizationId: user!.organizationId!,
            subscriptionNumber,
            customerId: quotation.customerId,
            planId: quotation.planId!,
            quotationId: quotation.id,
            status: "ACTIVE",
            billingFrequency: plan.billingInterval,
            startDate,
            nextBillingDate,
            subtotal: quotation.subtotal,
            discountAmount: quotation.discountAmount,
            taxAmount: quotation.taxAmount,
            totalAmount: quotation.totalAmount,
            paymentTerms: quotation.terms || "Net 15",
            notes: `Converted from Quotation ${quotation.quotationNumber}`,
            lines: {
              create: quotation.lines.map((ql) => ({
                productId: ql.productId,
                variantId: ql.variantId,
                description: ql.description,
                quantity: ql.quantity,
                unitPrice: ql.unitPrice,
                discountRate: ql.discountRate,
                taxRate: ql.taxRate,
                subtotal: ql.subtotal,
                total: ql.total,
              })),
            },
          },
          include: {
            customer: true,
            plan: true,
            lines: true,
          },
        });

        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: newSubscription.id,
            action: "CREATED",
            newStatus: "ACTIVE",
            reason: `Generated from accepted Quotation ${quotation.quotationNumber}`,
            actorEmail: user!.email,
          },
        });

        return newSubscription;
      });

      return NextResponse.json({
        success: true,
        message: "Quotation accepted and converted to Subscription successfully.",
        data: result,
      });
    }

    // Normal status update
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
