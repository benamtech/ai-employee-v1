import type { Context, Hono } from "hono";
import { StartOnboardingIdentityVerification } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { mintOwnerSession, requireOwnerSession } from "./owner-session.js";
import { authorizeOwnerAssignment } from "./owner-assignment-authority.js";
import { buildEmployeeSnapshotStrict as buildEmployeeSnapshot, strictSnapshotClient } from "./employee-stream-strict.js";
import { buildOperatingSurfaceState } from "./operating-surface.js";
import { buildToolCapabilityCatalog } from "./tool-capability-catalog.js";
import {
  loadOnboardingIdentity,
  processMiddeskIdentityWebhook,
  startOnboardingIdentityVerification,
} from "./onboarding-identity.js";
import { verifyMiddeskWebhookSignature } from "./onboarding-identity-provider.js";
import { writeAudit } from "./audit.js";
import { registerArtifactWorkbenchRoutes } from "./artifact-workbench-routes.js";
import { registerConnectorWorkbenchRoutes } from "./connector-workbench-routes.js";

type DenyInternal = (c: Context) => Response | null;

function retryAfterSeconds(retryAfterAt: string | null): number {
  if (!retryAfterAt) return 24 * 60 * 60;
  return Math.max(1, Math.ceil((new Date(retryAfterAt).getTime() - Date.now()) / 1000));
}

export function registerOnboardingIdentityRoutes(app: Hono, denyInternal: DenyInternal): void {
  // Owner-authenticated connector, capability, and artifact routes share this
  // existing registration seam so the production server remains the single
  // authority for constructing the Manager app.
  registerArtifactWorkbenchRoutes(app, denyInternal);
  registerConnectorWorkbenchRoutes(app, denyInternal);

  /**
   * Production owner login boundary. The web server authenticates email/password
   * directly with Supabase Auth and sends only the resulting access token here.
   * Manager then resolves public user + owner/admin memberships and mints the same
   * authority-versioned owner session used by onboarding and owner surfaces.
   * `account_id` is an explicit selection key only; membership remains authority.
   */
  app.post("/manager/auth/owner-login", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const { access_token, account_id } = await c.req.json().catch(() => ({}));
    if (typeof access_token !== "string" || access_token.length < 20) {
      return c.json({ error: "auth_token_required" }, 400);
    }
    const db = serviceClient();
    const auth = await db.auth.getUser(access_token);
    const authUser = auth.data.user;
    if (auth.error || !authUser?.id || !authUser.email_confirmed_at) {
      return c.json({ error: "invalid_login" }, 401);
    }

    const publicUserResult = await db.from("users")
      .select("id,email,full_name")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();
    if (publicUserResult.error) throw publicUserResult.error;
    const publicUser = publicUserResult.data as { id?: string; email?: string | null; full_name?: string | null } | null;
    if (!publicUser?.id) return c.json({ error: "owner_user_not_found" }, 403);

    const membershipResult = await db.from("account_memberships")
      .select("account_id,role")
      .eq("user_id", publicUser.id)
      .in("role", ["owner", "admin"]);
    if (membershipResult.error) throw membershipResult.error;
    const memberships = (membershipResult.data ?? []) as Array<{ account_id: string; role: string }>;
    if (!memberships.length) return c.json({ error: "owner_membership_not_found" }, 403);

    const accountIds = [...new Set(memberships.map((membership) => String(membership.account_id)))];
    const accountsResult = await db.from("accounts")
      .select("id,display_name,slug")
      .in("id", accountIds);
    if (accountsResult.error) throw accountsResult.error;
    const accounts = (accountsResult.data ?? []) as Array<{ id: string; display_name?: string | null; slug?: string | null }>;

    const requestedAccountId = typeof account_id === "string" && account_id.trim() ? account_id.trim() : null;
    if (!requestedAccountId && accountIds.length > 1) {
      return c.json({
        error: "account_selection_required",
        accounts: accounts.map((account) => ({
          id: account.id,
          display_name: account.display_name ?? "AMTECH account",
          slug: account.slug ?? null,
          role: memberships.find((membership) => membership.account_id === account.id)?.role ?? "owner",
        })),
      }, 409);
    }
    const selectedAccountId = requestedAccountId ?? accountIds[0];
    if (!selectedAccountId || !accountIds.includes(selectedAccountId)) {
      return c.json({ error: "account_access_denied" }, 403);
    }

    const ownerSession = await mintOwnerSession(db, selectedAccountId, publicUser.id);
    const auditId = await writeAudit(db, {
      account_id: selectedAccountId,
      actor: "owner",
      action: "owner_web_session:login",
      resource: publicUser.id,
      result: "ok",
      details: {
        user_id: publicUser.id,
        auth_user_id: authUser.id,
        membership_role: memberships.find((membership) => membership.account_id === selectedAccountId)?.role ?? null,
      },
    });
    return c.json({
      status: "ok",
      account_id: selectedAccountId,
      owner: { email: publicUser.email ?? authUser.email ?? null, full_name: publicUser.full_name ?? null },
      owner_session_token: ownerSession.token,
      owner_session_expires_at: ownerSession.expires_at,
      audit_id: auditId,
    });
  });

  app.post("/manager/onboarding/identity/verify", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const raw = await c.req.json().catch(() => ({}));
    const parsed = StartOnboardingIdentityVerification.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: "identity_validation_failed", issues: parsed.error.issues.map((issue) => issue.path.join(".")) }, 400);
    }
    const db = serviceClient();
    const session = await requireOwnerSession(db, parsed.data.owner_session_token);
    if (!session?.human_principal_id) return c.json({ error: "owner_session_invalid" }, 401);

    try {
      const result = await startOnboardingIdentityVerification(
        db,
        session.account_id,
        session.human_principal_id,
        parsed.data,
      );
      const auditId = await writeAudit(db, {
        account_id: session.account_id,
        actor: "owner",
        action: "onboarding_identity:verify",
        resource: result.identity.id,
        result: result.identity.status === "rejected" ? "denied" : "ok",
        details: {
          owner_principal_id: session.human_principal_id,
          attempt_id: result.attempt_id,
          attempt_status: result.attempt_status,
          provider_business_id: result.identity.provider_business_id,
          tax_id_last4: result.identity.tax_id_last4,
          duplicate: result.duplicate,
        },
      });
      if (result.attempt_status === "rate_limited") {
        const seconds = retryAfterSeconds(result.retry_after_at);
        c.header("Retry-After", String(seconds));
        return c.json({
          allowed: false,
          error: "identity_verification_rate_limited",
          retryAfter: seconds,
          identity: result.identity,
          audit_id: auditId,
        }, 429);
      }
      if (result.identity.status === "rejected") {
        return c.json({ allowed: false, error: "identity_rejected_permanent", identity: result.identity, audit_id: auditId }, 403);
      }
      return c.json({
        allowed: result.identity.status === "verified",
        status: result.identity.status,
        identity: result.identity,
        attempt_id: result.attempt_id,
        audit_id: auditId,
      }, result.identity.status === "verified" ? 200 : 202);
    } catch (error) {
      const message = String((error as Error).message ?? error);
      const permanent = message.includes("identity_rejected_permanent");
      const auditId = await writeAudit(db, {
        account_id: session.account_id,
        actor: "owner",
        action: "onboarding_identity:verify",
        result: permanent ? "denied" : "failed",
        details: { owner_principal_id: session.human_principal_id, error: message },
      });
      return c.json({
        allowed: false,
        error: permanent ? "identity_rejected_permanent" : "identity_verification_failed",
        audit_id: auditId,
      }, permanent ? 403 : 502);
    }
  });

  app.post("/manager/onboarding/identity/status", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const { owner_session_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const session = await requireOwnerSession(db, String(owner_session_token ?? ""));
    if (!session?.human_principal_id) return c.json({ error: "owner_session_invalid" }, 401);
    const identity = await loadOnboardingIdentity(db, session.account_id, session.human_principal_id);
    if (!identity) return c.json({ allowed: false, error: "identity_unverified", identity: null }, 404);
    const error = identity.status === "rejected"
      ? "identity_rejected_permanent"
      : identity.status === "verified"
        ? null
        : identity.status === "revoked" || identity.status === "expired"
          ? "identity_revoked"
          : "identity_unverified";
    return c.json({ allowed: identity.status === "verified", error, identity });
  });

  /** Owner-safe operating read. Exact session + assignment; no C3 registration. */
  app.post("/manager/employee/:employeeId/operating-snapshot", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const { owner_session_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const session = await requireOwnerSession(db, String(owner_session_token ?? ""));
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const authority = await authorizeOwnerAssignment(db, {
      session,
      employee_id: employeeId,
      resource_class: "employee",
      resource_id: employeeId,
      action: "materialize",
    });
    if (!authority.ok) return c.json({ error: authority.reason }, authority.status);
    const snapshot = await buildEmployeeSnapshot(db, employeeId, session.account_id, authority.assignment.assignment_id);
    const tool_catalog = await buildToolCapabilityCatalog(strictSnapshotClient(db), snapshot);
    const enriched = {
      ...snapshot,
      tool_catalog,
      tool_capabilities: tool_catalog.capabilities,
      task_capability_matches: tool_catalog.task_matches,
    };
    const operating_state = await buildOperatingSurfaceState(strictSnapshotClient(db), enriched);
    return c.json({ ...enriched, operating_state });
  });

  app.post("/webhooks/middesk/onboarding-identity", async (c) => {
    const rawBody = await c.req.raw.text();
    if (!verifyMiddeskWebhookSignature(rawBody, c.req.header("X-Middesk-Signature-256"))) {
      return c.json({ error: "signature_invalid" }, 401);
    }
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const db = serviceClient();
    try {
      const processed = await processMiddeskIdentityWebhook(db, event);
      const identity = await db.from("onboarding_identities")
        .select("account_id,owner_principal_id,provider_business_id")
        .eq("id", processed.identity_id)
        .maybeSingle();
      if (identity.error) throw identity.error;
      await writeAudit(db, {
        account_id: identity.data?.account_id ? String(identity.data.account_id) : null,
        actor: "manager",
        action: "onboarding_identity:provider_webhook",
        resource: processed.identity_id,
        result: processed.status === "rejected" ? "denied" : "ok",
        details: {
          provider: "middesk",
          provider_event_id: String(event.id ?? ""),
          provider_event_type: String(event.type ?? ""),
          provider_business_id: identity.data?.provider_business_id ?? null,
          duplicate: processed.duplicate,
          status: processed.status,
        },
      });
      return c.json({ received: true, ...processed });
    } catch (error) {
      return c.json({ error: String((error as Error).message ?? error) }, 503);
    }
  });
}
