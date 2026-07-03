/**
 * Secret-reference helper. Connector tokens / provider secrets are stored BY
 * REFERENCE (10-security-ops-observability.md: "Store OAuth tokens and Stripe
 * secrets by secret reference"). DB columns hold a `*_secret_ref`, never the raw
 * value. There is intentionally NO function here that writes a raw token into a
 * domain table — that path must not exist.
 *
 * Phase 0 provides an AES-256-GCM envelope store keyed by SECRET_REF_MASTER_KEY.
 * Phase 3+ swaps the backend for a real KMS/secret manager behind the same API.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

function masterKey(): Buffer {
  const raw = process.env.SECRET_REF_MASTER_KEY;
  if (!raw || raw.length < 16) {
    throw new Error("SECRET_REF_MASTER_KEY missing or too short (>=16 chars).");
  }
  // Derive a stable 32-byte key from the configured secret.
  return createHash("sha256").update(raw).digest();
}

/** Opaque, storable reference to an encrypted secret. Safe to log. */
export interface SecretRef {
  v: 1;
  iv: string;
  tag: string;
  ct: string;
}

export function sealSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const ref: SecretRef = {
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ct: ct.toString("base64"),
  };
  return Buffer.from(JSON.stringify(ref)).toString("base64url");
}

export function openSecret(ref: string): string {
  const parsed = JSON.parse(Buffer.from(ref, "base64url").toString("utf8")) as SecretRef;
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(parsed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.ct, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Redact obvious secret-shaped values before logging. */
export function redact(value: string): string {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 3)}…${value.slice(-2)}`;
}
