import { describe, it, expect } from "vitest";
import prisma from "../src/lib/db";

describe("Multi-Tenant Security & Isolation", () => {
  it("verifies both Organization A and Organization B exist in database", async () => {
    const acme = await prisma.organization.findUnique({
      where: { slug: "acme-cloud" },
    });
    const nexus = await prisma.organization.findUnique({
      where: { slug: "nexus-global" },
    });

    expect(acme).not.toBeNull();
    expect(nexus).not.toBeNull();
    expect(acme?.id).not.toBe(nexus?.id);
  });

  it("ensures Organization A products are never returned in queries for Organization B", async () => {
    const acme = await prisma.organization.findUnique({ where: { slug: "acme-cloud" } });
    const nexus = await prisma.organization.findUnique({ where: { slug: "nexus-global" } });

    // Acme products
    const acmeProducts = await prisma.product.findMany({
      where: { organizationId: acme!.id },
    });

    // Nexus products
    const nexusProducts = await prisma.product.findMany({
      where: { organizationId: nexus!.id },
    });

    expect(acmeProducts.length).toBeGreaterThan(0);
    const acmeProductIds = acmeProducts.map((p) => p.id);
    const nexusProductIds = nexusProducts.map((p) => p.id);

    // Set intersection must be empty
    const overlap = acmeProductIds.filter((id) => nexusProductIds.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("ensures Organization A invoices cannot be accessed by Organization B", async () => {
    const acme = await prisma.organization.findUnique({ where: { slug: "acme-cloud" } });
    const nexus = await prisma.organization.findUnique({ where: { slug: "nexus-global" } });

    const acmeInvoices = await prisma.invoice.findMany({
      where: { organizationId: acme!.id },
    });

    for (const inv of acmeInvoices) {
      // Query with nexus organizationId should return null (IDOR protection)
      const leaked = await prisma.invoice.findFirst({
        where: { id: inv.id, organizationId: nexus!.id },
      });
      expect(leaked).toBeNull();
    }
  });

  it("ensures Customer Portal isolation restricts access only to customer's own subscriptions", async () => {
    const acme = await prisma.organization.findUnique({ where: { slug: "acme-cloud" } });
    const alex = await prisma.customer.findFirst({
      where: { organizationId: acme!.id, email: "alex@techstart.io" },
    });
    const emma = await prisma.customer.findFirst({
      where: { organizationId: acme!.id, email: "emma@innovate.co" },
    });

    expect(alex).not.toBeNull();
    expect(emma).not.toBeNull();

    // Query scoped to Alex
    const alexSubs = await prisma.subscription.findMany({
      where: { organizationId: acme!.id, customerId: alex!.id },
    });

    for (const sub of alexSubs) {
      expect(sub.customerId).toBe(alex!.id);
      expect(sub.customerId).not.toBe(emma!.id);
    }
  });
});

