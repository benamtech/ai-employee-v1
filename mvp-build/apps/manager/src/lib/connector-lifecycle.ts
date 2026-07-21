import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  approvalInteractionForEffect,
  compileAdaptiveConnectorPlan,
  genericConnectorRuntimeManifest,
  resolveConnectorRuntimeManifest,
  type AdaptiveConnectorPlan,
  type ConnectorCapabilityManifest,
  type ConnectorLifecycleState,
  type ConnectorRuntimeManifest,
} from "@amtech/shared";

interface StoredBinding {
  id: string;
  connector_account_id?: string | null;
  assignment_id: string;
  account_id: string;
  employee_id: string;
  provider: string;
  connector_key?: string | null;
  external_subject: string;
  resource_class: string;
  resource_id?: string | null;
  status: string;
  lifecycle_state?: string | null;
  discovery_state?: string | null;
  discovered_capabilities?: unknown;
  provider_verification_ref?: string | null;
  provider_verified_at?: string | null;
  last_capability_discovery_at?: string | null;
  last_health_check_at?: string | null;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  revocation_evidence?: Record<string, unknown> | null;
  updated_at?: string | null;
}

interface StoredCapabilityProjection {
  id: string;
  connector_binding_id: string;
  assignment_id: string;
  account_id: string;
  employee_id: string;
  provider: string;
  connector_key: string;
  capability_key: string;
  label: string;
  category: string;
  effect_class: string;
  approval_interaction: string;
  event_driven: boolean;
  status: string;
  manifest_revision: string;
  evidence?: Record<string, unknown> | null;
  discovered_at?: string | null;
  last_verified_at?: string | null;
  revoked_at?: string | null;
  updated_at?: string | null;
}

export interface ConnectorSetupIntent {
  id: string;
  assignment_id: string;
  account_id: string;
  employee_id: string;
  connector_key: string;
  label: string;
  setup_experience: string;
  requested_by_principal_id: string;
  status: "requested" | "in_progress" | "ready" | "connected" | "cancelled" | "failed" | string;
  owner_context: Record<string, unknown>;
  evidence: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConnectorLifecycleSnapshot {
  schema: "amtech.connector-lifecycle-snapshot.v1";
  account_id: string;
  employee_id: string;
  assignment_id: string;
  checked_at: string;
  bindings: Array<StoredBinding & {
    connector_key: string;
    lifecycle_state: ConnectorLifecycleState;
    capabilities: StoredCapabilityProjection[];
  }>;
  unbound_capabilities: StoredCapabilityProjection[];
  setup_intents: ConnectorSetupIntent[];
  activation_plan: AdaptiveConnectorPlan;
  proof: {
    binding_count: number;
    active_binding_count: number;
    capability_count: number;
    revoked_binding_count: number;
    setup_intent_count: number;
  };
}

function stableId(prefix: string, ...parts: string[]): string {
  const digest = createHash("sha256").update(parts.join("\u001f")).digest("hex");
  return `${prefix}_${digest.slice(0, 28)}`;
}

function lifecycleState(row: StoredBinding): ConnectorLifecycleState {
  if (row.revoked_at || row.status === "revoked" || row.lifecycle_state === "revoked") return "revoked";
  if (row.status === "expired" || row.lifecycle_state === "expired") return "expired";
  if (row.status === "degraded" || row.lifecycle_state === "degraded") return "degraded";
  if (["active", "connected", "working", "current", "ok", "ready"].includes(row.status)) return "connected";
  if (row.status === "pending" || row.lifecycle_state === "authorizing") return "authorizing";
  return "setup_required";
}

function connectorKey(row: StoredBinding): string {
  return String(row.connector_key || resolveConnectorRuntimeManifest(row.provider)?.key || row.provider || "connector");
}

function manifestFor(value: string): ConnectorRuntimeManifest {
  return resolveConnectorRuntimeManifest(value) ?? genericConnectorRuntimeManifest(value);
}

async function loadBindings(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
}): Promise<StoredBinding[]> {
  const result = await db.from("connector_bindings")
    .select("id,connector_account_id,assignment_id,account_id,employee_id,provider,connector_key,external_subject,resource_class,resource_id,status,lifecycle_state,discovery_state,discovered_capabilities,provider_verification_ref,provider_verified_at,last_capability_discovery_at,last_health_check_at,revoked_at,revocation_reason,revocation_evidence,updated_at")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .eq("assignment_id", input.assignment_id)
    .order("updated_at", { ascending: false });
  if (result.error) throw result.error;
  return (result.data ?? []) as StoredBinding[];
}

async function loadProjections(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
}): Promise<StoredCapabilityProjection[]> {
  const result = await db.from("connector_capability_projections")
    .select("id,connector_binding_id,assignment_id,account_id,employee_id,provider,connector_key,capability_key,label,category,effect_class,approval_interaction,event_driven,status,manifest_revision,evidence,discovered_at,last_verified_at,revoked_at,updated_at")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .eq("assignment_id", input.assignment_id)
    .order("updated_at", { ascending: false });
  if (result.error) throw result.error;
  return (result.data ?? []) as StoredCapabilityProjection[];
}

async function loadSetupIntents(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
}): Promise<ConnectorSetupIntent[]> {
  const result = await db.from("connector_setup_intents")
    .select("id,assignment_id,account_id,employee_id,connector_key,label,setup_experience,requested_by_principal_id,status,owner_context,evidence,created_at,updated_at")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .eq("assignment_id", input.assignment_id)
    .order("updated_at", { ascending: false });
  if (result.error) throw result.error;
  return (result.data ?? []) as ConnectorSetupIntent[];
}

async function loadActivationPlan(db: SupabaseClient, input: {
  employee_id: string;
  connected_connector_keys: string[];
}): Promise<AdaptiveConnectorPlan> {
  const manifestResult = await db.from("employee_manifests")
    .select("manifest")
    .eq("employee_id", input.employee_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (manifestResult.error) throw manifestResult.error;
  const manifest = manifestResult.data?.manifest && typeof manifestResult.data.manifest === "object"
    ? manifestResult.data.manifest as Record<string, unknown>
    : {};
  return compileAdaptiveConnectorPlan({
    business_kind: typeof manifest.business_kind === "string" ? manifest.business_kind : null,
    business_description: typeof manifest.business_display_name === "string"
      ? `${manifest.business_display_name} ${String((manifest.seven_question_answers as Record<string, unknown> | undefined)?.business ?? "")}`
      : null,
    tools_mentioned: Array.isArray(manifest.tools_mentioned) ? manifest.tools_mentioned.map(String) : [],
    top_workflows: Array.isArray(manifest.top_workflows) ? manifest.top_workflows.map(String) : [],
    connected_connector_keys: input.connected_connector_keys,
  });
}

function capabilityProjection(binding: StoredBinding, capability: ConnectorCapabilityManifest, checkedAt: string) {
  const key = connectorKey(binding);
  return {
    id: stableId("ccp", binding.id, capability.key),
    connector_binding_id: binding.id,
    assignment_id: binding.assignment_id,
    account_id: binding.account_id,
    employee_id: binding.employee_id,
    provider: binding.provider,
    connector_key: key,
    capability_key: capability.key,
    label: capability.label,
    category: capability.category,
    effect_class: capability.effect_class,
    approval_interaction: approvalInteractionForEffect(capability.effect_class),
    event_driven: capability.event_driven,
    status: "discovered",
    manifest_revision: "connector-runtime-v1",
    evidence: {
      source: "manager_connector_capability_discovery",
      connector_binding_id: binding.id,
      provider_verification_ref: binding.provider_verification_ref ?? null,
      provider_verified_at: binding.provider_verified_at ?? null,
      binding_status: binding.status,
      declaration_not_execution_authority: true,
      actions: capability.actions,
      triggers: capability.triggers,
      checked_at: checkedAt,
    },
    discovered_at: checkedAt,
    last_verified_at: binding.provider_verified_at ?? null,
    revoked_at: null,
    updated_at: checkedAt,
  };
}

/**
 * Declared discovery improves guidance and owner evidence. Execution remains
 * governed by the existing fresh capability interceptor and current assignment.
 */
export async function refreshAssignmentConnectorCapabilities(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
}): Promise<ConnectorLifecycleSnapshot> {
  const checkedAt = new Date().toISOString();
  const bindings = await loadBindings(db, input);
  for (const binding of bindings) {
    if (lifecycleState(binding) !== "connected") continue;
    const manifest = manifestFor(binding.connector_key || binding.provider);
    const projections = manifest.capabilities.map((capability) => capabilityProjection(binding, capability, checkedAt));
    if (projections.length > 0) {
      const write = await db.from("connector_capability_projections").upsert(projections, {
        onConflict: "connector_binding_id,capability_key",
      });
      if (write.error) throw write.error;
    }

    const bindingWrite = await db.from("connector_bindings").update({
      connector_key: manifest.key,
      lifecycle_state: "connected",
      discovery_state: manifest.capabilities.length ? "complete" : "degraded",
      discovered_capabilities: projections.map((projection) => ({
        capability_key: projection.capability_key,
        effect_class: projection.effect_class,
        approval_interaction: projection.approval_interaction,
        event_driven: projection.event_driven,
      })),
      last_capability_discovery_at: checkedAt,
      updated_at: checkedAt,
    }).eq("id", binding.id).eq("assignment_id", input.assignment_id);
    if (bindingWrite.error) throw bindingWrite.error;

    const eventWrite = await db.from("connector_lifecycle_events").insert({
      id: stableId("cle", binding.id, "capabilities_discovered", checkedAt),
      connector_binding_id: binding.id,
      assignment_id: binding.assignment_id,
      account_id: binding.account_id,
      employee_id: binding.employee_id,
      connector_key: manifest.key,
      provider: binding.provider,
      event_type: "capabilities_discovered",
      lifecycle_state: "connected",
      evidence: {
        source: "manager_connector_capability_discovery",
        manifest_revision: manifest.revision,
        capability_keys: projections.map((projection) => projection.capability_key),
        provider_verification_ref: binding.provider_verification_ref ?? null,
      },
    });
    if (eventWrite.error && (eventWrite.error as { code?: string }).code !== "23505") throw eventWrite.error;
  }
  return loadConnectorLifecycleSnapshot(db, input);
}

export async function requestConnectorSetupIntent(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  requested_by_principal_id: string;
  connector: string;
  owner_context?: Record<string, unknown>;
}): Promise<ConnectorSetupIntent> {
  const manifest = manifestFor(input.connector);
  const now = new Date().toISOString();
  const id = stableId("csi", input.assignment_id, manifest.key, input.requested_by_principal_id);
  const row = {
    id,
    assignment_id: input.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    connector_key: manifest.key,
    label: manifest.label,
    setup_experience: manifest.setup_experience,
    requested_by_principal_id: input.requested_by_principal_id,
    status: "requested",
    owner_context: input.owner_context ?? {},
    evidence: {
      source: "owner_guided_connector_setup",
      adapter_kind: manifest.adapter_kind,
      supports_webhooks: manifest.supports_webhooks,
      supports_polling: manifest.supports_polling,
      supports_remote_mcp: manifest.supports_remote_mcp,
      custody: manifest.custody,
      provider_secrets_visible_to_owner_ui: false,
    },
    created_at: now,
    updated_at: now,
  };
  const result = await db.from("connector_setup_intents").upsert(row, {
    onConflict: "assignment_id,connector_key,requested_by_principal_id",
  }).select("*").maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("connector_setup_intent_not_persisted");
  return result.data as ConnectorSetupIntent;
}

export async function loadConnectorLifecycleSnapshot(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
}): Promise<ConnectorLifecycleSnapshot> {
  const [bindings, projections, setupIntents] = await Promise.all([
    loadBindings(db, input),
    loadProjections(db, input),
    loadSetupIntents(db, input),
  ]);
  const byBinding = new Map<string, StoredCapabilityProjection[]>();
  for (const projection of projections) {
    const list = byBinding.get(projection.connector_binding_id) ?? [];
    list.push(projection);
    byBinding.set(projection.connector_binding_id, list);
  }
  const connectedKeys = bindings
    .filter((binding) => lifecycleState(binding) === "connected")
    .map(connectorKey);
  const activationPlan = await loadActivationPlan(db, {
    employee_id: input.employee_id,
    connected_connector_keys: connectedKeys,
  });
  const knownBindingIds = new Set(bindings.map((binding) => binding.id));
  const normalizedBindings = bindings.map((binding) => ({
    ...binding,
    connector_key: connectorKey(binding),
    lifecycle_state: lifecycleState(binding),
    capabilities: byBinding.get(binding.id) ?? [],
  }));
  return {
    schema: "amtech.connector-lifecycle-snapshot.v1",
    ...input,
    checked_at: new Date().toISOString(),
    bindings: normalizedBindings,
    unbound_capabilities: projections.filter((projection) => !knownBindingIds.has(projection.connector_binding_id)),
    setup_intents: setupIntents,
    activation_plan: activationPlan,
    proof: {
      binding_count: bindings.length,
      active_binding_count: normalizedBindings.filter((binding) => binding.lifecycle_state === "connected").length,
      capability_count: projections.length,
      revoked_binding_count: normalizedBindings.filter((binding) => binding.lifecycle_state === "revoked").length,
      setup_intent_count: setupIntents.length,
    },
  };
}

export async function revokeAssignmentConnector(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  binding_id?: string | null;
  connector_key?: string | null;
  reason: string;
  actor_principal_id: string;
}): Promise<{ revoked: Array<Record<string, unknown>>; snapshot: ConnectorLifecycleSnapshot }> {
  let bindings = await loadBindings(db, input);
  if (input.binding_id) bindings = bindings.filter((binding) => binding.id === input.binding_id);
  if (input.connector_key) {
    const requested = input.connector_key.toLowerCase();
    bindings = bindings.filter((binding) => {
      const key = connectorKey(binding).toLowerCase();
      return key === requested || binding.provider.toLowerCase() === requested;
    });
  }
  if (bindings.length === 0) throw new Error("connector_binding_not_found_or_wrong_assignment");

  const revoked: Array<Record<string, unknown>> = [];
  for (const binding of bindings) {
    const result = await db.rpc("amtech_revoke_connector_binding", {
      p_binding_id: binding.id,
      p_account_id: input.account_id,
      p_employee_id: input.employee_id,
      p_assignment_id: input.assignment_id,
      p_reason: input.reason,
      p_evidence: {
        source: "owner_connector_revoke",
        actor_principal_id: input.actor_principal_id,
        request_id: `revoke_${randomUUID()}`,
      },
    });
    if (result.error) throw result.error;
    const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    revoked.push(...rows as Array<Record<string, unknown>>);
  }
  return {
    revoked,
    snapshot: await loadConnectorLifecycleSnapshot(db, input),
  };
}
