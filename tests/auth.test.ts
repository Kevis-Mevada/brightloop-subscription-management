import { describe, it, expect } from "vitest";
import { validatePassword, hashPassword, comparePassword, createSessionToken, verifySessionToken } from "../src/lib/auth";

describe("Authentication & Security Module", () => {
  it("strictly validates password complexity (>= 9 chars, uppercase, lowercase, special character)", () => {
    // Too short (< 9)
    expect(validatePassword("Pass1!").isValid).toBe(false);

    // Missing uppercase
    expect(validatePassword("password123!").isValid).toBe(false);

    // Missing lowercase
    expect(validatePassword("PASSWORD123!").isValid).toBe(false);

    // Missing special character
    expect(validatePassword("Password123").isValid).toBe(false);

    // Valid: 9+ chars, upper, lower, special character
    expect(validatePassword("Password123!").isValid).toBe(true);
    expect(validatePassword("Brightloop2026#Secure").isValid).toBe(true);
  });

  it("hashes password with bcrypt and verifies comparison correctly", async () => {
    const raw = "SuperSecret#2026";
    const hashed = await hashPassword(raw);

    expect(hashed).not.toBe(raw);
    expect(hashed.startsWith("$2a$") || hashed.startsWith("$2b$")).toBe(true);

    const isMatch = await comparePassword(raw, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword("WrongPassword1!", hashed);
    expect(isWrongMatch).toBe(false);
  });

  it("generates and verifies secure JWT session tokens", async () => {
    const mockUser = {
      id: "usr_test_123",
      email: "test@brightloop.io",
      name: "Test Admin",
      role: "ORGANIZATION_ADMIN" as const,
      status: "ACTIVE" as const,
      organizationId: "org_acme_123",
      customerId: null,
      organizationName: "Acme Corp",
    };

    const token = await createSessionToken(mockUser);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(mockUser.email);
    expect(verified?.role).toBe("ORGANIZATION_ADMIN");
    expect(verified?.organizationId).toBe("org_acme_123");
  });
});

