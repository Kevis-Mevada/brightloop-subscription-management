import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  try {
    const plans = await prisma.plan.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        planProducts: {
          include: { product: true },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: plans });
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
      code,
      description,
      price,
      billingInterval,
      minimumQuantity,
      startDate,
      endDate,
      autoClose,
      allowPause,
      allowEarlyCancellation,
      productIds,
    } = body;

    if (!name || !code || price === undefined || !billingInterval) {
      return NextResponse.json(
        { success: false, error: "Plan name, code, price, and billing interval are required." },
        { status: 400 }
      );
    }

    // Check duplicate code
    const existing = await prisma.plan.findUnique({
      where: {
        organizationId_code: {
          organizationId: user!.organizationId!,
          code: code.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Plan code '${code}' already exists.` },
        { status: 400 }
      );
    }

    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.plan.create({
        data: {
          organizationId: user!.organizationId!,
          name: name.trim(),
          code: code.trim(),
          description: description || null,
          price: parseFloat(price),
          billingInterval,
          minimumQuantity: minimumQuantity ? parseInt(minimumQuantity) : 1,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          autoClose: Boolean(autoClose),
          allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
          allowEarlyCancellation: allowEarlyCancellation !== undefined ? Boolean(allowEarlyCancellation) : true,
          status: "ACTIVE",
          planProducts: productIds && productIds.length > 0
            ? {
                create: productIds.map((pid: string) => ({
                  productId: pid,
                  quantity: 1,
                })),
              }
            : undefined,
        },
        include: {
          planProducts: {
            include: { product: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user!.organizationId!,
          userId: user!.id,
          action: "CREATE_PLAN",
          entity: "Plan",
          entityId: created.id,
          details: JSON.stringify({ name: created.name, code: created.code, interval: created.billingInterval }),
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      id,
      name,
      code,
      description,
      price,
      billingInterval,
      minimumQuantity,
      startDate,
      endDate,
      autoClose,
      allowPause,
      allowEarlyCancellation,
      status,
      productIds,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Plan ID is required." }, { status: 400 });
    }

    const plan = await prisma.plan.findFirst({
      where: { id, organizationId: user!.organizationId! },
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (productIds && Array.isArray(productIds)) {
        await tx.planProduct.deleteMany({ where: { planId: id } });
        for (const pid of productIds) {
          await tx.planProduct.create({
            data: { planId: id, productId: pid, quantity: 1 },
          });
        }
      }

      return tx.plan.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(code ? { code: code.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(price !== undefined ? { price: parseFloat(price) } : {}),
          ...(billingInterval ? { billingInterval } : {}),
          ...(minimumQuantity !== undefined ? { minimumQuantity: parseInt(minimumQuantity) } : {}),
          ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
          ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
          ...(autoClose !== undefined ? { autoClose: Boolean(autoClose) } : {}),
          ...(allowPause !== undefined ? { allowPause: Boolean(allowPause) } : {}),
          ...(allowEarlyCancellation !== undefined ? { allowEarlyCancellation: Boolean(allowEarlyCancellation) } : {}),
          ...(status ? { status } : {}),
        },
        include: {
          planProducts: { include: { product: true } },
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
