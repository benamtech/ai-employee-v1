import { describe, expect, it } from "vitest";
import { runManagerTool } from "../../apps/manager/src/lib/run-tool";
import type { ToolName } from "../../packages/shared/src/tool-contracts";

// These outcomes short-circuit BEFORE building the tool context / serviceClient,
// so they need no live DB — they prove the schema-first dispatch guard.
describe("runManagerTool dispatch guard", () => {
  it("blocks scheduler-only tools on any per-tool transport", async () => {
    const outcome = await runManagerTool("dispatch_due_reminders", {});
    expect(outcome.kind).toBe("scheduler_only");
  });

  it("rejects unknown tools", async () => {
    const outcome = await runManagerTool("not_a_real_tool" as ToolName, {});
    expect(outcome.kind).toBe("unknown_tool");
  });

  it("rejects input that violates a gated tool's schema with a validation_failed envelope", async () => {
    const outcome = await runManagerTool("send_deposit_invoice", { account_id: "acct_1", employee_id: "emp_1" });
    expect(outcome.kind).toBe("invalid_input");
    if (outcome.kind !== "invalid_input") throw new Error("expected invalid_input");
    expect(outcome.envelope.status).toBe("failed");
    expect(outcome.envelope.proof.failure_code).toBe("validation_failed");
    // owner context is preserved for the caller even on rejection
    expect(outcome.envelope.account_id).toBe("acct_1");
    expect(outcome.envelope.employee_id).toBe("emp_1");
  });

  it("accepts a well-formed gated input at the schema boundary (before the handler)", async () => {
    // A complete request_approval payload must pass validation. We can't run the
    // handler here (no DB), but a schema violation would surface as invalid_input.
    const outcome = await runManagerTool("request_approval", {
      account_id: "acct_1",
      employee_id: "emp_1",
      action_key: "send_estimate_email",
      summary: "Send the estimate to the customer",
      risk_level: "medium",
    }).catch((err) => ({ kind: "threw", err } as const));
    // Either it reached the handler (kind ok/threw on DB) — NOT invalid_input.
    expect(["ok", "threw"]).toContain((outcome as { kind: string }).kind);
  });
});
