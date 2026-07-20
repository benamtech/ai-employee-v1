import { failed } from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { qboTools } from "./qbo.stub.js";
import { mintOAuthState, safeOAuthReturnPath } from "../lib/oauth-state.js";

/**
 * Preserve the canonical QuickBooks connector implementation and only replace the
 * provider state parameter with one that is bound to the initiating owner work
 * object. Token exchange, storage, health checks, and assignment binding remain in
 * the existing qbo tool/webhook path.
 */
export const connectQuickBooksWithOwnerReturn: ToolHandler = async (ctx, raw) => {
  const canonical = qboTools.connect_quickbooks;
  if (!canonical) return failed("provider_error", "QuickBooks connector is unavailable.");
  const input = raw as { employee_id?: string; return_to?: string };
  const envelope = await canonical(ctx, raw);
  if (envelope.status !== "ok" || !input.employee_id) return envelope;

  const consentValue = envelope.proof?.consent_url;
  if (typeof consentValue !== "string") return envelope;
  try {
    const consent = new URL(consentValue);
    const returnTo = safeOAuthReturnPath(input.return_to);
    const state = mintOAuthState(input.employee_id, "quickbooks", 600, { return_to: returnTo });
    consent.searchParams.set("state", state);
    return {
      ...envelope,
      proof: {
        ...envelope.proof,
        consent_url: consent.toString(),
        return_to: returnTo ?? null,
      },
    };
  } catch {
    return failed("provider_error", "QuickBooks returned an invalid consent URL.", {
      assignment_id: ctx.assignment_id ?? null,
      employee_id: input.employee_id,
      proof: { provider: "quickbooks", failure_reason: "invalid_consent_url" },
    });
  }
};
