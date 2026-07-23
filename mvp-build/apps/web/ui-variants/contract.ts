import type { ComponentType, ReactNode } from "react";
import type { EmployeeExperienceModelV1, UiVariantIntentRequest, UiVariantIntentResult, UiVariantManifest } from "@amtech/shared";

export type { EmployeeExperienceModelV1, EmployeeExperienceIntent, UiVariantIntentRequest, UiVariantIntentResult, UiVariantManifest } from "@amtech/shared";

export interface UiVariantEnvironment {
  lab: boolean;
  viewport: "responsive" | "desktop" | "tablet" | "mobile";
  reduced_motion: boolean;
  color_scheme: "light" | "dark" | "unknown";
  locale: string;
}

export interface UiVariantSlots {
  /** The actual production Web-client tree. Capability fidelity does not imply visual similarity. */
  reference_client: ReactNode;
}

export interface UiVariantProps {
  manifest: UiVariantManifest;
  model: EmployeeExperienceModelV1;
  environment: UiVariantEnvironment;
  slots: UiVariantSlots;
  dispatchIntent: (request: UiVariantIntentRequest) => Promise<UiVariantIntentResult>;
}

export type UiVariantComponent = ComponentType<UiVariantProps>;
export function defineUiVariant<T extends UiVariantComponent>(component: T): T { return component; }
