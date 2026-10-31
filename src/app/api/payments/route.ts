import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { sendEmail, getPaymentReceiptEmailHtml } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  const invoiceId = url.searchParams.get("invoiceId");

  try {
    const payments = await prisma.payment.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(customerId ? { customerId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      },
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { invoiceId, amount, paymentMethod, transactionReference, notes, paymentDate } = body;

    if (!invoiceId || amount === undefined || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid invoice ID and payment amount are required." },
        { status: 400 }
      );
    }

    const payAmount = parseFloat(amount);

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: user!.organizationId! },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }

    const outstandingBalance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (payAmount > outstandingBalance + 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount (${formatCurrency(payAmount)}) exceeds invoice outstanding balance (${formatCurrency(outstandingBalance)}).`,
        },
        { status: 400 }
      );
    }

    const count = await prisma.payment.count({
      where: { organizationId: user!.organizationId! },
    });
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          organizationId: user!.organizationId!,
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: payAmount,
          paymentMethod: paymentMethod || "BANK_TRANSFER",
          transactionReference: transactionReference || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          status: "COMPLETED",
          notes: notes || null,
        },
      });

      const newPaidAmount = Number(invoice.paidAmount) + payAmount;
      const isPaidInFull = newPaidAmount >= Number(invoice.totalAmount) - 0.01;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: isPaidInFull ? "PAID" : invoice.status,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user!.organizationId!,
          userId: user!.id,
          action: "RECORD_PAYMENT",
          entity: "Payment",
          entityId: createdPayment.id,
          details: JSON.stringify({
            paymentNumber,
            amount: payAmount,
            invoiceNumber: invoice.invoiceNumber,
            isPaidInFull,
          }),
        },
      });

      return createdPayment;
    });

    // Send receipt email
    sendEmail({
      organizationId: user!.organizationId!,
      to: invoice.customer.email,
      subject: `Payment Receipt: ${paymentNumber} for Invoice ${invoice.invoiceNumber}`,
      templateName: "payment_receipt",
      html: getPaymentReceiptEmailHtml(
        invoice.customer.name,
        paymentNumber,
        formatCurrency(payAmount),
        invoice.invoiceNumber
      ),
    }).catch((e) => console.error("Email send receipt error:", e));

    return NextResponse.json({ success: true, data: payment });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

