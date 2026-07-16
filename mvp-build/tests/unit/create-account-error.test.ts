import { describe, expect, it } from "vitest";
import { createAccountAuthError } from "../../apps/manager/src/tools/identity.stub";

describe("create account error mapping", () => {
  it("maps duplicate Supabase Auth emails to a stable owner-facing code", () => {
    expect(createAccountAuthError("A user with this email address has already been registered")).toMatchObject({
      code: "account_email_already_registered",
      reason: "account_email_already_registered",
      audit_message: "email already registered",
      user_facing_summary_hint: "That email already has an AMTECH account. Use a different email for this new employee setup.",
    });
  });

  it("keeps generic auth failures non-secret and actionable", () => {
    expect(createAccountAuthError("Password should be at least 6 characters")).toMatchObject({
      code: "account_create_failed",
      reason: "supabase_auth_error",
      user_facing_summary_hint: "I could not create the account. Try a different email and password, then run it again.",
    });
  });
});
