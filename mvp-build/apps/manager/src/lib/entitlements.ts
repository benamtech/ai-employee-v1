/**
 * Entitlement layer — scaffolding now, default-allow policy in MVP.
 * Spec: 00-source-of-truth-and-rules.md ("Entitlements exist but default to
 * `allow`"), product-agent-platform-architecture.md (monetization deliberately
 * open). Every check is logged to `feature_checks` so paywalls/limits/trials can
 * attach later WITHOUT rewiring the product surfaces.
 */
import type { SupabaseClient } from "@amtech/db";

export interface EntitlementContext {
  account_id?: string | null;
  employee_id?: string | null;
}

export interface EntitlementResult {
  decision: "allow" | "deny";
  feature_key: string;
}

/** MVP: allow everything, but record the decision. */
export async function checkFeature(
  db: SupabaseClient,
  ctx: EntitlementContext,
  feature_key: string,
): Promise<EntitlementResult> {
  // Lookup the most specific policy; default allow when none.
  const decision: "allow" | "deny" = "allow";
  await db.from("feature_checks").insert({
    account_id: ctx.account_id ?? null,
    employee_id: ctx.employee_id ?? null,
    feature_key,
    decision,
  });
  return { decision, feature_key };
}

export async function recordUsage(
  db: SupabaseClient,
  ctx: EntitlementContext,
  feature_key: string,
  quantity = 1,
  unit?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.from("usage_events").insert({
    account_id: ctx.account_id ?? null,
    employee_id: ctx.employee_id ?? null,
    feature_key,
    quantity,
    unit: unit ?? null,
    metadata,
  });
}
