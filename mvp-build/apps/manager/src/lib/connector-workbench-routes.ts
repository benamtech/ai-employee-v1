import type { Context, Hono } from "hono";
import { serviceClient } from "@amtech/db";
import { requireOwnerSession } from "./owner-session.js";
import { authorizeOwnerAssignment } from "./owner-assignment-authority.js";
import {
  loadConnectorLifecycleSnapshot,
  refreshAssignmentConnectorCapabilities,
  requestConnectorSetupIntent,
  revokeAssignmentConnector,
} from "./connector-lifecycle.js";
import { writeAudit } from "./audit.js";

type InternalGate = (c: Context) => Response | null;

async function ownerScope(c: Context, action: string, denyInternal: InternalGate) {
  const denied = denyInternal(c);
  if (denied) return { denied } as const;
  const employeeId = String(c.req.param("employeeId") ?? "");
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const db = serviceClient();
  const session = await requireOwnerSession(db, String(body.owner_session_token ?? ""));
  const humanPrincipalId = String(session?.human_principal_id ?? "");
  if (!session || !humanPrincipalId) return { denied: c.json({ error: "owner_session_invalid" }, 401) } as const;
  const authority = await authorizeOwnerAssignment(db, {
    session,
    employee_id: employeeId,
    resource_class: "employee",
    resource_id: employeeId,
    action,
    allowed_roles: ["owner", "manager", "operator"],
  });
  if (!authority.ok) return { denied: c.json({ error: authority.reason }, authority.status) } as const;
  return { db, session, humanPrincipalId, authority, body, employeeId } as const;
}

export function registerConnectorWorkbenchRoutes(app: Hono, denyInternal: InternalGate): void {
  app.post("/manager/employee/:employeeId/workbench/connectors", async (c) => {
    const scope = await ownerScope(c, "capabilities:read", denyInternal);
    if ("denied" in scope) return scope.denied;
    const input = {
      account_id: scope.session.account_id,
      employee_id: scope.employeeId,
      assignment_id: scope.authority.assignment.assignment_id,
    };
    const snapshot = scope.body.refresh === true
      ? await refreshAssignmentConnectorCapabilities(scope.db, input)
      : await loadConnectorLifecycleSnapshot(scope.db, input);
    return c.json(snapshot);
  });

  app.post("/manager/employee/:employeeId/workbench/connect/:connector/request", async (c) => {
    const scope = await ownerScope(c, "connector:setup:request", denyInternal);
    if ("denied" in scope) return scope.denied;
    const connector = String(c.req.param("connector") ?? "").trim();
    if (!connector) return c.json({ error: "connector_required" }, 400);
    const intent = await requestConnectorSetupIntent(scope.db, {
      account_id: scope.session.account_id,
      employee_id: scope.employeeId,
      assignment_id: scope.authority.assignment.assignment_id,
      requested_by_principal_id: scope.humanPrincipalId,
      connector,
      owner_context: scope.body.owner_context && typeof scope.body.owner_context === "object"
        ? scope.body.owner_context as Record<string, unknown>
        : {},
    });
    const audit_id = await writeAudit(scope.db, {
      assignment_id: scope.authority.assignment.assignment_id,
      account_id: scope.session.account_id,
      employee_id: scope.employeeId,
      actor: "owner",
      action: "connector:setup:request",
      resource: intent.id,
      result: "ok",
      details: {
        connector_key: intent.connector_key,
        setup_experience: intent.setup_experience,
        provider_credentials_in_owner_ui: false,
      },
    });
    return c.json({
      status: "requested",
      intent,
      proof: {
        setup_intent_id: intent.id,
        assignment_id: intent.assignment_id,
        audit_id,
      },
    }, 202);
  });

  app.post("/manager/employee/:employeeId/workbench/connectors/revoke", async (c) => {
    const scope = await ownerScope(c, "connector:revoke", denyInternal);
    if ("denied" in scope) return scope.denied;
    const reason = String(scope.body.reason ?? "owner_requested_disconnect").trim();
    if (!reason) return c.json({ error: "revocation_reason_required" }, 400);
    const result = await revokeAssignmentConnector(scope.db, {
      account_id: scope.session.account_id,
      employee_id: scope.employeeId,
      assignment_id: scope.authority.assignment.assignment_id,
      binding_id: typeof scope.body.binding_id === "string" ? scope.body.binding_id : null,
      connector_key: typeof scope.body.connector_key === "string" ? scope.body.connector_key : null,
      reason,
      actor_principal_id: scope.humanPrincipalId,
    });
    const audit_id = await writeAudit(scope.db, {
      assignment_id: scope.authority.assignment.assignment_id,
      account_id: scope.session.account_id,
      employee_id: scope.employeeId,
      actor: "owner",
      action: "connector:revoke",
      resource: typeof scope.body.binding_id === "string" ? scope.body.binding_id : String(scope.body.connector_key ?? "connector"),
      result: "ok",
      details: {
        reason,
        revoked: result.revoked,
        subsequent_use_policy: "fail_closed",
      },
    });
    return c.json({ ...result, audit_id });
  });
}
