import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId } from "@amtech/shared";
import { loadApprovalAuthority } from "./approval-authority.js";

export interface SmsDecisionContext {
  context_id: string;
  approval_id: string;
  account_id: string;
  employee_id: string;
  assignment_id: string;
  human_principal_id: string;
  owner_message_id: string;
  action_key: string;
  summary: string;
  risk_level: string;
  resource_class: string;
  resource_id: string;
  snapshot_hash: string;
  expires_at: string;
}

interface CurrentHumanPrincipal {
  human_principal_id: string;
  role: string;
  roles: string[];
  policy_version: string;
}

function currentAt(row: { status?: string | null; starts_at?: string | null; ends_at?: string | null }, now = Date.now()): boolean {
  if (row.status !== "active" && row.status !== "current") return false;
  if (row.starts_at && Date.parse(row.starts_at) > now) return false;
  if (row.ends_at && Date.parse(row.ends_at) <= now) return false;
  return true;
}

function selectRole(rows: Array<{ role?: unknown; policy_version?: unknown }>, allowedRoles?: readonly string[]) {
  const order = new Map((allowedRoles ?? []).map((role, index) => [role, index]));
  return [...rows].sort((a, b) => {
    const aRole = String(a.role ?? "");
    const bRole = String(b.role ?? "");
    const aRank = order.has(aRole) ? order.get(aRole)! : Number.MAX_SAFE_INTEGER;
    const bRank = order.has(bRole) ? order.get(bRole)! : Number.MAX_SAFE_INTEGER;
    return aRank - bRank || aRole.localeCompare(bRole);
  })[0];
}

async function currentAssignmentHuman(db: SupabaseClient, input: {
  assignment_id: string;
  human_principal_id: string;
  allowed_roles?: readonly string[];
  policy_version?: string | null;
}): Promise<CurrentHumanPrincipal | null> {
  let query = db.from("assignment_principals")
    .select("principal_id,role,status,starts_at,ends_at,policy_version")
    .eq("assignment_id", input.assignment_id)
    .eq("principal_class", "human")
    .eq("principal_id", input.human_principal_id);
  if (input.allowed_roles?.length) query = query.in("role", [...input.allowed_roles]);
  if (input.policy_version) query = query.eq("policy_version", input.policy_version);
  const result = await query;
  if (result.error) throw result.error;
  const rows = (result.data ?? []).filter((row) => currentAt(row));
  if (!rows.length) return null;
  const selected = selectRole(rows, input.allowed_roles);
  if (!selected) return null;
  const roles = [...new Set(rows.map((row) => String(row.role)))];
  return {
    human_principal_id: input.human_principal_id,
    role: String(selected.role),
    roles,
    policy_version: String(selected.policy_version),
  };
}

/**
 * Resolve the human behind an assignment-bound SMS session. Phone possession is
 * never enough by itself: the verified phone must map to a current human
 * principal on this exact assignment. Multiple current roles for the same human
 * are valid; ambiguity means multiple distinct humans, not multiple role rows.
 */
export async function resolveSmsHumanPrincipal(db: SupabaseClient, input: {
  account_id: string;
  assignment_id: string;
  phone_e164: string;
  allowed_roles?: readonly string[];
  policy_version?: string | null;
}): Promise<CurrentHumanPrincipal> {
  const phoneResult = await db.from("verified_phones")
    .select("id,account_id,phone_e164,human_principal_id,verified_at")
    .eq("account_id", input.account_id)
    .eq("phone_e164", input.phone_e164)
    .order("verified_at", { ascending: false })
    .limit(2);
  if (phoneResult.error) throw phoneResult.error;
  const phones = phoneResult.data ?? [];
  if (phones.length !== 1) {
    throw new Error(phones.length === 0 ? "sms_verified_phone_missing" : "sms_verified_phone_ambiguous");
  }
  const phone = phones[0]!;
  if (phone.human_principal_id) {
    const current = await currentAssignmentHuman(db, {
      assignment_id: input.assignment_id,
      human_principal_id: String(phone.human_principal_id),
      allowed_roles: input.allowed_roles,
      policy_version: input.policy_version,
    });
    if (!current) throw new Error("sms_human_principal_not_current_for_assignment");
    return current;
  }

  let principalQuery = db.from("assignment_principals")
    .select("principal_id,role,status,starts_at,ends_at,policy_version")
    .eq("assignment_id", input.assignment_id)
    .eq("principal_class", "human");
  if (input.allowed_roles?.length) principalQuery = principalQuery.in("role", [...input.allowed_roles]);
  if (input.policy_version) principalQuery = principalQuery.eq("policy_version", input.policy_version);
  const principalsResult = await principalQuery;
  if (principalsResult.error) throw principalsResult.error;
  const currentRows = (principalsResult.data ?? []).filter((row) => currentAt(row));
  const distinct = [...new Set(currentRows.map((row) => String(row.principal_id)))];
  if (distinct.length !== 1) {
    throw new Error(distinct.length === 0 ? "sms_human_principal_missing" : "sms_human_principal_ambiguous");
  }
  const current = await currentAssignmentHuman(db, {
    assignment_id: input.assignment_id,
    human_principal_id: distinct[0]!,
    allowed_roles: input.allowed_roles,
    policy_version: input.policy_version,
  });
  if (!current) throw new Error("sms_human_principal_not_current_for_assignment");

  const repaired = await db.from("verified_phones").update({
    human_principal_id: current.human_principal_id,
  }).eq("id", phone.id).is("human_principal_id", null);
  if (repaired.error) throw repaired.error;
  return current;
}

/**
 * Focus the SMS conversation on the approval just delivered. Superseding a prior
 * focus does not resolve or revoke its approval; it only prevents a later vague
 * reply from being applied to the wrong work object.
 */
export async function openSmsApprovalDecisionContext(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  approval_id: string;
  prompt_message_id: string;
  owner_phone_e164: string;
  external_subject?: string | null;
}): Promise<SmsDecisionContext> {
  const approval = await loadApprovalAuthority(db, input.approval_id);
  if (!approval || approval.account_id !== input.account_id || approval.employee_id !== input.employee_id) {
    throw new Error("sms_decision_approval_not_found_or_wrong_employee");
  }
  if (approval.status !== "pending") throw new Error("sms_decision_approval_not_pending");
  const human = await resolveSmsHumanPrincipal(db, {
    account_id: input.account_id,
    assignment_id: approval.assignment_id,
    phone_e164: input.owner_phone_e164,
    allowed_roles: approval.required_resolver_roles,
    policy_version: approval.policy_version,
  });

  const prompt = await db.from("employee_messages")
    .select("id,assignment_id,account_id,employee_id,direction,channel")
    .eq("id", input.prompt_message_id)
    .maybeSingle();
  if (prompt.error) throw prompt.error;
  if (
    !prompt.data?.id
    || prompt.data.direction !== "to_owner"
    || prompt.data.assignment_id !== approval.assignment_id
    || prompt.data.account_id !== approval.account_id
    || prompt.data.employee_id !== approval.employee_id
  ) {
    throw new Error("sms_decision_prompt_scope_mismatch");
  }

  const now = new Date().toISOString();
  const superseded = await db.from("channel_decision_contexts").update({
    status: "superseded",
    updated_at: now,
    evidence: { superseded_by_prompt_message_id: input.prompt_message_id },
  })
    .eq("assignment_id", approval.assignment_id)
    .eq("channel", "sms")
    .eq("human_principal_id", human.human_principal_id)
    .eq("status", "open");
  if (superseded.error) throw superseded.error;

  const contextId = newId(ID_PREFIX.event);
  const inserted = await db.from("channel_decision_contexts").insert({
    id: contextId,
    assignment_id: approval.assignment_id,
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    channel: "sms",
    external_subject: input.external_subject ?? input.owner_phone_e164,
    human_principal_id: human.human_principal_id,
    approval_id: approval.approval_id,
    prompt_message_id: input.prompt_message_id,
    status: "open",
    expires_at: approval.expires_at,
    evidence: {
      source: "sms_approval_delivery",
      approval_snapshot_hash: approval.snapshot_hash,
      action_key: approval.action_key,
      resolver_role: human.role,
      resolver_roles: human.roles,
      natural_language_surface: true,
      code_challenge_required: false,
    },
    created_at: now,
    updated_at: now,
  }).select("*").maybeSingle();
  if (inserted.error) throw inserted.error;
  if (!inserted.data?.id) throw new Error("sms_decision_context_not_persisted");

  const messageUpdate = await db.from("employee_messages").update({
    human_principal_id: human.human_principal_id,
    decision_context_id: contextId,
    decision_context: {
      approval_id: approval.approval_id,
      action_key: approval.action_key,
      snapshot_hash: approval.snapshot_hash,
      expires_at: approval.expires_at,
    },
  }).eq("id", input.prompt_message_id).eq("assignment_id", approval.assignment_id);
  if (messageUpdate.error) throw messageUpdate.error;

  return {
    context_id: contextId,
    approval_id: approval.approval_id,
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    assignment_id: approval.assignment_id,
    human_principal_id: human.human_principal_id,
    owner_message_id: input.prompt_message_id,
    action_key: approval.action_key,
    summary: approval.summary,
    risk_level: approval.risk_level,
    resource_class: approval.resource_class,
    resource_id: approval.resource_id,
    snapshot_hash: approval.snapshot_hash,
    expires_at: approval.expires_at,
  };
}

/** Attach the current work-object focus to an inbound SMS turn without deciding it. */
export async function loadSmsDecisionContextForTurn(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  phone_e164: string;
  owner_message_id: string;
}): Promise<SmsDecisionContext | null> {
  const identity = await resolveSmsHumanPrincipal(db, {
    account_id: input.account_id,
    assignment_id: input.assignment_id,
    phone_e164: input.phone_e164,
    allowed_roles: ["owner", "manager", "operator", "approver", "billing"],
  });
  const contexts = await db.from("channel_decision_contexts")
    .select("id,approval_id,assignment_id,account_id,employee_id,human_principal_id,status,expires_at,created_at")
    .eq("assignment_id", input.assignment_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .eq("channel", "sms")
    .eq("human_principal_id", identity.human_principal_id)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(2);
  if (contexts.error) throw contexts.error;
  if ((contexts.data ?? []).length > 1) throw new Error("sms_decision_context_ambiguous");

  const messageUpdateBase = {
    account_id: input.account_id,
    human_principal_id: identity.human_principal_id,
  };
  const row = contexts.data?.[0];
  if (!row?.id) {
    const updated = await db.from("employee_messages").update(messageUpdateBase)
      .eq("id", input.owner_message_id)
      .eq("assignment_id", input.assignment_id);
    if (updated.error) throw updated.error;
    return null;
  }

  const approval = await loadApprovalAuthority(db, String(row.approval_id));
  if (!approval || approval.status !== "pending" || approval.assignment_id !== input.assignment_id) {
    const expired = await db.from("channel_decision_contexts").update({
      status: approval?.status === "rejected" ? "rejected" : "expired",
      updated_at: new Date().toISOString(),
    }).eq("id", row.id).eq("status", "open");
    if (expired.error) throw expired.error;
    const updated = await db.from("employee_messages").update(messageUpdateBase)
      .eq("id", input.owner_message_id)
      .eq("assignment_id", input.assignment_id);
    if (updated.error) throw updated.error;
    return null;
  }
  const authorizedHuman = await currentAssignmentHuman(db, {
    assignment_id: input.assignment_id,
    human_principal_id: identity.human_principal_id,
    allowed_roles: approval.required_resolver_roles,
    policy_version: approval.policy_version,
  });
  if (!authorizedHuman) throw new Error("sms_decision_resolver_no_longer_authorized");

  const updated = await db.from("employee_messages").update({
    ...messageUpdateBase,
    decision_context_id: row.id,
    decision_context: {
      approval_id: approval.approval_id,
      action_key: approval.action_key,
      summary: approval.summary,
      snapshot_hash: approval.snapshot_hash,
      expires_at: approval.expires_at,
      resolver_role: authorizedHuman.role,
    },
  }).eq("id", input.owner_message_id).eq("assignment_id", input.assignment_id);
  if (updated.error) throw updated.error;

  return {
    context_id: String(row.id),
    approval_id: approval.approval_id,
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    assignment_id: approval.assignment_id,
    human_principal_id: identity.human_principal_id,
    owner_message_id: input.owner_message_id,
    action_key: approval.action_key,
    summary: approval.summary,
    risk_level: approval.risk_level,
    resource_class: approval.resource_class,
    resource_id: approval.resource_id,
    snapshot_hash: approval.snapshot_hash,
    expires_at: approval.expires_at,
  };
}

export async function resolveOwnerChannelDecision(db: SupabaseClient, input: {
  owner_message_id: string;
  decision_context_id: string;
  approval_id: string;
  resolution: "approved" | "rejected";
}): Promise<Record<string, unknown>> {
  const result = await db.rpc("amtech_resolve_sms_channel_decision", {
    p_owner_message_id: input.owner_message_id,
    p_decision_context_id: input.decision_context_id,
    p_approval_id: input.approval_id,
    p_resolution: input.resolution,
  });
  if (result.error) throw result.error;
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row || typeof row !== "object") throw new Error("channel_decision_resolution_missing");
  return row as Record<string, unknown>;
}
