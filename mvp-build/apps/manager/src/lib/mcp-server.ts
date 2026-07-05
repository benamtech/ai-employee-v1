/**
 * Manager control plane, exposed to the Hermes employee as a native MCP server.
 *
 * This is a TRANSPORT over the existing tool registry — not a second
 * implementation. `tools/list` advertises each Manager tool's JSON Schema
 * (derived from the Step-2 zod source of truth) and `tools/call` dispatches
 * through `runManagerTool`, so gates, audit, secrets-by-reference, and the
 * approval flow (all inside the handlers) are reused verbatim. The employee
 * calls Manager tools natively instead of parsing a prose HTTP contract.
 *
 * Stateless: a fresh Server + web-standard transport per request
 * (sessionIdGenerator undefined, enableJsonResponse true), so it composes with
 * Hono via `c.req.raw` and needs no session store.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TOOL_NAMES, getToolSchema, type ToolName } from "@amtech/shared";
import { runManagerTool, SCHEDULER_ONLY_TOOLS } from "./run-tool.js";

const SERVER_INFO = { name: "amtech-manager", version: "0.1.0" } as const;

/** Short, model-facing descriptions to guide tool selection. Behavioral policy
 *  (sequences, gate discipline) lives in the workspace AGENTS/manager-tools
 *  prose; this is just the one-line "what is this tool". */
const TOOL_DESCRIPTIONS: Partial<Record<ToolName, string>> = {
  get_business_brain: "Read the business brain (facts the employee has learned about this business).",
  save_business_brain_fact: "Persist one durable fact about the business to the brain.",
  create_estimate_artifact: "Create a stored, itemized estimate artifact from a line-item payload.",
  render_estimate_pdf: "Render a stored estimate to a PDF artifact.",
  create_signed_artifact_link: "Mint a signed, expiring AMTECH link to an artifact (never a local path).",
  request_approval: "Open an owner approval gate before a money- or customer-facing action.",
  resolve_approval: "Record the owner's decision on an open approval.",
  get_approval_status: "Check whether an approval is still pending, approved, or rejected.",
  connect_email: "Begin Gmail connection (returns a consent URL; not connected until OAuth completes).",
  create_email_draft: "Draft a customer email (attachments by artifact id). Sending is gated.",
  send_email_draft: "Send a previously drafted email — requires an approved approval_id.",
  create_deposit_invoice: "Create a Stripe test-mode deposit invoice for an estimate. Sending is gated.",
  send_deposit_invoice: "Send a deposit invoice — requires an approved approval_id.",
  send_employee_event: "Emit an owner-authored internal work event to the Work Surface.",
  set_internal_reminder: "Set an internal job reminder the scheduler will fire.",
  get_reminders: "List the employee's reminders.",
};

/** Tools the employee may call over MCP: everything except scheduler-only,
 *  timer-driven tools (those run only through the protected scheduler runner). */
function employeeCallableTools(): ToolName[] {
  return TOOL_NAMES.filter((name) => !SCHEDULER_ONLY_TOOLS.has(name));
}

function inputSchemaFor(name: ToolName): Record<string, unknown> {
  const json = zodToJsonSchema(getToolSchema(name), { $refStrategy: "none" }) as Record<string, unknown>;
  delete json.$schema;
  // MCP inputSchema must be a JSON-Schema object; our tools all take an object.
  if (json.type !== "object") return { type: "object", additionalProperties: true };
  return json;
}

export function buildManagerMcpServer(): Server {
  const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: employeeCallableTools().map((name) => ({
      name,
      description: TOOL_DESCRIPTIONS[name] ?? `Manager tool: ${name}`,
      inputSchema: inputSchemaFor(name),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name as ToolName;
    const args = (req.params.arguments ?? {}) as Record<string, unknown>;
    const outcome = await runManagerTool(name, args, { actor: "employee" });

    if (outcome.kind === "unknown_tool") {
      return { content: [{ type: "text", text: `unknown_tool: ${name}` }], isError: true };
    }
    if (outcome.kind === "scheduler_only") {
      return { content: [{ type: "text", text: `${name} is scheduler-only and cannot be called directly.` }], isError: true };
    }

    const envelope = outcome.envelope;
    const isError = outcome.kind === "invalid_input" || envelope.status === "failed" || envelope.status === "denied";
    const text = envelope.user_facing_summary_hint || `${name}: ${envelope.status}`;
    // structuredContent carries the full typed envelope (proof, gates, next action);
    // text is the owner-safe hint. Never leak raw provider tokens (handlers already
    // return secrets by reference only).
    return { content: [{ type: "text", text }], structuredContent: envelope as unknown as Record<string, unknown>, isError };
  });

  return server;
}

/** Handle one MCP HTTP request (stateless). Auth is enforced by the caller
 *  (denyInternal) before this runs. */
export async function handleManagerMcpRequest(request: Request): Promise<Response> {
  const server = buildManagerMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const res = await transport.handleRequest(request);
    // Fully buffer the JSON response, then tear down the per-request server so
    // closing can never truncate a lazily-read body (enableJsonResponse mode
    // returns a complete JSON document).
    const buf = await res.arrayBuffer();
    return new Response(buf, { status: res.status, headers: res.headers });
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
