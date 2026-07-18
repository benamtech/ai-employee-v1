/**
 * Model Gateway contracts.
 *
 * Employee runtimes never receive provider master credentials. They receive only an
 * assignment-scoped gateway credential whose claims bind the request to one labor
 * assignment, one account, one employee, one credential version, and an allowed
 * model/provider policy. The Manager/host-private gateway owns provider selection,
 * retries, usage capture, cost attribution, circuit breaking, and redacted audit.
 */

export const MODEL_GATEWAY_TOKEN_PREFIX = "mgw_";

export interface ModelGatewayPolicy {
  /** Host-private OpenAI-compatible gateway base URL, for example http://host.docker.internal:8092/v1. */
  gateway_url: string;
  /** Stable model alias visible to the employee profile; provider model selection stays inside the gateway. */
  model_alias: string;
  allowed_providers: string[];
  allowed_models: string[];
  spend_limit_cents: number;
  rate_limit_per_minute: number;
  expires_at: string;
  credential_version: number;
}

export interface ModelGatewayTokenClaims extends ModelGatewayPolicy {
  token_type: "model_gateway";
  credential_id: string;
  assignment_id: string;
  account_id: string;
  employee_id: string;
  issued_at: string;
}

export interface ModelGatewayCredentialRecord extends ModelGatewayTokenClaims {
  token_hash: string;
  revoked_at?: string | null;
  rotated_from_credential_id?: string | null;
}

export interface ModelGatewayUsageRecord {
  request_id: string;
  credential_id: string;
  assignment_id: string;
  account_id: string;
  employee_id: string;
  model_alias: string;
  provider: string;
  upstream_model: string;
  credential_version: number;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_cents: number;
  status: "ok" | "failed" | "rate_limited" | "provider_unavailable" | "unauthorized";
  error_code?: string | null;
  correlation_id?: string | null;
}

export function modelGatewayPolicySummary(policy: ModelGatewayPolicy): Record<string, unknown> {
  return {
    gateway_url: policy.gateway_url,
    model_alias: policy.model_alias,
    allowed_providers: policy.allowed_providers,
    allowed_models: policy.allowed_models,
    spend_limit_cents: policy.spend_limit_cents,
    rate_limit_per_minute: policy.rate_limit_per_minute,
    expires_at: policy.expires_at,
    credential_version: policy.credential_version,
  };
}
