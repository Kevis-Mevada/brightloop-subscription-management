import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RECORDINGS_DIR = "/home/kevis/Desktop/SMS/recordings";
const ARTIFACT_DIR = "/home/kevis/.gemini/antigravity/brain/7a1ea96b-78d1-44bd-ae5c-14bef6f059ed";
const SCREENSHOT_DIR = path.join(RECORDINGS_DIR, "screenshots");
const ARTIFACT_SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });

async function main() {
  console.log("===============================================================");
  console.log("🎬 STARTING COMPLETE PRODUCT DEMO VIDEO RECORDING (1920x1080)");
  console.log("===============================================================");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: ["--start-maximized", "--no-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(35000);

  // Dialog auto-accept
  page.on("dialog", async (dialog) => {
    console.log(`💬 [Browser Dialog]: ${dialog.type()} -> "${dialog.message()}"`);
    await dialog.accept("Demonstration verification accepted");
  });

  async function snap(name: string) {
    const file1 = path.join(SCREENSHOT_DIR, `${name}.png`);
    const file2 = path.join(ARTIFACT_SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: file1, fullPage: false });
    fs.copyFileSync(file1, file2);
    console.log(`   📸 [Screenshot Saved]: ${name}.png`);
  }

  try {
    // -------------------------------------------------------------------------
    // PART 1: Introduction & Landing Page
    // -------------------------------------------------------------------------
    console.log("\n[PART 1] 🌐 Introduction & Brightloop Landing Page...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await sleep(2000);

    // Scroll through landing page
    await page.evaluate(() => window.scrollBy({ top: 550, behavior: "smooth" }));
    await sleep(1500);
    await page.evaluate(() => window.scrollBy({ top: 700, behavior: "smooth" }));
    await sleep(1500);
    await snap("01_landing_page");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1200);

    // -------------------------------------------------------------------------
    // PART 2: Authentication & Organization Registration
    // -------------------------------------------------------------------------
    console.log("\n[PART 2] 🔐 Organization Registration & Role-Based Access...");
    await page.click("header a[href='/register'], a:has-text('Get Started')");
    await page.waitForURL("**/register");
    await sleep(1500);

    const ts = Date.now().toString().slice(-4);
    const orgName = `Apex Cloud Systems ${ts}`;
    const adminEmail = `marcus-${ts}@apexcloud.io`;

    await page.fill("input[placeholder*='Acme Innovations']", "");
    await page.type("input[placeholder*='Acme Innovations']", orgName, { delay: 40 });
    await sleep(300);

    await page.fill("input[placeholder*='John Doe']", "");
    await page.type("input[placeholder*='John Doe']", "Marcus Vance", { delay: 40 });
    await sleep(300);

    await page.fill("input[type='email']", "");
    await page.type("input[type='email']", adminEmail, { delay: 40 });
    await sleep(300);

    await page.fill("input[type='password']", "");
    await page.type("input[type='password']", "ApexSecure2026!", { delay: 50 });
    await sleep(1000);

    await snap("02_registration_rbac");

    console.log("   👉 Submitting registration form...");
    await page.click("form button[type='submit']");
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    console.log(`   ✅ Registered new organization: ${orgName}!`);
    await sleep(2500);

    // -------------------------------------------------------------------------
    // PART 3: Admin Dashboard Statistics & Real-Time Metrics
    // -------------------------------------------------------------------------
    console.log("\n[PART 3] 📊 Admin Dashboard Analytics & Revenue Monitoring...");
    await sleep(2000);
    await snap("03_admin_dashboard");

    // -------------------------------------------------------------------------
    // PART 4: Product and Plan Management
    // -------------------------------------------------------------------------
    console.log("\n[PART 4] 📦 Product & Subscription Plan Management...");
    await page.click("a[href='/dashboard/products']");
    await page.waitForURL("**/dashboard/products");
    await page.waitForSelector("table");
    await sleep(1500);

    console.log("   👉 Creating Product with Price-Adjusting Variant...");
    await page.click("button:has-text('Add Product')");
    await page.waitForSelector("div[role='dialog']");
    await sleep(1000);

    const prodName = `AI Copilot Enterprise Suite v${ts}`;
    const prodCode = `PROD-AI-${ts}`;

    await page.type("input[placeholder*='Cloud ERP Core']", prodName, { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder*='PROD-ERP']", prodCode, { delay: 35 });
    await sleep(300);
    await page.selectOption("select", "DIGITAL");
    await sleep(300);
    await page.type("input[placeholder='1200.00']", "450.00", { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder='300.00']", "110.00", { delay: 35 });
    await sleep(300);
    await page.type("textarea", "Autonomous AI Copilot engine with real-time enterprise sync.", { delay: 25 });
    await sleep(800);

    await page.click("div[role='dialog'] form button[type='submit']");
    await page.waitForSelector("div[role='dialog']", { state: "hidden", timeout: 10000 });
    await sleep(2000);
    await snap("04_products_catalog");

    // Navigate to Plans
    console.log("   👉 Creating Monthly Subscription Plan...");
    await page.click("a[href='/dashboard/plans']");
    await page.waitForURL("**/dashboard/plans");
    await sleep(1500);

    await page.click("button:has-text('Create Plan')");
    await page.waitForSelector("div[role='dialog']");
    await sleep(1000);

    const planName = `Enterprise AI Suite (Monthly) v${ts}`;
    const planCode = `PLAN-AI-MO-${ts}`;

    await page.type("input[placeholder*='Professional Cloud Monthly']", planName, { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder*='PLAN-PRO-MO']", planCode, { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder='299.00']", "450.00", { delay: 35 });
    await sleep(300);
    await page.selectOption("select", "MONTHLY");
    await sleep(500);

    await page.click("div[role='dialog'] form button[type='submit']");
    await page.waitForSelector("div[role='dialog']", { state: "hidden", timeout: 10000 });
    await sleep(2000);
    await snap("05_plans_grid");

    // -------------------------------------------------------------------------
    // PART 5: Customer Management
    // -------------------------------------------------------------------------
    console.log("\n[PART 5] 👥 Customer CRM & Profile Management...");
    await page.click("a[href='/dashboard/customers']");
    await page.waitForURL("**/dashboard/customers");
    await page.waitForSelector("table");
    await sleep(1500);

    console.log("   👉 Registering Customer Profile & Portal Credentials...");
    await page.click("button:has-text('Add Customer')");
    await page.waitForSelector("div[role='dialog']");
    await sleep(1000);

    const custEmail = `billing-${ts}@quantumdynamics.org`;

    await page.type("input[placeholder*='Alex Rivera']", "Quantum Dynamics Labs", { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder*='TechStart Innovations']", "Quantum Dynamics Inc", { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder*='alex@techstart.io']", custEmail, { delay: 35 });
    await sleep(300);
    await page.type("input[placeholder*='(555) 234-5678']", "+1 (555) 234-9988", { delay: 35 });
    await sleep(300);

    await page.click("div[role='dialog'] form button[type='submit']");
    await page.waitForSelector("div[role='dialog']", { state: "hidden", timeout: 10000 });
    await sleep(2000);
    await snap("06_customer_accounts");

    // -------------------------------------------------------------------------
    // PART 6: Subscription Management & Quotation Lifecycle
    // -------------------------------------------------------------------------
    console.log("\n[PART 6] 🔄 Quotation Lifecycle & 1-Click Subscription Conversion...");
    await page.click("a[href='/dashboard/quotations']");
    await page.waitForURL("**/dashboard/quotations");
    await page.waitForSelector("table");
    await sleep(1500);

    console.log("   👉 Creating Quotation with Tax & Discount...");
    await page.click("button:has-text('Create Quotation')");
    await page.waitForSelector("div[role='dialog']");
    await sleep(1000);

    await page.fill("input[type='date']", "2026-11-30");
    await sleep(400);

    await page.click("div[role='dialog'] form button[type='submit']");
    await page.waitForSelector("div[role='dialog']", { state: "hidden", timeout: 10000 });
    await sleep(2500);

    console.log("   👉 Advancing Quotation: Send -> Accept -> 1-Click Convert...");
    const sendBtn = page.locator("button:has-text('Send')").first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
      await sleep(2000);
    }

    const acceptBtn = page.locator("button:has-text('Accept')").first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await sleep(2000);
    }

    const convertBtn = page.locator("button:has-text('Convert to Sub')").first();
    if (await convertBtn.isVisible()) {
      await convertBtn.click();
      await sleep(3000);
    }

    // Set subscription due for billing so billing engine creates invoice immediately
    await page.evaluate(async () => {
      const res = await fetch("/api/subscriptions").then((r) => r.json());
      if (res.success && res.data.length > 0) {
        await fetch("/api/subscriptions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: res.data[0].id,
            action: "FORCE_DUE",
            reason: "Immediate billing engine run test",
          }),
        });
      }
    });

    // Verify in Subscriptions
    await page.click("a[href='/dashboard/subscriptions']");
    await page.waitForURL("**/dashboard/subscriptions");
    await page.waitForSelector("table");
    await sleep(2000);
    await snap("07_subscriptions_lifecycle");

    console.log("   👉 Testing Pause & Resume Subscription...");
    const pauseBtn = page.locator("button:has-text('Pause')").first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await sleep(2500);
    }
    const resumeBtn = page.locator("button:has-text('Resume')").first();
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
      await sleep(2500);
    }

    // -------------------------------------------------------------------------
    // PART 7: Billing Engine, Tax Calculations & Printable Invoices
    // -------------------------------------------------------------------------
    console.log("\n[PART 7] ⚡ Recurring Billing Engine & Printable PDF Invoices...");
    await page.click("a[href='/dashboard/billing-jobs']");
    await page.waitForURL("**/dashboard/billing-jobs");
    await sleep(1500);

    console.log("   👉 Triggering Recurring Billing Engine Run...");
    await page.click("button:has-text('Trigger Billing Run')");
    await sleep(4000);
    await snap("08_billing_engine");

    // Open Invoices
    await page.click("a[href='/dashboard/invoices']");
    await page.waitForURL("**/dashboard/invoices");
    await page.waitForSelector("table");
    await sleep(2000);

    console.log("   👉 Opening Printable PDF Invoice Modal...");
    const viewPdfBtn = page.locator("button:has-text('View PDF')").first();
    if (await viewPdfBtn.isVisible()) {
      await viewPdfBtn.click();
      await page.waitForSelector("div[role='dialog']");
      await sleep(3500);
      await snap("09_invoice_printable_pdf");

      await page.keyboard.press("Escape");
      await page.waitForSelector("div[role='dialog']", { state: "hidden", timeout: 10000 });
      await sleep(1500);
    }

    // -------------------------------------------------------------------------
    // PART 8: Payment Processing & Reconciliation
    // -------------------------------------------------------------------------
    console.log("\n[PART 8] 💳 Payment Recording & Balance Reconciliation...");
    const recordPayBtn = page.locator("button:has-text('Record Pay')").first();
    if (await recordPayBtn.isVisible()) {
      await recordPayBtn.click();
      await page.waitForSelector("div[role='dialog']");
      await sleep(1500);

      const refInput = page.locator("input[placeholder*='txn_123456789']").first();
      if (await refInput.isVisible()) {
        await refInput.type("TXN-DEMO-STRIPE-89012", { delay: 40 });
        await sleep(500);
      }

      await page.click("div[role='dialog'] form button[type='submit']");
      await page.waitForSelector("div[role='dialog']", { state: "hidden", timeout: 10000 });
      await sleep(2500);
    }

    await page.click("a[href='/dashboard/payments']");
    await page.waitForURL("**/dashboard/payments");
    await page.waitForSelector("table");
    await sleep(2000);
    await snap("10_payment_transactions");

    // -------------------------------------------------------------------------
    // PART 9: Customer Self-Service Portal
    // -------------------------------------------------------------------------
    console.log("\n[PART 9] 👤 Customer Self-Service Portal Experience (/portal)...");
    await context.clearCookies();
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.waitForURL("**/login");
    await sleep(1500);

    console.log("   👉 Logging in as Customer (alex@techstart.io)...");
    await page.fill("input[type='email']", "");
    await page.type("input[type='email']", "alex@techstart.io", { delay: 50 });
    await sleep(300);

    await page.fill("input[type='password']", "");
    await page.type("input[type='password']", "Password123!", { delay: 50 });
    await sleep(500);

    await page.click("form button[type='submit']");
    await page.waitForURL("**/portal", { timeout: 15000 });
    await sleep(2500);

    await page.click("a[href='/portal/subscriptions']");
    await sleep(2000);
    await page.click("a[href='/portal/invoices']");
    await sleep(2000);
    await page.click("a[href='/portal/payments']");
    await sleep(2000);
    await snap("11_customer_portal");

    // -------------------------------------------------------------------------
    // PART 10: Multi-Tenant Isolation Testing (Nexus Global Solutions - EUR)
    // -------------------------------------------------------------------------
    console.log("\n[PART 10] 🏢 Multi-Tenant Isolation Testing (Nexus Global Solutions - EUR)...");
    await context.clearCookies();
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.waitForURL("**/login");
    await sleep(1500);

    console.log("   👉 Logging into Organization B (elena@nexus.eu)...");
    await page.fill("input[type='email']", "");
    await page.type("input[type='email']", "elena@nexus.eu", { delay: 50 });
    await sleep(300);

    await page.fill("input[type='password']", "");
    await page.type("input[type='password']", "Password123!", { delay: 50 });
    await sleep(500);

    await page.click("form button[type='submit']");
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await sleep(3000);

    await snap("12_nexus_multi_tenant_isolation");

    console.log("   👉 Verifying Nexus Global Isolated Products Catalog...");
    await page.click("a[href='/dashboard/products']");
    await page.waitForURL("**/dashboard/products");
    await page.waitForSelector("table");
    await sleep(2500);
    await snap("13_nexus_isolated_products");

    console.log("\n===============================================================");
    console.log("🎉 VIDEO DEMONSTRATION WORKFLOWS COMPLETED SUCCESSFULLY!");
    console.log("===============================================================");
    await sleep(2000);
  } catch (err) {
    console.error("❌ Demonstration error:", err);
  } finally {
    console.log("Finalizing browser video recording...");
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (video) {
      const recordedVideoPath = await video.path();
      console.log(`📹 Raw video recorded at: ${recordedVideoPath}`);
      const targetPath1 = path.join(RECORDINGS_DIR, "brightloop_complete_product_demo.webm");
      const targetPath2 = path.join(ARTIFACT_DIR, "brightloop_complete_product_demo.webm");

      fs.copyFileSync(recordedVideoPath, targetPath1);
      fs.copyFileSync(recordedVideoPath, targetPath2);

      const stat = fs.statSync(targetPath1);
      console.log(`✅ Final Video Deliverable saved to: ${targetPath1}`);
      console.log(`   File Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
    }
  }
}

main();
