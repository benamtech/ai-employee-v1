import { describe, it, expect, beforeAll } from "vitest";
import { sealSecret, openSecret, redact } from "../../apps/manager/src/lib/secrets";
import { sanitizeAuditDetails } from "../../apps/manager/src/lib/audit";

beforeAll(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-master-key-0123456789abcdef";
});

// Secrets BY REFERENCE (10-security: "Store OAuth tokens and Stripe secrets by ref";
// "Logs do not contain raw provider tokens").
describe("secret references", () => {
  it("seals and opens a secret", () => {
    const ref = sealSecret("ya29.super-secret-oauth-token");
    expect(openSecret(ref)).toBe("ya29.super-secret-oauth-token");
  });

  it("the reference does not leak the plaintext", () => {
    const ref = sealSecret("ya29.super-secret-oauth-token");
    expect(ref).not.toContain("super-secret");
  });

  it("a tampered reference fails to open (auth tag)", () => {
    const ref = sealSecret("token");
    expect(() => openSecret(ref.slice(0, -2) + "zz")).toThrow();
  });

  it("redact never prints a full secret", () => {
    expect(redact("sk_test_1234567890")).not.toContain("1234567890");
  });

  it("audit details redact tokens, signatures, and raw bodies", () => {
    const details = sanitizeAuditDetails({
      token_secret_ref: "ya29.super-secret-oauth-token",
      StripeSignature: "t=1,v1=abc",
      raw_body: "{\"customer\":\"Jane\"}",
      nested: { message: "failed with sk_test_1234567890" },
    });
    const printed = JSON.stringify(details);
    expect(printed).not.toContain("super-secret");
    expect(printed).not.toContain("Jane");
    expect(printed).not.toContain("1234567890");
    expect(printed).toContain("[redacted]");
  });
});
