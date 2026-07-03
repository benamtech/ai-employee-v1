import { describe, expect, it } from "vitest";
import { renderWorkEventSms, validateWorkEventDescriptor, workDeliverableNeedsGate, type WorkEventDescriptor } from "../../packages/shared/src/work-events";

const base: WorkEventDescriptor = {
  account_id: "acct_1",
  employee_id: "emp_1",
  move: "question",
  title: "Customer replied",
  summary: "Jane accepted the deposit and asked for Tuesday.",
  suggested_next_action: "Approve the deposit invoice or tell me what to change.",
};

describe("WorkEventDescriptor conformance", () => {
  it("accepts a gated money movement with an approval path", () => {
    expect(validateWorkEventDescriptor({
      ...base,
      deliverable: {
        type: "money_movement",
        title: "Deposit invoice",
        refs: { estimate_artifact_id: "art_1" },
        leaves_business: true,
        money: { involved: true, amount_cents: 84000, currency: "usd" },
        acceptance: ["approve", "edit", "reject"],
      },
    })).toMatchObject({ ok: true });
  });

  it("rejects money or leaves-business deliverables without a gate", () => {
    expect(validateWorkEventDescriptor({
      ...base,
      deliverable: {
        type: "outbound_message",
        title: "Estimate email",
        refs: { draft_id: "email_1" },
        leaves_business: true,
        acceptance: ["acknowledge"],
      },
    })).toMatchObject({ ok: false, reason: "gated_deliverable_without_gate" });
  });

  it("renders concise SMS text from the same descriptor", () => {
    expect(renderWorkEventSms(base)).toContain("Customer replied");
    expect(renderWorkEventSms(base)).toContain("Approve the deposit invoice");
  });

  it("identifies deliverables that need a structural gate", () => {
    expect(workDeliverableNeedsGate({ type: "money_movement", title: "Invoice", refs: {}, money: { involved: true }, acceptance: ["approve"] })).toBe(true);
    expect(workDeliverableNeedsGate({ type: "plan", title: "Plan", refs: {}, money: { involved: false }, acceptance: ["acknowledge"] })).toBe(false);
  });
});
