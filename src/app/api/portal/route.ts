import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["CUSTOMER", "SUPER_ADMIN", "ORGANIZATION_ADMIN"]);
  if (errorResponse) return errorResponse;

  if (!user!.customerId && user!.role === "CUSTOMER") {
    return NextResponse.json({ success: false, error: "Customer profile not linked." }, { status: 400 });
  }

  const customerId = user!.customerId!;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        subscriptions: {
          include: {
            plan: true,
            lines: { include: { product: true, variant: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          include: {
            lines: { include: { product: true, variant: true } },
            payments: true,
          },
          orderBy: { issueDate: "desc" },
        },
        payments: {
          include: {
            invoice: { select: { invoiceNumber: true } },
          },
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["CUSTOMER"]);
  if (errorResponse) return errorResponse;

  const customerId = user!.customerId!;

  try {
    const body = await req.json();
    const { phone, billingAddress, city, postalCode, country } = body;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        phone: phone || null,
        billingAddress: billingAddress || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

