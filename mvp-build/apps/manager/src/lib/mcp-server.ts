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
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TOOL_NAMES, getToolSchema, type ToolName } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { runManagerTool, SCHEDULER_ONLY_TOOLS } from "./run-tool.js";
import { buildEmployeeSnapshot } from "./employee-stream.js";

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

/** Owner-context fields bound to the employee's runtime, injected server-side from
 *  the MCP request identity — the model neither sees nor supplies them. */
const INJECTED_OWNER_FIELDS = ["account_id", "employee_id"] as const;

function inputSchemaFor(name: ToolName): Record<string, unknown> {
  const json = zodToJsonSchema(getToolSchema(name), { $refStrategy: "none" }) as Record<string, unknown>;
  delete json.$schema;
  // MCP inputSchema must be a JSON-Schema object; our tools all take an object.
  if (json.type !== "object") return { type: "object", additionalProperties: true };
  // Don't advertise the injected identity fields — otherwise the model sees them
  // as required inputs and asks the owner for an account_id / employee_id it should
  // never handle. They are injected from the request identity in the call handler.
  const props = json.properties as Record<string, unknown> | undefined;
  if (props) for (const f of INJECTED_OWNER_FIELDS) delete props[f];
  if (Array.isArray(json.required)) {
    json.required = (json.required as string[]).filter((r) => !INJECTED_OWNER_FIELDS.includes(r as never));
  }
  return json;
}

/** Identity bound to the employee's baked MCP config (rendered request headers),
 *  NOT anything the model provides. Injected into every tool call. */
export interface McpIdentity {
  account_id?: string;
  employee_id?: string;
}

const RESOURCE_DEFS = [
  { uri: "amtech://manager/business-brain", name: "Business brain summary", mimeType: "application/json" },
  { uri: "amtech://manager/connector-status", name: "Connector status", mimeType: "application/json" },
  { uri: "amtech://manager/artifacts", name: "Artifacts", mimeType: "application/json" },
  { uri: "amtech://manager/approvals", name: "Approvals", mimeType: "application/json" },
  { uri: "amtech://manager/work-queue", name: "Work queue", mimeType: "application/json" },
  { uri: "amtech://manager/runtime-health", name: "Runtime health", mimeType: "application/json" },
  { uri: "amtech://manager/capability-registry", name: "Capability registry", mimeType: "application/json" },
] as const;

function jsonResource(uri: string, payload: unknown) {
  return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(payload, null, 2) }] };
}

async function readManagerResource(uri: string, identity: McpIdentity) {
  if (!identity.account_id || !identity.employee_id) {
    return jsonResource(uri, { error: "identity_required" });
  }
  const db = serviceClient();
  const snapshot = await buildEmployeeSnapshot(db, identity.employee_id, identity.account_id);
  if (uri === "amtech://manager/connector-status") return jsonResource(uri, {
    connectors: snapshot.connectors.map((c) => ({
      id: c.id,
      connector_key: c.connector_key,
      provider: c.provider,
      status: c.status,
      external_email: c.external_email ?? null,
      last_error: c.last_error ?? null,
    })),
  });
  if (uri === "amtech://manager/artifacts") return jsonResource(uri, { artifacts: snapshot.artifacts, outputs: snapshot.outputs ?? [] });
  if (uri === "amtech://manager/approvals") return jsonResource(uri, { approvals: snapshot.approvals });
  if (uri === "amtech://manager/work-queue") return jsonResource(uri, { tasks: snapshot.tasks ?? [], surface_envelopes: snapshot.surface_envelopes ?? [] });
  if (uri === "amtech://manager/runtime-health") return jsonResource(uri, { runtime_health: snapshot.runtime_health });
  if (uri === "amtech://manager/capability-registry") return jsonResource(uri, { capabilities: snapshot.capabilities ?? [], abilities: snapshot.abilities ?? [] });
  if (uri === "amtech://manager/business-brain") {
    const { data } = await db
      .from("business_brain_facts")
      .select("id,fact_key,fact_value,category,source,confidence,updated_at")
      .eq("account_id", identity.account_id)
      .eq("employee_id", identity.employee_id)
      .order("updated_at", { ascending: false })
      .limit(50);
    return jsonResource(uri, { facts: data ?? [] });
  }
  return jsonResource(uri, { error: "resource_not_found" });
}

export function isRealMcpToolExecutionResult(value: unknown): boolean {
  const v = value as { structuredContent?: { proof?: unknown; status?: unknown }; content?: Array<{ text?: string }> } | undefined;
  if (!v?.structuredContent || typeof v.structuredContent !== "object") return false;
  if (!("status" in v.structuredContent)) return false;
  return Boolean(v.structuredContent.proof && typeof v.structuredContent.proof === "object");
}

export function buildManagerMcpServer(identity: McpIdentity = {}): Server {
  const server = new Server(SERVER_INFO, { capabilities: { tools: {}, resources: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: employeeCallableTools().map((name) => ({
      name,
      description: TOOL_DESCRIPTIONS[name] ?? `Manager tool: ${name}`,
      inputSchema: inputSchemaFor(name),
    })),
  }));

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCE_DEFS.map((r) => ({
      uri: r.uri,
      name: r.name,
      mimeType: r.mimeType,
      description: `${r.name} for the bound AMTECH employee context.`,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = String(req.params.uri ?? "");
    if (!RESOURCE_DEFS.some((r) => r.uri === uri)) return jsonResource(uri, { error: "resource_not_found" });
    return readManagerResource(uri, identity);
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name as ToolName;
    // Inject/override the owner context from the bound identity so the model can
    // neither spoof another account nor omit ids it should never have to know.
    const args = { ...((req.params.arguments ?? {}) as Record<string, unknown>) };
    if (identity.account_id) args.account_id = identity.account_id;
    if (identity.employee_id) args.employee_id = identity.employee_id;
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
export async function handleManagerMcpRequest(request: Request, identity: McpIdentity = {}): Promise<Response> {
  const server = buildManagerMcpServer(identity);
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
