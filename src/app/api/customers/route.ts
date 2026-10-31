export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");

  try {
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(status ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { companyName: { contains: search, mode: "insensitive" } },
                { customerNumber: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
            payments: true,
          },
        },
        user: {
          select: { id: true, email: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: customers });
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
      name,
      email,
      phone,
      companyName,
      billingAddress,
      shippingAddress,
      city,
      state,
      country,
      postalCode,
      notes,
      createPortalUser,
      portalPassword,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Customer name and email are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate customer email within tenant
    const existing = await prisma.customer.findUnique({
      where: {
        organizationId_email: {
          organizationId: user!.organizationId!,
          email: trimmedEmail,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A customer with this email already exists in your organization." },
        { status: 400 }
      );
    }

    // Auto-generate customer number
    const count = await prisma.customer.count({
      where: { organizationId: user!.organizationId! },
    });
    const customerNumber = `CUST-${String(count + 1).padStart(4, "0")}`;

    const customer = await prisma.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: {
          organizationId: user!.organizationId!,
          customerNumber,
          name: name.trim(),
          email: trimmedEmail,
          phone: phone || null,
          companyName: companyName || null,
          billingAddress: billingAddress || null,
          shippingAddress: shippingAddress || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: postalCode || null,
          notes: notes || null,
          status: "ACTIVE",
        },
      });

      // Optionally create portal login
      if (createPortalUser && portalPassword) {
        const passwordHash = await hashPassword(portalPassword);
        await tx.user.create({
          data: {
            organizationId: user!.organizationId!,
            customerId: createdCustomer.id,
            name: createdCustomer.name,
            email: trimmedEmail,
            passwordHash,
            role: "CUSTOMER",
            status: "ACTIVE",
            emailVerified: new Date(),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: user!.organizationId!,
          userId: user!.id,
          action: "CREATE_CUSTOMER",
          entity: "Customer",
          entityId: createdCustomer.id,
          details: JSON.stringify({ name: createdCustomer.name, email: createdCustomer.email, number: customerNumber }),
        },
      });

      return createdCustomer;
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, name, phone, companyName, billingAddress, shippingAddress, city, state, country, postalCode, notes, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: { id, organizationId: user!.organizationId! },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(companyName !== undefined ? { companyName } : {}),
        ...(billingAddress !== undefined ? { billingAddress } : {}),
        ...(shippingAddress !== undefined ? { shippingAddress } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(postalCode !== undefined ? { postalCode } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
