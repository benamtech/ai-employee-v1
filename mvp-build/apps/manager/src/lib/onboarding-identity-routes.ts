import type { Context, Hono } from "hono";
import { StartOnboardingIdentityVerification } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { requireOwnerSession } from "./owner-session.js";
import {
  loadOnboardingIdentity,
  processMiddeskIdentityWebhook,
  startOnboardingIdentityVerification,
} from "./onboarding-identity.js";
import { verifyMiddeskWebhookSignature } from "./onboarding-identity-provider.js";
import { writeAudit } from "./audit.js";

type DenyInternal = (c: Context) => Response | null;

function retryAfterSeconds(retryAfterAt: string | null): number {
  if (!retryAfterAt) return 24 * 60 * 60;
  return Math.max(1, Math.ceil((new Date(retryAfterAt).getTime() - Date.now()) / 1000));
}

export function registerOnboardingIdentityRoutes(app: Hono, denyInternal: DenyInternal): void {
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
