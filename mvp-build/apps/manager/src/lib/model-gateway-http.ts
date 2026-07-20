import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import {
  enforceGatewayTokenPolicy,
  recordModelGatewayUsage,
  resolveUpstreamModel,
  verifyModelGatewayCredential,
} from "./model-gateway.js";
import {
  recordProviderUsageReceipt,
  resolveCommercialScope,
  type ResolvedCommercialScope,
} from "./commercial-attribution.js";

export interface ModelGatewayHttpDependencies {
  db: () => SupabaseClient;
  fetch: typeof globalThis.fetch;
}

const FORBIDDEN_PROVIDER_AUTHORITY_FIELDS = new Set([
  "provider",
  "providerprofile",
  "modelprovider",
  "upstreammodel",
  "baseurl",
  "apikey",
  "endpoint",
  "url",
  "headers",
  "extraheaders",
  "extrabody",
  "authorization",
  "credential",
  "token",
  "routing",
]);

function normalizedFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function forbiddenProviderAuthorityField(body: Record<string, unknown>): string | null {
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_PROVIDER_AUTHORITY_FIELDS.has(normalizedFieldName(key))) return key;
  }
  return null;
}

function estimateCostCents(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): number {
  const perMillionInput = Number(process.env.MODEL_GATEWAY_INPUT_CENTS_PER_MILLION ?? 300);
  const perMillionOutput = Number(process.env.MODEL_GATEWAY_OUTPUT_CENTS_PER_MILLION ?? 1500);
  const input = Number(usage.prompt_tokens ?? 0);
  const output = Number(usage.completion_tokens ?? Math.max(0, Number(usage.total_tokens ?? 0) - input));
  return Math.ceil(((input / 1_000_000) * perMillionInput) + ((output / 1_000_000) * perMillionOutput));
}

function redactError(err: unknown): string {
  const message = String((err as Error).message ?? err);
  return message.replace(/[A-Za-z0-9_=-]{24,}/g, "[REDACTED]").slice(0, 180);
}

function providerReceiptId(response: Response, json: Record<string, any>): string | null {
  const header = response.headers.get("x-request-id")
    ?? response.headers.get("request-id")
    ?? response.headers.get("x-correlation-id");
  const bodyId = typeof json.id === "string" ? json.id : null;
  return header || bodyId;
}

function usageScope(claims: {
  assignment_id: string;
  payer_relationship_id: string;
  beneficiary_relationship_id: string;
  price_version_id: string;
}) {
  return {
    assignment_id: claims.assignment_id,
    payer_relationship_id: claims.payer_relationship_id,
    beneficiary_relationship_id: claims.beneficiary_relationship_id,
    price_version_id: claims.price_version_id,
  };
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
  ) {
    throw new Error("model_gateway_commercial_scope_changed");
  }
  return scope;
}

async function recordDeniedRequest(db: SupabaseClient, input: {
  request_id: string;
  correlation_id: string;
  started: number;
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
  code: string;
  requested_model: string;
}): Promise<void> {
  await recordModelGatewayUsage(db, {
    request_id: input.request_id,
    credential_id: input.claims.credential_id,
    account_id: input.claims.account_id,
    employee_id: input.claims.employee_id,
    ...usageScope(input.claims),
    model_alias: input.claims.model_alias,
    provider: "none",
    upstream_model: input.requested_model,
    credential_version: input.claims.credential_version,
    latency_ms: Date.now() - input.started,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost_cents: 0,
    status: input.code === "rate_limit_exceeded" ? "rate_limited" : "failed",
    error_code: input.code,
    correlation_id: input.correlation_id,
    provider_receipt_id: null,
    accounting_receipt_id: null,
  });
}

async function proxyOpenAiCompatible(
  c: any,
  upstreamPath: string,
  expectedEmployeeId: string,
  deps: ModelGatewayHttpDependencies,
) {
  const db = deps.db();
  const started = Date.now();
  const requestId = `mgwr_${randomUUID()}`;
  const correlationId = c.req.header("X-Amtech-Correlation-Id") ?? requestId;
  const claims = await verifyModelGatewayCredential(db, c.req.header("Authorization"), {
    employee_id: expectedEmployeeId,
  });
  if (!claims) {
    return c.json({
      error: {
        code: "model_gateway_unauthorized",
        message: "Model gateway credential is invalid, expired, revoked, stale, or not bound to this employee assignment.",
      },
    }, 401);
  }

  let commercial: ResolvedCommercialScope;
  try {
    commercial = await commercialScopeForClaims(db, claims);
  } catch (err) {
    return c.json({
      error: {
        code: "model_gateway_commercial_scope_unavailable",
        message: redactError(err),
      },
    }, 503);
  }

  let body: Record<string, any>;
  try {
    const parsed = await c.req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("request_body_not_object");
    body = parsed as Record<string, any>;
  } catch {
    return c.json({ error: { code: "invalid_json", message: "Request body must be a JSON object." } }, 400);
  }

  const forbiddenField = forbiddenProviderAuthorityField(body);
  if (forbiddenField) {
    await recordDeniedRequest(db, {
      request_id: requestId,
      correlation_id: correlationId,
      started,
      claims,
      code: "provider_authority_fields_forbidden",
      requested_model: String(body.model ?? claims.model_alias),
    });
    return c.json({
      error: {
        code: "provider_authority_fields_forbidden",
        message: `Provider routing and credentials are Manager-owned; request field ${forbiddenField} is not accepted.`,
      },
    }, 400);
  }

  const requestedModel = String(body.model ?? claims.model_alias);
  const policy = enforceGatewayTokenPolicy(claims, requestedModel);
  if (!policy.ok) {
    await recordDeniedRequest(db, {
      request_id: requestId,
      correlation_id: correlationId,
      started,
      claims,
      code: policy.code,
      requested_model: requestedModel,
    });
    return c.json({ error: { code: policy.code, message: "Model gateway policy denied this request." } }, policy.status as any);
  }

  let route: ReturnType<typeof resolveUpstreamModel>;
  try {
    route = resolveUpstreamModel(claims);
  } catch (err) {
    return c.json({ error: { code: "model_gateway_route_unavailable", message: redactError(err) } }, 503);
  }

  const { model: _requestedModel, stream: _requestedStream, ...requestPayload } = body;
  const upstreamBody = { ...requestPayload, model: route.model, stream: false };
  const maxRetries = Math.max(0, Math.min(Number(process.env.MODEL_GATEWAY_MAX_RETRIES ?? 2), 4));
  const timeoutMs = Math.max(1_000, Math.min(Number(process.env.MODEL_GATEWAY_PROVIDER_TIMEOUT_MS ?? 30_000), 120_000));
  let lastError = "provider_unavailable";

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await deps.fetch(`${route.base_url}${upstreamPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${route.api_key}`,
          "Content-Type": "application/json",
          "X-Amtech-Assignment-Id": claims.assignment_id,
          "X-Amtech-Correlation-Id": correlationId,
        },
        body: JSON.stringify(upstreamBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await response.text();
      let json: Record<string, any> = {};
      try {
        json = text ? JSON.parse(text) as Record<string, any> : {};
      } catch {
        json = {};
      }
      const usage = (json.usage ?? {}) as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      const promptTokens = Number(usage.prompt_tokens ?? 0);
      const completionTokens = Number(usage.completion_tokens ?? 0);
      const totalTokens = Number(usage.total_tokens ?? promptTokens + completionTokens);
      const costCents = estimateCostCents(usage);
      const providerId = providerReceiptId(response, json);

      if (response.ok && !providerId) {
        const receipt = await recordProviderUsageReceipt(db, {
          ...commercial,
          request_id: requestId,
          provider: route.provider,
          provider_receipt_id: null,
          state: "ambiguous",
          meter_kind: "model_request",
          quantity: totalTokens,
          amount_minor: costCents,
          currency: commercial.currency,
          correlation_id: correlationId,
          evidence: { upstream_model: route.model, provider_profile: route.profile_key, reason: "provider_success_without_receipt" },
        });
        await recordModelGatewayUsage(db, {
          request_id: requestId,
          credential_id: claims.credential_id,
          account_id: claims.account_id,
          employee_id: claims.employee_id,
          ...usageScope(claims),
          model_alias: claims.model_alias,
          provider: route.provider,
          upstream_model: route.model,
          credential_version: claims.credential_version,
          latency_ms: Date.now() - started,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          estimated_cost_cents: costCents,
          status: "ambiguous",
          error_code: "provider_receipt_missing",
          correlation_id: correlationId,
          provider_receipt_id: null,
          accounting_receipt_id: receipt.accounting_receipt_id,
        });
        return c.json({
          error: {
            code: "model_gateway_provider_receipt_ambiguous",
            message: "The provider returned content without a durable receipt. The result was not reported as successful.",
          },
        }, 502);
      }

      const receipt = await recordProviderUsageReceipt(db, {
        ...commercial,
        request_id: requestId,
        provider: route.provider,
        provider_receipt_id: providerId,
        state: response.ok ? "accepted" : "failed",
        meter_kind: "model_request",
        quantity: totalTokens,
        amount_minor: costCents,
        currency: commercial.currency,
        correlation_id: correlationId,
        evidence: { upstream_model: route.model, provider_profile: route.profile_key, http_status: response.status },
      });
      await recordModelGatewayUsage(db, {
        request_id: requestId,
        credential_id: claims.credential_id,
        account_id: claims.account_id,
        employee_id: claims.employee_id,
        ...usageScope(claims),
        model_alias: claims.model_alias,
        provider: route.provider,
        upstream_model: route.model,
        credential_version: claims.credential_version,
        latency_ms: Date.now() - started,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost_cents: costCents,
        status: response.ok ? "ok" : "failed",
        error_code: response.ok ? null : `provider_${response.status}`,
        correlation_id: correlationId,
        provider_receipt_id: providerId,
        accounting_receipt_id: receipt.accounting_receipt_id,
      });
      if (!response.ok) {
        return c.json({ error: { code: "provider_error", message: "The model provider returned a bounded failure through the gateway." } }, 502);
      }
      return c.json({
        ...json,
        model: claims.model_alias,
        amtech_gateway: {
          request_id: requestId,
          provider_receipt_id: providerId,
          accounting_receipt_id: receipt.accounting_receipt_id,
          assignment_id: claims.assignment_id,
          credential_version: claims.credential_version,
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      lastError = redactError(err);
      if (attempt >= maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  const failedReceipt = await recordProviderUsageReceipt(db, {
    ...commercial,
    request_id: requestId,
    provider: route.provider,
    provider_receipt_id: null,
    state: "failed",
    meter_kind: "model_request",
    quantity: 0,
    amount_minor: 0,
    currency: commercial.currency,
    correlation_id: correlationId,
    evidence: { upstream_model: route.model, provider_profile: route.profile_key, error: lastError },
  });
  await recordModelGatewayUsage(db, {
    request_id: requestId,
    credential_id: claims.credential_id,
    account_id: claims.account_id,
    employee_id: claims.employee_id,
    ...usageScope(claims),
    model_alias: claims.model_alias,
    provider: route.provider,
    upstream_model: route.model,
    credential_version: claims.credential_version,
    latency_ms: Date.now() - started,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost_cents: 0,
    status: "provider_unavailable",
    error_code: lastError,
    correlation_id: correlationId,
    provider_receipt_id: null,
    accounting_receipt_id: failedReceipt.accounting_receipt_id,
  });
  return c.json({
    error: {
      code: "model_gateway_provider_unavailable",
      message: "The model gateway could not reach the provider after bounded retries. The employee should surface this as a temporary provider outage, not hang.",
    },
  }, 503);
}

export function buildModelGatewayApp(overrides: Partial<ModelGatewayHttpDependencies> = {}): Hono {
  const deps: ModelGatewayHttpDependencies = {
    db: overrides.db ?? serviceClient,
    fetch: overrides.fetch ?? globalThis.fetch,
  };
  const app = new Hono();
  app.get("/health", (c) => c.json({ status: "ok", boundary: "host-private-model-gateway" }));
  app.post("/v1/employees/:employeeId/chat/completions", (c) => proxyOpenAiCompatible(c, "/chat/completions", c.req.param("employeeId"), deps));
  app.post("/v1/employees/:employeeId/responses", (c) => proxyOpenAiCompatible(c, "/responses", c.req.param("employeeId"), deps));

  app.post("/v1/chat/completions", (c) => {
    if (process.env.NODE_ENV === "production" || process.env.MODEL_GATEWAY_ALLOW_LEGACY_UNBOUND_ROUTE !== "1") {
      return c.json({ error: { code: "employee_route_required" } }, 404);
    }
    const employeeId = c.req.header("X-Amtech-Employee-Id");
    if (!employeeId) return c.json({ error: { code: "employee_route_required" } }, 400);
    return proxyOpenAiCompatible(c, "/chat/completions", employeeId, deps);
  });
  app.post("/v1/responses", (c) => {
    if (process.env.NODE_ENV === "production" || process.env.MODEL_GATEWAY_ALLOW_LEGACY_UNBOUND_ROUTE !== "1") {
      return c.json({ error: { code: "employee_route_required" } }, 404);
    }
    const employeeId = c.req.header("X-Amtech-Employee-Id");
    if (!employeeId) return c.json({ error: { code: "employee_route_required" } }, 400);
    return proxyOpenAiCompatible(c, "/responses", employeeId, deps);
  });
  return app;
}
