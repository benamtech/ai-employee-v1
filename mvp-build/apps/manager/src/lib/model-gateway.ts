import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  MODEL_GATEWAY_TOKEN_PREFIX,
  type ModelGatewayPolicy,
  type ModelGatewayTokenClaims,
  type ModelGatewayUsageRecord,
} from "@amtech/shared";
import { sealSecret } from "./secrets.js";

const rateBuckets = new Map<string, { window_start: number; count: number }>();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function base64urlJson(input: unknown): string {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function hmac(input: string): string {
  return createHmac("sha256", requiredEnv("MODEL_GATEWAY_SIGNING_SECRET")).update(input).digest("base64url");
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function gatewayUrl(): string {
  return (process.env.MODEL_GATEWAY_EMPLOYEE_BASE_URL ?? "http://host.docker.internal:8092/v1").replace(/\/$/, "");
}

function defaultAllowedProviders(): string[] {
  return (process.env.MODEL_GATEWAY_ALLOWED_PROVIDERS ?? process.env.MODEL_GATEWAY_PROVIDER ?? "openai_compatible")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function defaultAllowedModels(): string[] {
  return (process.env.MODEL_GATEWAY_ALLOWED_MODELS ?? process.env.MODEL_GATEWAY_MODEL_ALIAS ?? "amtech-primary")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function buildModelGatewayPolicy(overrides: Partial<ModelGatewayPolicy> = {}): ModelGatewayPolicy {
  const ttlMs = Number(process.env.MODEL_GATEWAY_CREDENTIAL_TTL_MS ?? 1000 * 60 * 60 * 24 * 30);
  return {
    gateway_url: overrides.gateway_url ?? gatewayUrl(),
    model_alias: overrides.model_alias ?? process.env.MODEL_GATEWAY_MODEL_ALIAS ?? "amtech-primary",
    allowed_providers: overrides.allowed_providers ?? defaultAllowedProviders(),
    allowed_models: overrides.allowed_models ?? defaultAllowedModels(),
    spend_limit_cents: overrides.spend_limit_cents ?? Number(process.env.MODEL_GATEWAY_DEFAULT_SPEND_LIMIT_CENTS ?? 40000),
    rate_limit_per_minute: overrides.rate_limit_per_minute ?? Number(process.env.MODEL_GATEWAY_DEFAULT_RATE_LIMIT_PER_MINUTE ?? 60),
    expires_at: overrides.expires_at ?? new Date(Date.now() + ttlMs).toISOString(),
    credential_version: overrides.credential_version ?? 1,
  };
}

export async function mintModelGatewayCredential(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  policy?: Partial<ModelGatewayPolicy>;
  rotated_from_credential_id?: string | null;
}): Promise<{ credential_id: string; token: string; token_hash: string; token_prefix: string; policy: ModelGatewayPolicy }> {
  const policy = buildModelGatewayPolicy(input.policy);
  const credential_id = `mgwc_${randomUUID()}`;
  const issued_at = new Date().toISOString();
  const claims: ModelGatewayTokenClaims = {
    token_type: "model_gateway",
    credential_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    issued_at,
    ...policy,
  };
  const payload = base64urlJson(claims);
  const token = `${MODEL_GATEWAY_TOKEN_PREFIX}${payload}.${hmac(payload)}`;
  const hash = tokenHash(token);

  const inserted = await db.from("model_gateway_credentials").insert({
    id: credential_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    credential_version: policy.credential_version,
    token_hash: hash,
    gateway_url: policy.gateway_url,
    model_alias: policy.model_alias,
    allowed_providers: policy.allowed_providers,
    allowed_models: policy.allowed_models,
    spend_limit_cents: policy.spend_limit_cents,
    rate_limit_per_minute: policy.rate_limit_per_minute,
    expires_at: policy.expires_at,
    token_secret_ref: sealSecret(token),
    rotated_from_credential_id: input.rotated_from_credential_id ?? null,
  });
  if (inserted.error) throw inserted.error;
  return { credential_id, token, token_hash: hash, token_prefix: token.slice(0, 14), policy };
}

export async function revokeModelGatewayCredential(db: SupabaseClient, credentialId: string): Promise<void> {
  const updated = await db
    .from("model_gateway_credentials")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", credentialId)
    .is("revoked_at", null);
  if (updated.error) throw updated.error;
}

export async function verifyModelGatewayCredential(db: SupabaseClient, authorization: string | null | undefined): Promise<ModelGatewayTokenClaims | null> {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!token.startsWith(MODEL_GATEWAY_TOKEN_PREFIX)) return null;
  const body = token.slice(MODEL_GATEWAY_TOKEN_PREFIX.length);
  const dot = body.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = body.slice(0, dot);
  const signature = body.slice(dot + 1);
  if (!safeEqual(hmac(payload), signature)) return null;

  let claims: ModelGatewayTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ModelGatewayTokenClaims;
  } catch {
    return null;
  }
  if (claims.token_type !== "model_gateway") return null;
  if (!claims.account_id || !claims.employee_id || !claims.credential_id) return null;
  if (Date.parse(claims.expires_at) <= Date.now()) return null;

  const row = await db
    .from("model_gateway_credentials")
    .select("id,account_id,employee_id,credential_version,token_hash,revoked_at,expires_at")
    .eq("id", claims.credential_id)
    .eq("account_id", claims.account_id)
    .eq("employee_id", claims.employee_id)
    .maybeSingle();
  if (row.error || !row.data) return null;
  if (row.data.revoked_at) return null;
  if (Number(row.data.credential_version) !== Number(claims.credential_version)) return null;
  if (Date.parse(String(row.data.expires_at)) <= Date.now()) return null;
  if (row.data.token_hash !== tokenHash(token)) return null;
  return claims;
}

export function enforceGatewayTokenPolicy(claims: ModelGatewayTokenClaims, requestedModel: string): { ok: true } | { ok: false; status: number; code: string } {
  if (!claims.allowed_models.includes(requestedModel) && requestedModel !== claims.model_alias) {
    return { ok: false, status: 403, code: "model_not_allowed" };
  }
  if (claims.spend_limit_cents <= 0) return { ok: false, status: 402, code: "spend_limit_exhausted" };
  const now = Date.now();
  const bucket = rateBuckets.get(claims.credential_id);
  if (!bucket || now - bucket.window_start >= 60_000) {
    rateBuckets.set(claims.credential_id, { window_start: now, count: 1 });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > claims.rate_limit_per_minute) return { ok: false, status: 429, code: "rate_limit_exceeded" };
  return { ok: true };
}

export function resolveUpstreamModel(claims: ModelGatewayTokenClaims, requestedModel: string): { provider: string; model: string } {
  const provider = process.env.MODEL_GATEWAY_PROVIDER ?? claims.allowed_providers[0] ?? "openai_compatible";
  if (!claims.allowed_providers.includes(provider)) throw new Error("provider_not_allowed");
  const model = process.env.MODEL_GATEWAY_UPSTREAM_MODEL ?? (requestedModel === claims.model_alias ? claims.allowed_models[0] : requestedModel);
  if (!model) throw new Error("upstream_model_missing");
  return { provider, model };
}

export async function recordModelGatewayUsage(db: SupabaseClient, usage: ModelGatewayUsageRecord): Promise<void> {
  const inserted = await db.from("model_gateway_request_audit").insert({
    id: usage.request_id,
    credential_id: usage.credential_id,
    account_id: usage.account_id,
    employee_id: usage.employee_id,
    model_alias: usage.model_alias,
    provider: usage.provider,
    upstream_model: usage.upstream_model,
    credential_version: usage.credential_version,
    latency_ms: usage.latency_ms,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    estimated_cost_cents: usage.estimated_cost_cents,
    status: usage.status,
    error_code: usage.error_code ?? null,
    correlation_id: usage.correlation_id ?? null,
  });
  if (inserted.error) {
    // Do not leak request bodies or token material. A failed audit write is still
    // visible in process logs; the gateway request itself should already be bounded.
    // eslint-disable-next-line no-console
    console.warn("[model-gateway] usage audit write failed", inserted.error.message);
  }
}
