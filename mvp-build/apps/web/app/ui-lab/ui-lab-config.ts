import {
  EmployeeUiAdapterKey,
  EmployeeUiBrandTokens,
  EmployeeUiComponentSetKey,
  EmployeeUiLayoutKey,
  EmployeeUiThemeKey,
  type UiLabPresetPresentation,
} from "@amtech/shared";
import type { FixtureScenarioId } from "../agent/[employeeId]/fixture-runtime";
import type { UiLabPreviewConfig, UiLabPreviewMode } from "./[scenario]/ProductionFixtureLabClient";

export const UI_LAB_PREVIEW_MODES = ["full_owner_client", "workspace_fixture"] as const satisfies readonly UiLabPreviewMode[];

export const UI_LAB_VIEWPORTS = {
  responsive: { label: "Responsive", width: "100%", height: 900 },
  desktop: { label: "Desktop 1440", width: 1440, height: 960 },
  tablet: { label: "Tablet 1024", width: 1024, height: 900 },
  mobile: { label: "Mobile 390", width: 390, height: 844 },
} as const;

export function scenarioPresentation(scenarioId: FixtureScenarioId): UiLabPreviewConfig {
  if (scenarioId === "website") return config("boundless_website", "brand", "boundless", "editorial", "calm");
  if (scenarioId === "contractor") return config("owner_web", "field_notebook", "conversation_workspace", "standard", "balanced");
  if (scenarioId === "clothing-ops") return config("owner_web", "studio", "canvas", "editorial", "balanced");
  if (scenarioId === "research") return config("owner_web", "editorial", "focus", "editorial", "calm");
  if (scenarioId === "personal-brain") return config("owner_web", "midnight", "focus", "terminal", "balanced");
  return config("owner_web", "amtech_light", "conversation_workspace", "compact", "balanced");
}

export function parseUiLabPreviewConfig(
  scenarioId: FixtureScenarioId,
  search: Record<string, string | string[] | undefined>,
): { config: UiLabPreviewConfig; mode: UiLabPreviewMode } {
  const defaults = scenarioPresentation(scenarioId);
  const value = (key: string) => {
    const raw = search[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const adapter = EmployeeUiAdapterKey.safeParse(value("adapter"));
  const theme = EmployeeUiThemeKey.safeParse(value("theme"));
  const layout = EmployeeUiLayoutKey.safeParse(value("layout"));
  const components = EmployeeUiComponentSetKey.safeParse(value("components"));
  const density = value("density");
  const mode = value("mode");
  const brand = EmployeeUiBrandTokens.safeParse({
    primary: value("brand_primary"),
    secondary: value("brand_secondary"),
    accent: value("brand_accent"),
    canvas: value("brand_canvas"),
    surface: value("brand_surface"),
    ink: value("brand_ink"),
    muted: value("brand_muted"),
  });

  return {
    config: {
      adapterKey: adapter.success ? adapter.data : defaults.adapterKey,
      themeKey: theme.success ? theme.data : defaults.themeKey,
      layoutKey: layout.success ? layout.data : defaults.layoutKey,
      componentSetKey: components.success ? components.data : defaults.componentSetKey,
      density: density === "calm" || density === "dense" || density === "balanced" ? density : defaults.density,
      brand: brand.success ? compactBrand(brand.data) : defaults.brand,
    },
    mode: mode === "workspace_fixture" ? "workspace_fixture" : "full_owner_client",
  };
}

export function previewConfigFromPreset(
  adapterKey: UiLabPreviewConfig["adapterKey"],
  presentation: UiLabPresetPresentation,
): UiLabPreviewConfig {
  return {
    adapterKey,
    themeKey: presentation.theme_key,
    layoutKey: presentation.layout_key,
    componentSetKey: presentation.component_set_key,
    density: presentation.density,
    brand: presentation.brand,
  };
}

function config(
  adapterKey: UiLabPreviewConfig["adapterKey"],
  themeKey: UiLabPreviewConfig["themeKey"],
  layoutKey: UiLabPreviewConfig["layoutKey"],
  componentSetKey: UiLabPreviewConfig["componentSetKey"],
  density: UiLabPreviewConfig["density"],
): UiLabPreviewConfig {
  return { adapterKey, themeKey, layoutKey, componentSetKey, density, brand: {} };
}

function compactBrand(brand: EmployeeUiBrandTokens): EmployeeUiBrandTokens {
  return Object.fromEntries(Object.entries(brand).filter(([, value]) => Boolean(value))) as EmployeeUiBrandTokens;
}
