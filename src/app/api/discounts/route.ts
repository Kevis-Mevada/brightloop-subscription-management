export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const discounts = await prisma.discountRule.findMany({
      where: { organizationId: user!.organizationId! },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: discounts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      code,
      name,
      type,
      value,
      minSpend,
      minQuantity,
      startDate,
      endDate,
      usageLimit,
      productId,
    } = body;

    if (!code || !name || value === undefined) {
      return NextResponse.json({ success: false, error: "Discount code, name, and value are required." }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    const existing = await prisma.discountRule.findUnique({
      where: {
        organizationId_code: {
          organizationId: user!.organizationId!,
          code: trimmedCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Discount code '${trimmedCode}' already exists.` }, { status: 400 });
    }

    const discount = await prisma.discountRule.create({
      data: {
        organizationId: user!.organizationId!,
        code: trimmedCode,
        name: name.trim(),
        type: type || "PERCENTAGE",
        value: parseFloat(value),
        minSpend: minSpend ? parseFloat(minSpend) : null,
        minQuantity: minQuantity ? parseInt(minQuantity) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        productId: productId || null,
        status: true,
      },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: discount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, name, type, value, minSpend, minQuantity, startDate, endDate, usageLimit, productId, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Discount ID is required." }, { status: 400 });
    }

    const existing = await prisma.discountRule.findFirst({
      where: { id, organizationId: user!.organizationId! },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Discount not found." }, { status: 404 });
    }

    const updated = await prisma.discountRule.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(value !== undefined ? { value: parseFloat(value) } : {}),
        ...(minSpend !== undefined ? { minSpend: minSpend ? parseFloat(minSpend) : null } : {}),
        ...(minQuantity !== undefined ? { minQuantity: minQuantity ? parseInt(minQuantity) : null } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        ...(usageLimit !== undefined ? { usageLimit: usageLimit ? parseInt(usageLimit) : null } : {}),
        ...(productId !== undefined ? { productId: productId || null } : {}),
        ...(status !== undefined ? { status: Boolean(status) } : {}),
      },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

