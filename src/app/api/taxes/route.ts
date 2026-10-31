export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const taxes = await prisma.taxRule.findMany({
      where: { organizationId: user!.organizationId! },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: taxes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, rate, isInclusive, isDefault } = body;

    if (!name || rate === undefined) {
      return NextResponse.json({ success: false, error: "Tax name and rate are required." }, { status: 400 });
    }

    const tax = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        // unset other defaults
        await tx.taxRule.updateMany({
          where: { organizationId: user!.organizationId!, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRule.create({
        data: {
          organizationId: user!.organizationId!,
          name: name.trim(),
          rate: parseFloat(rate),
          isInclusive: Boolean(isInclusive),
          isDefault: Boolean(isDefault),
          status: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: tax });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, name, rate, isInclusive, isDefault, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Tax ID is required." }, { status: 400 });
    }

    const existing = await prisma.taxRule.findFirst({
      where: { id, organizationId: user!.organizationId! },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Tax rule not found." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.taxRule.updateMany({
          where: { organizationId: user!.organizationId!, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.taxRule.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(rate !== undefined ? { rate: parseFloat(rate) } : {}),
          ...(isInclusive !== undefined ? { isInclusive: Boolean(isInclusive) } : {}),
          ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
          ...(status !== undefined ? { status: Boolean(status) } : {}),
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

