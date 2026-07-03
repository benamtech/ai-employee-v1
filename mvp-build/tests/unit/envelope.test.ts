import { describe, it, expect } from "vitest";
import {
  ok,
  failed,
  needsConfirmation,
  notImplemented,
} from "../../packages/shared/src/envelope";

describe("tool return envelope", () => {
  it("ok carries provider proof and the spec fields", () => {
    const env = ok({
      account_id: "acct_1",
      employee_id: "emp_1",
      proof: { twilio_sid: "SM123" },
      changed_resources: ["employee:emp_1"],
      audit_id: "aud_1",
    });
    expect(env.status).toBe("ok");
    expect(env.proof.twilio_sid).toBe("SM123");
    expect(env.changed_resources).toContain("employee:emp_1");
    expect(env.audit_id).toBe("aud_1");
  });

  it("notImplemented is a real failure, not a faked success", () => {
    const env = notImplemented("provision_employee");
    expect(env.status).toBe("failed");
    expect(env.proof.failure_code).toBe("not_implemented");
    // Crucially: no provider proof ids are fabricated.
    expect(env.proof.twilio_sid).toBeUndefined();
  });

  it("failed records a structured failure code", () => {
    const env = failed("validation_failed", "missing phone");
    expect(env.status).toBe("failed");
    expect(env.proof.failure_code).toBe("validation_failed");
  });

  it("needsConfirmation surfaces the gate", () => {
    const env = needsConfirmation({
      action_key: "send_estimate_email",
      summary: "Send estimate to jane@example.com?",
      risk_level: "medium",
    });
    expect(env.status).toBe("needs_confirmation");
    expect(env.required_confirmation?.action_key).toBe("send_estimate_email");
  });
});
