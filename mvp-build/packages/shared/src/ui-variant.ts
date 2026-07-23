import { z } from "zod";
import type { EmployeeUiAdapterKey, EmployeeUiPresentationProfile } from "./employee-ui-presentation.js";
import type { ActiveSave, DelegatedWorkUnit, OperatingDecision, OperatingEvidence, OperatingSystemChange, OperatingWorkLoop } from "./operating-system.js";
import type { AbilitySummary, ApprovalRow, ConnectionSurface, MessageRow, ResurfaceItem, WorkOutput, WorkTask } from "./resource-payload.js";
import type { CapabilityGraphNode } from "./materialization.js";

export const UiVariantId = z.string().regex(/^[a-z][a-z0-9-]{1,62}[a-z0-9]$/, "UI variant ids must be lowercase kebab-case and 3-64 characters");
export type UiVariantId = z.infer<typeof UiVariantId>;
export const UiVariantCapability = z.enum(["identity","context","presentation","runtime","conversation","work","attention","waiting","changes","connections","capabilities","evidence","outputs","intents","reference_client","fixture_metadata"]);
export type UiVariantCapability = z.infer<typeof UiVariantCapability>;
export const UiVariantRuntimeFeature = z.enum(["dom","css","svg","canvas_2d","webgl","webgpu","web_worker","wasm","audio","video"]);
export type UiVariantRuntimeFeature = z.infer<typeof UiVariantRuntimeFeature>;
const PackageName = z.string().regex(/^(?:@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)$/);
export const UiVariantManifest = z.object({
  schema: z.literal("amtech.ui-variant.v1"), id: UiVariantId, name: z.string().min(2).max(100), summary: z.string().min(8).max(500), contract_version: z.literal(1), entry: z.literal("./index.tsx"),
  status: z.enum(["experiment","candidate","approved","deprecated"]),
  supported_adapters: z.array(z.enum(["owner_web","public_form","boundless_website"])).min(1),
  capabilities: z.object({ required: z.array(UiVariantCapability).default([]), optional: z.array(UiVariantCapability).default([]), intentionally_omitted: z.array(UiVariantCapability).default([]) }).strict(),
  runtime_features: z.array(UiVariantRuntimeFeature).default(["dom","css","svg"]), dependencies: z.array(PackageName).default(["react"]), isolation: z.enum(["host_contained","self_managed"]).default("host_contained"),
  performance: z.object({ containment: z.enum(["layout_paint_style","layout_style","none"]).default("layout_paint_style"), content_visibility: z.enum(["visible","auto"]).default("visible"), initial_render: z.enum(["eager","lazy"]).default("lazy") }).strict(),
  production: z.object({ eligibility: z.enum(["lab_only","candidate","approved"]), requires_reference_client: z.boolean().default(false) }).strict(),
  tags: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/)).default([]),
}).strict();
export type UiVariantManifest = z.infer<typeof UiVariantManifest>;

export interface EmployeeExperienceIntent { id: string; kind: "send_message"|"submit_command"|"approve"|"respond"|"open_resource"|"reset_fixture"|"interrupt_fixture"|"recover_fixture"|"custom"; label: string; description: string; availability: "direct"|"reference_client"|"unavailable"; risk: "none"|"low"|"medium"|"high"; target?: { kind: string; id: string } | null; input?: { kind: "none"|"text"|"confirmation"|"structured"; placeholder?: string | null } }
export interface EmployeeExperienceModelV1 {
  version: 1; adapter_key: EmployeeUiAdapterKey; presentation: EmployeeUiPresentationProfile;
  identity: { account_id: string; assignment_id?: string|null; employee_id: string; employee_name: string; employee_status?: string|null; business_name?: string|null; business_kind?: string|null; profile_key?: string|null; profile_version?: string|null };
  context: { dominant_domains: string[]; owner_experience?: "guided"|"standard"|"expert"|null; preferred_density?: "calm"|"balanced"|"dense"|null; signals: Array<{ id:string; source:string; key:string; label:string; value?:string|null; confidence:"high"|"medium"|"low"; freshness:"live"|"current"|"stale"|"static" }> };
  runtime: { status:"initial"|"active"|"waiting"|"stalled"|"recovering"|"completed"|"degraded"|"unknown"; health?:string|null; phase?:string|null; summary:string; progress?:string|null; running:boolean; observed_at?:string|null; sequence?:number|null };
  conversation: MessageRow[];
  work: { guidance?: { headline:string; summary:string; mode:string; suggested_prompt?:string|null }|null; loops: OperatingWorkLoop[]; tasks: WorkTask[]; delegated: DelegatedWorkUnit[] };
  attention: { decisions: OperatingDecision[]; approvals: ApprovalRow[]; resurface_items: ResurfaceItem[] };
  waiting: ActiveSave[]; changes: OperatingSystemChange[]; connections: ConnectionSurface[]; abilities: AbilitySummary[]; capabilities: CapabilityGraphNode[]; evidence: OperatingEvidence[]; outputs: WorkOutput[]; intents: EmployeeExperienceIntent[];
  metadata: { generated_at:string; evidence_level:"fixture_demonstration"|"source_wired"|"live"; fixture:boolean; scenario_id?:string|null; contract_fingerprint:string };
}
export interface UiVariantIntentRequest { intent_id: string; value?: string|Record<string,unknown>|null }
export interface UiVariantIntentResult { accepted:boolean; code:string; message:string }
