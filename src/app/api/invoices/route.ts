export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customerId");

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(status ? { status: status as any } : {}),
        ...(customerId ? { customerId } : {}),
      },
      include: {
        customer: true,
        subscription: true,
        lines: {
          include: { product: true, variant: true },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { customerId, subscriptionId, dueDate, notes, terms, lines } = body;

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer and at least one line item are required." },
        { status: 400 }
      );
    }

    const count = await prisma.invoice.count({
      where: { organizationId: user!.organizationId! },
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

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
        description: line.description || "Manual Invoice Line",
        quantity: qty,
        unitPrice,
        discountRate,
        taxRate,
        subtotal: lineSubtotal,
        total: lineTotal,
      };
    });

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          organizationId: user!.organizationId!,
          invoiceNumber,
          customerId,
          subscriptionId: subscriptionId || null,
          status: "CONFIRMED",
          issueDate: new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 86400000),
          subtotal,
          discountAmount: totalDiscount,
          taxAmount: totalTax,
          totalAmount: grandTotal,
          paidAmount: 0,
          notes: notes || null,
          terms: terms || null,
          lines: {
            create: processedLines,
          },
        },
        include: {
          customer: true,
          lines: { include: { product: true, variant: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user!.organizationId!,
          userId: user!.id,
          action: "CREATE_INVOICE",
          entity: "Invoice",
          entityId: created.id,
          details: JSON.stringify({ invoiceNumber: created.invoiceNumber, total: grandTotal }),
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Invoice ID and status are required." }, { status: 400 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId: user!.organizationId! },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { customer: true, lines: true, payments: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

