import { createHash, randomInt, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import type { ActionVerificationRequirement } from "@amtech/shared";
import { resolveEmployeeSmsSender } from "./sms-sender.js";
import { sendSms } from "./twilio.js";

export type ActionVerificationCommand = "verify" | "approve" | "reject";

export interface ParsedActionVerificationReply {
  command: ActionVerificationCommand;
  code: string;
}

export interface ActionVerificationChallenge {
  challenge_id: string;
  account_id: string;
  employee_id: string;
  assignment_id: string;
  human_principal_id: string;
  phone_e164: string;
  verification_requirement: Exclude<ActionVerificationRequirement, "owner_session">;
  target_type: string;
  target_id: string;
  purpose: string;
  status: string;
  expires_at: string;
  provider_message_id?: string | null;
  provider_status?: string | null;
}

export interface VerifiedActionChallenge {
  challenge_id: string;
  target_type: string;
  target_id: string;
  human_principal_id: string;
  verification_requirement: Exclude<ActionVerificationRequirement, "owner_session">;
}

function verificationSecret(): string {
  const explicit = process.env.ACTION_VERIFICATION_SECRET;
  if (explicit) return explicit;
  if (process.env.NODE_ENV !== "production" && process.env.MANAGER_SIGNING_SECRET) {
    return process.env.MANAGER_SIGNING_SECRET;
  }
  throw new Error("ACTION_VERIFICATION_SECRET missing.");
}

export function actionVerificationCodeHash(input: {
  assignment_id: string;
  phone_e164: string;
  code: string;
}): string {
  return `sha256:${createHash("sha256")
    .update([verificationSecret(), input.assignment_id, input.phone_e164, input.code].join("\u001f"))
    .digest("hex")}`;
}

export function parseActionVerificationReply(body: string): ParsedActionVerificationReply | null {
  const normalized = body.trim().replace(/\s+/g, " ");
  const match = /^(VERIFY|APPROVE|REJECT)\s+([0-9]{6})$/i.exec(normalized);
  if (!match) return null;
  return {
    command: match[1]!.toLowerCase() as ActionVerificationCommand,
    code: match[2]!,
  };
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

async function selectAuthorizedResolver(db: SupabaseClient, input: {
  account_id: string;
  assignment_id: string;
  human_principal_id?: string | null;
  allowed_roles: readonly string[];
}): Promise<{ human_principal_id: string; role: string; phone_e164: string }> {
  let principalsQuery = db.from("assignment_principals")
    .select("principal_id,role,status,starts_at,ends_at,policy_version")
    .eq("assignment_id", input.assignment_id)
    .eq("principal_class", "human")
    .eq("status", "active")
    .in("role", [...input.allowed_roles]);
  if (input.human_principal_id) principalsQuery = principalsQuery.eq("principal_id", input.human_principal_id);
  const principals = await principalsQuery;
  if (principals.error) throw principals.error;
  const now = Date.now();
  const current = (principals.data ?? []).filter((row) => {
    const starts = row.starts_at ? Date.parse(String(row.starts_at)) : 0;
    const ends = row.ends_at ? Date.parse(String(row.ends_at)) : Number.POSITIVE_INFINITY;
    return Number.isFinite(starts) && starts <= now && now < ends;
  });
  if (current.length !== 1) throw new Error(current.length === 0
    ? "action_verification_resolver_missing"
    : "action_verification_resolver_ambiguous");
  const selected = current[0]!;
  const phone = await db.from("verified_phones")
    .select("phone_e164,verified_at,human_principal_id")
    .eq("account_id", input.account_id)
    .eq("human_principal_id", String(selected.principal_id))
    .order("verified_at", { ascending: false })
    .limit(2);
  if (phone.error) throw phone.error;
  if ((phone.data ?? []).length !== 1 || !phone.data?.[0]?.phone_e164) {
    throw new Error((phone.data ?? []).length === 0
      ? "action_verification_phone_missing"
      : "action_verification_phone_ambiguous");
  }
  return {
    human_principal_id: String(selected.principal_id),
    role: String(selected.role),
    phone_e164: String(phone.data[0].phone_e164),
  };
}

function normalizeChallenge(row: Record<string, unknown>): ActionVerificationChallenge {
  return {
    challenge_id: String(row.id ?? row.challenge_id ?? ""),
    account_id: String(row.account_id ?? ""),
    employee_id: String(row.employee_id ?? ""),
    assignment_id: String(row.assignment_id ?? ""),
    human_principal_id: String(row.human_principal_id ?? ""),
    phone_e164: String(row.phone_e164 ?? ""),
    verification_requirement: String(row.verification_requirement) as ActionVerificationChallenge["verification_requirement"],
    target_type: String(row.target_type ?? ""),
    target_id: String(row.target_id ?? ""),
    purpose: String(row.purpose ?? ""),
    status: String(row.status ?? "pending"),
    expires_at: String(row.expires_at ?? ""),
    provider_message_id: row.provider_message_id ? String(row.provider_message_id) : null,
    provider_status: row.provider_status ? String(row.provider_status) : null,
  };
}

/**
 * Create one expiring challenge for one authorized human and one immutable
 * target. The plaintext code exists only in this call stack and the outbound SMS;
 * durable state stores only a keyed hash and provider receipt metadata.
 */
export async function createAndSendActionVerificationChallenge(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  verification_requirement: Exclude<ActionVerificationRequirement, "owner_session">;
  target_type: string;
  target_id: string;
  purpose: string;
  allowed_roles: readonly string[];
  human_principal_id?: string | null;
  expires_in_seconds?: number;
}): Promise<ActionVerificationChallenge> {
  const resolver = await selectAuthorizedResolver(db, input);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(60, Math.min(input.expires_in_seconds ?? 10 * 60, 30 * 60)) * 1000).toISOString();

  const existing = await db.from("action_verification_challenges")
    .select("*")
    .eq("assignment_id", input.assignment_id)
    .eq("target_type", input.target_type)
    .eq("target_id", input.target_id)
    .eq("human_principal_id", resolver.human_principal_id)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data && ["pending", "verified"].includes(String(existing.data.status)) && Date.parse(String(existing.data.expires_at)) > now.getTime()) {
    return normalizeChallenge(existing.data as Record<string, unknown>);
  }

  if (existing.data?.id) {
    const retired = await db.from("action_verification_challenges").update({
      status: "expired",
      updated_at: now.toISOString(),
      evidence: {
        ...((existing.data.evidence && typeof existing.data.evidence === "object") ? existing.data.evidence as Record<string, unknown> : {}),
        superseded_at: now.toISOString(),
      },
    }).eq("id", existing.data.id);
    if (retired.error) throw retired.error;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const challengeId = `avc_${randomUUID().replace(/-/g, "").slice(0, 28)}`;
  const inserted = await db.from("action_verification_challenges").upsert({
    id: challengeId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    human_principal_id: resolver.human_principal_id,
    phone_e164: resolver.phone_e164,
    verification_requirement: input.verification_requirement,
    target_type: input.target_type,
    target_id: input.target_id,
    purpose: input.purpose,
    code_hash: actionVerificationCodeHash({
      assignment_id: input.assignment_id,
      phone_e164: resolver.phone_e164,
      code,
    }),
    status: "pending",
    attempts: 0,
    max_attempts: 5,
    expires_at: expiresAt,
    evidence: {
      source: "manager_action_verification",
      resolver_role: resolver.role,
      plaintext_code_persisted: false,
      target_bound: true,
      single_use: true,
    },
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: "assignment_id,target_type,target_id,human_principal_id" });
  if (inserted.error) throw inserted.error;

  const from = await resolveEmployeeSmsSender(db, input.employee_id);
  const message = [
    `AMTECH verification for ${input.purpose}.`,
    `Reply APPROVE ${code} to approve, REJECT ${code} to reject, or VERIFY ${code} to verify only.`,
    `Expires in ${Math.round((Date.parse(expiresAt) - now.getTime()) / 60_000)} minutes.`,
    "Do not share this code.",
  ].join(" ");

  try {
    const sent = await sendSms({ to: resolver.phone_e164, from, body: message, forceFrom: true });
    const updated = await db.from("action_verification_challenges").update({
      provider_message_id: sent.sid,
      provider_status: sent.status,
      updated_at: new Date().toISOString(),
      evidence: {
        source: "manager_action_verification",
        resolver_role: resolver.role,
        plaintext_code_persisted: false,
        target_bound: true,
        single_use: true,
        outbound_provider: "twilio",
        outbound_to_suffix: resolver.phone_e164.slice(-4),
      },
    }).eq("id", challengeId).select("*").maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) throw new Error("action_verification_challenge_missing_after_send");
    return normalizeChallenge(updated.data as Record<string, unknown>);
  } catch (error) {
    await db.from("action_verification_challenges").update({
      status: "delivery_ambiguous",
      updated_at: new Date().toISOString(),
      evidence: {
        source: "manager_action_verification",
        outbound_provider: "twilio",
        delivery_outcome: "ambiguous",
        error: String((error as Error)?.message ?? error).slice(0, 200),
      },
    }).eq("id", challengeId).catch(() => undefined);
    throw error;
  }
}

export async function verifyActionChallengeBySms(db: SupabaseClient, input: {
  assignment_id: string;
  phone_e164: string;
  code: string;
  provider_message_id: string;
}): Promise<VerifiedActionChallenge | null> {
  const result = await db.rpc("amtech_verify_action_challenge", {
    p_assignment_id: input.assignment_id,
    p_phone_e164: input.phone_e164,
    p_code_hash: actionVerificationCodeHash(input),
    p_provider_message_id: input.provider_message_id,
  });
  if (result.error) throw result.error;
  const row = firstRow<Record<string, unknown>>(result.data);
  if (!row?.challenge_id) return null;
  return {
    challenge_id: String(row.challenge_id),
    target_type: String(row.target_type),
    target_id: String(row.target_id),
    human_principal_id: String(row.human_principal_id),
    verification_requirement: String(row.verification_requirement) as VerifiedActionChallenge["verification_requirement"],
  };
}
