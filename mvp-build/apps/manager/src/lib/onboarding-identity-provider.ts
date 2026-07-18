import { createHmac, timingSafeEqual } from "node:crypto";
import type { OnboardingBusinessAddress } from "@amtech/shared";

export type OnboardingProviderDecision = "pending" | "verified" | "rejected";

export interface MiddeskBusinessResult {
  business_id: string;
  request_id: string;
  provider_status: string;
  decision: OnboardingProviderDecision;
  raw: Record<string, unknown>;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_missing`);
  return value;
}

function apiBase(): string {
  return (process.env.MIDDESK_API_BASE_URL ?? "https://api.middesk.com/v1").replace(/\/$/, "");
}

function timeoutMs(): number {
  const configured = Number(process.env.MIDDESK_TIMEOUT_MS ?? 10_000);
  return Number.isFinite(configured) ? Math.max(1_000, Math.min(configured, 30_000)) : 10_000;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function lower(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

export function middeskBusinessDecision(business: Record<string, unknown>): {
  provider_status: string;
  decision: OnboardingProviderDecision;
} {
  const businessStatus = lower(business.status);
  const tin = asRecord(business.tin);
  const tinStatus = lower(tin.status);
  const positive = new Set(["approved", "verified", "matched", "match", "success", "passed"]);
  const negative = new Set(["rejected", "unverified", "mismatch", "mismatched", "invalid", "failed"]);
  if (negative.has(businessStatus) || negative.has(tinStatus)) {
    return { provider_status: tinStatus || businessStatus || "rejected", decision: "rejected" };
  }
  if (positive.has(businessStatus) || positive.has(tinStatus)) {
    return { provider_status: tinStatus || businessStatus || "verified", decision: "verified" };
  }
  return { provider_status: tinStatus || businessStatus || "pending", decision: "pending" };
}

async function middeskRequest(path: string, init: RequestInit): Promise<{ body: Record<string, unknown>; requestId: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${required("MIDDESK_API_KEY")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const text = await response.text();
    const body = text ? asRecord(JSON.parse(text)) : {};
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? "";
    if (!response.ok) {
      const code = lower(body.type) || lower(body.error) || `http_${response.status}`;
      throw new Error(`middesk_${code}`);
    }
    return { body, requestId };
  } catch (error) {
    if ((error as Error).name === "AbortError") throw new Error("middesk_timeout");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function createMiddeskBusiness(input: {
  business_name: string;
  tax_id: string;
  address: OnboardingBusinessAddress;
  idempotency_key: string;
}): Promise<MiddeskBusinessResult> {
  const response = await middeskRequest("/businesses", {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotency_key },
    body: JSON.stringify({
      name: input.business_name,
      tin: { tin: input.tax_id },
      addresses: [{
        address_line1: input.address.address_line1,
        ...(input.address.address_line2 ? { address_line2: input.address.address_line2 } : {}),
        city: input.address.city,
        state: input.address.state,
        postal_code: input.address.postal_code,
        country: input.address.country,
      }],
      orders: [{ product: "business_verification_verify" }],
    }),
  });
  const businessId = String(response.body.id ?? "");
  if (!businessId) throw new Error("middesk_business_id_missing");
  const decision = middeskBusinessDecision(response.body);
  return {
    business_id: businessId,
    request_id: response.requestId || businessId,
    provider_status: decision.provider_status,
    decision: decision.decision,
    raw: response.body,
  };
}

export async function getMiddeskBusiness(businessId: string): Promise<MiddeskBusinessResult> {
  const response = await middeskRequest(`/businesses/${encodeURIComponent(businessId)}`, { method: "GET" });
  const resolvedId = String(response.body.id ?? businessId);
  const decision = middeskBusinessDecision(response.body);
  return {
    business_id: resolvedId,
    request_id: response.requestId || resolvedId,
    provider_status: decision.provider_status,
    decision: decision.decision,
    raw: response.body,
  };
}

export function verifyMiddeskWebhookSignature(rawBody: string, signature: string | null | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", required("MIDDESK_WEBHOOK_SECRET")).update(rawBody).digest("hex");
  const supplied = signature.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}
