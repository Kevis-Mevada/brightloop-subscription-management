import prisma from "./db";
import { BillingInterval } from "./types";

export function calculateNextBillingDate(currentDate: Date, interval: BillingInterval): Date {
  const next = new Date(currentDate);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export interface BillingRunResult {
  jobId: string;
  subscriptionsProcessed: number;
  invoicesGenerated: number;
  errors: string[];
  durationMs: number;
}

export async function processRecurringBilling(organizationId: string): Promise<BillingRunResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let subscriptionsProcessed = 0;
  let invoicesGenerated = 0;

  // Create pending job log
  const job = await prisma.billingJob.create({
    data: {
      organizationId,
      status: "RUNNING",
    },
  });

  try {
    const now = new Date();

    // Fetch active subscriptions that are due for billing
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        nextBillingDate: {
          lte: now,
        },
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    subscriptionsProcessed = dueSubscriptions.length;

    for (const sub of dueSubscriptions) {
      try {
        const periodStart = new Date(sub.nextBillingDate);
        const periodEnd = calculateNextBillingDate(periodStart, sub.billingFrequency);

        // Generate robust idempotency key
        const startStr = periodStart.toISOString().slice(0, 10);
        const endStr = periodEnd.toISOString().slice(0, 10);
        const idempotencyKey = `SUB-${sub.id}-${startStr}-${endStr}`;

        // Check if invoice already exists with this idempotency key
        const existingInvoice = await prisma.invoice.findUnique({
          where: { idempotencyKey },
        });

        if (existingInvoice) {
          // Already generated, advance nextBillingDate safely
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              nextBillingDate: periodEnd,
              lastBilledDate: now,
            },
          });
          continue;
        }

        // Run in an atomic Prisma transaction
        await prisma.$transaction(async (tx) => {
          // Generate unique invoice number
          const invoiceCount = await tx.invoice.count({
            where: { organizationId },
          });
          const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(5, "0")}`;

          // Due date is based on payment terms, default +15 days
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + 15);

          // Create Invoice
          const invoice = await tx.invoice.create({
            data: {
              organizationId,
              invoiceNumber,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              billingPeriodStart: periodStart,
              billingPeriodEnd: periodEnd,
              idempotencyKey,
              status: "CONFIRMED",
              issueDate: now,
              dueDate,
              subtotal: sub.subtotal,
              discountAmount: sub.discountAmount,
              taxAmount: sub.taxAmount,
              totalAmount: sub.totalAmount,
              notes: `Automated recurring billing for Subscription ${sub.subscriptionNumber} (${startStr} to ${endStr})`,
              terms: sub.paymentTerms,
              lines: {
                create: sub.lines.map((line) => ({
                  productId: line.productId,
                  variantId: line.variantId,
                  description: line.description || `${sub.plan.name} - Billing Line`,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  discountRate: line.discountRate,
                  taxRate: line.taxRate,
                  subtotal: line.subtotal,
                  total: line.total,
                })),
              },
            },
          });

          // Check if subscription should auto-close
          let newStatus = sub.status;
          if (sub.endDate && periodEnd >= sub.endDate) {
            newStatus = "CLOSED";
          }

          // Advance subscription billing dates
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              status: newStatus,
              nextBillingDate: periodEnd,
              lastBilledDate: now,
            },
          });

          // Log subscription history
          await tx.subscriptionHistory.create({
            data: {
              subscriptionId: sub.id,
              action: "BILLED",
              previousStatus: sub.status,
              newStatus,
              reason: `Recurring invoice ${invoice.invoiceNumber} generated for period ${startStr} to ${endStr}.`,
              actorEmail: "system@brightloop.io",
            },
          });

          invoicesGenerated++;
        });
      } catch (subErr: any) {
        console.error(`Error billing subscription ${sub.id}:`, subErr);
        errors.push(`Subscription ${sub.subscriptionNumber}: ${subErr.message}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // Update job status
    await prisma.billingJob.update({
      where: { id: job.id },
      data: {
        status: errors.length > 0 && invoicesGenerated === 0 ? "FAILED" : "SUCCESS",
        subscriptionsProcessed,
        invoicesGenerated,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
        executionTimeMs: durationMs,
      },
    });

    return {
      jobId: job.id,
      subscriptionsProcessed,
      invoicesGenerated,
      errors,
      durationMs,
    };
  } catch (jobErr: any) {
    const durationMs = Date.now() - startTime;
    await prisma.billingJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: jobErr.message,
        executionTimeMs: durationMs,
      },
    });
    throw jobErr;
  }
}
