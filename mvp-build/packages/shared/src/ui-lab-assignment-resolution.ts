import { EmployeeUiAdapterKey, type EmployeeUiPresentationOverride } from "./employee-ui-presentation.js";
import { APPROVED_UI_PRESET_ASSIGNMENTS } from "./ui-lab-runtime-registry.generated.js";

export interface ResolveApprovedUiPresetInput {
  adapter_key: unknown;
  profile_key?: string | null;
  employee_type?: string | null;
  business_kind?: string | null;
  dominant_domains?: readonly string[];
}

export interface ApprovedUiPresetMatch {
  preset_ref: string;
  presentation: EmployeeUiPresentationOverride;
}

interface RuntimeUiPresetAssignment {
  preset_ref: string;
  adapter_key: string;
  profile_keys: readonly string[];
  business_kinds: readonly string[];
  employee_types: readonly string[];
  priority: number;
  presentation: EmployeeUiPresentationOverride;
}

export function resolveApprovedUiPreset(input: ResolveApprovedUiPresetInput): ApprovedUiPresetMatch | null {
  const adapter = EmployeeUiAdapterKey.safeParse(input.adapter_key);
  if (!adapter.success) return null;
  const profileKey = normalize(input.profile_key);
  const employeeType = normalize(input.employee_type);
  const businessText = [input.business_kind, ...(input.dominant_domains ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const assignments = [...(APPROVED_UI_PRESET_ASSIGNMENTS as readonly RuntimeUiPresetAssignment[])]
    .sort((left, right) => left.priority - right.priority || left.preset_ref.localeCompare(right.preset_ref));

  for (const assignment of assignments) {
    if (assignment.adapter_key !== adapter.data) continue;
    const profileMatch = Boolean(profileKey && assignment.profile_keys.some((value) => normalize(value) === profileKey));
    const employeeMatch = Boolean(employeeType && assignment.employee_types.some((value) => normalize(value) === employeeType));
    const businessMatch = assignment.business_kinds.some((value) => businessText.includes(normalize(value)));
    if (!profileMatch && !employeeMatch && !businessMatch) continue;
    return {
      preset_ref: assignment.preset_ref,
      presentation: {
        ...assignment.presentation,
        source: "user_preference",
      },
    };
  }
  return null;
}

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}
