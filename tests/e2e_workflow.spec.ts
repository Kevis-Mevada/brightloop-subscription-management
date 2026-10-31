import { test, expect } from "@playwright/test";

test.describe("Brightloop Multi-Tenant E2E Lifecycle", () => {
  test("Complete Subscription and Billing Flow", async ({ page, request }) => {
    // 1. Visit landing page
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Automated Recurring Billing");

    // 2. Login as Org Admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "john@acme.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 3. Land on Dashboard Overview
    await page.waitForURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Subscription Overview");

    // 4. Products Catalog
    await page.goto("/dashboard/products");
    await expect(page.locator("h1")).toContainText("Products & Services");
    await expect(page.locator("table")).toContainText("Cloud ERP Core");
    await expect(page.locator("table")).toContainText("Odoo Brand Integration");

    // 5. Subscription Plans
    await page.goto("/dashboard/plans");
    await expect(page.locator("h1")).toContainText("Subscription Plans");
    await expect(page.locator("body")).toContainText("Professional Cloud Monthly");

    // 6. Customers CRM
    await page.goto("/dashboard/customers");
    await expect(page.locator("h1")).toContainText("Customer Accounts");
    await expect(page.locator("table")).toContainText("Alex Rivera");

    // 7. Quotations
    await page.goto("/dashboard/quotations");
    await expect(page.locator("h1")).toContainText("Quotation Management");

    // 8. Subscriptions
    await page.goto("/dashboard/subscriptions");
    await expect(page.locator("h1")).toContainText("Subscription Lifecycle");
    await expect(page.locator("table")).toContainText("SUB-2026-0001");

    // 9. Invoices
    await page.goto("/dashboard/invoices");
    await expect(page.locator("h1")).toContainText("Invoice Management");
    await expect(page.locator("table")).toContainText("INV-2026-00001");

    // 10. Financial Reports
    await page.goto("/dashboard/reports");
    await expect(page.locator("h1")).toContainText("Financial & Revenue Reports");
    await expect(page.locator("body")).toContainText("Monthly Recurring Revenue");

    // 11. Customer Portal
    await page.goto("/portal");
    // Verify portal view
  });
});

