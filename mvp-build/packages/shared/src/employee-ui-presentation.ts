import { z } from "zod";

/**
 * A port names the purposeful UI conversation. Adapters implement that port;
 * themes, layouts and component sets are strategies inside an adapter.
 */
export const EmployeeUiAdapterKey = z.enum([
  "owner_web",
  "public_form",
  "boundless_website",
]);
export type EmployeeUiAdapterKey = z.infer<typeof EmployeeUiAdapterKey>;

export const BUILTIN_EMPLOYEE_UI_THEMES = [
  "amtech_light",
  "brand",
  "field_notebook",
  "ledger",
  "studio",
  "editorial",
  "midnight",
  "high_contrast",
] as const;

export const BUILTIN_EMPLOYEE_UI_LAYOUTS = [
  "conversation_workspace",
  "focus",
  "canvas",
  "form_chat",
  "boundless",
] as const;

export const BUILTIN_EMPLOYEE_UI_COMPONENT_SETS = [
  "standard",
  "compact",
  "editorial",
  "terminal",
  "form_forward",
] as const;

const CustomRegistryKey = z.string().regex(
  /^custom:[a-z][a-z0-9_-]*$/,
  "Custom presentation registry keys must use custom:<lowercase-slug>",
);

export const EmployeeUiThemeKey = z.union([
  z.enum(BUILTIN_EMPLOYEE_UI_THEMES),
  CustomRegistryKey,
]);
export type EmployeeUiThemeKey = z.infer<typeof EmployeeUiThemeKey>;

export const EmployeeUiLayoutKey = z.union([
  z.enum(BUILTIN_EMPLOYEE_UI_LAYOUTS),
  CustomRegistryKey,
]);
export type EmployeeUiLayoutKey = z.infer<typeof EmployeeUiLayoutKey>;

export const EmployeeUiComponentSetKey = z.union([
  z.enum(BUILTIN_EMPLOYEE_UI_COMPONENT_SETS),
  CustomRegistryKey,
]);
export type EmployeeUiComponentSetKey = z.infer<typeof EmployeeUiComponentSetKey>;

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const EmployeeUiBrandTokens = z.object({
  primary: HexColor.optional(),
  secondary: HexColor.optional(),
  accent: HexColor.optional(),
  canvas: HexColor.optional(),
  surface: HexColor.optional(),
  ink: HexColor.optional(),
  muted: HexColor.optional(),
});
export type EmployeeUiBrandTokens = z.infer<typeof EmployeeUiBrandTokens>;

export const EmployeeUiPresentationSource = z.enum([
  "adapter_default",
  "profile_match",
  "onboarding_brand",
  "profile_generated",
  "explicit_override",
  "user_preference",
  "ui_lab",
]);
export type EmployeeUiPresentationSource = z.infer<typeof EmployeeUiPresentationSource>;

export const EmployeeUiPresentationOverride = z.object({
  version: z.literal(1).optional(),
  theme_key: EmployeeUiThemeKey.optional(),
  layout_key: EmployeeUiLayoutKey.optional(),
  component_set_key: EmployeeUiComponentSetKey.optional(),
  density: z.enum(["calm", "balanced", "dense"]).optional(),
  brand: EmployeeUiBrandTokens.optional(),
  source: EmployeeUiPresentationSource.optional(),
});
export type EmployeeUiPresentationOverride = z.infer<typeof EmployeeUiPresentationOverride>;

export const EmployeeUiPresentationProfile = z.object({
  version: z.literal(1),
  theme_key: EmployeeUiThemeKey,
  layout_key: EmployeeUiLayoutKey,
  component_set_key: EmployeeUiComponentSetKey,
  density: z.enum(["calm", "balanced", "dense"]),
  brand: EmployeeUiBrandTokens.default({}),
  source: EmployeeUiPresentationSource,
});
export type EmployeeUiPresentationProfile = z.infer<typeof EmployeeUiPresentationProfile>;

export const EmployeeUiPortContract = z.object({
  version: z.literal(1),
  adapter_key: EmployeeUiAdapterKey,
  presentation: EmployeeUiPresentationProfile,
});
export type EmployeeUiPortContract = z.infer<typeof EmployeeUiPortContract>;

export interface EmployeeUiPresentationSignal {
  key?: string | null;
  value?: string | null;
}

export interface ResolveEmployeeUiPortInput {
  adapter_key?: unknown;
  business_kind?: string | null;
  profile_key?: string | null;
  dominant_domains?: readonly string[];
  signals?: readonly EmployeeUiPresentationSignal[];
  explicit?: unknown;
}

const DEFAULTS: Record<EmployeeUiAdapterKey, Omit<EmployeeUiPresentationProfile, "version" | "source" | "brand">> = {
  owner_web: {
    theme_key: "amtech_light",
    layout_key: "conversation_workspace",
    component_set_key: "standard",
    density: "balanced",
  },
  public_form: {
    theme_key: "brand",
    layout_key: "form_chat",
    component_set_key: "form_forward",
    density: "balanced",
  },
  boundless_website: {
    theme_key: "brand",
    layout_key: "boundless",
    component_set_key: "editorial",
    density: "calm",
  },
};

/** Resolve adapter + presentation strategies without changing employee data. */
export function resolveEmployeeUiPort(input: ResolveEmployeeUiPortInput = {}): EmployeeUiPortContract {
  const adapter = EmployeeUiAdapterKey.safeParse(input.adapter_key);
  const adapterKey: EmployeeUiAdapterKey = adapter.success ? adapter.data : "owner_web";
  const defaults = DEFAULTS[adapterKey];
  const matched = inferMatchedPresentation(input, adapterKey);
  const brand = extractBrandTokens(input.signals ?? []);
  const generated = parseGeneratedPresentation(input.signals ?? []);
  const explicit = EmployeeUiPresentationOverride.safeParse(input.explicit);

  const source: EmployeeUiPresentationSource = explicit.success && hasPresentationValue(explicit.data)
    ? explicit.data.source ?? "explicit_override"
    : generated
      ? generated.source ?? "profile_generated"
      : Object.keys(brand).length
        ? "onboarding_brand"
        : matched
          ? "profile_match"
          : "adapter_default";

  const profile: EmployeeUiPresentationProfile = {
    version: 1,
    theme_key: explicit.success && explicit.data.theme_key
      ? explicit.data.theme_key
      : generated?.theme_key ?? (Object.keys(brand).length ? "brand" : matched?.theme_key ?? defaults.theme_key),
    layout_key: explicit.success && explicit.data.layout_key
      ? explicit.data.layout_key
      : generated?.layout_key ?? matched?.layout_key ?? defaults.layout_key,
    component_set_key: explicit.success && explicit.data.component_set_key
      ? explicit.data.component_set_key
      : generated?.component_set_key ?? matched?.component_set_key ?? defaults.component_set_key,
    density: explicit.success && explicit.data.density
      ? explicit.data.density
      : generated?.density ?? matched?.density ?? defaults.density,
    brand: {
      ...brand,
      ...(generated?.brand ?? {}),
      ...(explicit.success ? explicit.data.brand ?? {} : {}),
    },
    source,
  };

  return EmployeeUiPortContract.parse({ version: 1, adapter_key: adapterKey, presentation: profile });
}

function inferMatchedPresentation(
  input: ResolveEmployeeUiPortInput,
  adapterKey: EmployeeUiAdapterKey,
): EmployeeUiPresentationOverride | null {
  if (adapterKey !== "owner_web") return null;
  const text = [
    input.business_kind,
    input.profile_key,
    ...(input.dominant_domains ?? []),
  ].filter(Boolean).join(" ").toLowerCase();

  if (/bookkeep|account|finance|invoice|payroll|ledger/.test(text)) {
    return { theme_key: "ledger", layout_key: "focus", component_set_key: "compact", density: "dense" };
  }
  if (/shopify|e-?commerce|clothing|apparel|retail|fulfillment|inventory/.test(text)) {
    return { theme_key: "studio", layout_key: "canvas", component_set_key: "editorial", density: "balanced" };
  }
  if (/research|analysis|intelligence|writer|editorial/.test(text)) {
    return { theme_key: "editorial", layout_key: "focus", component_set_key: "editorial", density: "calm" };
  }
  if (/contractor|painting|landscap|roof|plumb|electric|construction|field service|hvac/.test(text)) {
    return { theme_key: "field_notebook", layout_key: "conversation_workspace", component_set_key: "standard", density: "balanced" };
  }
  return null;
}

function parseGeneratedPresentation(signals: readonly EmployeeUiPresentationSignal[]): EmployeeUiPresentationOverride | null {
  for (const signal of signals) {
    const key = String(signal.key ?? "").toLowerCase();
    if (!key.includes("ui_presentation")) continue;
    try {
      const parsed = EmployeeUiPresentationOverride.safeParse(JSON.parse(String(signal.value ?? "{}")));
      if (parsed.success) return parsed.data;
    } catch {
      // Invalid profile hints are ignored; the deterministic adapter default remains usable.
    }
  }
  return null;
}

function extractBrandTokens(signals: readonly EmployeeUiPresentationSignal[]): EmployeeUiBrandTokens {
  const result: EmployeeUiBrandTokens = {};
  for (const signal of signals) {
    const key = String(signal.key ?? "").toLowerCase();
    if (!key.includes("brand") && !key.includes("color") && !key.includes("colour")) continue;
    const color = String(signal.value ?? "").match(/#[0-9a-fA-F]{6}/)?.[0];
    if (!color) continue;
    if (/primary|main|brand_color/.test(key)) result.primary = color;
    else if (/secondary/.test(key)) result.secondary = color;
    else if (/accent/.test(key)) result.accent = color;
    else if (/background|canvas/.test(key)) result.canvas = color;
    else if (/surface|panel/.test(key)) result.surface = color;
    else if (/text|ink|foreground/.test(key)) result.ink = color;
    else if (/muted|subtle/.test(key)) result.muted = color;
    else if (!result.primary) result.primary = color;
  }
  return result;
}

function hasPresentationValue(value: EmployeeUiPresentationOverride): boolean {
  return Boolean(
    value.theme_key
    || value.layout_key
    || value.component_set_key
    || value.density
    || Object.keys(value.brand ?? {}).length,
  );
}
