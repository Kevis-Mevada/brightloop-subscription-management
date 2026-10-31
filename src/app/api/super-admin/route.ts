import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const totalOrganizations = await prisma.organization.count();
    const activeOrganizations = await prisma.organization.count({
      where: { isSuspended: false },
    });
    const suspendedOrganizations = await prisma.organization.count({
      where: { isSuspended: true },
    });
    const totalPlatformUsers = await prisma.user.count();

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            subscriptions: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalOrganizations,
          activeOrganizations,
          suspendedOrganizations,
          totalPlatformUsers,
        },
        organizations,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { organizationId, isSuspended } = body;

    if (!organizationId || isSuspended === undefined) {
      return NextResponse.json(
        { success: false, error: "organizationId and isSuspended are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { isSuspended: Boolean(isSuspended) },
    });

    return NextResponse.json({
      success: true,
      message: `Organization ${isSuspended ? "suspended" : "activated"} successfully.`,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

