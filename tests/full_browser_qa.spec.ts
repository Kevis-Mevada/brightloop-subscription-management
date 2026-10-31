import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = "/home/kevis/.gemini/antigravity/brain/7a1ea96b-78d1-44bd-ae5c-14bef6f059ed/screenshots";

test.describe("Brightloop Complete Dynamic Browser QA Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(25000);
  });

  test("STEP 3: Actual Browser Testing - Navigation & All Pages Load", async ({ page }) => {
    // 1. Landing Page
    await page.goto("http://localhost:3000");
    await expect(page.locator("h1")).toContainText("Subscription Management");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_landing_page.png") });

    // 2. Login Page
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("h3")).toContainText("Sign In");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_login_page.png") });

    // 3. Register Page
    await page.goto("http://localhost:3000/register");
    await expect(page.locator("h3")).toContainText("Create Organization");
    await expect(page.locator("body")).toContainText("Password Requirements");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_register_page.png") });

    // 4. Authenticate as Acme Admin
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "john@acme.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForURL("http://localhost:3000/dashboard");
    await expect(page.locator("h1")).toContainText("Subscription Overview");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_dashboard_overview.png") });

    // 5. Navigate every dashboard menu item
    // Products
    await page.click('nav a:has-text("Products")');
    await page.waitForURL("**/dashboard/products");
    await expect(page.locator("h1")).toContainText("Products & Services");
    await expect(page.locator("table")).toContainText("Cloud ERP Core");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_products_catalog.png") });

    // Plans
    await page.click('nav a:has-text("Plans")');
    await page.waitForURL("**/dashboard/plans");
    await expect(page.locator("h1")).toContainText("Subscription Plans");
    await expect(page.locator("body")).toContainText("Professional Cloud Monthly");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_plans_grid.png") });

    // Customers
    await page.click('nav a:has-text("Customers")');
    await page.waitForURL("**/dashboard/customers");
    await expect(page.locator("h1")).toContainText("Customer Accounts");
    await expect(page.locator("table")).toContainText("Alex Rivera");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_customers_crm.png") });

    // Quotations
    await page.click('nav a:has-text("Quotations")');
    await page.waitForURL("**/dashboard/quotations");
    await expect(page.locator("h1")).toContainText("Quotation Management");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_quotations_list.png") });

    // Subscriptions
    await page.click('nav a:has-text("Subscriptions")');
    await page.waitForURL("**/dashboard/subscriptions");
    await expect(page.locator("h1")).toContainText("Subscription Lifecycle");
    await expect(page.locator("table")).toContainText("SUB-2026-0001");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09_subscriptions_lifecycle.png") });

    // Invoices
    await page.click('nav a:has-text("Invoices")');
    await page.waitForURL("**/dashboard/invoices");
    await expect(page.locator("h1")).toContainText("Invoice Management");
    await expect(page.locator("table")).toContainText("INV-2026-00001");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10_invoices_table.png") });

    // Payments
    await page.click('nav a:has-text("Payments")');
    await page.waitForURL("**/dashboard/payments");
    await expect(page.locator("h1")).toContainText("Payment Transactions");
    await expect(page.locator("table")).toContainText("PAY-2026-00001");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11_payments_table.png") });

    // Discounts
    await page.click('nav a:has-text("Discounts")');
    await page.waitForURL("**/dashboard/discounts");
    await expect(page.locator("h1")).toContainText("Discount & Promotion Rules");
    await expect(page.locator("table")).toContainText("WELCOME10");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12_discounts_table.png") });

    // Taxes
    await page.click('nav a:has-text("Tax Rules")');
    await page.waitForURL("**/dashboard/taxes");
    await expect(page.locator("h1")).toContainText("Tax Configuration");
    await expect(page.locator("table")).toContainText("Standard VAT 18%");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13_taxes_table.png") });

    // Billing Engine Runner
    await page.click('nav a:has-text("Billing Engine")');
    await page.waitForURL("**/dashboard/billing-jobs");
    await expect(page.locator("h1")).toContainText("Automatic Recurring Billing Engine");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "14_billing_engine_runner.png") });

    // Financial Reports
    await page.click('nav a:has-text("Reports")');
    await page.waitForURL("**/dashboard/reports");
    await expect(page.locator("h1")).toContainText("Financial & Revenue Reports");
    await expect(page.locator("body")).toContainText("Monthly Recurring Revenue");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "15_reports_statement.png") });

    // Settings
    await page.click('nav a:has-text("Settings")');
    await page.waitForURL("**/dashboard/settings");
    await expect(page.locator("h1")).toContainText("Organization Settings");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "16_settings_profile.png") });
  });

  test("STEP 4: Test Complete End-to-End Business Workflow (17 Steps)", async ({ page }) => {
    // 1. Register a fresh Organization
    const randOrg = `Apex Corp ${Math.floor(Math.random() * 10000)}`;
    const randEmail = `admin_${Math.floor(Math.random() * 10000)}@apexcorp.com`;
    await page.goto("http://localhost:3000/register");
    await page.fill('input[placeholder="Acme Innovations"]', randOrg);
    await page.fill('input[placeholder="John Doe"]', "Apex Executive");
    await page.fill('input[placeholder="john@acme.com"]', randEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button:has-text("Create Account & Workspace")');

    // Should redirect to dashboard
    await page.waitForURL("http://localhost:3000/dashboard");
    await expect(page.locator("h1")).toContainText("Subscription Overview");

    // 2. Create a Product with Odoo Variant
    await page.goto("http://localhost:3000/dashboard/products");
    await page.click('button:has-text("Add Product")');
    await page.fill('input[placeholder="e.g. Cloud ERP Core"]', "Custom SaaS Cloud");
    await page.fill('input[placeholder="e.g. PROD-ERP"]', `PROD-${Math.floor(Math.random() * 1000)}`);
    await page.fill('input[placeholder="1200.00"]', "850.00");
    await page.click('form button[type="submit"]');
    await expect(page.locator("table")).toContainText("Custom SaaS Cloud");

    // 3. Create a Subscription Plan
    await page.goto("http://localhost:3000/dashboard/plans");
    await page.click('button:has-text("Create Plan")');
    await page.fill('input[placeholder="e.g. Professional Cloud Monthly"]', "Apex Business Growth");
    await page.fill('input[placeholder="e.g. PLAN-PRO-MO"]', `PLAN-${Math.floor(Math.random() * 1000)}`);
    await page.fill('input[placeholder="299.00"]', "450.00");
    await page.click('form button[type="submit"]');
    await expect(page.locator("body")).toContainText("Apex Business Growth");

    // 4. Create a Customer with Portal Access
    const custEmail = `client_${Math.floor(Math.random() * 10000)}@clientco.com`;
    await page.goto("http://localhost:3000/dashboard/customers");
    await page.click('button:has-text("Add Customer")');
    await page.fill('input[placeholder="e.g. Alex Rivera"]', "Robert California");
    await page.fill('input[placeholder="alex@techstart.io"]', custEmail);
    await page.fill('input[placeholder="TechStart Innovations"]', "Sabre Industries");
    await page.click('form button[type="submit"]');
    await expect(page.locator("table")).toContainText("Robert California");

    // 5. Generate a Quotation
    await page.goto("http://localhost:3000/dashboard/quotations");
    await page.click('button:has-text("Create Quotation")');
    await page.waitForTimeout(600);
    await page.click('form button[type="submit"]');
    await expect(page.locator("table")).toContainText("DRAFT");

    // 6. Confirm / Send Quotation
    await page.click('button:has-text("Send")');
    await expect(page.locator("table")).toContainText("SENT");

    // 7. Accept Quotation
    await page.click('button:has-text("Accept")');
    await expect(page.locator("table")).toContainText("ACCEPTED");

    // 8. 1-Click Convert to Subscription
    await page.click('button:has-text("Convert to Sub")');
    await page.waitForTimeout(1000);

    // 9. Verify in Subscriptions
    await page.goto("http://localhost:3000/dashboard/subscriptions");
    await expect(page.locator("table")).toContainText("ACTIVE");

    // 10. Run Recurring Billing Engine
    await page.goto("http://localhost:3000/dashboard/billing-jobs");
    await page.click('button:has-text("Trigger Billing Run Now")');
    await expect(page.locator("body")).toContainText("Billing run finished");

    // 11. View Invoices & Record Payment
    await page.goto("http://localhost:3000/dashboard/invoices");
    await expect(page.locator("table")).toContainText("INV-");

    // 12. View Printable PDF
    await page.click('button:has-text("View PDF")');
    await expect(page.locator("h3:has-text('INVOICE')")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "17_printable_pdf_modal.png") });
    await page.click('button:has-text("Close")');

    // 13. Record Payment
    await page.click('button:has-text("Record Pay")');
    await page.click('form button[type="submit"]');
    await expect(page.locator("table")).toContainText("PAID");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "18_payment_completed.png") });

    // 14. Check Dashboard Revenue updated
    await page.goto("http://localhost:3000/dashboard");
    await expect(page.locator("h1")).toContainText("Subscription Overview");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "19_revenue_updated.png") });

    // 15. Sign out & Login as Customer to Portal
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL("**/login");

    await page.fill('input[type="email"]', custEmail);
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // 16. Verify Customer Portal
    await page.waitForURL("**/portal");
    await expect(page.locator("h1")).toContainText("Welcome back, Robert California");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "20_customer_portal_overview.png") });

    // 17. View Invoices in Portal
    await page.goto("http://localhost:3000/portal/invoices");
    await expect(page.locator("h1")).toContainText("My Invoices");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "21_customer_portal_invoices.png") });
  });

  test("STEP 5: Multi-Tenant Security & Direct IDOR Boundary Verification", async ({ page, request }) => {
    // Login as Acme Admin
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "john@acme.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Fetch Acme products via API
    const acmeRes = await page.request.get("http://localhost:3000/api/products");
    const acmeData = await acmeRes.json();
    expect(acmeData.success).toBe(true);
    expect(acmeData.data.length).toBeGreaterThan(0);

    // Verify Nexus product "PROD-CYBER" does NOT exist in Acme's list
    const hasNexusProduct = acmeData.data.some((p: any) => p.code === "PROD-CYBER");
    expect(hasNexusProduct).toBe(false);

    // Sign out and login as Nexus Admin
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "elena@nexus.eu");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Fetch Nexus products via API
    const nexusRes = await page.request.get("http://localhost:3000/api/products");
    const nexusData = await nexusRes.json();
    expect(nexusData.success).toBe(true);

    // Verify Acme product "PROD-ERP" does NOT exist in Nexus's list
    const hasAcmeProduct = nexusData.data.some((p: any) => p.code === "PROD-ERP");
    expect(hasAcmeProduct).toBe(false);

    // Direct IDOR attempt: Nexus Admin attempts to update Acme's product
    const acmeProdId = acmeData.data[0].id;
    const hackRes = await page.request.put("http://localhost:3000/api/products", {
      data: { id: acmeProdId, name: "HACKED_NAME" },
    });
    const hackJson = await hackRes.json();
    // Must return 404 unauthorized
    expect(hackRes.status()).toBe(404);
    expect(hackJson.success).toBe(false);
  });

  test("STEP 7: Responsive Layout Testing Across Viewports", async ({ page }) => {
    // Login
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "john@acme.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Desktop: 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("http://localhost:3000/dashboard");
    await expect(page.locator("h1")).toContainText("Subscription Overview");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "22_responsive_desktop_1920.png") });

    // Laptop: 1366x768
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "23_responsive_laptop_1366.png") });

    // Tablet: 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "24_responsive_tablet_768.png") });

    // Mobile: 390x844 (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "25_responsive_mobile_390.png") });
  });

  test("STEP 8: Error and Edge Case Testing", async ({ page }) => {
    // 1. Weak password rejected on registration
    await page.goto("http://localhost:3000/register");
    await page.fill('input[placeholder="Acme Innovations"]', "Edge Test");
    await page.fill('input[placeholder="John Doe"]', "Test User");
    await page.fill('input[placeholder="john@acme.com"]', "edge@test.com");
    await page.fill('input[type="password"]', "short");
    // Submit button must be disabled for invalid password
    await expect(page.locator('button:has-text("Create Account & Workspace")')).toBeDisabled();

    // 2. Duplicate registration email rejected
    await page.fill('input[placeholder="john@acme.com"]', "john@acme.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button:has-text("Create Account & Workspace")');
    await expect(page.locator("body")).toContainText("already exists");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "26_error_duplicate_email.png") });

    // 3. Invalid login credentials
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "nonexistent@fake.io");
    await page.fill('input[type="password"]', "WrongPass123!");
    await page.click('button[type="submit"]');
    await expect(page.locator("body")).toContainText("Invalid email or password");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "27_error_invalid_login.png") });
  });
});
