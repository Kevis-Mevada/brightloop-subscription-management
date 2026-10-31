import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(pwd: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
}

async function main() {
  console.log("🌱 Starting Comprehensive Multi-Tenant Seeding...");
  const defaultPassword = await hashPassword("Password123!");

  // 1. Platform Super Admin
  await prisma.user.upsert({
    where: { email: "admin@brightloop.io" },
    update: {},
    create: {
      name: "Brightloop Super Admin",
      email: "admin@brightloop.io",
      passwordHash: defaultPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // =========================================================================
  // ORGANIZATION 1: ACME CLOUD TECHNOLOGIES (USD)
  // =========================================================================
  const acme = await prisma.organization.upsert({
    where: { slug: "acme-cloud" },
    update: {},
    create: {
      name: "Acme Cloud Technologies",
      slug: "acme-cloud",
      currency: "USD",
      timezone: "America/New_York",
    },
  });

  // Admin & Staff for Acme
  await prisma.user.upsert({
    where: { email: "john@acme.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@acme.com",
      passwordHash: defaultPassword,
      role: "ORGANIZATION_ADMIN",
      status: "ACTIVE",
      organizationId: acme.id,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "sarah.ops@acme.com" },
    update: {},
    create: {
      name: "Sarah Miller",
      email: "sarah.ops@acme.com",
      passwordHash: defaultPassword,
      role: "STAFF",
      status: "ACTIVE",
      organizationId: acme.id,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "mike.support@acme.com" },
    update: {},
    create: {
      name: "Mike Chen",
      email: "mike.support@acme.com",
      passwordHash: defaultPassword,
      role: "STAFF",
      status: "ACTIVE",
      organizationId: acme.id,
      emailVerified: new Date(),
    },
  });

  // Acme Taxes
  await prisma.taxRule.upsert({
    where: { organizationId_name: { organizationId: acme.id, name: "Standard VAT 18%" } },
    update: {},
    create: { organizationId: acme.id, name: "Standard VAT 18%", rate: 18.0, isDefault: true, status: true },
  });
  await prisma.taxRule.upsert({
    where: { organizationId_name: { organizationId: acme.id, name: "State Sales Tax (8.25%)" } },
    update: {},
    create: { organizationId: acme.id, name: "State Sales Tax (8.25%)", rate: 8.25, isDefault: false, status: true },
  });

  // Acme Discounts
  await prisma.discountRule.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "WELCOME10" } },
    update: {},
    create: { organizationId: acme.id, code: "WELCOME10", name: "Welcome 10%", type: "PERCENTAGE", value: 10.0, status: true },
  });
  await prisma.discountRule.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "FLAT100" } },
    update: {},
    create: { organizationId: acme.id, code: "FLAT100", name: "$100 Off Enterprise", type: "FIXED", value: 100.0, minSpend: 500.0, status: true },
  });

  // Acme Products (5 products)
  const acmeProd1 = await prisma.product.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PROD-ERP" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Cloud ERP Core",
      code: "PROD-ERP",
      description: "Complete Cloud ERP suite for growing businesses.",
      salesPrice: 1200.0,
      costPrice: 300.0,
      productType: "SERVICE",
      status: "ACTIVE",
      variants: {
        create: [
          { name: "Standard Edition", sku: "ERP-STD", priceAdjustment: 0.0, isDefault: true },
          { name: "Odoo Brand Integration", sku: "ERP-ODOO-560", priceAdjustment: 560.0 }, // PDF spec
          { name: "Enterprise Dedicated Cluster", sku: "ERP-ENT", priceAdjustment: 950.0 },
        ],
      },
    },
    include: { variants: true },
  });

  const acmeProd2 = await prisma.product.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PROD-DEVOPS" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "24/7 Managed DevOps Support",
      code: "PROD-DEVOPS",
      description: "Dedicated site reliability engineering.",
      salesPrice: 450.0,
      costPrice: 150.0,
      productType: "SERVICE",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PROD-REDIS" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Managed Redis Cache Tier",
      code: "PROD-REDIS",
      description: "In-memory cache cluster with sub-millisecond latency.",
      salesPrice: 150.0,
      costPrice: 40.0,
      productType: "SERVICE",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PROD-STORAGE" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Cloud Storage 1TB Block",
      code: "PROD-STORAGE",
      description: "High-durability S3-compatible cloud storage.",
      salesPrice: 50.0,
      costPrice: 15.0,
      productType: "DIGITAL",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PROD-SECURITY" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Enterprise SSO & Security Shield",
      code: "PROD-SECURITY",
      description: "SAML 2.0, Okta, Azure AD integration with DDoS protection.",
      salesPrice: 350.0,
      costPrice: 80.0,
      productType: "SERVICE",
      status: "ACTIVE",
    },
  });

  // Acme Plans (3 plans)
  const acmePlanMo = await prisma.plan.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PLAN-PRO-MO" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Professional Cloud Monthly",
      code: "PLAN-PRO-MO",
      description: "ERP and DevOps support billed monthly.",
      price: 1760.0,
      billingInterval: "MONTHLY",
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyCancellation: true,
      status: "ACTIVE",
    },
  });

  const acmePlanYr = await prisma.plan.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PLAN-ENT-YR" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Enterprise Annual Suite",
      code: "PLAN-ENT-YR",
      description: "Full suite billed annually at a discounted rate.",
      price: 14500.0,
      billingInterval: "YEARLY",
      minimumQuantity: 1,
      allowPause: false,
      allowEarlyCancellation: false,
      status: "ACTIVE",
    },
  });

  await prisma.plan.upsert({
    where: { organizationId_code: { organizationId: acme.id, code: "PLAN-DAILY-DEV" } },
    update: {},
    create: {
      organizationId: acme.id,
      name: "Daily Dynamic Compute Tier",
      code: "PLAN-DAILY-DEV",
      description: "Compute power billed on a daily basis.",
      price: 25.0,
      billingInterval: "DAILY",
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyCancellation: true,
      status: "ACTIVE",
    },
  });

  // Acme Customers (5 customers)
  const acmeCust1 = await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: acme.id, email: "alex@techstart.io" } },
    update: {},
    create: {
      organizationId: acme.id,
      customerNumber: "CUST-1001",
      name: "Alex Rivera",
      email: "alex@techstart.io",
      phone: "+1 (555) 234-5678",
      companyName: "TechStart Innovations",
      billingAddress: "742 Evergreen Terrace",
      city: "Austin",
      state: "TX",
      country: "USA",
      postalCode: "78701",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "alex@techstart.io" },
    update: {},
    create: {
      name: "Alex Rivera",
      email: "alex@techstart.io",
      passwordHash: defaultPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      organizationId: acme.id,
      customerId: acmeCust1.id,
      emailVerified: new Date(),
    },
  });

  const acmeCust2 = await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: acme.id, email: "emma@innovate.co" } },
    update: {},
    create: {
      organizationId: acme.id,
      customerNumber: "CUST-1002",
      name: "Emma Watson",
      email: "emma@innovate.co",
      phone: "+1 (555) 876-5432",
      companyName: "Innovate Global Ltd",
      billingAddress: "10 Downing St",
      city: "London",
      country: "UK",
      postalCode: "SW1A 2AA",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "emma@innovate.co" },
    update: {},
    create: {
      name: "Emma Watson",
      email: "emma@innovate.co",
      passwordHash: defaultPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      organizationId: acme.id,
      customerId: acmeCust2.id,
      emailVerified: new Date(),
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: acme.id, email: "carlos@datadrive.net" } },
    update: {},
    create: {
      organizationId: acme.id,
      customerNumber: "CUST-1003",
      name: "Carlos Mendez",
      email: "carlos@datadrive.net",
      phone: "+1 (555) 345-6789",
      companyName: "DataDrive Analytics",
      billingAddress: "123 Market St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94105",
      status: "ACTIVE",
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: acme.id, email: "priya@fintechflow.org" } },
    update: {},
    create: {
      organizationId: acme.id,
      customerNumber: "CUST-1004",
      name: "Priya Sharma",
      email: "priya@fintechflow.org",
      phone: "+1 (555) 456-7890",
      companyName: "FintechFlow Corp",
      billingAddress: "456 Wall Ave",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10005",
      status: "ACTIVE",
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: acme.id, email: "david@quantumai.dev" } },
    update: {},
    create: {
      organizationId: acme.id,
      customerNumber: "CUST-1005",
      name: "David Kim",
      email: "david@quantumai.dev",
      phone: "+1 (555) 567-8901",
      companyName: "QuantumAI Labs",
      billingAddress: "789 Tech Hub Blvd",
      city: "Seattle",
      state: "WA",
      country: "USA",
      postalCode: "98101",
      status: "ACTIVE",
    },
  });

  // Acme Subscriptions & Invoices
  const odooVar = acmeProd1.variants.find((v) => v.name.includes("Odoo")) || acmeProd1.variants[0];
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const acmeSub1 = await prisma.subscription.upsert({
    where: { organizationId_subscriptionNumber: { organizationId: acme.id, subscriptionNumber: "SUB-2026-0001" } },
    update: {},
    create: {
      organizationId: acme.id,
      subscriptionNumber: "SUB-2026-0001",
      customerId: acmeCust1.id,
      planId: acmePlanMo.id,
      status: "ACTIVE",
      billingFrequency: "MONTHLY",
      startDate: now,
      nextBillingDate: nextMonth,
      subtotal: 1760.0,
      discountAmount: 176.0,
      taxAmount: 285.12,
      totalAmount: 1869.12,
      lines: {
        create: [
          {
            productId: acmeProd1.id,
            variantId: odooVar?.id,
            description: "Cloud ERP Core with Odoo Brand Integration",
            quantity: 1,
            unitPrice: 1760.0,
            discountRate: 10.0,
            taxRate: 18.0,
            subtotal: 1760.0,
            total: 1869.12,
          },
        ],
      },
      history: {
        create: {
          action: "CREATED",
          newStatus: "ACTIVE",
          reason: "System subscription seeding",
          actorEmail: "john@acme.com",
        },
      },
    },
  });

  const acmeInv1 = await prisma.invoice.upsert({
    where: { organizationId_invoiceNumber: { organizationId: acme.id, invoiceNumber: "INV-2026-00001" } },
    update: {},
    create: {
      organizationId: acme.id,
      invoiceNumber: "INV-2026-00001",
      customerId: acmeCust1.id,
      subscriptionId: acmeSub1.id,
      status: "PAID",
      issueDate: now,
      dueDate: new Date(Date.now() + 15 * 86400000),
      subtotal: 1760.0,
      discountAmount: 176.0,
      taxAmount: 285.12,
      totalAmount: 1869.12,
      paidAmount: 1869.12,
      lines: {
        create: [
          {
            productId: acmeProd1.id,
            variantId: odooVar?.id,
            description: "Cloud ERP Core with Odoo Brand Integration",
            quantity: 1,
            unitPrice: 1760.0,
            discountRate: 10.0,
            taxRate: 18.0,
            subtotal: 1760.0,
            total: 1869.12,
          },
        ],
      },
    },
  });

  await prisma.payment.upsert({
    where: { organizationId_paymentNumber: { organizationId: acme.id, paymentNumber: "PAY-2026-00001" } },
    update: {},
    create: {
      organizationId: acme.id,
      paymentNumber: "PAY-2026-00001",
      invoiceId: acmeInv1.id,
      customerId: acmeCust1.id,
      amount: 1869.12,
      paymentMethod: "CREDIT_CARD",
      transactionReference: "txn_acme_live_987654321",
      status: "COMPLETED",
    },
  });

  // =========================================================================
  // ORGANIZATION 2: NEXUS GLOBAL SOLUTIONS (EUR)
  // =========================================================================
  const nexus = await prisma.organization.upsert({
    where: { slug: "nexus-global" },
    update: {},
    create: {
      name: "Nexus Global Solutions",
      slug: "nexus-global",
      currency: "EUR",
      timezone: "Europe/Berlin",
    },
  });

  await prisma.user.upsert({
    where: { email: "elena@nexus.eu" },
    update: {},
    create: {
      name: "Elena Rostova",
      email: "elena@nexus.eu",
      passwordHash: defaultPassword,
      role: "ORGANIZATION_ADMIN",
      status: "ACTIVE",
      organizationId: nexus.id,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "lucas.ops@nexus.eu" },
    update: {},
    create: {
      name: "Lucas Weber",
      email: "lucas.ops@nexus.eu",
      passwordHash: defaultPassword,
      role: "STAFF",
      status: "ACTIVE",
      organizationId: nexus.id,
      emailVerified: new Date(),
    },
  });

  // Nexus Taxes & Discounts
  await prisma.taxRule.upsert({
    where: { organizationId_name: { organizationId: nexus.id, name: "EU VAT Standard (19%)" } },
    update: {},
    create: { organizationId: nexus.id, name: "EU VAT Standard (19%)", rate: 19.0, isDefault: true, status: true },
  });

  await prisma.discountRule.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "NEXUS20" } },
    update: {},
    create: { organizationId: nexus.id, code: "NEXUS20", name: "Nexus 20% Discount", type: "PERCENTAGE", value: 20.0, status: true },
  });

  // Nexus Products (5 products)
  const nexusProd1 = await prisma.product.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PROD-CYBER" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "Nexus Cyber Shield Core",
      code: "PROD-CYBER",
      description: "Next-gen zero-trust cloud firewall.",
      salesPrice: 499.0,
      costPrice: 120.0,
      productType: "SERVICE",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PROD-GATEWAY" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "API Gateway Managed Proxy",
      code: "PROD-GATEWAY",
      description: "Distributed edge proxy with rate limiting.",
      salesPrice: 249.0,
      costPrice: 50.0,
      productType: "SERVICE",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PROD-GDPR" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "GDPR Compliance Audit Suite",
      code: "PROD-GDPR",
      description: "Automated privacy audit & consent tracking.",
      salesPrice: 799.0,
      costPrice: 200.0,
      productType: "DIGITAL",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PROD-TELEMETRY" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "Real-time Telemetry Engine",
      code: "PROD-TELEMETRY",
      description: "Distributed tracing and telemetry metrics.",
      salesPrice: 299.0,
      costPrice: 60.0,
      productType: "SERVICE",
      status: "ACTIVE",
    },
  });

  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PROD-VAULT" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "Multi-Region Backup Vault",
      code: "PROD-VAULT",
      description: "Immutable encrypted disaster recovery backups.",
      salesPrice: 180.0,
      costPrice: 45.0,
      productType: "DIGITAL",
      status: "ACTIVE",
    },
  });

  // Nexus Plans (3 plans)
  const nexusPlan1 = await prisma.plan.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PLAN-NEXUS-START" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "Nexus Guard Monthly",
      code: "PLAN-NEXUS-START",
      description: "Cyber Shield security for small teams.",
      price: 350.0,
      billingInterval: "MONTHLY",
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyCancellation: true,
      status: "ACTIVE",
    },
  });

  await prisma.plan.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PLAN-NEXUS-BIZ" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "Nexus Business Scale",
      code: "PLAN-NEXUS-BIZ",
      description: "Advanced zero trust protection.",
      price: 890.0,
      billingInterval: "MONTHLY",
      minimumQuantity: 1,
      allowPause: true,
      allowEarlyCancellation: true,
      status: "ACTIVE",
    },
  });

  await prisma.plan.upsert({
    where: { organizationId_code: { organizationId: nexus.id, code: "PLAN-NEXUS-ENT" } },
    update: {},
    create: {
      organizationId: nexus.id,
      name: "Nexus Global Enterprise",
      code: "PLAN-NEXUS-ENT",
      description: "Unlimited regional nodes and dedicated SRE.",
      price: 9500.0,
      billingInterval: "YEARLY",
      minimumQuantity: 1,
      allowPause: false,
      allowEarlyCancellation: false,
      status: "ACTIVE",
    },
  });

  // Nexus Customers (5 customers)
  const nexusCust1 = await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: nexus.id, email: "liam@apex.de" } },
    update: {},
    create: {
      organizationId: nexus.id,
      customerNumber: "CUST-9001",
      name: "Liam Schmidt",
      email: "liam@apex.de",
      phone: "+49 30 123456",
      companyName: "Apex Dynamics GmbH",
      billingAddress: "Alexanderplatz 1",
      city: "Berlin",
      country: "Germany",
      postalCode: "10178",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "liam@apex.de" },
    update: {},
    create: {
      name: "Liam Schmidt",
      email: "liam@apex.de",
      passwordHash: defaultPassword,
      role: "CUSTOMER",
      status: "ACTIVE",
      organizationId: nexus.id,
      customerId: nexusCust1.id,
      emailVerified: new Date(),
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: nexus.id, email: "sophie@parislabs.fr" } },
    update: {},
    create: {
      organizationId: nexus.id,
      customerNumber: "CUST-9002",
      name: "Sophie Dubois",
      email: "sophie@parislabs.fr",
      phone: "+33 1 42685500",
      companyName: "Paris Labs SAS",
      billingAddress: "15 Rue de Rivoli",
      city: "Paris",
      country: "France",
      postalCode: "75004",
      status: "ACTIVE",
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: nexus.id, email: "matteo@milanotech.it" } },
    update: {},
    create: {
      organizationId: nexus.id,
      customerNumber: "CUST-9003",
      name: "Matteo Rossi",
      email: "matteo@milanotech.it",
      phone: "+39 02 876543",
      companyName: "Milano Tech SpA",
      billingAddress: "Via Monte Napoleone 8",
      city: "Milan",
      country: "Italy",
      postalCode: "20121",
      status: "ACTIVE",
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: nexus.id, email: "lars@nordicpay.dk" } },
    update: {},
    create: {
      organizationId: nexus.id,
      customerNumber: "CUST-9004",
      name: "Lars Nielsen",
      email: "lars@nordicpay.dk",
      phone: "+45 33 123456",
      companyName: "NordicPay ApS",
      billingAddress: "Strøget 24",
      city: "Copenhagen",
      country: "Denmark",
      postalCode: "1160",
      status: "ACTIVE",
    },
  });

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: nexus.id, email: "olivia@cambridgeai.co.uk" } },
    update: {},
    create: {
      organizationId: nexus.id,
      customerNumber: "CUST-9005",
      name: "Olivia Brown",
      email: "olivia@cambridgeai.co.uk",
      phone: "+44 1223 765432",
      companyName: "Cambridge AI Systems Ltd",
      billingAddress: "Trinity Street 12",
      city: "Cambridge",
      country: "UK",
      postalCode: "CB2 1TJ",
      status: "ACTIVE",
    },
  });

  // Nexus Subscriptions & Invoices
  await prisma.subscription.upsert({
    where: { organizationId_subscriptionNumber: { organizationId: nexus.id, subscriptionNumber: "SUB-NEXUS-001" } },
    update: {},
    create: {
      organizationId: nexus.id,
      subscriptionNumber: "SUB-NEXUS-001",
      customerId: nexusCust1.id,
      planId: nexusPlan1.id,
      status: "ACTIVE",
      billingFrequency: "MONTHLY",
      startDate: now,
      nextBillingDate: nextMonth,
      subtotal: 350.0,
      discountAmount: 0.0,
      taxAmount: 66.5,
      totalAmount: 416.5,
      lines: {
        create: [
          {
            productId: nexusProd1.id,
            description: "Nexus Cyber Shield Core Security",
            quantity: 1,
            unitPrice: 350.0,
            discountRate: 0.0,
            taxRate: 19.0,
            subtotal: 350.0,
            total: 416.5,
          },
        ],
      },
      history: {
        create: {
          action: "CREATED",
          newStatus: "ACTIVE",
          reason: "Initial Nexus subscription seeding",
          actorEmail: "elena@nexus.eu",
        },
      },
    },
  });

  console.log("🎉 Complete Realistic Multi-Tenant Test Data Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
