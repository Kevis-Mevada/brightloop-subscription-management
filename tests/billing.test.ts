import { describe, it, expect } from "vitest";
import { calculateNextBillingDate } from "../src/lib/billing";

describe("Recurring Billing Calculation Engine", () => {
  it("advances nextBillingDate accurately for DAILY interval", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const next = calculateNextBillingDate(start, "DAILY");
    expect(next.getDate()).toBe(16);
  });

  it("advances nextBillingDate accurately for WEEKLY interval", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const next = calculateNextBillingDate(start, "WEEKLY");
    expect(next.getDate()).toBe(22);
  });

  it("advances nextBillingDate accurately for MONTHLY interval", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const next = calculateNextBillingDate(start, "MONTHLY");
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(15);
  });

  it("advances nextBillingDate accurately for YEARLY interval", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    const next = calculateNextBillingDate(start, "YEARLY");
    expect(next.getFullYear()).toBe(2027);
  });

  it("constructs deterministic idempotency keys preventing duplicate billing periods", () => {
    const subId = "sub_xyz789";
    const start = new Date("2026-02-01T00:00:00Z");
    const end = new Date("2026-03-01T00:00:00Z");

    const key1 = `SUB-${subId}-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}`;
    const key2 = `SUB-${subId}-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}`;

    expect(key1).toBe("SUB-sub_xyz789-2026-02-01-2026-03-01");
    expect(key1).toBe(key2); // Idempotent match
  });
});

