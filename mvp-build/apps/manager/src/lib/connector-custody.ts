import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  resolveConnectorCustody,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type ConnectorBindingRecord,
  type ConnectorCustodyDecision,
  type ConnectorEventDedupeRecord,
  type ProviderCapabilityClass,
} from "@amtech/shared";
import { enqueueAmbientEvent } from "./ambient-inbox.js";

export interface VerifiedConnectorEventInput {
  provider: string;
  external_event_id: string;
  external_subject: string;
  event_type: string;
  payload: Record<string, unknown>;
  verification_ref: string;
  verification_metadata: Record<string, unknown>;
  resource_class: string;
  resource_id?: string | null;
  capability_class?: ProviderCapabilityClass;
  occurred_at?: string | null;
  ordering_key?: string | null;
  correlation_id?: string | null;
  causation_id?: string | null;
  action?: string;
}

export type VerifiedConnectorEventResult =
  | {
      status: "authorized";
      inbox_id: string;
      duplicate: boolean;
      assignment_id: string;
      connector_binding_id: string;
      command_intent_id: string;
      command_id: string;
      custody: Extract<ConnectorCustodyDecision, { ok: true }>;
    }
  | {
      status: "waiting_for_binding" | "denied" | "revoked";
      inbox_id: string;
      duplicate: boolean;
      reason: string;
      custody?: Extract<ConnectorCustodyDecision, { ok: false }>;
    };

export interface ConnectorBindingInput {
  provider: string;
  external_subject: string;
  account_id: string;
  employee_id: string;
  resource_class: string;
  resource_id?: string | null;
  connector_account_id?: string | null;
  capability_class: ProviderCapabilityClass;
  policy_version?: string;
  provider_verification_ref: string;
  provider_verified_at?: string;
  provenance?: Record<string, unknown>;
  actions?: readonly string[];
}

interface StoredConnectorBinding {
  id: string;
  assignment_id: string;
  connector_account_id?: string | null;
  principal_id: string;
  provider: string;
  external_subject: string;
  account_id: string;
  employee_id: string;
  resource_class: string;
  resource_id?: string | null;
  capability_class: ProviderCapabilityClass;
  policy_version: string;
  status: string;
  expires_at?: string | null;
  revoked_at?: string | null;
}

interface StoredAmbientRow {
  inbox_id: string;
  provider: string;
  external_event_id: string;
  assignment_id?: string | null;
  connector_binding_id?: string | null;
  command_intent_id?: string | null;
  command_id?: string | null;
  payload_hash?: string | null;
  processing_state: string;
  authorization_state?: string | null;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalPayloadHash(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(canonicalize(payload));
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

function stableHex(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

function stableCommandIdentity(provider: string, externalEventId: string, assignmentId: string) {
  const digest = stableHex("connector-event-v1", provider, externalEventId, assignmentId);
  return {
    intent_id: `intent_${digest.slice(0, 32)}`,
    command_id: `cmd_${digest.slice(32)}`,
    intent_key: `connector:${provider}:${externalEventId}`,
  };
}

function bindingId(input: ConnectorBindingInput, assignmentId: string): string {
  return `cb_${stableHex(
    input.provider,
    input.external_subject,
    assignmentId,
    input.resource_class,
    input.resource_id ?? "",
  ).slice(0, 32)}`;
}

function grantId(assignmentId: string, principalId: string, resourceClass: string, resourceId: string | null): string {
  return `grant_${stableHex(assignmentId, principalId, resourceClass, resourceId ?? "").slice(0, 28)}`;
}

function commandPayload(input: VerifiedConnectorEventInput, payloadHash: string, binding: ConnectorBindingRecord) {
  return {
    provider: input.provider,
    external_event_id: input.external_event_id,
    external_subject: input.external_subject,
    event_type: input.event_type,
    connector_binding_id: binding.binding_id,
    resource_class: input.resource_class,
    resource_id: input.resource_id ?? null,
    payload_hash: payloadHash,
  };
}

function assignmentRecord(binding: StoredConnectorBinding, assignment: Record<string, unknown>): AssignmentPrincipalRecord {
  const status = String(assignment.status ?? "revoked");
  return {
    assignment_id: binding.assignment_id,
    account_id: binding.account_id,
    employee_id: binding.employee_id,
    principal_id: binding.principal_id,
    role: "operator",
    status,
    revoked_at: ["revoked", "ended", "suspended", "expired"].includes(status)
      ? String(assignment.ends_at ?? new Date(0).toISOString())
      : null,
    expires_at: typeof assignment.ends_at === "string" ? assignment.ends_at : null,
  };
}

function grantRecord(row: Record<string, unknown>): AssignmentResourceGrantRecord {
  const status = String(row.status ?? "revoked");
  return {
    assignment_id: String(row.assignment_id ?? ""),
    resource_class: String(row.resource_class ?? ""),
    resource_id: typeof row.resource_id === "string" ? row.resource_id : null,
    actions: Array.isArray(row.actions) ? row.actions.map(String) : [],
    revoked_at: ["revoked", "ended", "suspended", "expired"].includes(status)
      ? String(row.ends_at ?? new Date(0).toISOString())
      : null,
    expires_at: typeof row.ends_at === "string" ? row.ends_at : null,
  };
}

async function loadBindings(
  db: SupabaseClient,
  provider: string,
  externalSubject: string,
): Promise<StoredConnectorBinding[]> {
  const result = await db
    .from("connector_bindings")
    .select("id,assignment_id,connector_account_id,principal_id,provider,external_subject,account_id,employee_id,resource_class,resource_id,capability_class,policy_version,status,expires_at,revoked_at")
    .eq("provider", provider)
    .eq("external_subject", externalSubject);
  if (result.error) throw result.error;
  return (result.data ?? []) as StoredConnectorBinding[];
}

function toSharedBinding(row: StoredConnectorBinding): ConnectorBindingRecord {
  return {
    binding_id: row.id,
    provider: row.provider,
    external_subject: row.external_subject,
    assignment_id: row.assignment_id,
    account_id: row.account_id,
    employee_id: row.employee_id,
    principal_id: row.principal_id,
    resource_class: row.resource_class,
    resource_id: row.resource_id ?? null,
    status: row.status,
    policy_version: row.policy_version,
    capability_class: row.capability_class,
    revoked_at: row.revoked_at ?? null,
    expires_at: row.expires_at ?? null,
  };
}

async function loadScope(
  db: SupabaseClient,
  bindings: readonly StoredConnectorBinding[],
): Promise<{ assignments: AssignmentPrincipalRecord[]; grants: AssignmentResourceGrantRecord[] }> {
  const assignmentIds = [...new Set(bindings.map((binding) => binding.assignment_id))];
  if (assignmentIds.length === 0) return { assignments: [], grants: [] };

  const [assignmentRows, grantRows] = await Promise.all([
    db.from("employee_assignments").select("id,status,ends_at").in("id", assignmentIds),
    db.from("assignment_resource_grants")
      .select("assignment_id,principal_id,resource_class,resource_id,actions,status,ends_at")
      .in("assignment_id", assignmentIds),
  ]);
  if (assignmentRows.error) throw assignmentRows.error;
  if (grantRows.error) throw grantRows.error;

  const byId = new Map((assignmentRows.data ?? []).map((row) => [String(row.id), row as Record<string, unknown>]));
  const assignments = bindings.flatMap((binding) => {
    const row = byId.get(binding.assignment_id);
    return row ? [assignmentRecord(binding, row)] : [];
  });
  const grants = (grantRows.data ?? [])
    .filter((row) => {
      const binding = bindings.find((item) => item.assignment_id === String(row.assignment_id));
      return !row.principal_id || row.principal_id === binding?.principal_id;
    })
    .map((row) => grantRecord(row as Record<string, unknown>));
  return { assignments, grants };
}

async function loadInbox(db: SupabaseClient, inboxId: string): Promise<StoredAmbientRow> {
  const result = await db
    .from("ambient_event_inbox")
    .select("inbox_id,provider,external_event_id,assignment_id,connector_binding_id,command_intent_id,command_id,payload_hash,processing_state,authorization_state")
    .eq("inbox_id", inboxId)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("ambient_event_not_found_after_enqueue");
  return result.data as StoredAmbientRow;
}

async function registerConnectorCommand(
  db: SupabaseClient,
  input: VerifiedConnectorEventInput,
  binding: ConnectorBindingRecord,
  payloadHash: string,
  identity: ReturnType<typeof stableCommandIdentity>,
): Promise<void> {
  const payload = commandPayload(input, payloadHash, binding);
  const result = await db.rpc("register_durable_command", {
    p_intent_id: identity.intent_id,
    p_assignment_id: binding.assignment_id,
    p_actor_principal_id: binding.principal_id,
    p_actor_class: "employee",
    p_authenticated_by: `verified_provider:${input.provider}`,
    p_intent_key: identity.intent_key,
    p_command_id: identity.command_id,
    p_command_type: "connector.event.ingest",
    p_command_version: "1.0.0",
    p_policy_version: binding.policy_version,
    p_payload: payload,
    p_payload_hash: payloadHash,
    p_correlation_id: input.correlation_id ?? identity.intent_id,
    p_causation_id: input.causation_id ?? null,
  });
  if (result.error) throw result.error;
}

async function markAuthorizationState(
  db: SupabaseClient,
  inboxId: string,
  state: "waiting_for_binding" | "denied" | "revoked" | "public_ingress",
  details: Record<string, unknown>,
): Promise<void> {
  const current = await db.from("ambient_event_inbox").select("verification_metadata").eq("inbox_id", inboxId).maybeSingle();
  if (current.error) throw current.error;
  const existing = current.data?.verification_metadata && typeof current.data.verification_metadata === "object"
    ? current.data.verification_metadata as Record<string, unknown>
    : {};
  const updated = await db.from("ambient_event_inbox").update({
    authorization_state: state,
    verification_metadata: { ...existing, custody: details },
  }).eq("inbox_id", inboxId);
  if (updated.error) throw updated.error;
}

export async function enqueuePublicVerifiedEvent(
  db: SupabaseClient,
  input: Omit<VerifiedConnectorEventInput, "resource_class" | "verification_ref"> & { verification_ref: string },
): Promise<{ inbox_id: string; duplicate: boolean }> {
  if (!input.verification_ref) throw new Error("provider_verification_ref_required");
  const payloadHash = canonicalPayloadHash(input.payload);
  const queued = await enqueueAmbientEvent(db, {
    source_type: "provider_webhook",
    provider: input.provider,
    external_event_id: input.external_event_id,
    occurred_at: input.occurred_at ?? null,
    event_type: input.event_type,
    subject_key: input.external_subject,
    correlation_id: input.correlation_id ?? null,
    causation_id: input.causation_id ?? null,
    ordering_key: input.ordering_key ?? null,
    payload: input.payload,
    verification_metadata: input.verification_metadata,
  });
  const updated = await db.from("ambient_event_inbox").update({
    provider_verification_ref: input.verification_ref,
    payload_hash: payloadHash,
    authorization_state: "public_ingress",
  }).eq("inbox_id", queued.inbox_id);
  if (updated.error) throw updated.error;
  return queued;
}

export async function enqueueVerifiedConnectorEvent(
  db: SupabaseClient,
  input: VerifiedConnectorEventInput,
): Promise<VerifiedConnectorEventResult> {
  if (!input.verification_ref) throw new Error("provider_verification_ref_required");
  const payloadHash = canonicalPayloadHash(input.payload);
  const queued = await enqueueAmbientEvent(db, {
    source_type: "provider_webhook",
    provider: input.provider,
    external_event_id: input.external_event_id,
    occurred_at: input.occurred_at ?? null,
    event_type: input.event_type,
    subject_key: input.external_subject,
    correlation_id: input.correlation_id ?? null,
    causation_id: input.causation_id ?? null,
    ordering_key: input.ordering_key ?? null,
    payload: input.payload,
    verification_metadata: input.verification_metadata,
  });

  const metadataWrite = await db.from("ambient_event_inbox").update({
    provider_verification_ref: input.verification_ref,
    payload_hash: payloadHash,
    resource_class: input.resource_class,
    resource_id: input.resource_id ?? null,
  }).eq("inbox_id", queued.inbox_id);
  if (metadataWrite.error) throw metadataWrite.error;

  const bindingRows = await loadBindings(db, input.provider, input.external_subject);
  if (bindingRows.length === 0) {
    await markAuthorizationState(db, queued.inbox_id, "waiting_for_binding", {
      reason: "missing_connector_binding",
      provider: input.provider,
      external_subject: input.external_subject,
    });
    return {
      status: "waiting_for_binding",
      inbox_id: queued.inbox_id,
      duplicate: queued.duplicate,
      reason: "missing_connector_binding",
    };
  }

  const sharedBindings = bindingRows.map(toSharedBinding);
  const { assignments, grants } = await loadScope(db, bindingRows);
  const existing = await loadInbox(db, queued.inbox_id);
  const selectedAssignment = existing.assignment_id ?? bindingRows[0]?.assignment_id ?? "unbound";
  const identity = stableCommandIdentity(input.provider, input.external_event_id, selectedAssignment);
  const dedupeRecord: ConnectorEventDedupeRecord | null = existing.assignment_id && existing.payload_hash
    ? {
        provider: existing.provider,
        external_event_id: existing.external_event_id,
        payload_hash: existing.payload_hash,
        assignment_id: existing.assignment_id,
        command_intent_id: existing.command_intent_id ?? null,
        processing_state: existing.processing_state,
      }
    : null;

  const custody = resolveConnectorCustody({
    verification: {
      verified: true,
      provider: input.provider,
      verification_ref: input.verification_ref,
      verified_at: new Date().toISOString(),
    },
    external_event_id: input.external_event_id,
    external_subject: input.external_subject,
    payload_hash: payloadHash,
    bindings: sharedBindings,
    assignments,
    grants,
    dedupe_record: dedupeRecord,
    action: input.action ?? "connector:event:ingest",
    command_effect_intent_id: identity.intent_id,
  });

  if (!custody.ok) {
    const state = custody.reason === "revoked_or_expired_connector_binding" ? "revoked" : "denied";
    await markAuthorizationState(db, queued.inbox_id, state, {
      reason: custody.reason,
      scope_reason: custody.scope_reason ?? null,
      evidence: custody.evidence,
    });
    return {
      status: state,
      inbox_id: queued.inbox_id,
      duplicate: queued.duplicate,
      reason: custody.reason,
      custody,
    };
  }

  const acceptedIdentity = stableCommandIdentity(input.provider, input.external_event_id, custody.assignment.assignment_id);
  await registerConnectorCommand(db, input, custody.binding, payloadHash, acceptedIdentity);
  const attested = await db.rpc("attest_ambient_connector_custody", {
    p_inbox_id: queued.inbox_id,
    p_assignment_id: custody.assignment.assignment_id,
    p_connector_binding_id: custody.binding.binding_id,
    p_command_intent_id: acceptedIdentity.intent_id,
    p_command_id: acceptedIdentity.command_id,
    p_provider_verification_ref: input.verification_ref,
    p_payload_hash: payloadHash,
    p_resource_class: custody.binding.resource_class,
    p_resource_id: custody.binding.resource_id ?? null,
  });
  if (attested.error) throw attested.error;

  return {
    status: "authorized",
    inbox_id: queued.inbox_id,
    duplicate: queued.duplicate || custody.duplicate,
    assignment_id: custody.assignment.assignment_id,
    connector_binding_id: custody.binding.binding_id,
    command_intent_id: acceptedIdentity.intent_id,
    command_id: acceptedIdentity.command_id,
    custody,
  };
}

export async function upsertAssignmentConnectorBinding(
  db: SupabaseClient,
  input: ConnectorBindingInput,
): Promise<{ binding_id: string; assignment_id: string; principal_id: string }> {
  const resolved = await db.rpc("amtech_default_assignment_for_employee_account", {
    p_employee_id: input.employee_id,
    p_account_id: input.account_id,
  });
  if (resolved.error) throw resolved.error;
  const assignmentId = typeof resolved.data === "string"
    ? resolved.data
    : Array.isArray(resolved.data)
      ? String(resolved.data[0] ?? "")
      : String(resolved.data ?? "");
  if (!assignmentId) throw new Error("connector_assignment_not_unique");

  const principal = await db
    .from("employee_principals")
    .select("id")
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (principal.error) throw principal.error;
  if (!principal.data?.id) throw new Error("connector_employee_principal_missing");
  const principalId = String(principal.data.id);
  const resourceId = input.resource_id ?? input.external_subject;
  const id = bindingId(input, assignmentId);
  const policyVersion = input.policy_version ?? "authorization-v1";
  const verifiedAt = input.provider_verified_at ?? new Date().toISOString();

  const bindingWrite = await db.from("connector_bindings").upsert({
    id,
    assignment_id: assignmentId,
    connector_account_id: input.connector_account_id ?? null,
    principal_id: principalId,
    provider: input.provider,
    external_subject: input.external_subject,
    account_id: input.account_id,
    employee_id: input.employee_id,
    resource_class: input.resource_class,
    resource_id: resourceId,
    capability_class: input.capability_class,
    policy_version: policyVersion,
    status: "active",
    provider_verification_ref: input.provider_verification_ref,
    provider_verified_at: verifiedAt,
    revoked_at: null,
    provenance: {
      ...(input.provenance ?? {}),
      account_id: input.account_id,
      employee_id: input.employee_id,
      source: "manager_connector_binding",
    },
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (bindingWrite.error) throw bindingWrite.error;

  const actions = [...new Set(input.actions ?? ["connector:event:ingest"] )];
  const grantWrite = await db.from("assignment_resource_grants").upsert({
    id: grantId(assignmentId, principalId, input.resource_class, resourceId),
    assignment_id: assignmentId,
    principal_id: principalId,
    resource_class: input.resource_class,
    resource_id: resourceId,
    actions,
    status: "active",
    policy_version: policyVersion,
    provenance: {
      source: "connector_binding",
      connector_binding_id: id,
      provider: input.provider,
    },
  }, { onConflict: "id" });
  if (grantWrite.error) throw grantWrite.error;
  return { binding_id: id, assignment_id: assignmentId, principal_id: principalId };
}
