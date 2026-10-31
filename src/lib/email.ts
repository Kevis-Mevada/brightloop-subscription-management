import { Resend } from "resend";
import prisma from "./db";

const resendApiKey = process.env.RESEND_API_KEY || "missing-resend-api-key";
const resend = new Resend(resendApiKey);

// Default sender in test mode for Resend is onboarding@resend.dev
const DEFAULT_FROM = process.env.EMAIL_FROM || "Brightloop <onboarding@resend.dev>";

export interface SendEmailOptions {
  organizationId: string;
  to: string;
  subject: string;
  templateName: string;
  html: string;
}

export async function sendEmail({
  organizationId,
  to,
  subject,
  templateName,
  html,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    });

    if (data.error) {
      console.error("[Email Error]:", data.error);
      await prisma.emailLog.create({
        data: {
          organizationId,
          recipientEmail: to,
          subject,
          templateName,
          status: "FAILED",
          errorMessage: data.error.message || "Failed to send email via Resend",
        },
      });
      return { success: false, error: data.error.message };
    }

    await prisma.emailLog.create({
      data: {
        organizationId,
        recipientEmail: to,
        subject,
        templateName,
        resendId: data.data?.id,
        status: "SENT",
      },
    });

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error("[Email Exception]:", error);
    try {
      await prisma.emailLog.create({
        data: {
          organizationId,
          recipientEmail: to,
          subject,
          templateName,
          status: "FAILED",
          errorMessage: error?.message || "Unknown error",
        },
      });
    } catch (e) {
      // Ignore secondary DB error
    }
    return { success: false, error: error?.message || "Internal server error" };
  }
}

// -------------------------------------------------------------
// HTML TEMPLATE BUILDERS
// -------------------------------------------------------------

function emailLayout(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #1e40af; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Brightloop</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Multi-Tenant Subscription Management</p>
          </div>
          <div style="padding: 32px 24px;">
            ${content}
          </div>
          <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Brightloop Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getVerificationEmailHtml(name: string, verifyUrl: string): string {
  return emailLayout(
    "Verify your email",
    `
      <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${name}!</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Please confirm your email address by clicking the button below to activate your Brightloop account.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:<br><a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a></p>
    `
  );
}

export function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return emailLayout(
    "Reset your password",
    `
      <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hello ${name}, we received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email.</p>
    `
  );
}

export function getInvoiceEmailHtml(
  customerName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  viewUrl: string
): string {
  return emailLayout(
    `Invoice ${invoiceNumber}`,
    `
      <h2 style="color: #0f172a; margin-top: 0;">Invoice ${invoiceNumber}</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Dear ${customerName}, your invoice is ready. Please find the details below:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong style="color: #334155;">Invoice Number:</strong>
          <span style="color: #0f172a;">${invoiceNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong style="color: #334155;">Amount Due:</strong>
          <span style="color: #16a34a; font-weight: 700;">${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <strong style="color: #334155;">Due Date:</strong>
          <span style="color: #0f172a;">${dueDate}</span>
        </div>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${viewUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View & Pay Invoice</a>
      </div>
    `
  );
}

export function getPaymentReceiptEmailHtml(
  customerName: string,
  paymentNumber: string,
  amount: string,
  invoiceNumber: string
): string {
  return emailLayout(
    `Payment Receipt ${paymentNumber}`,
    `
      <h2 style="color: #0f172a; margin-top: 0;">Payment Received - Thank You!</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Dear ${customerName}, we have successfully recorded your payment of <strong>${amount}</strong> for Invoice <strong>${invoiceNumber}</strong>.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="color: #166534; font-size: 14px; margin: 0;">Receipt Number: <strong>${paymentNumber}</strong></p>
      </div>
    `
  );
}

export function getRenewalReminderEmailHtml(
  customerName: string,
  subscriptionNumber: string,
  renewalDate: string,
  amount: string
): string {
  return emailLayout(
    `Upcoming Subscription Renewal: ${subscriptionNumber}`,
    `
      <h2 style="color: #0f172a; margin-top: 0;">Upcoming Subscription Renewal</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.5;">Dear ${customerName}, this is a friendly reminder that your subscription <strong>${subscriptionNumber}</strong> is scheduled to renew on <strong>${renewalDate}</strong> for the amount of <strong>${amount}</strong>.</p>
      <p style="color: #64748b; font-size: 13px;">You can view and manage your subscription settings anytime from your customer portal.</p>
    `
  );
}
