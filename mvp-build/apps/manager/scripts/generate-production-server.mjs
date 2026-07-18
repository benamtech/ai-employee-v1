#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { productionAdminBlock } from "./production-admin-block.mjs";

const templatePath = fileURLToPath(new URL("../src/server.template.ts", import.meta.url));
const outputPath = fileURLToPath(new URL("../src/server.generated.ts", import.meta.url));
const expectedTemplateBlob = "bd60a15384e8efd2db8b2fe8e92b1bedddaf9911";

function gitBlobSha(content) {
  const bytes = Buffer.from(content, "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

function replaceOne(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`production_server_transform_${label}_expected_exactly_once`);
  }
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

const template = await readFile(templatePath, "utf8");
const actualBlob = gitBlobSha(template);
if (actualBlob !== expectedTemplateBlob) {
  throw new Error(`production_server_template_hash_mismatch:${actualBlob}`);
}

let source = template;
source = replaceOne(
  source,
  `import { runManagerTool } from "./lib/run-tool.js";`,
  `import { runManagerTool, type RunManagerToolOptions } from "./lib/run-tool.js";`,
  "run_tool_import",
);
source = replaceOne(
  source,
  `import { authorizeOwnerAssignment, listOwnerAssignments } from "./lib/owner-assignment-authority.js";`,
  `import { authorizeOwnerAssignment, listOwnerAssignments, loadOwnerCommandPolicyVersion } from "./lib/owner-assignment-authority.js";`,
  "owner_authority_import",
);
source = replaceOne(
  source,
  `import { deliverOwnerTurnToRuntime } from "./lib/runtime.js";`,
  `import { deliverOwnerTurnToRuntime } from "./lib/runtime.js";\nimport { executeOwnerWebTurnCommand } from "./lib/owner-turn-command.js";`,
  "owner_turn_command_import",
);
source = replaceOne(
  source,
  `import { resolvePreviewLink } from "./lib/preview-links.js";`,
  `import { resolvePreviewLink } from "./lib/preview-links.js";\nimport { loadApprovalAuthority } from "./lib/approval-authority.js";`,
  "approval_authority_import",
);
source = replaceOne(
  source,
  `  buildReadinessReport,\n  recordSupportAccess,\n  requirePlatformRole,\n  runAdminSupportAction,\n} from "./lib/admin.js";`,
  `  buildReadinessReport,\n} from "./lib/admin.js";\nimport {\n  authorizePlatformAdminRequest,\n  executePlatformAdminSupportAction,\n  resolvePlatformAdminAssignment,\n} from "./lib/platform-admin-runtime.js";`,
  "admin_import",
);
source = replaceOne(
  source,
  `        assignment_id: link.assignment_id,\n        principal_id: link.resolver_principal_id,`,
  `        assignment_id: String(link.assignment_id),\n        principal_id: link.resolver_principal_id,`,
  "preview_assignment",
);
source = replaceOne(
  source,
  `          employee_id: employeeId,\n          assignment_id: artifact.assignment_id,`,
  `          employee_id: String(employeeId),\n          assignment_id: artifact.assignment_id,`,
  "artifact_owner_employee",
);
source = replaceOne(
  source,
  `      const resolution = act === "approve" ? "approved" : "rejected";\n      const followup = await deliverApprovalResolutionFollowup(db, {`,
  `      const approvalResolution = act === "approve" ? "approved" : "rejected";\n      const followup = await deliverApprovalResolutionFollowup(db, {`,
  "preview_resolution_name",
);
source = replaceOne(
  source,
  `        resolution,\n        channel: "sms",\n      });\n      resultBody = {\n        ok: true,\n        resolution,`,
  `        resolution: approvalResolution,\n        channel: "sms",\n      });\n      resultBody = {\n        ok: true,\n        resolution: approvalResolution,`,
  "preview_resolution_use",
);

const toolRouteStart = source.indexOf('  app.post("/manager/tools/:name"');
const toolRouteEnd = source.indexOf("  // Manager control plane as a native MCP server", toolRouteStart);
if (toolRouteStart < 0 || toolRouteEnd < 0) throw new Error("production_server_transform_tool_route_not_found");
const toolRouteBlock = `  app.post("/manager/tools/:name", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const name = c.req.param("name") as ToolName;
    const input = await c.req.json().catch(() => ({})) as Record<string, unknown>;
    try {
      let options: RunManagerToolOptions = { actor: name === "resolve_approval" ? "owner" : "manager" };
      if (name === "resolve_approval") {
        const db = serviceClient();
        const session = await requireOwnerSession(db, String(input.owner_session_token ?? ""));
        if (!session?.human_principal_id) return c.json({ error: "owner_session_invalid" }, 401);
        const approvalId = String(input.approval_id ?? "");
        const approval = approvalId ? await loadApprovalAuthority(db, approvalId) : null;
        if (!approval || approval.account_id !== input.account_id || approval.employee_id !== input.employee_id) {
          return c.json({ error: "approval_not_found_or_wrong_assignment" }, 404);
        }
        const authority = await authorizeOwnerAssignment(db, {
          session,
          employee_id: approval.employee_id,
          assignment_id: approval.assignment_id,
          resource_class: "approval",
          resource_id: approval.approval_id,
          action: approval.required_resolver_action,
          allowed_roles: approval.required_resolver_roles,
        });
        if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
        options = {
          actor: "owner",
          assignment_id: authority.assignment.assignment_id,
          principal_id: session.human_principal_id,
          principal_class: "human",
          authenticated_by: \`owner_web_session:\${session.session_id}\`,
        };
      }
      const outcome = await runManagerTool(name, input, options);
      if (outcome.kind === "scheduler_only") return c.json({ error: "scheduler_only_tool" }, 403);
      if (outcome.kind === "unknown_tool") return c.json({ error: "unknown_tool" }, 404);
      if (outcome.kind === "invalid_input") return c.json(outcome.envelope, 400);
      if (name === "resolve_approval" && outcome.envelope.status === "ok") {
        const approvalInput = input as { account_id?: string; employee_id?: string; approval_id?: string; owner_response?: string; channel?: "sms" | "web" };
        const resolution = approvalInput.owner_response === "approved" || approvalInput.owner_response === "yes" ? "approved" : "rejected";
        const followup = await deliverApprovalResolutionFollowup(serviceClient(), {
          account_id: String(approvalInput.account_id),
          employee_id: String(approvalInput.employee_id),
          assignment_id: String(outcome.envelope.assignment_id ?? ""),
          approval_id: String(approvalInput.approval_id),
          resolution,
          channel: approvalInput.channel,
        });
        return c.json(withApprovalFollowupProof(outcome.envelope, followup));
      }
      return c.json(outcome.envelope);
    } catch (err) {
      console.error(\`[manager] tool \${name} threw:\`, err instanceof Error ? err.message : String(err));
      return c.json({ error: "internal_error", tool: name }, 500);
    }
  });

`;
source = source.slice(0, toolRouteStart) + toolRouteBlock + source.slice(toolRouteEnd);

const ownerMessageStart = source.indexOf('  app.post("/manager/employee/:employeeId/message"');
const ownerMessageEnd = source.indexOf("  app.post(MANAGER_API.ownerDashboard", ownerMessageStart);
if (ownerMessageStart < 0 || ownerMessageEnd < 0) throw new Error("production_server_transform_owner_message_not_found");
const ownerMessageBlock = `  app.post("/manager/employee/:employeeId/message", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const { owner_session_token, message, intent_id } = await c.req.json().catch(() => ({}));
    if (!message) return c.json({ error: "message_required" }, 400);
    if (!intent_id || !/^[A-Za-z0-9:_-]{8,160}$/.test(String(intent_id))) {
      return c.json({ error: "stable_intent_id_required" }, 400);
    }
    const db = serviceClient();
    const session = await requireOwnerSession(db, owner_session_token);
    if (!session?.human_principal_id) return c.json({ error: "owner_session_invalid" }, 401);
    const authority = await authorizeOwnerAssignment(db, {
      session,
      employee_id: employeeId,
      resource_class: "employee",
      resource_id: employeeId,
      action: "message:create",
      allowed_roles: ["owner", "manager", "operator"],
    });
    if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
    const assignmentId = authority.assignment.assignment_id;
    const policyVersion = await loadOwnerCommandPolicyVersion(db, session, assignmentId);
    const result = await executeOwnerWebTurnCommand(db, {
      account_id: session.account_id,
      employee_id: employeeId,
      assignment_id: assignmentId,
      principal_id: session.human_principal_id,
      policy_version: policyVersion,
      authenticated_by: \`owner_web_session:\${session.session_id}\`,
      intent_id: String(intent_id),
      body: String(message),
    });
    if (result.status === "accepted") return c.json(result, 200);
    return c.json(result, result.status === "ambiguous" ? 202 : 502);
  });

  app.get("/manager/employee/:employeeId/commands/:commandId", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const commandId = c.req.param("commandId");
    const token = c.req.query("owner_session_token") ?? "";
    const db = serviceClient();
    const session = await requireOwnerSession(db, token);
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const command = await db.from("durable_commands")
      .select("id,assignment_id,status,terminal_receipt_id,command_type,updated_at")
      .eq("id", commandId)
      .maybeSingle();
    if (command.error) throw command.error;
    if (!command.data?.id) return c.json({ error: "command_not_found" }, 404);
    const authority = await authorizeOwnerAssignment(db, {
      session,
      employee_id: employeeId,
      assignment_id: String(command.data.assignment_id),
      resource_class: "employee",
      resource_id: employeeId,
      action: "read",
    });
    if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
    const receipt = command.data.terminal_receipt_id
      ? await db.from("effect_receipts")
        .select("id,state,provider_receipt_id,error_code,ambiguity_code,evidence,observed_at")
        .eq("id", command.data.terminal_receipt_id)
        .maybeSingle()
      : { data: null, error: null };
    if (receipt.error) throw receipt.error;
    return c.json({
      command_id: command.data.id,
      assignment_id: command.data.assignment_id,
      status: command.data.status,
      command_type: command.data.command_type,
      updated_at: command.data.updated_at,
      receipt: receipt.data ?? null,
    });
  });

`;
source = source.slice(0, ownerMessageStart) + ownerMessageBlock + source.slice(ownerMessageEnd);

const adminStart = source.indexOf("  async function adminActor(");
const adminEnd = source.indexOf('  app.post("/manager/claim/consume"', adminStart);
if (adminStart < 0 || adminEnd < 0) throw new Error("production_server_transform_admin_block_not_found");
source = source.slice(0, adminStart) + productionAdminBlock + source.slice(adminEnd);

const required = [
  "authorizePlatformAdminRequest",
  "executePlatformAdminSupportAction",
  "X-AMTECH-Admin-Authorization",
  "X-AMTECH-Support-Lease-Id",
  "String(link.assignment_id)",
  "String(employeeId)",
  "approvalResolution",
  "executeOwnerWebTurnCommand",
  "loadOwnerCommandPolicyVersion",
  "owner_web_session:",
];
for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`production_server_missing_marker:${marker}`);
}
for (const forbidden of ["async function adminActor(", "requirePlatformRole", "recordSupportAccess", "runAdminSupportAction"]) {
  if (source.includes(forbidden)) throw new Error(`production_server_forbidden_marker:${forbidden}`);
}

const generated = `// GENERATED FILE. DO NOT EDIT.\n// Source: server.template.ts @ git blob ${expectedTemplateBlob}\n// Generator: scripts/generate-production-server.mjs\n\n${source}`;
await mkdir(dirname(outputPath), { recursive: true });
let current = null;
try { current = await readFile(outputPath, "utf8"); } catch { /* first generation */ }
if (current !== generated) await writeFile(outputPath, generated, "utf8");
console.log(JSON.stringify({ status: "ok", template_blob: actualBlob, output: outputPath }));
