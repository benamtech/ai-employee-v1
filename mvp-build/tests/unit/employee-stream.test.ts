import { describe, expect, it } from "vitest";
import { buildEmployeeSnapshot, cursorFromSnapshot, fetchWorkEventsSince } from "../../apps/manager/src/lib/employee-stream";
import { makeFakeDb } from "./_helpers/fake-supabase";

function descriptorPayload(account: string, employee: string) {
  return { work_event_descriptor: { account_id: account, employee_id: employee, move: "notify", title: "T", summary: "S" } };
}

function toolDescriptorPayload(account: string, employee: string) {
  return {
    work_event_descriptor: {
      account_id: account,
      employee_id: employee,
      move: "notify",
      title: "Tool result",
      summary: "Avery prepared a customer update.",
      deliverable: {
        type: "tool_activity",
        title: "Create account",
        refs: {
          approval_id: "appr_1",
          tool_call_id: "call_1",
          manager_account_id: account,
        },
        acceptance: ["acknowledge"],
        ui_resource: {
          type: "rawHtml",
          uri: "ui://manager/create_account",
          mimeType: "text/html",
          text: "<div>create_account</div>",
        },
        tool: {
          name: "create_account",
          toolset: "manager_mcp",
          input: { email: "owner@example.com", password: "secret", provision_employee: true },
          input_schema: { type: "object", properties: { email: { type: "string" } } },
          result_summary: "Created Manager account.",
        },
      },
      proof: { run_id: "run_1", tool: "manager_tool:create_account" },
    },
  };
}

const seed = () => ({
  approvals: [{ id: "appr_1", employee_id: "emp_1", account_id: "acct_1", action_key: "send_email", summary: "x", risk_level: "high", resolution: null, created_at: "2026-07-04T00:00:00Z" }],
  employees: [{ id: "emp_1", account_id: "acct_1", name: "Sage", status: "live", profile_id: "client_emp_1", created_at: "2026-07-04T00:00:00Z" }],
  artifacts: [{ id: "art_1", employee_id: "emp_1", account_id: "acct_1", kind: "estimate", payload: { customer_name: "Jane", job_description: "Mulch", recommended_total: 1120 }, storage_ref: null, created_at: "2026-07-04T00:00:03Z" }],
  connector_accounts: [{ id: "conn_1", employee_id: "emp_1", account_id: "acct_1", connector_key: "gmail", provider: "gmail", status: "needs_reauth", last_error: "expired" }],
  employee_messages: [{ id: "m_1", employee_id: "emp_1", direction: "to_owner", body: "hi", status: "sent", created_at: "2026-07-04T00:00:00Z" }],
  inbound_events: [
    { id: "e_1", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
    { id: "e_other", account_id: "acct_2", employee_id: "emp_2", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:02Z", normalized_payload: descriptorPayload("acct_2", "emp_2") },
  ],
});

describe("buildEmployeeSnapshot", () => {
  it("returns an account-scoped, descriptor-filtered read-model", async () => {
    const db = makeFakeDb(seed());
    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    expect(snap.account_id).toBe("acct_1");
    expect(snap.employee_id).toBe("emp_1");
    expect(snap.approvals).toHaveLength(1);
    // Only this employee/account's work event survives the descriptor filter.
    expect(snap.work_events.map((w) => w.id)).toEqual(["e_1"]);
    expect(snap.employee?.name).toBe("Sage");
    expect(snap.outputs?.map((o) => o.id)).toContain("artifact:art_1");
    expect(snap.tasks?.some((t) => t.id === "approval:appr_1")).toBe(true);
    expect(snap.tasks?.some((t) => t.id === "connector:conn_1")).toBe(true);
    expect(snap.abilities?.some((a) => a.id === "ability:email" && a.status === "needs_connection")).toBe(true);
    expect(snap.capabilities?.some((c) => c.key === "ability:estimate")).toBe(true);
    expect(snap.capabilities?.some((c) => c.key.startsWith("manager_tool:"))).toBe(false);
    expect(snap.surface_envelopes?.some((e) => e.kind === "approval" && e.safety.requires_approval)).toBe(true);
    expect(snap.connection_surfaces?.map((c) => c.label)).toEqual(expect.arrayContaining(["Email", "Payments", "Accounting", "Files", "Calendar", "Store"]));
    expect(snap.connection_surfaces?.find((c) => c.label === "Email")?.state).toBe("needs_you");
    expect(snap.connection_surfaces?.find((c) => c.label === "Payments")?.capability_keys).toContain("ability:payments");
    expect(snap.resurface_items?.some((item) => item.kind === "connector" && item.target?.kind === "task")).toBe(true);
    expect(snap.resurface_items?.some((item) => item.kind === "review" && item.target?.kind === "approval")).toBe(true);
  });

  it("projects owner resources without Manager account, MCP, tool schema, or UI-resource internals", async () => {
    const db = makeFakeDb({
      ...seed(),
      inbound_events: [
        { id: "e_tool", account_id: "acct_1", employee_id: "emp_1", source: "manager_mcp", event_type: "manager.tool_activity", status: "delivered", created_at: "2026-07-04T00:00:05Z", normalized_payload: toolDescriptorPayload("acct_1", "emp_1") },
      ],
    });

    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    const json = JSON.stringify(snap);

    expect(json).not.toContain("create_account");
    expect(json).not.toContain("provision_employee");
    expect(json).not.toContain("manager_tool:");
    expect(json).not.toContain("manager_mcp");
    expect(json).not.toContain("input_schema");
    expect(json).not.toContain("\"input\"");
    expect(json).not.toContain("ui_resource");
    expect(json).not.toContain("owner@example.com");
    expect(snap.work_events[0]?.work_event_descriptor?.deliverable).toMatchObject({
      type: "recommendation",
      title: "Create account",
      refs: { approval_id: "appr_1" },
    });
  });

  it("derives generic connection surfaces from connector rows and capability categories", async () => {
    const db = makeFakeDb({
      ...seed(),
      connector_accounts: [
        { id: "conn_email", employee_id: "emp_1", account_id: "acct_1", connector_key: "gmail", provider: "gmail", status: "connected", external_email: "owner@example.com", last_connector_test_at: "2026-07-04T00:00:04Z" },
        { id: "conn_custom", employee_id: "emp_1", account_id: "acct_1", connector_key: "field_app", provider: "field_ops", status: "connected", external_label: "Field Ops" },
        { id: "conn_ref", employee_id: "emp_1", account_id: "acct_1", connector_key: "reference_data", provider: "readonly_mcp", status: "connected", external_label: "Reference catalog" },
      ],
    });
    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    expect(snap.connection_surfaces?.find((c) => c.id === "connection:email")).toMatchObject({
      label: "Email",
      state: "working",
      account_label: "owner@example.com",
      connector_id: "conn_email",
    });
    expect(snap.connection_surfaces?.find((c) => c.id === "connection:payments")).toMatchObject({
      label: "Payments",
      state: "not_connected",
    });
    expect(snap.connection_surfaces?.find((c) => c.id === "connection:custom:conn_custom")).toMatchObject({
      label: "Field Ops",
      category: "custom",
      state: "connected",
      what_employee_can_do: "Use this connected system through approved Manager capabilities.",
    });
    expect(snap.connection_surfaces?.find((c) => c.id === "connection:custom:conn_ref")).toMatchObject({
      label: "Reference Data",
      category: "custom",
      state: "connected",
      what_employee_can_do: "Query this read-only system directly when it helps the work.",
    });
  });

  it("queries scoped inbound events before applying the recent-event limit", async () => {
    const unrelated = Array.from({ length: 60 }, (_, i) => ({
      id: `e_other_${i}`,
      account_id: "acct_2",
      employee_id: "emp_2",
      source: "gmail",
      event_type: "gmail.reply_received",
      status: "delivered",
      created_at: `2026-07-04T00:01:${String(i).padStart(2, "0")}Z`,
      normalized_payload: descriptorPayload("acct_2", "emp_2"),
    }));
    const db = makeFakeDb({
      ...seed(),
      inbound_events: [
        ...unrelated,
        { id: "e_relevant", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
      ],
    });
    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    expect(snap.work_events.map((w) => w.id)).toEqual(["e_relevant"]);
  });
});

describe("fetchWorkEventsSince", () => {
  it("returns only events strictly after the cursor and advances it", async () => {
    const db = makeFakeDb(seed());
    const before = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:00Z");
    expect(before.workEvents.map((w) => w.id)).toEqual(["e_1"]);
    expect(before.nextCursor).toEqual({ created_at: "2026-07-04T00:00:01Z", id: "e_1" });

    const after = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", { created_at: "2026-07-04T00:00:01Z", id: "e_1" });
    expect(after.workEvents).toHaveLength(0);
  });

  it("does not let unrelated tenant events consume the since-cursor window", async () => {
    const unrelated = Array.from({ length: 60 }, (_, i) => ({
      id: `e_other_${i}`,
      account_id: "acct_2",
      employee_id: "emp_2",
      source: "gmail",
      event_type: "gmail.reply_received",
      status: "delivered",
      created_at: `2026-07-04T00:01:${String(i).padStart(2, "0")}Z`,
      normalized_payload: descriptorPayload("acct_2", "emp_2"),
    }));
    const db = makeFakeDb({
      ...seed(),
      approvals: [],
      inbound_events: [
        ...unrelated,
        { id: "e_relevant", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
      ],
    });
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:00Z");
    expect(delta.workEvents.map((w) => w.id)).toEqual(["e_relevant"]);
    expect(delta.nextCursor).toEqual({ created_at: "2026-07-04T00:00:01Z", id: "e_relevant" });
  });

  it("surfaces newly created approvals as deltas", async () => {
    const db = makeFakeDb(seed());
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-03T00:00:00Z");
    expect(delta.approvals).toEqual([{ id: "appr_1", resolution: null }]);
  });

  it("advances the cursor when only approvals are new", async () => {
    const db = makeFakeDb({
      ...seed(),
      inbound_events: [],
      approvals: [{ id: "appr_2", employee_id: "emp_1", account_id: "acct_1", action_key: "send_email", summary: "x", risk_level: "high", resolution: null, created_at: "2026-07-04T00:00:05Z" }],
    });
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:00Z");
    expect(delta.approvals).toEqual([{ id: "appr_2", resolution: null }]);
    expect(delta.nextCursor).toEqual({ created_at: "2026-07-04T00:00:05Z", id: "appr_2" });
  });

  it("uses a stable created_at/id cursor for same-ms rows", async () => {
    const db = makeFakeDb({
      ...seed(),
      inbound_events: [
        { id: "evt_a", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01.000Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
        { id: "evt_b", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01.000Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
        { id: "evt_c", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:02.000Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
      ],
      approvals: [],
    });
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", { created_at: "2026-07-04T00:00:01.000Z", id: "evt_a" });
    expect(delta.workEvents.map((w) => w.id)).toEqual(["evt_b", "evt_c"]);
    expect(delta.nextCursor).toEqual({ created_at: "2026-07-04T00:00:02.000Z", id: "evt_c" });
  });

  it("derives reconnect cursor from delivered snapshot rows", async () => {
    const db = makeFakeDb(seed());
    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    expect(cursorFromSnapshot(snap)).toEqual({ created_at: "2026-07-04T00:00:01Z", id: "e_1" });
  });
});
