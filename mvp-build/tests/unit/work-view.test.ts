import { describe, expect, it } from "vitest";
import { validateWorkView, validateWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";

describe("validateWorkView", () => {
  it("accepts well-formed views", () => {
    expect(validateWorkView({ kind: "table", columns: ["A", "B"], rows: [["1", "2"]] }).ok).toBe(true);
    expect(validateWorkView({ kind: "schedule", span: "week", slots: [{ when: "Mon", label: "Job" }] }).ok).toBe(true);
    expect(validateWorkView({ kind: "diff", before: { x: "1" }, after: { x: "2" } }).ok).toBe(true);
    expect(validateWorkView({ kind: "form", fields: [{ name: "n", label: "Name" }] }).ok).toBe(true);
  });

  it("rejects malformed views", () => {
    expect(validateWorkView({ kind: "table", columns: ["A"], rows: [["1", "2"]] }).ok).toBe(false);
    expect(validateWorkView({ kind: "schedule", span: "year" as never, slots: [] }).ok).toBe(false);
    expect(validateWorkView({ kind: "form", fields: [] }).ok).toBe(false);
  });
});

const gated = (over: Partial<WorkEventDescriptor["deliverable"]> = {}): WorkEventDescriptor => ({
  account_id: "acct_1", employee_id: "emp_1", move: "review", title: "T", summary: "S",
  deliverable: {
    type: "money_movement", title: "Deposit", refs: {}, money: { involved: true },
    acceptance: ["approve", "reject"], ...over,
  } as WorkEventDescriptor["deliverable"],
});

describe("gate invariance with a view", () => {
  it("a view never relaxes the gate on a money/customer deliverable", () => {
    // A gated deliverable still needs an approve/respond action even with a view.
    const bad = gated({ acceptance: ["acknowledge"], view: { kind: "table", columns: ["A"], rows: [["1"]] } });
    expect(validateWorkEventDescriptor(bad)).toEqual({ ok: false, reason: "gated_deliverable_without_gate" });
  });

  it("a malformed view fails validation even when the gate is satisfied", () => {
    const bad = gated({ view: { kind: "form", fields: [] } });
    expect(validateWorkEventDescriptor(bad).ok).toBe(false);
  });

  it("a well-formed gated deliverable with a view passes", () => {
    const ok = gated({ view: { kind: "table", columns: ["Item"], rows: [["Paint"]], bulk_accept: true } });
    expect(validateWorkEventDescriptor(ok)).toEqual({ ok: true });
  });
});
