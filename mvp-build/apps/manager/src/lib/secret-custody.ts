import { createHash } from "node:crypto";

export const SECRET_SCOPES = ["manager", "model-gateway", "host-provisioner", "connector", "channel", "deployment"] as const;
export type SecretScope = (typeof SECRET_SCOPES)[number];

export interface ManagedSecretDescriptor {
  secret_id: string;
  scope: SecretScope;
  service: string;
  owner: string;
  purpose: string;
  audience: string;
  version: number;
  issued_at: string;
  expires_at?: string | null;
  rotation_due_at: string;
  revoked_at?: string | null;
  replacement_secret_id?: string | null;
  rollback_secret_id?: string | null;
}

const ID = /^[A-Za-z0-9:_-]{8,220}$/;

function iso(value: string, field: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`secret_${field}_invalid`);
  return parsed;
}

export function validateSecretDescriptor(input: ManagedSecretDescriptor, _now = Date.now()): ManagedSecretDescriptor {
  if (!ID.test(input.secret_id)) throw new Error("secret_id_invalid");
  if (!SECRET_SCOPES.includes(input.scope)) throw new Error("secret_scope_invalid");
  for (const [field, value] of Object.entries({ service: input.service, owner: input.owner, purpose: input.purpose, audience: input.audience })) {
    if (typeof value !== "string" || value.trim().length < 2 || value.length > 240) throw new Error(`secret_${field}_invalid`);
  }
  if (!Number.isInteger(input.version) || input.version < 1) throw new Error("secret_version_invalid");
  const issued = iso(input.issued_at, "issued_at");
  const rotation = iso(input.rotation_due_at, "rotation_due_at");
  if (rotation <= issued) throw new Error("secret_rotation_window_invalid");
  if (input.expires_at && iso(input.expires_at, "expires_at") <= issued) throw new Error("secret_expiry_invalid");
  if (input.revoked_at && iso(input.revoked_at, "revoked_at") < issued) throw new Error("secret_revocation_before_issue");
  if (input.replacement_secret_id && !ID.test(input.replacement_secret_id)) throw new Error("secret_replacement_id_invalid");
  if (input.rollback_secret_id && !ID.test(input.rollback_secret_id)) throw new Error("secret_rollback_id_invalid");
  if (input.replacement_secret_id === input.secret_id) throw new Error("secret_replacement_self_reference");
  if (input.rollback_secret_id === input.secret_id) throw new Error("secret_rollback_self_reference");
  return Object.freeze({ ...input });
}

export function secretDescriptorFingerprint(input: ManagedSecretDescriptor): string {
  const descriptor = validateSecretDescriptor(input);
  const canonical = JSON.stringify(Object.fromEntries(Object.entries(descriptor).sort(([a], [b]) => a.localeCompare(b))));
  return createHash("sha256").update(canonical).digest("hex");
}

export function assertSecretUsable(input: ManagedSecretDescriptor, expected: { audience: string; minimum_version?: number }, now = Date.now()): void {
  const descriptor = validateSecretDescriptor(input, now);
  if (descriptor.audience !== expected.audience) throw new Error("secret_audience_mismatch");
  if (descriptor.version < (expected.minimum_version ?? 1)) throw new Error("secret_version_stale");
  if (Date.parse(descriptor.issued_at) > now) throw new Error("secret_not_yet_issued");
  if (descriptor.revoked_at && Date.parse(descriptor.revoked_at) <= now) throw new Error("secret_revoked");
  if (descriptor.expires_at && Date.parse(descriptor.expires_at) <= now) throw new Error("secret_expired");
}

export function assertRotationContinuity(oldSecret: ManagedSecretDescriptor, replacement: ManagedSecretDescriptor): void {
  const oldDescriptor = validateSecretDescriptor(oldSecret);
  const nextDescriptor = validateSecretDescriptor(replacement);
  if (oldDescriptor.scope !== nextDescriptor.scope || oldDescriptor.service !== nextDescriptor.service || oldDescriptor.audience !== nextDescriptor.audience) {
    throw new Error("secret_rotation_binding_mismatch");
  }
  if (nextDescriptor.version !== oldDescriptor.version + 1) throw new Error("secret_rotation_version_gap");
  if (oldDescriptor.replacement_secret_id !== nextDescriptor.secret_id) throw new Error("secret_rotation_replacement_unbound");
  if (nextDescriptor.rollback_secret_id !== oldDescriptor.secret_id) throw new Error("secret_rotation_rollback_unbound");
  if (!oldDescriptor.revoked_at) throw new Error("secret_rotation_old_secret_not_revoked");

  const cutover = Date.parse(oldDescriptor.revoked_at);
  if (oldDescriptor.expires_at && Date.parse(oldDescriptor.expires_at) < cutover) throw new Error("secret_rotation_old_secret_expiry_gap");
  if (Date.parse(nextDescriptor.issued_at) > cutover) throw new Error("secret_rotation_cutover_gap");
  if (nextDescriptor.expires_at && Date.parse(nextDescriptor.expires_at) <= cutover) throw new Error("secret_rotation_replacement_expired_at_cutover");
  if (nextDescriptor.revoked_at && Date.parse(nextDescriptor.revoked_at) <= cutover) throw new Error("secret_rotation_replacement_revoked_at_cutover");

  assertSecretUsable(nextDescriptor, { audience: oldDescriptor.audience, minimum_version: oldDescriptor.version + 1 }, cutover);
  try {
    assertSecretUsable(oldDescriptor, { audience: oldDescriptor.audience }, cutover);
  } catch (error) {
    if (String((error as Error).message) === "secret_revoked") return;
    throw error;
  }
  throw new Error("secret_rotation_old_secret_still_usable");
}

export function redactSecretValue(value: string): { redacted: true; sha256: string; length: number } {
  return { redacted: true, sha256: createHash("sha256").update(value).digest("hex"), length: value.length };
}
