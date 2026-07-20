import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
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

function parse(text: string): Record<string, any> {
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    const line = text.split("\n").reverse().find((value) => value.startsWith("data:"));
    return JSON.parse((line ?? "").slice(5).trim()) as Record<string, any>;
  }
}

async function call(method: string, params: unknown): Promise<{ status: number; body: any }> {
  const response = await handleManagerMcpRequest(rpc(method, params));
  return { status: response.status, body: parse(await response.text()) };
}

function resultText(body: any): string {
  return String(body?.result?.content?.map((item: { text?: string }) => item.text ?? "").join(" ") ?? "");
}

describe("Manager MCP server discovery and execution boundary", () => {
  it("lists employee-callable tools broadly with JSON-Schema inputs and labels execution as Manager-authorized", async () => {
    const { status, body } = await call("tools/list", {});
    expect(status).toBe(200);
    const tools = body.result.tools as Array<{ name: string; inputSchema: { type?: string }; _meta?: Record<string, string> }>;
    const names = tools.map((tool) => tool.name);
    expect(names).toContain("create_estimate_artifact");
    expect(names).toContain("request_approval");
    expect(names).toContain("send_deposit_invoice");
    expect(names).not.toContain("dispatch_due_reminders");
    expect(names).not.toContain("dispatch_daily_briefs");
    const estimate = tools.find((tool) => tool.name === "create_estimate_artifact");
    expect(estimate?.inputSchema.type).toBe("object");
    expect(estimate?._meta).toMatchObject({
      "amtech/discovery": "broad",
      "amtech/executionAuthority": "manager-current-effective-capability",
    });
  });

  it("denies tool execution before schema validation when assignment identity is absent", async () => {
    const { status, body } = await call("tools/call", {
      name: "send_deposit_invoice",
      arguments: { account_id: "acct_1", employee_id: "emp_1" },
    });
    expect(status).toBe(200);
    expect(body.result.isError).toBe(true);
    expect(resultText(body)).toContain("assignment_identity_required");
    expect(body.result.structuredContent).toBeUndefined();
  });

  it("refuses scheduler-only tools called directly over MCP", async () => {
    const { body } = await call("tools/call", { name: "dispatch_due_reminders", arguments: {} });
    expect(body.result.isError).toBe(true);
    expect(resultText(body)).toContain("unknown_tool");
  });

  it("does not advertise Manager-injected owner context fields to the model", async () => {
    const { body } = await call("tools/list", {});
    const tools = body.result.tools as Array<{ name: string; inputSchema: any }>;
    for (const name of ["create_estimate_artifact", "request_approval", "set_internal_reminder"]) {
      const tool = tools.find((candidate) => candidate.name === name)!;
      expect(Object.keys(tool.inputSchema.properties ?? {})).not.toContain("account_id");
      expect(Object.keys(tool.inputSchema.properties ?? {})).not.toContain("employee_id");
      expect(tool.inputSchema.required ?? []).not.toContain("account_id");
      expect(tool.inputSchema.required ?? []).not.toContain("employee_id");
    }
  });

  it("intercepts complete bound identities through effective capability authority before tool dispatch", async () => {
    const source = await readFile("apps/manager/src/lib/mcp-server.ts", "utf8");
    const identityCheck = source.indexOf("assignment_identity_required");
    const capabilityCheck = source.indexOf("const capability = await authorizeManagerMcpToolExecution", identityCheck);
    const toolDispatch = source.indexOf("const outcome = await runManagerTool", capabilityCheck);
    expect(identityCheck).toBeGreaterThan(0);
    expect(capabilityCheck).toBeGreaterThan(identityCheck);
    expect(toolDispatch).toBeGreaterThan(capabilityCheck);
    expect(source).toContain("capability_not_effective");
    expect(source).toContain("effective_capability_report_id");
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
