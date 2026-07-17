import { z } from "zod";
import type { ModelGatewayPolicy } from "./model-gateway.js";

export const ProfilePackage = z.object({
  key: z.string().min(1),
  display_name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  supported_business_kinds: z.array(z.string()).default([]),
  default_skills: z.array(z.string()).default([]),
  context_slots: z.array(z.object({
    key: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.number().int().min(0).default(100),
  })).default([]),
  memory_limits: z.object({
    memory_chars: z.number().int().positive().default(2200),
    user_chars: z.number().int().positive().default(1375),
  }).default({ memory_chars: 2200, user_chars: 1375 }),
  resource_pointers: z.array(z.string().min(1)).default([]),
  template_source: z.object({
    name: z.string(),
    url: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  env_requires: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().default(false),
  })).default([]),
  validation_command: z.string().optional(),
});

export type ProfilePackage = z.infer<typeof ProfilePackage>;

export interface ProfileContextFact {
  key: string;
  value: string;
  confidence?: "high" | "medium" | "low";
  source?: "onboarding" | "manifest" | "work";
}

export interface ProfileContextSlot {
  key: string;
  title: string;
  priority: number;
  facts: ProfileContextFact[];
}

export interface ProfileContext {
  package_key: string;
  generated_from: "onboarding_manifest";
  memory_limits: {
    memory_chars: number;
    user_chars: number;
  };
  resource_pointers: string[];
  slots: ProfileContextSlot[];
}

export interface ProfileBuildParams {
  client_id: string;
  account_id: string;
  employee_id: string;
  profile_package_key: string;
  runtime_backend?: "docker" | "local" | "ssh" | "vm";
  business_display_name: string;
  business_kind: string;
  owner_name: string;
  owner_phone_e164: string;
  employee_name: string;
  timezone: string;
  workspace_dir: string;
  webhook_url: string;
  gateway_port: number;
  top_workflows: string[];
  tools_mentioned: string[];
  seed_skills: string[];
  api_server_key?: string;
  profile_context: ProfileContext;
  direct_mcp_connectors?: import("./connector-registry.js").DirectMcpConnectorSpec[];

  /**
   * WS1 model custody boundary. Production profiles render this host-private
   * gateway policy plus the scoped render secret below; they never render provider
   * master keys or provider-specific env vars.
   */
  model_gateway: ModelGatewayPolicy;
}

export type ProvisionerOperation =
  | "ensure_runtime"
  | "remove_runtime"
  | "inspect_runtime"
  | "inspect_drift"
  | "repair_drift"
  | "rotate_model_gateway_credential"
  | "suspend_runtime"
  | "replace_runtime"
  | "restore_runtime";

/**
 * Declarative host-private lifecycle request. Manager may omit envelope fields when
 * calling its local proxy; the proxy mints them before signing the Unix-socket request.
 */
export interface ProvisionerRequest {
  request_id?: string;
  operation?: ProvisionerOperation;
  issued_at?: string;
  expires_at?: string;
  nonce?: string;
  idempotency_key?: string;
  account_id: string;
  employee_id: string;
  manifest_id: string;
  profile_package_key: string;
  params: ProfileBuildParams;
  render_secrets?: {
    manager_mcp_token?: string;
    model_gateway_token?: string;
  };
}

export interface ProvisionerResult {
  status: "ok" | "failed";
  request_id?: string;
  operation?: ProvisionerOperation;
  idempotent_replay?: boolean;
  profile_id?: string;
  profile_checksum?: string;
  generated_path?: string;
  workspace_dir?: string;
  network_name?: string;
  container_name?: string;
  webchat_api_url?: string;
  api_base_url?: string;
  api_key_ref?: string;
  api_session_id?: string;
  public_web_route?: string;
  gateway_port?: number;
  validation_status?: "passed" | "failed";
  validation_output?: string;
  smoke_output?: string;
  failure_state?: string;
  logs?: string[];
  drift?: Record<string, unknown>;
  model_gateway_credential_version?: number;
}