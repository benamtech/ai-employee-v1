import { z } from "zod";

export const ProfilePackage = z.object({
  key: z.string().min(1),
  display_name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  supported_business_kinds: z.array(z.string()).default([]),
  default_skills: z.array(z.string()).default([]),
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
}

export interface ProvisionerRequest {
  account_id: string;
  employee_id: string;
  manifest_id: string;
  profile_package_key: string;
  params: ProfileBuildParams;
}

export interface ProvisionerResult {
  status: "ok" | "failed";
  profile_id?: string;
  generated_path?: string;
  workspace_dir?: string;
  sms_number_e164?: string;
  twilio_webhook_url?: string;
  webchat_api_url?: string;
  api_base_url?: string;
  api_key_ref?: string;
  api_session_id?: string;
  public_web_route?: string;
  gateway_port?: number;
  validation_status?: "passed" | "failed";
  validation_output?: string;
  smoke_output?: string;
  first_sms_sid?: string;
  failure_state?: string;
  logs?: string[];
}
