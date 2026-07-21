import { createHash, randomUUID } from "node:crypto";
import { Hono } from "hono";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import {
  enforceGatewayTokenPolicy,
  resolveUpstreamModel,
  verifyModelGatewayCredential,
} from "./model-gateway.js";
import { resolveCommercialScope, type ResolvedCommercialScope } from "./commercial-attribution.js";
import { recordEffectBoundProviderUsage } from "./commercial-effect-attribution.js";
import {
  ProviderOutcomeAmbiguousError,
  createSupabaseGatewayCommercialStore,
  executeCommercialProviderRequest,
  gatewayRequestIdentity,
  type GatewayCommercialRecord,
  type GatewayCommercialStore,
} from "./model-gateway-commercial.js";
import {
  DurableEffectAmbiguousError,
  executeDurableCommandEffect,
  type DurableEffectExecution,
} from "./durable-command-runtime.js";

interface ProviderExecution {
  json: Record<string, unknown>;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_cents: number;
  provider_receipt_id: string;
}

export interface ModelGatewayHttpDependencies {
  db: () => SupabaseClient;
  fetch: typeof globalThis.fetch;
  commercialStore: <T>(db: SupabaseClient) => GatewayCommercialStore<T>;
  executeEffect: typeof executeDurableCommandEffect;
}

const FORBIDDEN_PROVIDER_AUTHORITY_FIELDS = new Set([
  "provider", "providerprofile", "modelprovider", "upstreammodel", "baseurl", "apikey",
  "endpoint", "url", "headers", "extraheaders", "extrabody", "authorization",
  "credential", "token", "routing",
]);
const REQUEST_REVISION = /^[A-Za-z0-9._:-]{1,160}$/;
const MAX_PROVIDER_OUTPUT_TOKENS = 128_000;

class GatewayRequestEnvelopeError extends Error {
  readonly code: string;
  readonly status: 400 | 503;

  constructor(code: string, status: 400 | 503) {
    super(code);
    this.name = "GatewayRequestEnvelopeError";
    this.code = code;
    this.status = status;
  }
}

function normalizedFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function forbiddenProviderAuthorityField(body: Record<string, unknown>): string | null {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_PROVIDER_AUTHORITY_FIELDS.has(normalizedFieldName(key))) return key;
  }
  return null;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function stableRevision(body: Record<string, unknown>, supplied: string | undefined): string {
  if (supplied !== undefined) {
    if (!REQUEST_REVISION.test(supplied)) {
      throw new GatewayRequestEnvelopeError("model_gateway_request_revision_invalid", 400);
    }
    return supplied;
  }
  return `reqrev_${createHash("sha256").update(JSON.stringify(canonicalize(body))).digest("hex").slice(0, 32)}`;
}

function rateWindowHint(credentialId: string, now = new Date()): string {
  // Compatibility-only hint. Migration 0077 derives the authoritative window
  // from the database statement timestamp and ignores caller selection.
  return `${credentialId}:${now.toISOString().slice(0, 16)}`;
}

function configuredNonnegativeNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new GatewayRequestEnvelopeError("model_gateway_pricing_configuration_invalid", 503);
  }
  return value;
}

function estimateCostCents(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): number {
  const perMillionInput = configuredNonnegativeNumber("MODEL_GATEWAY_INPUT_CENTS_PER_MILLION", 300);
  const perMillionOutput = configuredNonnegativeNumber("MODEL_GATEWAY_OUTPUT_CENTS_PER_MILLION", 1500);
  const input = Number(usage.prompt_tokens ?? 0);
  const output = Number(usage.completion_tokens ?? Math.max(0, Number(usage.total_tokens ?? 0) - input));
  if (!Number.isSafeInteger(input) || input < 0 || !Number.isSafeInteger(output) || output < 0) {
    throw new GatewayRequestEnvelopeError("model_gateway_usage_estimate_invalid", 503);
  }
  const result = Math.ceil(((input / 1_000_000) * perMillionInput) + ((output / 1_000_000) * perMillionOutput));
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new GatewayRequestEnvelopeError("model_gateway_pricing_configuration_invalid", 503);
  }
  return result;
}

function maximumOutputTokens(body: Record<string, unknown>): number {
  const hasMaxTokens = Object.prototype.hasOwnProperty.call(body, "max_tokens");
  const hasMaxOutputTokens = Object.prototype.hasOwnProperty.call(body, "max_output_tokens");
  const raw = hasMaxTokens ? body.max_tokens : hasMaxOutputTokens ? body.max_output_tokens : 1024;
  if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw < 1 || raw > MAX_PROVIDER_OUTPUT_TOKENS) {
    throw new GatewayRequestEnvelopeError("model_gateway_max_output_tokens_invalid", 400);
  }
  return raw;
}

function providerTimeoutMs(): number {
  const raw = process.env.MODEL_GATEWAY_PROVIDER_TIMEOUT_MS;
  const value = raw === undefined ? 30_000 : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1_000 || value > 120_000) {
    throw new GatewayRequestEnvelopeError("model_gateway_provider_timeout_invalid", 503);
  }
  return value;
}

function reserveCostCents(body: Record<string, unknown>): number {
  const serialized = JSON.stringify(body.messages ?? body.input ?? body);
  const estimatedPromptTokens = Math.max(1, Math.ceil(serialized.length / 4));
  const maximumOutput = maximumOutputTokens(body);
  return Math.max(1, estimateCostCents({ prompt_tokens: estimatedPromptTokens, completion_tokens: maximumOutput }));
}

export function validateGatewayRequestEnvelope(
  body: Record<string, unknown>,
  suppliedRevision?: string,
): { revision_id: string; reserve_amount_minor: number; provider_timeout_ms: number } {
  return {
    revision_id: stableRevision(body, suppliedRevision),
    reserve_amount_minor: reserveCostCents(body),
    provider_timeout_ms: providerTimeoutMs(),
  };
}

function providerUsageInteger(value: unknown, field: string): number {
  const parsed = value === undefined ? 0 : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 0) {
    throw new DurableEffectAmbiguousError("provider_usage_invalid_after_acceptance", { field });
  }
  return parsed;
}

function redactError(error: unknown): string {
  const message = String((error as Error)?.message ?? error);
  return message.replace(/[A-Za-z0-9_=-]{24,}/g, "[REDACTED]").slice(0, 180);
}

function providerReceiptId(response: Response, json: Record<string, unknown>): string | null {
  return response.headers.get("x-request-id")
    ?? response.headers.get("request-id")
    ?? response.headers.get("x-correlation-id")
    ?? (typeof json.id === "string" ? json.id : null);
}

async function commercialScopeForClaims(
  db: SupabaseClient,
  claims: {
    account_id: string;
    employee_id: string;
    assignment_id: string;
    payer_relationship_id: string;
    beneficiary_relationship_id: string;
    price_version_id: string;
  },
): Promise<ResolvedCommercialScope> {
  const scope = await resolveCommercialScope(db, {
    account_id: claims.account_id,
    employee_id: claims.employee_id,
    assignment_id: claims.assignment_id,
    policy_key: "provider-cost-observation",
  });
  if (
    scope.payer_relationship_id !== claims.payer_relationship_id
    || scope.beneficiary_relationship_id !== claims.beneficiary_relationship_id
    || scope.price_version_id !== claims.price_version_id
  ) throw new Error("model_gateway_commercial_scope_changed");
  return scope;
}

async function recordAudit(db: SupabaseClient, input: {
  id: string;
  credential_id: string;
  account_id: string;
  employee_id: string;
  assignment_id: string;
  payer_relationship_id: string;
  beneficiary_relationship_id: string;
  price_version_id: string;
  accounting_receipt_id?: string | null;
  provider_receipt_id?: string | null;
  model_alias: string;
  provider: string;
  upstream_model: string;
  credential_version: number;
  latency_ms: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_cents?: number;
  status: "ok" | "failed" | "rate_limited" | "provider_unavailable" | "unauthorized" | "ambiguous";
  error_code?: string | null;
  correlation_id: string;
}): Promise<void> {
  const result = await db.from("model_gateway_request_audit").upsert({
    id: input.id,
    credential_id: input.credential_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    accounting_receipt_id: input.accounting_receipt_id ?? null,
    provider_receipt_id: input.provider_receipt_id ?? null,
    model_alias: input.model_alias,
    provider: input.provider,
    upstream_model: input.upstream_model,
    credential_version: input.credential_version,
    latency_ms: input.latency_ms,
    prompt_tokens: input.prompt_tokens ?? 0,
    completion_tokens: input.completion_tokens ?? 0,
    total_tokens: input.total_tokens ?? 0,
    estimated_cost_cents: input.estimated_cost_cents ?? 0,
    status: input.status,
    error_code: input.error_code ?? null,
    correlation_id: input.correlation_id,
  }, { onConflict: "id" });
  if (result.error) throw result.error;
}

async function recordPreAdmissionDenial(db: SupabaseClient, input: {
  claims: {
    credential_id: string;
    account_id: string;
    employee_id: string;
    assignment_id: string;
    payer_relationship_id: string;
    beneficiary_relationship_id: string;
    price_version_id: string;
    model_alias: string;
    credential_version: number;
  };
  requested_model: string;
  code: string;
  correlation_id: string;
  started: number;
}): Promise<void> {
  await recordAudit(db, {
    id: `mgwa_${randomUUID()}`,
    ...input.claims,
    provider: "none",
    upstream_model: input.requested_model,
    latency_ms: Date.now() - input.started,
    status: input.code === "rate_limit_exceeded" ? "rate_limited" : "failed",
    error_code: input.code,
    correlation_id: input.correlation_id,
  });
}

async function executeProviderEffect(
  db: SupabaseClient,
  deps: ModelGatewayHttpDependencies,
  record: GatewayCommercialRecord<ProviderExecution>,
  input: {
    route: ReturnType<typeof resolveUpstreamModel>;
    upstreamPath: string;
    upstreamBody: Record<string, unknown>;
    correlationId: string;
    commercial: ResolvedCommercialScope;
    requestId: string;
    providerTimeoutMs: number;
  },
): Promise<{
  response: ProviderExecution;
  provider_receipt_id: string;
  effect_receipt_id: string;
  accounting_receipt_id: string;
  amount_minor: number;
  evidence: Record<string, unknown>;
}> {
  if (!record.command_id || !record.effect_key) throw new Error("gateway_durable_identity_missing");
  let execution: DurableEffectExecution<ProviderExecution>;
  try {
    execution = await deps.executeEffect<ProviderExecution>(db, {
      assignment_id: record.assignment_id,
      command_id: record.command_id,
      effect_key: record.effect_key,
      provider: input.route.provider,
      operation: `model_gateway${input.upstreamPath}`,
      capability_class: "native_idempotency",
      request: {
        request_key: record.request_key,
        revision_id: record.revision_id,
        route_key: input.route.profile_key,
        upstream_path: input.upstreamPath,
        body: input.upstreamBody,
      },
      provider_idempotency_key: record.provider_idempotency_key,
      apply: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), input.providerTimeoutMs);
        let response: Response;
        try {
          response = await deps.fetch(`${input.route.base_url}${input.upstreamPath}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${input.route.api_key}`,
              "Content-Type": "application/json",
              "Idempotency-Key": record.provider_idempotency_key,
              "X-Amtech-Request-Key": record.request_key,
              "X-Amtech-Assignment-Id": record.assignment_id,
              "X-Amtech-Correlation-Id": input.correlationId,
            },
            body: JSON.stringify(input.upstreamBody),
            signal: controller.signal,
          });
        } catch (error) {
          throw new DurableEffectAmbiguousError("provider_response_lost_after_dispatch", {
            request_key: record.request_key,
            provider_idempotency_key: record.provider_idempotency_key,
            error: redactError(error),
          });
        } finally {
          clearTimeout(timeout);
        }

        const text = await response.text();
        let json: Record<string, unknown> = {};
        try { json = text ? JSON.parse(text) as Record<string, unknown> : {}; } catch { json = {}; }
        if (!response.ok) throw new Error(`provider_http_${response.status}`);
        const providerId = providerReceiptId(response, json);
        if (!providerId) {
          throw new DurableEffectAmbiguousError("provider_success_without_receipt", {
            request_key: record.request_key,
            http_status: response.status,
          });
        }
        const usage = (json.usage ?? {}) as Record<string, unknown>;
        const promptTokens = providerUsageInteger(usage.prompt_tokens, "prompt_tokens");
        const completionTokens = providerUsageInteger(usage.completion_tokens, "completion_tokens");
        const totalTokens = usage.total_tokens === undefined
          ? promptTokens + completionTokens
          : providerUsageInteger(usage.total_tokens, "total_tokens");
        if (totalTokens < promptTokens + completionTokens) {
          throw new DurableEffectAmbiguousError("provider_usage_invalid_after_acceptance", {
            field: "total_tokens",
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
          });
        }
        let estimatedCostCents: number;
        try {
          estimatedCostCents = estimateCostCents({ prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens });
        } catch (error) {
          throw new DurableEffectAmbiguousError("provider_usage_pricing_invalid_after_acceptance", {
            error: redactError(error),
          });
        }
        return {
          provider_receipt_id: providerId,
          result: {
            json,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            estimated_cost_cents: estimatedCostCents,
            provider_receipt_id: providerId,
          },
          evidence: {
            request_key: record.request_key,
            revision_id: record.revision_id,
            upstream_model: input.route.model,
            provider_profile: input.route.profile_key,
            http_status: response.status,
          },
        };
      },
    });
  } catch (error) {
    if (error instanceof DurableEffectAmbiguousError) {
      throw new ProviderOutcomeAmbiguousError(error.ambiguity_code, {
        ...error.evidence,
        request_key: record.request_key,
      });
    }
    throw error;
  }

  try {
    const accounting = await recordEffectBoundProviderUsage(db, {
      ...input.commercial,
      request_id: input.requestId,
      effect_receipt_id: execution.receipt_id,
      provider: input.route.provider,
      provider_receipt_id: execution.result.provider_receipt_id,
      meter_kind: "model_request",
      quantity: execution.result.total_tokens,
      amount_minor: execution.result.estimated_cost_cents,
      correlation_id: input.correlationId,
      evidence: {
        request_key: record.request_key,
        revision_id: record.revision_id,
        upstream_model: input.route.model,
        provider_profile: input.route.profile_key,
      },
    });
    return {
      response: execution.result,
      provider_receipt_id: execution.result.provider_receipt_id,
      effect_receipt_id: execution.receipt_id,
      accounting_receipt_id: accounting.accounting_receipt_id,
      amount_minor: execution.result.estimated_cost_cents,
      evidence: { replayed_effect: execution.replayed },
    };
  } catch (error) {
    throw new ProviderOutcomeAmbiguousError("accepted_effect_accounting_pending", {
      request_key: record.request_key,
      effect_receipt_id: execution.receipt_id,
      error: redactError(error),
    });
  }
}

async function proxyOpenAiCompatible(c: any, upstreamPath: string, expectedEmployeeId: string, deps: ModelGatewayHttpDependencies) {
  const db = deps.db();
  const started = Date.now();
  const correlationId = c.req.header("X-Amtech-Correlation-Id") ?? `corr_${randomUUID()}`;
  const claims = await verifyModelGatewayCredential(db, c.req.header("Authorization"), { employee_id: expectedEmployeeId });
  if (!claims) {
    return c.json({ error: { code: "model_gateway_unauthorized", message: "Model gateway credential is invalid, expired, revoked, stale, or not bound to this employee assignment." } }, 401);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await c.req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("request_body_not_object");
    body = parsed as Record<string, unknown>;
  } catch {
    return c.json({ error: { code: "invalid_json", message: "Request body must be a JSON object." } }, 400);
  }

  const forbiddenField = forbiddenProviderAuthorityField(body);
  if (forbiddenField) {
    await recordPreAdmissionDenial(db, {
      claims,
      requested_model: String(body.model ?? claims.model_alias),
      code: "provider_authority_fields_forbidden",
      correlation_id: correlationId,
      started,
    });
    return c.json({ error: { code: "provider_authority_fields_forbidden", message: `Provider routing and credentials are Manager-owned; request field ${forbiddenField} is not accepted.` } }, 400);
  }

  const requestedModel = String(body.model ?? claims.model_alias);
  const policy = enforceGatewayTokenPolicy(claims, requestedModel);
  if (!policy.ok) {
    await recordPreAdmissionDenial(db, { claims, requested_model: requestedModel, code: policy.code, correlation_id: correlationId, started });
    return c.json({ error: { code: policy.code, message: "Model gateway policy denied this request." } }, policy.status as any);
  }

  let commercial: ResolvedCommercialScope;
  let route: ReturnType<typeof resolveUpstreamModel>;
  try {
    commercial = await commercialScopeForClaims(db, claims);
    route = resolveUpstreamModel(claims);
  } catch (error) {
    return c.json({ error: { code: "model_gateway_route_unavailable", message: redactError(error) } }, 503);
  }

  const { model: _requestedModel, stream: _requestedStream, ...requestPayload } = body;
  const upstreamBody = { ...requestPayload, model: route.model, stream: false };
  let envelope: ReturnType<typeof validateGatewayRequestEnvelope>;
  try {
    envelope = validateGatewayRequestEnvelope(upstreamBody, c.req.header("X-Amtech-Request-Revision"));
  } catch (error) {
    const failure = error instanceof GatewayRequestEnvelopeError
      ? error
      : new GatewayRequestEnvelopeError("model_gateway_request_envelope_invalid", 400);
    await recordPreAdmissionDenial(db, {
      claims,
      requested_model: requestedModel,
      code: failure.code,
      correlation_id: correlationId,
      started,
    });
    return c.json({ error: { code: failure.code, message: "Model gateway request bounds or pricing configuration are invalid." } }, failure.status);
  }

  const routeKey = `${route.provider}:${route.profile_key}:${route.model}:${upstreamPath}`;
  const windowHint = rateWindowHint(claims.credential_id);
  const identity = gatewayRequestIdentity({
    assignment_id: claims.assignment_id,
    credential_id: claims.credential_id,
    revision_id: envelope.revision_id,
    route_key: routeKey,
    request: upstreamBody,
    reserve_amount_minor: envelope.reserve_amount_minor,
    rate_window_key: windowHint,
    correlation_id: correlationId,
  });
  const store = deps.commercialStore<ProviderExecution>(db);
  const provider = (record: GatewayCommercialRecord<ProviderExecution>) => executeProviderEffect(db, deps, record, {
    route,
    upstreamPath,
    upstreamBody,
    correlationId,
    commercial,
    requestId: identity.request_key,
    providerTimeoutMs: envelope.provider_timeout_ms,
  });
  const result = await executeCommercialProviderRequest(store, {
    assignment_id: claims.assignment_id,
    credential_id: claims.credential_id,
    revision_id: envelope.revision_id,
    route_key: routeKey,
    request: upstreamBody,
    reserve_amount_minor: envelope.reserve_amount_minor,
    rate_window_key: windowHint,
    correlation_id: correlationId,
    provider,
    projectProof: async (accepted) => `commercial://assignments/${accepted.assignment_id}/model-requests/${accepted.request_key}`,
  });

  const terminal = result.record;
  const execution = terminal.response;
  const auditStatus = result.state === "accepted" ? "ok"
    : result.state === "ambiguous" ? "ambiguous"
      : result.error_code === "rate_limit_exceeded" ? "rate_limited"
        : result.state === "denied" ? "failed" : "provider_unavailable";
  await recordAudit(db, {
    id: terminal.request_key,
    credential_id: claims.credential_id,
    account_id: claims.account_id,
    employee_id: claims.employee_id,
    assignment_id: claims.assignment_id,
    payer_relationship_id: claims.payer_relationship_id,
    beneficiary_relationship_id: claims.beneficiary_relationship_id,
    price_version_id: claims.price_version_id,
    accounting_receipt_id: terminal.accounting_receipt_id,
    provider_receipt_id: terminal.provider_receipt_id,
    model_alias: claims.model_alias,
    provider: route.provider,
    upstream_model: route.model,
    credential_version: claims.credential_version,
    latency_ms: Date.now() - started,
    prompt_tokens: execution?.prompt_tokens,
    completion_tokens: execution?.completion_tokens,
    total_tokens: execution?.total_tokens,
    estimated_cost_cents: execution?.estimated_cost_cents,
    status: auditStatus,
    error_code: result.error_code ?? result.ambiguity_code,
    correlation_id: correlationId,
  });

  if (result.state === "denied") {
    const status = result.error_code === "rate_limit_exceeded" ? 429 : result.error_code === "budget_reservation_conflict" ? 402 : 409;
    return c.json({ error: { code: result.error_code ?? "model_gateway_admission_denied", message: "Shared commercial authority denied this request before provider dispatch." } }, status);
  }
  if (result.state === "ambiguous") {
    return c.json({
      error: {
        code: "model_gateway_provider_outcome_ambiguous",
        message: "Provider acceptance may have occurred. The request is durable and must reconcile before another effect attempt.",
      },
      amtech_gateway: { request_id: terminal.request_key, ambiguity_code: terminal.ambiguity_code, assignment_id: terminal.assignment_id },
    }, 502);
  }
  if (result.state !== "accepted" || !execution) {
    return c.json({ error: { code: result.error_code ?? "model_gateway_provider_unavailable", message: "The provider effect failed before an accepted durable receipt was established." } }, 503);
  }

  return c.json({
    ...execution.json,
    model: claims.model_alias,
    amtech_gateway: {
      request_id: terminal.request_key,
      request_revision_id: terminal.revision_id,
      provider_receipt_id: terminal.provider_receipt_id,
      effect_receipt_id: terminal.effect_receipt_id,
      accounting_receipt_id: terminal.accounting_receipt_id,
      proof_ref: terminal.proof_ref,
      assignment_id: claims.assignment_id,
      credential_version: claims.credential_version,
      idempotent_replay: result.replayed,
    },
  });
}

export function buildModelGatewayApp(overrides: Partial<ModelGatewayHttpDependencies> = {}): Hono {
  const deps: ModelGatewayHttpDependencies = {
    db: overrides.db ?? serviceClient,
    fetch: overrides.fetch ?? globalThis.fetch,
    commercialStore: overrides.commercialStore ?? createSupabaseGatewayCommercialStore,
    executeEffect: overrides.executeEffect ?? executeDurableCommandEffect,
  };
  const app = new Hono();
  app.get("/health", (c) => c.json({ status: "ok", boundary: "host-private-model-gateway" }));
  app.post("/v1/employees/:employeeId/chat/completions", (c) => proxyOpenAiCompatible(c, "/chat/completions", c.req.param("employeeId"), deps));
  app.post("/v1/employees/:employeeId/responses", (c) => proxyOpenAiCompatible(c, "/responses", c.req.param("employeeId"), deps));
  app.post("/v1/chat/completions", (c) => {
    if (process.env.NODE_ENV === "production" || process.env.MODEL_GATEWAY_ALLOW_LEGACY_UNBOUND_ROUTE !== "1") return c.json({ error: { code: "employee_route_required" } }, 404);
    const employeeId = c.req.header("X-Amtech-Employee-Id");
    if (!employeeId) return c.json({ error: { code: "employee_route_required" } }, 400);
    return proxyOpenAiCompatible(c, "/chat/completions", employeeId, deps);
  });
  app.post("/v1/responses", (c) => {
    if (process.env.NODE_ENV === "production" || process.env.MODEL_GATEWAY_ALLOW_LEGACY_UNBOUND_ROUTE !== "1") return c.json({ error: { code: "employee_route_required" } }, 404);
    const employeeId = c.req.header("X-Amtech-Employee-Id");
    if (!employeeId) return c.json({ error: { code: "employee_route_required" } }, 400);
    return proxyOpenAiCompatible(c, "/responses", employeeId, deps);
  });
  return app;
}
