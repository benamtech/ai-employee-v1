import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";

export const PROVISIONING_STATES = [
  "requested",
  "resources_reserved",
  "profile_rendered",
  "credentials_minted",
  "runtime_started",
  "runtime_healthy",
  "routing_activated",
  "channel_configured",
  "welcome_sent",
  "ready",
  "failed",
  "compensating",
  "compensated",
] as const;

export type ProvisioningState = (typeof PROVISIONING_STATES)[number];

export interface ProvisioningTransitionInput {
  provisioning_job_id: string;
  account_id: string;
  employee_id?: string | null;
  expected_state: ProvisioningState | "running";
  to_state: ProvisioningState;
  attempt?: number;
  retry_class?: string | null;
  timeout_at?: string | null;
  evidence?: Record<string, unknown>;
  error?: Record<string, unknown> | null;
}

/**
 * Compare-and-swap a provisioning job and append immutable transition evidence.
 * The update predicate prevents two workers from advancing the same state.
 */
export async function transitionProvisioning(
  db: SupabaseClient,
  input: ProvisioningTransitionInput,
): Promise<{ applied: boolean; transition_version?: number }> {
  const current = await db
    .from("provisioning_jobs")
    .select("state,transition_version")
    .eq("id", input.provisioning_job_id)
    .maybeSingle();
  if (current.error) throw current.error;
  if (!current.data || current.data.state !== input.expected_state) return { applied: false };

  const previousVersion = Number(current.data.transition_version ?? 0);
  const nextVersion = previousVersion + 1;
  const now = new Date().toISOString();
  const updated = await db
    .from("provisioning_jobs")
    .update({
      state: input.to_state,
      transition_version: nextVersion,
      last_transition_at: now,
    })
    .eq("id", input.provisioning_job_id)
    .eq("state", input.expected_state)
    .eq("transition_version", previousVersion)
    .select("id")
    .maybeSingle();
  if (updated.error) throw updated.error;
  if (!updated.data) return { applied: false };

  const inserted = await db.from("provisioning_transitions").insert({
    id: `ptr_${randomUUID()}`,
    provisioning_job_id: input.provisioning_job_id,
    account_id: input.account_id,
    employee_id: input.employee_id ?? null,
    from_state: input.expected_state,
    to_state: input.to_state,
    transition_version: nextVersion,
    attempt: input.attempt ?? 1,
    retry_class: input.retry_class ?? null,
    timeout_at: input.timeout_at ?? null,
    evidence: input.evidence ?? {},
    error: input.error ?? null,
    created_at: now,
  });
  if (inserted.error) throw inserted.error;
  return { applied: true, transition_version: nextVersion };
}

export async function beginCompensation(
  db: SupabaseClient,
  input: Omit<ProvisioningTransitionInput, "to_state">,
): Promise<{ applied: boolean; transition_version?: number }> {
  return transitionProvisioning(db, { ...input, to_state: "compensating" });
}
