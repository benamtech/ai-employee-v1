import { ID_PREFIX, failed, newId, ok } from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { qboAuthorizeUrl } from "../lib/qbo-client.js";
import { mintOAuthState, safeOAuthReturnPath } from "../lib/oauth-state.js";
import { writeAudit } from "../lib/audit.js";

/** Owner-safe QuickBooks consent start. Existing QBO exchange, token sealing,
 * company verification, assignment binding, and provider tools remain unchanged;
 * this wrapper only binds the signed initiating work-object return path. */
export const connectQuickBooksWithOwnerReturn: ToolHandler = async (ctx, raw) => {
  const input = raw as {
    account_id?: string;
    employee_id?: string;
    requested_scopes?: string[];
    return_to?: string;
  };
  if (!input.account_id || !input.employee_id) {
    return failed("validation_failed", "account_id and employee_id are required.");
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
    const scopes = input.requested_scopes?.length ? input.requested_scopes : ["com.intuit.quickbooks.accounting"];
    const existing = await ctx.db.from("connector_accounts")
      .select("id")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .eq("connector_key", "quickbooks")
      .eq("provider", "quickbooks")
      .maybeSingle();
    if (existing.error) throw existing.error;
    const connectorId = existing.data?.id ? String(existing.data.id) : newId(ID_PREFIX.connector);
    if (existing.data?.id) {
      const updated = await ctx.db.from("connector_accounts").update({
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
        connector_key: "quickbooks",
        provider: "quickbooks",
        status: "pending_oauth",
        scopes,
        token_secret_ref: null,
      });
      if (inserted.error) throw inserted.error;
    }

    const returnTo = safeOAuthReturnPath(input.return_to);
    const state = mintOAuthState(input.employee_id, "quickbooks", 600, { return_to: returnTo });
    const consentUrl = qboAuthorizeUrl(state);
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:connect_quickbooks",
      resource: connectorId,
      result: "ok",
      details: { provider: "quickbooks", status: "pending_oauth", scopes, return_to: returnTo ?? null },
    });
    return ok({
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      changed_resources: [`connector:${connectorId}`],
      proof: {
        connector_id: connectorId,
        provider: "quickbooks",
        status: "pending_oauth",
        consent_url: consentUrl,
        return_to: returnTo ?? null,
      },
      user_facing_summary_hint: "QuickBooks consent link created.",
      next_suggested_action: "Complete Intuit consent, then run the QuickBooks connector test.",
      audit_id,
    });
  } catch (error) {
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:connect_quickbooks",
      result: "failed",
      details: { reason: "oauth_url_failed", message: String((error as Error).message ?? error) },
    });
    return failed("provider_error", "Could not create the QuickBooks consent link.", {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      audit_id,
    });
  }
};
