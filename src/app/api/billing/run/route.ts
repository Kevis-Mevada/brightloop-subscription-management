export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { processRecurringBilling } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN", "STAFF"]);
  if (errorResponse) return errorResponse;

  try {
    const jobs = await prisma.billingJob.findMany({
      where: { organizationId: user!.organizationId! },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, data: jobs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await authenticateApiRequest(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const result = await processRecurringBilling(user!.organizationId!);
    return NextResponse.json({
      success: true,
      message: `Billing run finished: ${result.invoicesGenerated} invoices generated from ${result.subscriptionsProcessed} due subscriptions.`,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

