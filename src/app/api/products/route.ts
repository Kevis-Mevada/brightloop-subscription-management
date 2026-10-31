import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId: user!.organizationId!,
        ...(status ? { status: status as any } : {}),
        ...(type ? { productType: type as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, code, description, notes, productType, salesPrice, costPrice, variants } = body;

    if (!name || !code || salesPrice === undefined) {
      return NextResponse.json(
        { success: false, error: "Product name, code, and sales price are required." },
        { status: 400 }
      );
    }

    // Check duplicate code within tenant
    const existing = await prisma.product.findUnique({
      where: {
        organizationId_code: {
          organizationId: user!.organizationId!,
          code: code.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Product code '${code}' is already in use.` },
        { status: 400 }
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          organizationId: user!.organizationId!,
          name: name.trim(),
          code: code.trim(),
          description: description || null,
          notes: notes || null,
          productType: productType || "SERVICE",
          salesPrice: parseFloat(salesPrice),
          costPrice: costPrice !== undefined ? parseFloat(costPrice) : 0,
          status: "ACTIVE",
          variants: variants && variants.length > 0
            ? {
                create: variants.map((v: any) => ({
                  name: v.name,
                  sku: v.sku || null,
                  priceAdjustment: parseFloat(v.priceAdjustment || 0),
                  isDefault: Boolean(v.isDefault),
                })),
              }
            : undefined,
        },
        include: {
          variants: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user!.organizationId!,
          userId: user!.id,
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: created.id,
          details: JSON.stringify({ name: created.name, code: created.code, price: created.salesPrice }),
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, name, code, description, notes, productType, salesPrice, costPrice, status, variants } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    }

    // Verify tenant ownership
    const product = await prisma.product.findFirst({
      where: { id, organizationId: user!.organizationId! },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found or unauthorized." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If variants are provided, replace them or update
      if (variants && Array.isArray(variants)) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        for (const v of variants) {
          await tx.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              sku: v.sku || null,
              priceAdjustment: parseFloat(v.priceAdjustment || 0),
              isDefault: Boolean(v.isDefault),
            },
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(code ? { code: code.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(notes !== undefined ? { notes } : {}),
          ...(productType ? { productType } : {}),
          ...(salesPrice !== undefined ? { salesPrice: parseFloat(salesPrice) } : {}),
          ...(costPrice !== undefined ? { costPrice: parseFloat(costPrice) } : {}),
          ...(status ? { status } : {}),
        },
        include: { variants: true },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
