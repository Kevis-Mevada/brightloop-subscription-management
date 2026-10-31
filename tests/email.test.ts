import { describe, it, expect } from "vitest";
import {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getInvoiceEmailHtml,
  getPaymentReceiptEmailHtml,
  getRenewalReminderEmailHtml,
} from "../src/lib/email";

describe("Email Notification System", () => {
  it("renders verification email HTML template with button link and name", () => {
    const html = getVerificationEmailHtml("Alex", "https://brightloop.io/verify?token=abc");
    expect(html).toContain("Welcome, Alex!");
    expect(html).toContain("https://brightloop.io/verify?token=abc");
    expect(html).toContain("Verify Email Address");
  });

  it("renders password reset email HTML template", () => {
    const html = getPasswordResetEmailHtml("Sarah", "https://brightloop.io/reset?token=xyz");
    expect(html).toContain("Password Reset Request");
    expect(html).toContain("https://brightloop.io/reset?token=xyz");
  });

  it("renders invoice email HTML template with invoice number and amounts", () => {
    const html = getInvoiceEmailHtml("Alex", "INV-2026-00001", "$1,869.12", "Nov 15, 2026", "https://brightloop.io/portal/invoices");
    expect(html).toContain("INV-2026-00001");
    expect(html).toContain("$1,869.12");
    expect(html).toContain("Nov 15, 2026");
  });

  it("renders payment receipt email HTML template", () => {
    const html = getPaymentReceiptEmailHtml("Alex", "PAY-2026-00001", "$1,869.12", "INV-2026-00001");
    expect(html).toContain("PAY-2026-00001");
    expect(html).toContain("$1,869.12");
    expect(html).toContain("INV-2026-00001");
  });

  it("renders upcoming renewal reminder HTML template", () => {
    const html = getRenewalReminderEmailHtml("Alex", "SUB-2026-0001", "Dec 1, 2026", "$1,869.12");
    expect(html).toContain("SUB-2026-0001");
    expect(html).toContain("Dec 1, 2026");
    expect(html).toContain("$1,869.12");
  });
});

