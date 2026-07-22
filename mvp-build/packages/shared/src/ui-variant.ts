import { z } from "zod";
import type { EmployeeUiAdapterKey, EmployeeUiPresentationProfile } from "./employee-ui-presentation.js";
import type {
  ActiveSave,
  DelegatedWorkUnit,
  OperatingDecision,
  OperatingEvidence,
  OperatingSystemChange,
  OperatingWorkLoop,
} from "./operating-system.js";
import type {
  AbilitySummary,
  ApprovalRow,
  ConnectionSurface,
  MessageRow,
  ResurfaceItem,
  WorkOutput,
  WorkTask,
} from "./resource-payload.js";
import type { CapabilityGraphNode } from "./materialization.js";

export const UiVariantId = z.string().regex(
  /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/,
  "UI variant ids must be lowercase kebab-case",
);
export type UiVariantId = z.infer<typeof UiVariantId>;

export const UiVariantConformance = z.enum(["web_client_capable", "specialized"]);
export type UiVariantConformance = z.infer<typeof UiVariantConformance>;

export const UiVariantFeature = z.enum([
  "canvas",
  "webgl",
  "webgpu",
  "wasm",
  "workers",
  "audio",
  "camera",
  "microphone",
  "clipboard",
  "drag_drop",
  "file_input",
]);
export type UiVariantFeature = z.infer<typeof UiVariantFeature>;

export const UiVariantManifest = z.object({
  schema: z.literal("amtech.ui-variant.v1"),
  id: UiVariantId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  contract_version: z.literal(1),
  entry: z.literal("index.tsx").default("index.tsx"),
  conformance: UiVariantConformance.default("web_client_capable"),
  status: z.enum(["experiment", "candidate", "approved"]).default("experiment"),
  adapters: z.array(z.enum(["owner_web", "public_form", "boundless_website"])).min(1),
  capabilities: z.array(z.string().regex(/^[a-z][a-z0-9_.-]*$/)).default([]),
  intentionally_omitted: z.array(z.string().regex(/^[a-z][a-z0-9_.-]*$/)).default([]),
  features: z.array(UiVariantFeature).default([]),
  packages: z.array(z.string().regex(/^(@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)$/)).default([]),
});
export type UiVariantManifest = z.infer<typeof UiVariantManifest>;

export interface UiVariantIdentity {
  employee_id: string;
  employee_name: string;
  business_name?: string | null;
  business_kind?: string | null;
  profile_key?: string | null;
  status?: string | null;
}

export interface UiVariantRuntime {
  health: "healthy" | "degraded" | "unhealthy" | "unknown";
  phase?: string | null;
  summary: string;
  observed_at?: string | null;
  is_fixture: boolean;
  is_running: boolean;
}

export interface UiVariantExperienceModel {
  version: 1;
  identity: UiVariantIdentity;
  adapter: EmployeeUiAdapterKey;
  presentation: EmployeeUiPresentationProfile;
  runtime: UiVariantRuntime;
  conversation: MessageRow[];
  approvals: ApprovalRow[];
  work: {
    loops: OperatingWorkLoop[];
    tasks: WorkTask[];
    active_saves: ActiveSave[];
    delegated: DelegatedWorkUnit[];
  };
  attention: ResurfaceItem[];
  decisions: OperatingDecision[];
  changes: OperatingSystemChange[];
  connections: ConnectionSurface[];
  abilities: AbilitySummary[];
  capabilities: CapabilityGraphNode[];
  evidence: OperatingEvidence[];
  outputs: WorkOutput[];
  environment: {
    scenario_id?: string | null;
    viewport?: string | null;
    reduced_motion: boolean;
    color_scheme: "light" | "dark" | "unknown";
  };
}

export type UiVariantIntent =
  | { type: "send_message"; body: string }
  | { type: "approve"; approval_id: string }
  | { type: "reject"; approval_id: string; reason?: string }
  | { type: "open_output"; output_id: string }
  | { type: "open_connection"; connection_id: string }
  | { type: "refresh" }
  | { type: "custom"; key: string; payload?: Record<string, unknown> };

export interface UiVariantIntentResult {
  accepted: boolean;
  code: string;
  message?: string;
}

export interface UiVariantRenderProps {
  model: UiVariantExperienceModel;
  dispatch: (intent: UiVariantIntent) => Promise<UiVariantIntentResult>;
  slots: {
    web_client?: unknown;
  };
}

export interface UiVariantModule {
  default: (props: UiVariantRenderProps) => unknown;
}
