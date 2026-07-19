import type { Hono } from "hono";
import { serviceClient } from "@amtech/db";
import { openSecret, sealSecret } from "../lib/secrets.js";
import { safeOAuthReturnPath, verifyOAuthState } from "../lib/oauth-state.js";
import { qboCompanyInfo, qboExchangeCode, qboRefresh, qboRevoke } from "../lib/qbo-client.js";
import { writeAudit } from "../lib/audit.js";
import { upsertAssignmentConnectorBinding } from "../lib/connector-custody.js";

function resultPage(message: string, success: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>AMTECH</title></head>` +
    `<body style="font-family:system-ui;max-width:560px;margin:12vh auto;text-align:center">` +
    `<h1 style="color:${success ? "#1a7f37" : "#b42318"}">${success ? "Connected" : "Connection failed"}</h1>` +
    `<p>${message}</p></body></html>`;
}

function ownerWebOrigin(): string | null {
  const raw = process.env.AGENT_WEB_ORIGIN ?? process.env.PUBLIC_WEB_ORIGIN ?? "";
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function oauthReturnUrl(returnTo: string | undefined, status: "connected" | "error"): string | null {
  const origin = ownerWebOrigin();
  const path = safeOAuthReturnPath(returnTo);
  if (!origin || !path) return null;
  const url = new URL(path, origin);
  url.searchParams.set("connector", "quickbooks");
  url.searchParams.set("state", status);
  return url.toString();
}

export function registerQboWebhooks(app: Hono): void {
  app.get("/webhooks/qbo/oauth/callback", async (c) => {
    const rawState = c.req.query("state") ?? "";
    const state = rawState ? verifyOAuthState(rawState) : null;
    if (!state || state.provider !== "quickbooks") return c.text("invalid oauth state", 403);
    const error = c.req.query("error");
    if (error) {
      const returnUrl = oauthReturnUrl(state.return_to, "error");
      if (returnUrl) return c.redirect(returnUrl);
      return c.html(resultPage("QuickBooks connection was cancelled.", false), 400);
    }
    const code = c.req.query("code") ?? "";
    const realmId = c.req.query("realmId") ?? "";
    if (!code || !realmId) return c.text("missing code or realmId", 400);

    const db = serviceClient();
    try {
      const employeeResult = await db.from("employees").select("id,account_id").eq("id", state.employee_id).single();
      if (employeeResult.error) throw employeeResult.error;
      const accountId = String(employeeResult.data.account_id);
      const existing = await db.from("connector_accounts")
        .select("id")
        .eq("account_id", accountId)
        .eq("employee_id", state.employee_id)
        .eq("connector_key", "quickbooks")
        .eq("provider", "quickbooks")
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (!existing.data?.id) throw new Error("pending QuickBooks connector account not found");
      const connectorId = String(existing.data.id);

      const token = await qboExchangeCode(code);
      const accessRef = `qbo:${connectorId}:access`;
      const refreshRef = `qbo:${connectorId}:refresh`;
      await sealSecret(accessRef, token.access_token);
      await sealSecret(refreshRef, token.refresh_token);
      const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
      const refreshExpiresAt = token.x_refresh_token_expires_in
        ? new Date(Date.now() + token.x_refresh_token_expires_in * 1000).toISOString()
        : null;
      const company = await qboCompanyInfo(realmId, token.access_token);
      const updated = await db.from("connector_accounts").update({
        status: "connected",
        token_secret_ref: accessRef,
        refresh_secret_ref: refreshRef,
        token_expires_at: expiresAt,
        refresh_token_expires_at: refreshExpiresAt,
        external_account_id: realmId,
        display_name: String(company?.CompanyName ?? `QuickBooks company ${realmId}`),
        metadata: { company_info: company },
        connected_at: new Date().toISOString(),
        last_test_at: new Date().toISOString(),
        last_error: null,
      }).eq("id", connectorId).eq("account_id", accountId).eq("employee_id", state.employee_id);
      if (updated.error) throw updated.error;
      await upsertAssignmentConnectorBinding(db, {
        provider: "quickbooks",
        external_subject: realmId,
        account_id: accountId,
        employee_id: state.employee_id,
        resource_class: "connector:quickbooks",
        resource_id: realmId,
        connector_account_id: connectorId,
        capability_class: "consumer_dedupe",
        provider_verification_ref: `quickbooks-oauth:${connectorId}:${realmId}`,
        provenance: { oauth_state_verified: true, company_info_verified: true },
      });
      const auditId = await writeAudit(db, {
        account_id: accountId,
        employee_id: state.employee_id,
        actor: "manager",
        action: "qbo:oauth_complete",
        resource: connectorId,
        result: "ok",
        details: { realm_id: realmId, company_name: company?.CompanyName ?? null, return_to: state.return_to ?? null },
      });
      const returnUrl = oauthReturnUrl(state.return_to, "connected");
      if (returnUrl) return c.redirect(returnUrl);
      const fallback = process.env.QBO_OAUTH_SUCCESS_REDIRECT;
      if (fallback) return c.redirect(fallback);
      return c.html(resultPage(`QuickBooks is connected. Audit ${auditId}.`, true), 200);
    } catch (connectError) {
      const employee = await db.from("employees").select("account_id").eq("id", state.employee_id).maybeSingle();
      await writeAudit(db, {
        account_id: employee.data?.account_id ? String(employee.data.account_id) : null,
        employee_id: state.employee_id,
        actor: "manager",
        action: "qbo:oauth_complete",
        result: "failed",
        details: { reason: String((connectError as Error).message ?? connectError) },
      }).catch(() => {});
      const returnUrl = oauthReturnUrl(state.return_to, "error");
      if (returnUrl) return c.redirect(returnUrl);
      return c.html(resultPage("QuickBooks connection failed. Please try connecting again.", false), 500);
    }
  });

  app.post("/webhooks/qbo/disconnect", async (c) => {
    const { connector_id } = await c.req.json().catch(() => ({}));
    if (typeof connector_id !== "string" || !connector_id) return c.json({ error: "connector_id_required" }, 400);
    const db = serviceClient();
    const connector = await db.from("connector_accounts").select("*").eq("id", connector_id).maybeSingle();
    if (connector.error) throw connector.error;
    if (!connector.data?.id) return c.json({ error: "not_found" }, 404);
    try {
      if (connector.data.access_token_ref) {
        const token = await openSecret(String(connector.data.access_token_ref));
        await qboRevoke(token);
      }
    } catch {
      // Continue with local revocation even if Intuit is unavailable.
    }
    const changed = await db.from("connector_accounts").update({
      status: "revoked",
      token_secret_ref: null,
      refresh_secret_ref: null,
      token_expires_at: null,
      refresh_token_expires_at: null,
      last_error: null,
    }).eq("id", connector_id);
    if (changed.error) throw changed.error;
    await writeAudit(db, {
      account_id: String(connector.data.account_id),
      employee_id: String(connector.data.employee_id),
      actor: "manager",
      action: "qbo:disconnect",
      resource: connector_id,
      result: "ok",
    });
    return c.json({ ok: true });
  });

  app.post("/webhooks/qbo/refresh", async (c) => {
    const { connector_id } = await c.req.json().catch(() => ({}));
    if (typeof connector_id !== "string" || !connector_id) return c.json({ error: "connector_id_required" }, 400);
    const db = serviceClient();
    const connector = await db.from("connector_accounts").select("*").eq("id", connector_id).maybeSingle();
    if (connector.error) throw connector.error;
    if (!connector.data?.id || !connector.data.refresh_token_ref) return c.json({ error: "not_refreshable" }, 409);
    try {
      const refreshToken = await openSecret(String(connector.data.refresh_token_ref));
      const token = await qboRefresh(refreshToken);
      await sealSecret(String(connector.data.access_token_ref), token.access_token);
      await sealSecret(String(connector.data.refresh_token_ref), token.refresh_token);
      const updated = await db.from("connector_accounts").update({
        status: "connected",
        token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        refresh_token_expires_at: token.x_refresh_token_expires_in
          ? new Date(Date.now() + token.x_refresh_token_expires_in * 1000).toISOString()
          : null,
        last_error: null,
      }).eq("id", connector_id);
      if (updated.error) throw updated.error;
      return c.json({ ok: true });
    } catch (refreshError) {
      await db.from("connector_accounts").update({ status: "error", last_error: String((refreshError as Error).message ?? refreshError) }).eq("id", connector_id);
      return c.json({ error: "refresh_failed" }, 502);
    }
  });
}
