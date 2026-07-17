import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serviceClient } from "@amtech/db";
import {
  enforceGatewayTokenPolicy,
  recordModelGatewayUsage,
  resolveUpstreamModel,
  verifyModelGatewayCredential,
} from "./lib/model-gateway.js";

function upstreamBaseUrl(): string {
  const value = process.env.MODEL_GATEWAY_UPSTREAM_BASE_URL;
  if (!value) throw new Error("MODEL_GATEWAY_UPSTREAM_BASE_URL missing.");
  return value.replace(/\/$/, "");
}

function upstreamApiKey(): string {
  const value = process.env.MODEL_GATEWAY_PROVIDER_API_KEY;
  if (!value) throw new Error("MODEL_GATEWAY_PROVIDER_API_KEY missing.");
  return value;
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

async function proxyOpenAiCompatible(c: any, upstreamPath: string, expectedEmployeeId: string) {
  const db = serviceClient();
  const started = Date.now();
  const requestId = `mgwr_${randomUUID()}`;
  const correlationId = c.req.header("X-Amtech-Correlation-Id") ?? requestId;
  const claims = await verifyModelGatewayCredential(db, c.req.header("Authorization"), {
    employee_id: expectedEmployeeId,
  });
  if (!claims) {
    return c.json({ error: { code: "model_gateway_unauthorized", message: "Model gateway credential is invalid, expired, revoked, or not bound to this employee route." } }, 401);
  }

  let body: Record<string, any>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: "invalid_json", message: "Request body must be JSON." } }, 400);
  }
  const requestedModel = String(body.model ?? claims.model_alias);
  const policy = enforceGatewayTokenPolicy(claims, requestedModel);
  if (!policy.ok) {
    await recordModelGatewayUsage(db, {
      request_id: requestId,
      credential_id: claims.credential_id,
      account_id: claims.account_id,
      employee_id: claims.employee_id,
      model_alias: claims.model_alias,
      provider: "none",
      upstream_model: requestedModel,
      credential_version: claims.credential_version,
      latency_ms: Date.now() - started,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_cents: 0,
      status: policy.code === "rate_limit_exceeded" ? "rate_limited" : "failed",
      error_code: policy.code,
      correlation_id: correlationId,
    });
    return c.json({ error: { code: policy.code, message: "Model gateway policy denied this request." } }, policy.status as any);
  }

  let route: { provider: string; model: string };
  try {
    route = resolveUpstreamModel(claims, requestedModel);
  } catch (err) {
    return c.json({ error: { code: "model_gateway_route_unavailable", message: redactError(err) } }, 503);
  }

  const upstreamBody = { ...body, model: route.model, stream: false };
  const maxRetries = Math.max(0, Math.min(Number(process.env.MODEL_GATEWAY_MAX_RETRIES ?? 2), 4));
  const timeoutMs = Math.max(1000, Math.min(Number(process.env.MODEL_GATEWAY_PROVIDER_TIMEOUT_MS ?? 30_000), 120_000));
  let lastError = "provider_unavailable";

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${upstreamBaseUrl()}${upstreamPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstreamApiKey()}`,
          "Content-Type": "application/json",
          "X-Amtech-Account-Id": claims.account_id,
          "X-Amtech-Employee-Id": claims.employee_id,
          "X-Amtech-Correlation-Id": correlationId,
        },
        body: JSON.stringify(upstreamBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await res.text();
      let json: Record<string, any> = {};
      try {
        json = text ? JSON.parse(text) as Record<string, any> : {};
      } catch {
        json = {};
      }
      const usage = (json.usage ?? {}) as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      await recordModelGatewayUsage(db, {
        request_id: requestId,
        credential_id: claims.credential_id,
        account_id: claims.account_id,
        employee_id: claims.employee_id,
        model_alias: claims.model_alias,
        provider: route.provider,
        upstream_model: route.model,
        credential_version: claims.credential_version,
        latency_ms: Date.now() - started,
        prompt_tokens: Number(usage.prompt_tokens ?? 0),
        completion_tokens: Number(usage.completion_tokens ?? 0),
        total_tokens: Number(usage.total_tokens ?? 0),
        estimated_cost_cents: estimateCostCents(usage),
        status: res.ok ? "ok" : "failed",
        error_code: res.ok ? null : `provider_${res.status}`,
        correlation_id: correlationId,
      });
      if (!res.ok) return c.json({ error: { code: "provider_error", message: "The model provider returned a bounded failure through the gateway." } }, 502);
      return c.json({ ...json, model: claims.model_alias, amtech_gateway: { request_id: requestId, credential_version: claims.credential_version } });
    } catch (err) {
      clearTimeout(timeout);
      lastError = redactError(err);
      if (attempt >= maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  await recordModelGatewayUsage(db, {
    request_id: requestId,
    credential_id: claims.credential_id,
    account_id: claims.account_id,
    employee_id: claims.employee_id,
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
  });
  return c.json({ error: { code: "model_gateway_provider_unavailable", message: "The model gateway could not reach the provider after bounded retries. The employee should surface this as a temporary provider outage, not hang." } }, 503);
}

export function buildModelGatewayApp(): Hono {
  const app = new Hono();
  app.get("/health", (c) => c.json({ status: "ok", boundary: "host-private-model-gateway" }));
  app.post("/v1/employees/:employeeId/chat/completions", (c) => proxyOpenAiCompatible(c, "/chat/completions", c.req.param("employeeId")));
  app.post("/v1/employees/:employeeId/responses", (c) => proxyOpenAiCompatible(c, "/responses", c.req.param("employeeId")));

  // The unbound route is only a local migration escape hatch. Production must
  // always use the employee-bound URL rendered into the profile.
  app.post("/v1/chat/completions", (c) => {
    if (process.env.NODE_ENV === "production" || process.env.MODEL_GATEWAY_ALLOW_LEGACY_UNBOUND_ROUTE !== "1") {
      return c.json({ error: { code: "employee_route_required" } }, 404);
    }
    const employeeId = c.req.header("X-Amtech-Employee-Id");
    if (!employeeId) return c.json({ error: { code: "employee_route_required" } }, 400);
    return proxyOpenAiCompatible(c, "/chat/completions", employeeId);
  });
  app.post("/v1/responses", (c) => {
    if (process.env.NODE_ENV === "production" || process.env.MODEL_GATEWAY_ALLOW_LEGACY_UNBOUND_ROUTE !== "1") {
      return c.json({ error: { code: "employee_route_required" } }, 404);
    }
    const employeeId = c.req.header("X-Amtech-Employee-Id");
    if (!employeeId) return c.json({ error: { code: "employee_route_required" } }, 400);
    return proxyOpenAiCompatible(c, "/responses", employeeId);
  });
  return app;
}

export function startModelGateway(): void {
  const app = buildModelGatewayApp();
  const port = Number(process.env.MODEL_GATEWAY_PORT ?? 8092);
  const hostname = process.env.MODEL_GATEWAY_HOST ?? "0.0.0.0";
  serve({ fetch: app.fetch, port, hostname });
  // eslint-disable-next-line no-console
  console.log(`[model-gateway] listening on ${hostname}:${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) startModelGateway();
