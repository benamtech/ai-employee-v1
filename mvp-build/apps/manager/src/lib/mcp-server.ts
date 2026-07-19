/**
 * Manager control plane, exposed to the Hermes employee as a native MCP server.
 * The verified MCP credential supplies employee principal and assignment context;
 * model arguments can neither choose nor override that authority.
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
import { buildEmployeeSnapshotStrict as buildEmployeeSnapshot } from "./employee-stream-strict.js";
import { buildBusinessBrainIndex, readBusinessFactsResource } from "./business-brain.js";

const SERVER_INFO = { name: "amtech-manager", version: "0.1.0" } as const;

const TOOL_DESCRIPTIONS: Partial<Record<ToolName, string>> = {
  get_business_brain: "Read the business brain index and resource map; use business-facts only for explicit fact details.",
  save_business_brain_fact: "Persist one durable fact resource inside the broader business brain.",
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
  connect_quickbooks: "Begin QuickBooks connection (returns a consent URL; not connected until OAuth completes).",
  run_quickbooks_connector_test: "Verify the QuickBooks connection is healthy (company info check).",
  create_expense: "Prepare a QuickBooks expense (Purchase) for owner approval; refer to the vendor and category by name. Committing is gated.",
  create_bill: "Prepare a QuickBooks bill for owner approval; refer to the vendor and category by name. Committing is gated.",
  create_invoice: "Prepare a QuickBooks customer invoice for owner approval; refer to the customer and items by name. Committing is gated.",
  create_payment: "Prepare a QuickBooks customer payment for owner approval. Committing is gated.",
  commit_quickbooks_write: "Commit a previously approved QuickBooks write — requires the pending_write_id and its own approved approval_id.",
  query_quickbooks: "Read QuickBooks records by entity and filters (owner-safe read; QuickBooks limits which fields are filterable).",
  get_profit_and_loss: "Read a QuickBooks Profit and Loss report (flattened, owner-summarizable).",
  get_balance_sheet: "Read a QuickBooks Balance Sheet report (flattened, owner-summarizable).",
  get_aged_receivables: "Read a QuickBooks A/R aging summary (who owes the business, and how overdue).",
  get_aged_payables: "Read a QuickBooks A/P aging summary (what the business owes, and how overdue).",
};

function employeeCallableTools(): ToolName[] {
  return TOOL_NAMES.filter((name) => !SCHEDULER_ONLY_TOOLS.has(name));
}

const INJECTED_OWNER_FIELDS = ["account_id", "employee_id"] as const;

function inputSchemaFor(name: ToolName): Record<string, unknown> {
  const json = zodToJsonSchema(getToolSchema(name), { $refStrategy: "none" }) as Record<string, unknown>;
  delete json.$schema;
  if (json.type !== "object") return { type: "object", additionalProperties: true };
  const props = json.properties as Record<string, unknown> | undefined;
  if (props) for (const field of INJECTED_OWNER_FIELDS) delete props[field];
  if (Array.isArray(json.required)) {
    json.required = (json.required as string[]).filter((required) => !INJECTED_OWNER_FIELDS.includes(required as never));
  }
  return json;
}

export interface McpIdentity {
  account_id?: string;
  employee_id?: string;
  assignment_id?: string;
  principal_id?: string;
  policy_version?: string;
  credential_id?: string;
}

const RESOURCE_DEFS = [
  { uri: "amtech://manager/business-brain", name: "Business brain index", mimeType: "application/json" },
  { uri: "amtech://manager/business-facts", name: "Business facts", mimeType: "application/json" },
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
  if (!identity.account_id || !identity.employee_id || !identity.assignment_id || !identity.principal_id) {
    return jsonResource(uri, { error: "assignment_identity_required" });
  }
  const db = serviceClient();
  const snapshot = await buildEmployeeSnapshot(db, identity.employee_id, identity.account_id, identity.assignment_id);
  if (uri === "amtech://manager/connector-status") return jsonResource(uri, {
    assignment_id: identity.assignment_id,
    connection_surfaces: snapshot.connection_surfaces ?? [],
    connectors: snapshot.connectors.map((connector) => ({
      id: connector.id,
      connector_key: connector.connector_key,
      provider: connector.provider,
      status: connector.status,
      external_email: connector.external_email ?? null,
      last_error: connector.last_error ?? null,
    })),
  });
  if (uri === "amtech://manager/artifacts") return jsonResource(uri, { assignment_id: identity.assignment_id, artifacts: snapshot.artifacts, outputs: snapshot.outputs ?? [] });
  if (uri === "amtech://manager/approvals") return jsonResource(uri, { assignment_id: identity.assignment_id, approvals: snapshot.approvals });
  if (uri === "amtech://manager/work-queue") return jsonResource(uri, { assignment_id: identity.assignment_id, tasks: snapshot.tasks ?? [], resurface_items: snapshot.resurface_items ?? [], surface_envelopes: snapshot.surface_envelopes ?? [] });
  if (uri === "amtech://manager/runtime-health") return jsonResource(uri, { assignment_id: identity.assignment_id, runtime_health: snapshot.runtime_health });
  if (uri === "amtech://manager/capability-registry") return jsonResource(uri, { assignment_id: identity.assignment_id, capabilities: snapshot.capabilities ?? [], abilities: snapshot.abilities ?? [] });
  if (uri === "amtech://manager/business-brain") return jsonResource(uri, await buildBusinessBrainIndex(db, {
    account_id: identity.account_id,
    employee_id: identity.employee_id,
    snapshot,
  }));
  if (uri === "amtech://manager/business-facts") return jsonResource(uri, await readBusinessFactsResource(db, {
    account_id: identity.account_id,
    employee_id: identity.employee_id,
  }));
  return jsonResource(uri, { error: "resource_not_found" });
}

export function isRealMcpToolExecutionResult(value: unknown): boolean {
  const result = value as { structuredContent?: { proof?: unknown; status?: unknown }; content?: Array<{ text?: string }> } | undefined;
  if (!result?.structuredContent || typeof result.structuredContent !== "object") return false;
  if (!("status" in result.structuredContent)) return false;
  return Boolean(result.structuredContent.proof && typeof result.structuredContent.proof === "object");
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
    resources: RESOURCE_DEFS.map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      mimeType: resource.mimeType,
      description: `${resource.name} for the bound AMTECH employee assignment.`,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = String(request.params.uri ?? "");
    if (!RESOURCE_DEFS.some((resource) => resource.uri === uri)) return jsonResource(uri, { error: "resource_not_found" });
    return readManagerResource(uri, identity);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name as ToolName;
    const args = { ...((request.params.arguments ?? {}) as Record<string, unknown>) };
    if (identity.account_id) args.account_id = identity.account_id;
    if (identity.employee_id) args.employee_id = identity.employee_id;
    const outcome = await runManagerTool(name, args, {
      actor: "employee",
      assignment_id: identity.assignment_id ?? null,
      principal_id: identity.principal_id ?? null,
      principal_class: identity.principal_id ? "employee" : null,
      authenticated_by: identity.credential_id ? `employee_mcp_credential:${identity.credential_id}` : null,
    });

    if (outcome.kind === "unknown_tool") {
      return { content: [{ type: "text", text: `unknown_tool: ${name}` }], isError: true };
    }
    if (outcome.kind === "scheduler_only") {
      return { content: [{ type: "text", text: `${name} is scheduler-only and cannot be called directly.` }], isError: true };
    }

    const envelope = outcome.envelope;
    const isError = outcome.kind === "invalid_input" || envelope.status === "failed" || envelope.status === "denied";
    const text = envelope.user_facing_summary_hint || `${name}: ${envelope.status}`;
    return { content: [{ type: "text", text }], structuredContent: envelope as unknown as Record<string, unknown>, isError };
  });

  return server;
}

export async function handleManagerMcpRequest(request: Request, identity: McpIdentity = {}): Promise<Response> {
  const server = buildManagerMcpServer(identity);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(request);
    const buffer = await response.arrayBuffer();
    return new Response(buffer, { status: response.status, headers: response.headers });
  } finally {
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
