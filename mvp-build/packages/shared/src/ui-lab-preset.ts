import { z } from "zod";
import {
  EmployeeUiAdapterKey,
  EmployeeUiBrandTokens,
  EmployeeUiComponentSetKey,
  EmployeeUiLayoutKey,
  EmployeeUiThemeKey,
} from "./employee-ui-presentation.js";

export const UI_LAB_PRESET_SCHEMA = "amtech.ui-lab-preset.v1" as const;
export const UI_LAB_ASSIGNMENT_SCHEMA = "amtech.ui-lab-assignments.v1" as const;

export const UiLabPresetId = z.string().regex(
  /^[a-z][a-z0-9-]*$/,
  "UI Lab preset ids must be lowercase kebab-case",
);
export type UiLabPresetId = z.infer<typeof UiLabPresetId>;

export const UiLabPresetRef = z.string().regex(
  /^[a-z][a-z0-9-]*@v[0-9]{4}$/,
  "UI Lab preset refs must use <preset-id>@vNNNN",
);
export type UiLabPresetRef = z.infer<typeof UiLabPresetRef>;

export const UiLabPresetStatus = z.enum([
  "draft",
  "candidate",
  "approved",
  "deprecated",
]);
export type UiLabPresetStatus = z.infer<typeof UiLabPresetStatus>;

export const UiLabViewportKey = z.enum([
  "responsive",
  "desktop",
  "tablet",
  "mobile",
]);
export type UiLabViewportKey = z.infer<typeof UiLabViewportKey>;

export const UiLabPresetPresentation = z.object({
  theme_key: EmployeeUiThemeKey,
  layout_key: EmployeeUiLayoutKey,
  component_set_key: EmployeeUiComponentSetKey,
  density: z.enum(["calm", "balanced", "dense"]),
  brand: EmployeeUiBrandTokens.default({}),
});
export type UiLabPresetPresentation = z.infer<typeof UiLabPresetPresentation>;

export const UiLabPresetTargets = z.object({
  profile_keys: z.array(z.string().regex(/^[a-z][a-z0-9_:-]*$/)).default([]),
  business_kinds: z.array(z.string().min(1)).default([]),
  employee_types: z.array(z.string().regex(/^[a-z][a-z0-9_:-]*$/)).default([]),
});
export type UiLabPresetTargets = z.infer<typeof UiLabPresetTargets>;

export const UiLabSourceProvenance = z.object({
  git_sha: z.string().regex(/^[0-9a-f]{40}$/).nullable(),
  git_branch: z.string().min(1).nullable(),
  dirty: z.boolean(),
  changed_paths: z.array(z.string()).default([]),
  reproducible: z.boolean(),
  captured_at: z.string().datetime(),
  captured_by: z.string().min(1).optional(),
});
export type UiLabSourceProvenance = z.infer<typeof UiLabSourceProvenance>;

export const UiLabHumanReview = z.object({
  reviewer: z.string().min(1),
  reviewed_at: z.string().datetime(),
  decision: z.enum(["approve", "reject", "revise"]),
  notes: z.string().max(4000).optional(),
  validation_run: z.string().min(1).optional(),
});
export type UiLabHumanReview = z.infer<typeof UiLabHumanReview>;

const UiLabPresetFields = z.object({
  schema: z.literal(UI_LAB_PRESET_SCHEMA),
  id: UiLabPresetId,
  version: z.number().int().positive(),
  preset_ref: UiLabPresetRef,
  display_name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  status: UiLabPresetStatus,
  parent_ref: UiLabPresetRef.optional(),
  scenario_id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  adapter_key: EmployeeUiAdapterKey,
  presentation: UiLabPresetPresentation,
  targets: UiLabPresetTargets.default({
    profile_keys: [],
    business_kinds: [],
    employee_types: [],
  }),
  review_viewports: z.array(UiLabViewportKey).min(1).default(["desktop", "mobile"]),
  tags: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).default([]),
  notes: z.string().max(8000).optional(),
  source: UiLabSourceProvenance,
  human_review: UiLabHumanReview.optional(),
});

export const UiLabPreset = UiLabPresetFields.superRefine((preset, context) => {
  const expectedRef = `${preset.id}@v${String(preset.version).padStart(4, "0")}`;
  if (preset.preset_ref !== expectedRef) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["preset_ref"], message: `Expected ${expectedRef}` });
  }
  if (preset.version === 1 && preset.parent_ref) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_ref"], message: "Version 1 cannot have a parent" });
  }
  if (preset.version > 1) {
    const expectedParent = `${preset.id}@v${String(preset.version - 1).padStart(4, "0")}`;
    if (preset.parent_ref !== expectedParent) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_ref"], message: `Expected ${expectedParent}` });
    }
  }
  if (preset.source.reproducible && (preset.source.dirty || !preset.source.git_sha)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["source", "reproducible"], message: "Reproducible source requires a clean worktree and Git SHA" });
  }
  if (preset.source.dirty && preset.source.changed_paths.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["source", "changed_paths"], message: "Dirty source must identify changed paths" });
  }
  if (preset.status === "approved") {
    if (!preset.source.reproducible || preset.source.dirty || !preset.source.git_sha) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["source"], message: "Approved presets require reproducible clean Git source" });
    }
    if (preset.human_review?.decision !== "approve" || !preset.human_review.validation_run) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["human_review"], message: "Approved presets require an approving human review and validation run" });
    }
  }
});
export type UiLabPreset = z.infer<typeof UiLabPreset>;

export const UiLabSavePresetRequest = z.object({
  id: UiLabPresetId,
  display_name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  scenario_id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  adapter_key: EmployeeUiAdapterKey,
  presentation: UiLabPresetPresentation,
  targets: UiLabPresetTargets.optional(),
  review_viewports: z.array(UiLabViewportKey).min(1).optional(),
  tags: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).optional(),
  notes: z.string().max(8000).optional(),
  captured_by: z.string().min(1).max(120).optional(),
});
export type UiLabSavePresetRequest = z.infer<typeof UiLabSavePresetRequest>;

export const UiLabAssignment = z.object({
  preset_ref: UiLabPresetRef,
  adapter_key: EmployeeUiAdapterKey,
  profile_keys: z.array(z.string().regex(/^[a-z][a-z0-9_:-]*$/)).default([]),
  business_kinds: z.array(z.string().min(1)).default([]),
  employee_types: z.array(z.string().regex(/^[a-z][a-z0-9_:-]*$/)).default([]),
  priority: z.number().int().min(0).max(10000).default(100),
  assigned_at: z.string().datetime(),
  assigned_by: z.string().min(1),
});
export type UiLabAssignment = z.infer<typeof UiLabAssignment>;

export const UiLabAssignmentRegistry = z.object({
  schema: z.literal(UI_LAB_ASSIGNMENT_SCHEMA),
  generated_from: z.string().default("ui-lab/presets"),
  assignments: z.array(UiLabAssignment).default([]),
});
export type UiLabAssignmentRegistry = z.infer<typeof UiLabAssignmentRegistry>;

export const UiLabPresetSummary = UiLabPresetFields.pick({
  id: true,
  version: true,
  preset_ref: true,
  display_name: true,
  description: true,
  status: true,
  scenario_id: true,
  adapter_key: true,
  presentation: true,
  targets: true,
  review_viewports: true,
  tags: true,
  source: true,
  human_review: true,
});
export type UiLabPresetSummary = z.infer<typeof UiLabPresetSummary>;

export function formatUiLabPresetRef(id: string, version: number): UiLabPresetRef {
  return UiLabPresetRef.parse(`${id}@v${String(version).padStart(4, "0")}`);
}

export function parseUiLabPresetRef(ref: string): { id: UiLabPresetId; version: number } {
  const parsed = UiLabPresetRef.parse(ref);
  const [id, rawVersion] = parsed.split("@v");
  return {
    id: UiLabPresetId.parse(id),
    version: Number(rawVersion),
  };
}

export function uiLabPresetFilename(version: number): string {
  if (!Number.isInteger(version) || version < 1) throw new Error("ui_lab_preset_version_invalid");
  return `v${String(version).padStart(4, "0")}.json`;
}
