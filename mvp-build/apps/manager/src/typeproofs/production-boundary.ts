import type { Hono } from "hono";
import type { SupabaseClient } from "@amtech/db";
import {
  MODEL_GATEWAY_TOKEN_PREFIX,
  type ModelGatewayPolicy,
  type ModelGatewayTokenClaims,
  type ProfileBuildParams,
  type ProvisionerOperation,
  type ProvisionerRequest,
  type ProvisionerResult,
} from "@amtech/shared";
import { buildModelGatewayApp } from "../model-gateway-server.js";
import { runProvisioningReconcilerCycle } from "../lib/provisioning-reconciler.js";
import { runAmbientInboxCycle } from "../lib/ambient-inbox.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

type _GatewayEntrypointIsHono = Expect<Equal<ReturnType<typeof buildModelGatewayApp>, Hono>>;
type _ReconcilerCycleAcceptsDb = Expect<Equal<Parameters<typeof runProvisioningReconcilerCycle>[0], SupabaseClient | undefined>>;
type _AmbientCycleAcceptsDb = Expect<Equal<Parameters<typeof runAmbientInboxCycle>[0], SupabaseClient | undefined>>;
type _ProvisionerStatusClosed = Expect<Equal<ProvisionerResult["status"], "ok" | "failed">>;
type _GatewayPrefixExported = Expect<Equal<typeof MODEL_GATEWAY_TOKEN_PREFIX, "mgw_">>;

const boundedOperations: ProvisionerOperation[] = [
  "render_profile",
  "start_runtime",
  "activate_routing",
  "inspect_runtime",
  "inspect_drift",
  "repair_drift",
  "rotate_model_gateway_credential",
  "suspend_runtime",
  "restart_runtime",
  "replace_runtime",
  "restore_runtime",
  "remove_runtime",
  "ensure_runtime",
];

const modelPolicy = {
  gateway_url: "http://host.docker.internal:8092/v1/employees/emp_typeproof",
  model_alias: "amtech-primary",
  allowed_providers: ["openai_compatible"],
  allowed_models: ["amtech-primary"],
  spend_limit_cents: 40000,
  rate_limit_per_minute: 60,
  expires_at: "2099-01-01T00:00:00.000Z",
  credential_version: 1,
} satisfies ModelGatewayPolicy;

const profileParams = {
  client_id: "client-typeproof",
  account_id: "acct_typeproof",
  employee_id: "emp_typeproof",
  profile_package_key: "contractor_estimator",
  runtime_backend: "docker",
  business_display_name: "Typeproof Painting",
  business_kind: "painting_contractor",
  owner_name: "Owner",
  owner_phone_e164: "+15555550100",
  employee_name: "Avery",
  timezone: "America/New_York",
  workspace_dir: "/tmp/amtech-typeproof/workspace",
  webhook_url: "https://api.example.test/webhooks/twilio/emp_typeproof",
  gateway_port: 8101,
  top_workflows: ["estimate"],
  tools_mentioned: ["gmail"],
  seed_skills: ["estimate"],
  profile_context: {
    package_key: "contractor_estimator",
    generated_from: "onboarding_manifest",
    memory_limits: { memory_chars: 2200, user_chars: 1375 },
    resource_pointers: [],
    slots: [],
  },
  model_gateway: modelPolicy,
} satisfies ProfileBuildParams;

const request = {
  operation: "render_profile",
  account_id: profileParams.account_id,
  employee_id: profileParams.employee_id,
  manifest_id: "man_typeproof",
  profile_package_key: profileParams.profile_package_key,
  params: profileParams,
  render_secrets: {
    manager_mcp_token: "mcp_scoped_typeproof",
    model_gateway_token: `${MODEL_GATEWAY_TOKEN_PREFIX}scoped-typeproof`,
  },
} satisfies ProvisionerRequest;

const successfulResult = {
  status: "ok",
  operation: "render_profile",
  request_id: "req_typeproof",
  profile_id: "client_emp_typeproof",
  profile_checksum: "a".repeat(64),
  generated_path: "/var/lib/amtech/hermes/profiles/client_emp_typeproof",
  validation_status: "passed",
  model_gateway_credential_version: 1,
} satisfies ProvisionerResult;

const failedResult = {
  status: "failed",
  operation: "start_runtime",
  failure_state: "runtime_unavailable",
  logs: ["bounded failure"],
} satisfies ProvisionerResult;

interface ModelGatewayCredentialRow {
  id: string;
  account_id: string;
  employee_id: string;
  credential_version: number;
  token_hash: string;
  token_secret_ref: string;
  gateway_url: string;
  model_alias: string;
  allowed_providers: string[];
  allowed_models: string[];
  spend_limit_cents: number;
  rate_limit_per_minute: number;
  expires_at: string;
  revoked_at: string | null;
}

interface ProvisioningJobWorkerRow {
  id: string;
  account_id: string;
  employee_id: string | null;
  command_type: string;
  state: string;
  operation_key: string;
  worker_context: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
  lease_token: string | null;
  lease_expires_at: string | null;
}

interface AmbientInboxWorkerRow {
  inbox_id: string;
  provider: string;
  external_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processing_state: string;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
  lease_token: string | null;
  lease_expires_at: string | null;
}

const credentialRowShape = {
  id: "mgwc_typeproof",
  account_id: "acct_typeproof",
  employee_id: "emp_typeproof",
  credential_version: 1,
  token_hash: "b".repeat(64),
  token_secret_ref: "sealed-ref",
  gateway_url: modelPolicy.gateway_url,
  model_alias: modelPolicy.model_alias,
  allowed_providers: modelPolicy.allowed_providers,
  allowed_models: modelPolicy.allowed_models,
  spend_limit_cents: modelPolicy.spend_limit_cents,
  rate_limit_per_minute: modelPolicy.rate_limit_per_minute,
  expires_at: modelPolicy.expires_at,
  revoked_at: null,
} satisfies ModelGatewayCredentialRow;

const jobRowShape = {
  id: "pjob_typeproof",
  account_id: "acct_typeproof",
  employee_id: "emp_typeproof",
  command_type: "ensure_runtime",
  state: "requested",
  operation_key: "ensure_runtime:acct_typeproof:emp_typeproof:op:typeproof",
  worker_context: {},
  attempt_count: 0,
  max_attempts: 12,
  next_attempt_at: "2099-01-01T00:00:00.000Z",
  lease_token: null,
  lease_expires_at: null,
} satisfies ProvisioningJobWorkerRow;

const ambientRowShape = {
  inbox_id: "ain_typeproof",
  provider: "gmail",
  external_event_id: "event_typeproof",
  event_type: "gmail.history.available",
  payload: {},
  processing_state: "received",
  attempt_count: 0,
  max_attempts: 12,
  next_attempt_at: "2099-01-01T00:00:00.000Z",
  lease_token: null,
  lease_expires_at: null,
} satisfies AmbientInboxWorkerRow;

const claimsShape = {
  token_type: "model_gateway",
  credential_id: credentialRowShape.id,
  account_id: credentialRowShape.account_id,
  employee_id: credentialRowShape.employee_id,
  issued_at: "2026-07-17T00:00:00.000Z",
  ...modelPolicy,
} satisfies ModelGatewayTokenClaims;

export function assertProductionBoundaryTypeProof(): true {
  const app: Hono = buildModelGatewayApp();
  void app;
  void boundedOperations;
  void request;
  void successfulResult;
  void failedResult;
  void jobRowShape;
  void ambientRowShape;
  void claimsShape;
  return true;
}
