import { ID_PREFIX, failed, newId, ok } from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { mintOAuthState, safeOAuthReturnPath } from "../lib/oauth-state.js";

const DEFAULT_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

function gmailRedirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${(process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "")}/webhooks/gmail/oauth/callback`;
}

function gmailConsentUrl(state: string, scopes: string[]): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID missing.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

/** Owner-safe connect path. It preserves the existing connector custody and OAuth
 * exchange tools while binding the provider callback to one relative work-object
 * return target inside the signed state token. */
export const connectEmailWithOwnerReturn: ToolHandler = async (ctx, raw) => {
  const input = raw as {
    account_id?: string;
    employee_id?: string;
    provider?: string;
    requested_scopes?: string[];
    return_to?: string;
  };
  if (!input.account_id || !input.employee_id || input.provider !== "gmail") {
    return failed("validation_failed", "account_id, employee_id, and provider=gmail are required.");
  }
  const employee = await ctx.db.from("employees")
    .select("id")
    .eq("id", input.employee_id)
    .eq("account_id", input.account_id)
    .maybeSingle();
  if (employee.error) throw employee.error;
  if (!employee.data?.id) return failed("unauthorized", "Employee does not belong to this account.", {
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: ctx.assignment_id ?? null,
  });

  try {
    const existing = await ctx.db.from("connector_accounts")
      .select("id")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .eq("connector_key", "email")
      .eq("provider", "gmail")
      .maybeSingle();
    if (existing.error) throw existing.error;
    const connectorId = existing.data?.id ? String(existing.data.id) : newId(ID_PREFIX.connector);
    const scopes = input.requested_scopes?.length ? input.requested_scopes : DEFAULT_GMAIL_SCOPES;
    if (existing.data?.id) {
      const updated = await ctx.db.from("connector_accounts").update({
        provider: "gmail",
        status: "pending_oauth",
        scopes,
        last_error: null,
      }).eq("id", connectorId);
      if (updated.error) throw updated.error;
    } else {
      const inserted = await ctx.db.from("connector_accounts").insert({
        id: connectorId,
        account_id: input.account_id,
        employee_id: input.employee_id,
        connector_key: "email",
        provider: "gmail",
        status: "pending_oauth",
        scopes,
        token_secret_ref: null,
      });
      if (inserted.error) throw inserted.error;
    }
    const returnTo = safeOAuthReturnPath(input.return_to);
    const state = mintOAuthState(input.employee_id, "gmail", 600, { return_to: returnTo });
    const consentUrl = gmailConsentUrl(state, scopes);
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:connect_email",
      resource: connectorId,
      result: "ok",
      details: { provider: "gmail", status: "pending_oauth", scopes, return_to: returnTo ?? null },
    });
    return ok({
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`connector:${connectorId}`],
      proof: { connector_id: connectorId, provider: "gmail", status: "pending_oauth", consent_url: consentUrl, return_to: returnTo ?? null },
      user_facing_summary_hint: "Gmail consent link created.",
      next_suggested_action: "Complete Google consent, then run the connector test.",
      audit_id,
    });
  } catch (error) {
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:connect_email",
      result: "failed",
      details: { reason: "oauth_url_failed", message: String((error as Error).message ?? error) },
    });
    return failed("provider_error", "Could not create Gmail consent link.", {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      audit_id,
    });
  }
};
