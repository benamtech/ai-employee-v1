import { describe, expect, it } from "vitest";
import { handleManagerMcpRequest, isRealMcpToolExecutionResult } from "../../apps/manager/src/lib/mcp-server";

function rpc(method: string, params: unknown, id = 1): Request {
  return new Request("http://manager.local/manager/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
}

function parse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // SSE framing fallback: pull the last `data:` line.
    const line = text.split("\n").reverse().find((l) => l.startsWith("data:"));
    return JSON.parse((line ?? "").slice(5).trim()) as Record<string, unknown>;
  }
}

async function call(method: string, params: unknown, identity?: { account_id?: string; employee_id?: string }): Promise<{ status: number; body: any }> {
  const res = await handleManagerMcpRequest(rpc(method, params), identity);
  return { status: res.status, body: parse(await res.text()) };
}

describe("Manager MCP server (transport over the tool registry)", () => {
  it("lists employee-callable tools with JSON-Schema inputs and hides scheduler-only tools", async () => {
    const { status, body } = await call("tools/list", {});
    expect(status).toBe(200);
    const tools = body.result.tools as Array<{ name: string; inputSchema: { type?: string } }>;
    const names = tools.map((t) => t.name);
    expect(names).toContain("create_estimate_artifact");
    expect(names).toContain("request_approval");
    expect(names).toContain("send_deposit_invoice");
    // scheduler-only, timer-driven tools are NOT callable by the employee
    expect(names).not.toContain("dispatch_due_reminders");
    expect(names).not.toContain("dispatch_daily_briefs");
    const est = tools.find((t) => t.name === "create_estimate_artifact");
    expect(est?.inputSchema.type).toBe("object");
  });

  it("returns an error result with a validation_failed envelope for malformed input", async () => {
    const { body } = await call("tools/call", {
      name: "send_deposit_invoice",
      arguments: { account_id: "acct_1", employee_id: "emp_1" },
    });
    expect(body.result.isError).toBe(true);
    expect(body.result.structuredContent.status).toBe("failed");
    expect(body.result.structuredContent.proof.failure_code).toBe("validation_failed");
  });

  it("refuses scheduler-only tools called directly over MCP", async () => {
    const { body } = await call("tools/call", { name: "dispatch_due_reminders", arguments: {} });
    expect(body.result.isError).toBe(true);
  });

  it("does NOT advertise the injected owner-context fields to the model", async () => {
    const { body } = await call("tools/list", {});
    const tools = body.result.tools as Array<{ name: string; inputSchema: any }>;
    for (const name of ["create_estimate_artifact", "request_approval", "set_internal_reminder"]) {
      const t = tools.find((x) => x.name === name)!;
      expect(Object.keys(t.inputSchema.properties ?? {})).not.toContain("account_id");
      expect(Object.keys(t.inputSchema.properties ?? {})).not.toContain("employee_id");
      expect(t.inputSchema.required ?? []).not.toContain("account_id");
      expect(t.inputSchema.required ?? []).not.toContain("employee_id");
    }
  });

  it("accepts a bound identity and injects it (call without ids in args still dispatches)", async () => {
    // No account_id/employee_id in args — they come from the bound identity.
    const { status, body } = await call(
      "tools/call",
      { name: "send_deposit_invoice", arguments: {} },
      { account_id: "acct_bound", employee_id: "emp_bound" },
    );
    expect(status).toBe(200);
    // It fails on the REAL missing fields (invoice row / approval), not on missing
    // account_id/employee_id — proving identity was injected before validation.
    expect(body.result.isError).toBe(true);
    expect(body.result.structuredContent.status).toBe("failed");
  });

  it("distinguishes real MCP tool execution from tool-call JSON emitted as text", () => {
    expect(isRealMcpToolExecutionResult({
      content: [{ type: "text", text: "{\"tool\":\"send_email_draft\",\"arguments\":{}}" }],
    })).toBe(false);
    expect(isRealMcpToolExecutionResult({
      content: [{ type: "text", text: "send_email_draft: ok" }],
      structuredContent: { status: "ok", proof: { audit_id: "aud_1" } },
    })).toBe(true);
  });
});
