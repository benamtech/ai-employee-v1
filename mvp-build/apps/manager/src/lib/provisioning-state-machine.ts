import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";

export const PROVISIONING_STATES = [
  "requested",
  "resources_reserved",
  "credentials_minted",
  "profile_rendered",
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

export const PROVISIONING_RESOURCE_TYPES = [
  "account",
  "employee_record",
  "scoped_credentials",
  "rendered_profile",
  "employee_network",
  "runtime",
  "gateway_routing",
  "channel_provider_bindings",
  "health_acceptance",
  "welcome_ready",
] as const;

export type ProvisioningResourceType = (typeof PROVISIONING_RESOURCE_TYPES)[number];

export const PROVISIONING_COMMAND_TYPES = [
  "ensure_runtime",
  "teardown",
  "suspend",
  "rotate_model_gateway_credential",
  "reprovision",
  "replace_runtime",
  "restore",
  "inspect_drift",
  "repair_drift",
] as const;

export type ProvisioningCommandType = (typeof PROVISIONING_COMMAND_TYPES)[number];
export type RetryClass = "retryable" | "operator-action-required" | "permanent" | "compensating";

export interface ProvisioningTransitionInput {
  provisioning_job_id: string;
  account_id: string;
  employee_id?: string | null;
  expected_state: ProvisioningState | "running" | "success";
  to_state: ProvisioningState;
  attempt?: number;
  retry_class?: RetryClass | string | null;
  timeout_at?: string | null;
  evidence?: Record<string, unknown>;
  error?: Record<string, unknown> | null;
}

export interface ProvisioningResourceSpec {
  resource_key: string;
  resource_type: ProvisioningResourceType;
  desired_state: string;
  idempotency_key: string;
}

export interface ProvisioningLease {
  job_id: string;
  lease_token: string;
  lease_expires_at: string;
  attempt_count: number;
}

export function canonicalProvisioningGraph(input: { account_id: string; employee_id: string; manifest_id: string }): ProvisioningResourceSpec[] {
  const base = `acct:${input.account_id}:emp:${input.employee_id}:man:${input.manifest_id}`;
  return [
    { resource_key: "account", resource_type: "account", desired_state: "present", idempotency_key: `${base}:account` },
    { resource_key: "employee_record", resource_type: "employee_record", desired_state: "present", idempotency_key: `${base}:employee_record` },
    { resource_key: "scoped_credentials", resource_type: "scoped_credentials", desired_state: "minted", idempotency_key: `${base}:scoped_credentials` },
    { resource_key: "rendered_profile", resource_type: "rendered_profile", desired_state: "checksum_verified_frozen", idempotency_key: `${base}:rendered_profile` },
    { resource_key: "employee_network", resource_type: "employee_network", desired_state: "isolated", idempotency_key: `${base}:employee_network` },
    { resource_key: "runtime", resource_type: "runtime", desired_state: "started", idempotency_key: `${base}:runtime` },
    { resource_key: "gateway_routing", resource_type: "gateway_routing", desired_state: "loopback_route_active", idempotency_key: `${base}:gateway_routing` },
    { resource_key: "channel_provider_bindings", resource_type: "channel_provider_bindings", desired_state: "configured_after_runtime", idempotency_key: `${base}:channel_provider_bindings` },
    { resource_key: "health_acceptance", resource_type: "health_acceptance", desired_state: "accepted", idempotency_key: `${base}:health_acceptance` },
    { resource_key: "welcome_ready", resource_type: "welcome_ready", desired_state: "idempotent_business_effect_ready", idempotency_key: `${base}:welcome_ready` },
  ];
}

export function classifyProvisioningError(err: unknown): RetryClass {
  const message = String((err as Error).message ?? err).toLowerCase();
  if (/timeout|temporar|econn|rate|429|503|unavailable|lease|in_progress/.test(message)) return "retryable";
  if (/missing|misconfigured|credential|secret|permission|operator|dns|caddy|migration/.test(message)) return "operator-action-required";
  if (/compensat|orphan|drift|partial/.test(message)) return "compensating";
  return "permanent";
}

export async function transitionProvisioning(db: SupabaseClient, input: ProvisioningTransitionInput): Promise<{ applied: boolean; transition_version?: number }> {
  const current = await db.from("provisioning_jobs").select("state,transition_version").eq("id", input.provisioning_job_id).maybeSingle();
  if (current.error) throw current.error;
  if (!current.data || current.data.state !== input.expected_state) return { applied: false };
  const previousVersion = Number(current.data.transition_version ?? 0);
  const nextVersion = previousVersion + 1;
  const now = new Date().toISOString();
  const updated = await db
    .from("provisioning_jobs")
    .update({ state: input.to_state, transition_version: nextVersion, last_transition_at: now, retry_class: input.retry_class ?? undefined })
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

export async function beginCompensation(db: SupabaseClient, input: Omit<ProvisioningTransitionInput, "to_state">): Promise<{ applied: boolean; transition_version?: number }> {
  return transitionProvisioning(db, { ...input, to_state: "compensating" });
}

export async function claimProvisioningLease(db: SupabaseClient, input: { provisioning_job_id: string; lease_ms?: number }): Promise<ProvisioningLease | null> {
  const lease_token = `lease_${randomUUID()}`;
  const lease_expires_at = new Date(Date.now() + (input.lease_ms ?? 120_000)).toISOString();
  const now = new Date().toISOString();
  const claimed = await db
    .from("provisioning_jobs")
    .update({ lease_token, lease_expires_at })
    .eq("id", input.provisioning_job_id)
    .or(`lease_expires_at.is.null,lease_expires_at.lt.${now}`)
    .select("id,attempt_count")
    .maybeSingle();
  if (claimed.error) throw claimed.error;
  if (!claimed.data) return null;
  return { job_id: String(claimed.data.id), lease_token, lease_expires_at, attempt_count: Number(claimed.data.attempt_count ?? 1) };
}

export async function persistProvisioningResourceGraph(db: SupabaseClient, input: { provisioning_job_id: string; account_id: string; employee_id: string; resources: ProvisioningResourceSpec[] }): Promise<void> {
  const rows = input.resources.map((resource) => ({
    id: `prs_${randomUUID()}`,
    provisioning_job_id: input.provisioning_job_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    resource_key: resource.resource_key,
    resource_type: resource.resource_type,
    desired_state: resource.desired_state,
    observed_state: "unknown",
    idempotency_key: resource.idempotency_key,
  }));
  const upserted = await db.from("provisioning_resource_states").upsert(rows, { onConflict: "provisioning_job_id,resource_key" });
  if (upserted.error) throw upserted.error;
}

export async function recordProvisioningResource(db: SupabaseClient, input: { provisioning_job_id: string; resource_key: string; observed_state: string; evidence?: Record<string, unknown>; error?: Record<string, unknown> | null; retry_class?: RetryClass | null }): Promise<void> {
  const now = new Date().toISOString();
  const updated = await db
    .from("provisioning_resource_states")
    .update({ observed_state: input.observed_state, evidence: input.evidence ?? {}, error: input.error ?? null, retry_class: input.retry_class ?? null, last_inspected_at: now, updated_at: now })
    .eq("provisioning_job_id", input.provisioning_job_id)
    .eq("resource_key", input.resource_key);
  if (updated.error) throw updated.error;
}

export function reverseCompensationOrder(resources: ProvisioningResourceSpec[]): ProvisioningResourceSpec[] {
  return [...resources].reverse();
}
