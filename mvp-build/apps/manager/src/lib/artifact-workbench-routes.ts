import type { Context, Hono } from "hono";
import {
  buildEffectiveCapabilityReport,
  resolveOwnerOAuthConnectorSetup,
  type CapabilityEvidenceInput,
} from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { requireOwnerSession } from "./owner-session.js";
import { authorizeOwnerAssignment } from "./owner-assignment-authority.js";
import { runManagerTool } from "./run-tool.js";
import {
  createArtifactRevision,
  loadArtifactRevisionHistory,
  validateArtifactRevision,
  verifyArtifactPublication,
} from "./artifact-revisions.js";
import {
  collectRuntimeCapabilityEvidence,
  latestEffectiveCapabilityReport,
  persistEffectiveCapabilityReport,
} from "./effective-capability-evidence.js";
import { loadApprovalAuthority } from "./approval-authority.js";

type InternalGate = (c: Context) => Response | null;

type OwnerAuthorityResult =
  | { denied: Response }
  | {
      denied?: undefined;
      db: ReturnType<typeof serviceClient>;
      session: NonNullable<Awaited<ReturnType<typeof requireOwnerSession>>> & { human_principal_id: string };
      authority: Extract<Awaited<ReturnType<typeof authorizeOwnerAssignment>>, { ok: true }>;
      body: Record<string, unknown>;
      employeeId: string;
    };

export function safeWorkbenchReturnPath(value: unknown, employeeId: string): string {
  const fallback = `/agent/${encodeURIComponent(employeeId)}`;
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value) || value.length > 500) return fallback;
  return value;
}

async function ownerAuthority(c: Context, action: string, denyInternal: InternalGate): Promise<OwnerAuthorityResult> {
  const denied = denyInternal(c);
  if (denied) return { denied };
  const employeeId = String(c.req.param("employeeId") ?? "");
  if (!employeeId) return { denied: c.json({ error: "employee_id_required" }, 400) };
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const db = serviceClient();
  const ownerSessionToken = typeof body.owner_session_token === "string" ? body.owner_session_token : "";
  const session = await requireOwnerSession(db, ownerSessionToken);
  const humanPrincipalId = typeof session?.human_principal_id === "string" ? session.human_principal_id : "";
  if (!session || !humanPrincipalId) return { denied: c.json({ error: "owner_session_invalid" }, 401) };
  const authority = await authorizeOwnerAssignment(db, {
    session,
    employee_id: employeeId,
    resource_class: "employee",
    resource_id: employeeId,
    action,
    allowed_roles: ["owner", "manager", "operator"],
  });
  if (!authority.ok) return { denied: c.json({ error: authority.reason }, authority.status) };
  return {
    db,
    session: { ...session, human_principal_id: humanPrincipalId },
    authority,
    body,
    employeeId,
  };
}

export function registerArtifactWorkbenchRoutes(app: Hono, denyInternal: InternalGate): void {
  app.post("/manager/employee/:employeeId/workbench/connect/:connector", async (c) => {
    const auth = await ownerAuthority(c, "connector:connect", denyInternal);
    if (auth.denied) return auth.denied;
    const setup = resolveOwnerOAuthConnectorSetup(c.req.param("connector"));
    if (!setup) return c.json({ error: "connector_not_supported" }, 404);
    const returnTo = safeWorkbenchReturnPath(auth.body.return_to, auth.employeeId);
    const outcome = await runManagerTool(setup.start_tool, {
      account_id: auth.session.account_id,
      employee_id: auth.employeeId,
      provider: setup.provider,
      requested_scopes: setup.requested_scopes,
      return_to: returnTo,
    }, {
      actor: "owner",
      assignment_id: auth.authority.assignment.assignment_id,
      principal_id: auth.session.human_principal_id,
      principal_class: "human",
      authenticated_by: `owner_web_session:${auth.session.session_id}`,
    });
    if (outcome.kind === "unknown_tool" || outcome.kind === "scheduler_only") return c.json({ error: outcome.kind }, 400);
    if (outcome.kind === "invalid_input") return c.json(outcome.envelope, 400);
    return outcome.envelope.status === "ok" ? c.json(outcome.envelope) : c.json(outcome.envelope, 400);
  });

  app.post("/manager/employee/:employeeId/workbench/artifacts/revise", async (c) => {
    const auth = await ownerAuthority(c, "artifact:revise", denyInternal);
    if (auth.denied) return auth.denied;
    const payload = auth.body.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return c.json({ error: "artifact_payload_required" }, 400);
    const result = await createArtifactRevision(auth.db, {
      account_id: auth.session.account_id,
      employee_id: auth.employeeId,
      assignment_id: auth.authority.assignment.assignment_id,
      artifact_id: typeof auth.body.artifact_id === "string" ? auth.body.artifact_id : undefined,
      kind: String(auth.body.kind ?? "document"),
      payload: payload as Record<string, unknown>,
      mime_type: typeof auth.body.mime_type === "string" ? auth.body.mime_type : null,
      storage_ref: typeof auth.body.storage_ref === "string" ? auth.body.storage_ref : null,
      source_manifest: auth.body.source_manifest && typeof auth.body.source_manifest === "object" ? auth.body.source_manifest as Record<string, unknown> : {},
      created_run: typeof auth.body.created_run === "string" ? auth.body.created_run : null,
      created_by: `owner:${auth.session.human_principal_id}`,
    });
    return c.json(result, 201);
  });

  app.post("/manager/employee/:employeeId/workbench/artifacts/validate", async (c) => {
    const auth = await ownerAuthority(c, "artifact:validate", denyInternal);
    if (auth.denied) return auth.denied;
    const validations = Array.isArray(auth.body.validations) ? auth.body.validations : [];
    const result = await validateArtifactRevision(auth.db, {
      account_id: auth.session.account_id,
      employee_id: auth.employeeId,
      assignment_id: auth.authority.assignment.assignment_id,
      artifact_id: String(auth.body.artifact_id ?? ""),
      revision_id: typeof auth.body.revision_id === "string" ? auth.body.revision_id : undefined,
      validations: validations.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          validator_key: String(row.validator_key ?? "manual"),
          status: String(row.status ?? "failed") as "passed" | "failed" | "warning" | "skipped",
          summary: String(row.summary ?? "Validation result recorded."),
          evidence: row.evidence && typeof row.evidence === "object" ? row.evidence as Record<string, unknown> : {},
        };
      }),
    });
    return c.json(result);
  });

  app.post("/manager/employee/:employeeId/workbench/approvals/resolve", async (c) => {
    const auth = await ownerAuthority(c, "artifact:publish", denyInternal);
    if (auth.denied) return auth.denied;
    const approvalId = String(auth.body.approval_id ?? "");
    const artifactId = String(auth.body.artifact_id ?? "");
    const resolution = String(auth.body.resolution ?? "");
    if (!approvalId || !artifactId || !["approved", "rejected"].includes(resolution)) {
      return c.json({ error: "artifact_approval_resolution_required" }, 400);
    }
    const approval = await loadApprovalAuthority(auth.db, approvalId);
    if (
      !approval ||
      approval.assignment_id !== auth.authority.assignment.assignment_id ||
      approval.account_id !== auth.session.account_id ||
      approval.employee_id !== auth.employeeId ||
      approval.action_key !== "publish_artifact_sandbox" ||
      String(approval.resource_class) !== "artifact" ||
      approval.resource_id !== artifactId
    ) {
      return c.json({ error: "artifact_approval_scope_mismatch" }, 403);
    }
    const outcome = await runManagerTool("resolve_approval", {
      account_id: auth.session.account_id,
      employee_id: auth.employeeId,
      approval_id: approvalId,
      owner_response: resolution,
      channel: "web",
    }, {
      actor: "owner",
      assignment_id: auth.authority.assignment.assignment_id,
      principal_id: auth.session.human_principal_id,
      principal_class: "human",
      authenticated_by: `owner_web_session:${auth.session.session_id}`,
    });
    if (outcome.kind === "unknown_tool" || outcome.kind === "scheduler_only") return c.json({ error: outcome.kind }, 400);
    if (outcome.kind === "invalid_input") return c.json(outcome.envelope, 400);
    return outcome.envelope.status === "ok" ? c.json(outcome.envelope) : c.json(outcome.envelope, 403);
  });

  app.post("/manager/employee/:employeeId/workbench/artifacts/verify-publication", async (c) => {
    const auth = await ownerAuthority(c, "artifact:validate", denyInternal);
    if (auth.denied) return auth.denied;
    const result = await verifyArtifactPublication(auth.db, {
      account_id: auth.session.account_id,
      employee_id: auth.employeeId,
      assignment_id: auth.authority.assignment.assignment_id,
      artifact_id: String(auth.body.artifact_id ?? ""),
      observed_ref: String(auth.body.observed_ref ?? ""),
    });
    return c.json(result);
  });

  app.post("/manager/employee/:employeeId/workbench/artifacts/history", async (c) => {
    const auth = await ownerAuthority(c, "read", denyInternal);
    if (auth.denied) return auth.denied;
    return c.json(await loadArtifactRevisionHistory(auth.db, String(auth.body.artifact_id ?? ""), auth.authority.assignment.assignment_id));
  });

  app.post("/manager/employee/:employeeId/workbench/capabilities", async (c) => {
    const auth = await ownerAuthority(c, "capabilities:read", denyInternal);
    if (auth.denied) return auth.denied;
    if (auth.body.refresh !== true) {
      const latest = await latestEffectiveCapabilityReport(auth.db, auth.employeeId, auth.authority.assignment.assignment_id);
      if (latest) return c.json(latest);
    }
    const report = await collectRuntimeCapabilityEvidence(auth.db, {
      account_id: auth.session.account_id,
      employee_id: auth.employeeId,
      assignment_id: auth.authority.assignment.assignment_id,
      advertised_toolsets: Array.isArray(auth.body.advertised_toolsets) ? auth.body.advertised_toolsets.map(String) : [],
    });
    await persistEffectiveCapabilityReport(auth.db, report);
    return c.json(report);
  });

  app.post("/manager/internal/effective-capabilities/report", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
    const capabilities = Array.isArray(body.capabilities) ? body.capabilities as CapabilityEvidenceInput[] : [];
    if (!body.account_id || !body.employee_id || !body.assignment_id || !capabilities.length) {
      return c.json({ error: "capability_report_context_required" }, 400);
    }
    const report = buildEffectiveCapabilityReport({
      report_id: String(body.report_id ?? `caprep_${Date.now()}`),
      account_id: String(body.account_id),
      employee_id: String(body.employee_id),
      assignment_id: String(body.assignment_id),
      capabilities,
    });
    await persistEffectiveCapabilityReport(serviceClient(), report);
    return c.json(report, 201);
  });
}
