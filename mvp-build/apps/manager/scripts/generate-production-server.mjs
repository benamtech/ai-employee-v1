#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

const adminStart = source.indexOf("  async function adminActor(");
const adminEnd = source.indexOf('  app.post("/manager/claim/consume"', adminStart);
if (adminStart < 0 || adminEnd < 0) throw new Error("production_server_transform_admin_block_not_found");
const adminBlock = `  function adminAuthHeaders(c: Context) {
    return {
      authorization: c.req.header("X-AMTECH-Admin-Authorization"),
      support_lease_id: c.req.header("X-AMTECH-Support-Lease-Id"),
      legacy_identity_header_present: Boolean(c.req.header("X-AMTECH-Platform-User-Id")),
      legacy_reason_header_present: Boolean(c.req.header("X-AMTECH-Support-Reason")),
    };
  }

  async function authorizeAdminRead(c: Context, input: {
    action: string;
    action_class: "read" | "support_read";
    allowed_roles: Array<"platform_owner" | "platform_operator" | "support_readonly" | "billing_operator" | "security_reviewer">;
    account_id?: string | null;
    employee_id?: string | null;
    assignment_id?: string | null;
    require_support_lease?: boolean;
  }) {
    const denied = denyInternal(c);
    if (denied) return { denied };
    const auth = await authorizePlatformAdminRequest(serviceClient(), {
      ...adminAuthHeaders(c),
      ...input,
    });
    if (!auth.ok) return { denied: c.json({ error: auth.error }, auth.status) };
    return { actor: auth.actor };
  }

  app.get(MANAGER_API.admin.dashboard, async (c) => {
    const auth = await authorizeAdminRead(c, {
      action: "admin:dashboard:read",
      action_class: "read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"],
    });
    if ("denied" in auth) return auth.denied;
    return c.json(await buildAdminDashboard(serviceClient()));
  });

  app.get(MANAGER_API.admin.accounts, async (c) => {
    const auth = await authorizeAdminRead(c, {
      action: "admin:accounts:list",
      action_class: "read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"],
    });
    if ("denied" in auth) return auth.denied;
    return c.json({ accounts: (await buildAdminDashboard(serviceClient())).accounts });
  });

  app.get("/manager/admin/accounts/:accountId", async (c) => {
    const accountId = c.req.param("accountId");
    const auth = await authorizeAdminRead(c, {
      action: "admin:account:inspect",
      action_class: "support_read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"],
      account_id: accountId,
      employee_id: null,
      assignment_id: null,
      require_support_lease: true,
    });
    if ("denied" in auth) return auth.denied;
    const detail = await buildAdminAccountDetail(serviceClient(), accountId);
    if (!detail) return c.json({ error: "account_not_found" }, 404);
    return c.json(detail);
  });

  async function employeeAdminScope(employeeId: string) {
    const db = serviceClient();
    const employee = await db.from("employees").select("id,account_id").eq("id", employeeId).maybeSingle();
    if (employee.error) throw employee.error;
    if (!employee.data?.account_id) return null;
    const assignmentId = await resolvePlatformAdminAssignment(db, {
      account_id: String(employee.data.account_id),
      employee_id: employeeId,
    });
    return { db, account_id: String(employee.data.account_id), assignment_id: assignmentId };
  }

  app.get("/manager/admin/employees/:employeeId", async (c) => {
    const employeeId = c.req.param("employeeId");
    const scope = await employeeAdminScope(employeeId);
    if (!scope) return c.json({ error: "employee_not_found" }, 404);
    const auth = await authorizeAdminRead(c, {
      action: "admin:employee:inspect",
      action_class: "support_read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "security_reviewer"],
      account_id: scope.account_id,
      employee_id: employeeId,
      assignment_id: scope.assignment_id,
      require_support_lease: true,
    });
    if ("denied" in auth) return auth.denied;
    const detail = await buildAdminEmployeeDetail(scope.db, employeeId);
    if (!detail) return c.json({ error: "employee_not_found" }, 404);
    return c.json(detail);
  });

  app.get("/manager/admin/employees/:employeeId/readiness", async (c) => {
    const employeeId = c.req.param("employeeId");
    const scope = await employeeAdminScope(employeeId);
    if (!scope) return c.json({ error: "employee_not_found" }, 404);
    const auth = await authorizeAdminRead(c, {
      action: "admin:employee:readiness",
      action_class: "support_read",
      allowed_roles: ["platform_owner", "platform_operator", "support_readonly", "security_reviewer"],
      account_id: scope.account_id,
      employee_id: employeeId,
      assignment_id: scope.assignment_id,
      require_support_lease: true,
    });
    if ("denied" in auth) return auth.denied;
    const report = await buildReadinessReport(scope.db, employeeId);
    if (!report) return c.json({ error: "employee_not_found" }, 404);
    return c.json(report);
  });

  app.get("/manager/admin/environment/readiness", async (c) => {
    const auth = await authorizeAdminRead(c, {
      action: "admin:environment:readiness",
      action_class: "read",
      allowed_roles: ["platform_owner", "platform_operator", "security_reviewer"],
    });
    if ("denied" in auth) return auth.denied;
    return c.json(buildEnvironmentReadiness());
  });

  app.post(MANAGER_API.admin.supportAction, async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const action = await c.req.json().catch(() => ({}));
    const result = await executePlatformAdminSupportAction(serviceClient(), {
      ...adminAuthHeaders(c),
      action,
    });
    return c.json(result.body, result.status as 200 | 400 | 401 | 403 | 409 | 410 | 503);
  });

`;
source = source.slice(0, adminStart) + adminBlock + source.slice(adminEnd);

const required = [
  "authorizePlatformAdminRequest",
  "executePlatformAdminSupportAction",
  "X-AMTECH-Admin-Authorization",
  "X-AMTECH-Support-Lease-Id",
  "String(link.assignment_id)",
  "approvalResolution",
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
