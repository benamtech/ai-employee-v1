import { describe, it, expect, beforeAll } from "vitest";
import { mintOAuthState, verifyOAuthState } from "../../apps/manager/src/lib/oauth-state";

beforeAll(() => {
  process.env.SIGNING_SECRET = "unit-test-signing-secret-key-0123456789";
});

// Groundwork for Gmail/Stripe OAuth (10-security: "OAuth CSRF state mismatch fails").
describe("OAuth state", () => {
  it("round-trips employee + provider", () => {
    const s = mintOAuthState("emp_1", "gmail");
    const p = verifyOAuthState(s);
    expect(p?.employee_id).toBe("emp_1");
    expect(p?.provider).toBe("gmail");
  });

  it("rejects a tampered state (CSRF mismatch)", () => {
    const s = mintOAuthState("emp_1", "stripe");
    expect(verifyOAuthState(s.replace(/.$/, "X"))).toBeNull();
  });

  it("rejects an expired state", () => {
    const s = mintOAuthState("emp_1", "gmail", -1);
    expect(verifyOAuthState(s)).toBeNull();
  });
});
