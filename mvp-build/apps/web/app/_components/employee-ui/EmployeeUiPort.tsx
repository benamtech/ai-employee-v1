"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  resolveApprovedUiPreset,
  resolveEmployeeUiPort,
  type EmployeeUiAdapterKey,
  type EmployeeUiPortContract,
  type EmployeeUiPresentationOverride,
  type EmployeeUiThemeKey,
  type ResourcePayload,
} from "@amtech/shared";

export const EMPLOYEE_UI_ADAPTERS = Object.freeze({
  owner_web: {
    label: "Owner web client",
    purpose: "Operate a persistent employee through the authenticated AMTECH web client.",
  },
  public_form: {
    label: "Public form employee",
    purpose: "Run one bounded public workflow through a conversational form-oriented web client.",
  },
  boundless_website: {
    label: "Boundless employee website",
    purpose: "Make the employee itself the dominant public website experience.",
  },
} satisfies Record<EmployeeUiAdapterKey, { label: string; purpose: string }>);

interface EmployeeUiPortHostProps {
  adapterKey: EmployeeUiAdapterKey;
  employeeId?: string;
  payload?: ResourcePayload | null;
  presentationOverride?: EmployeeUiPresentationOverride;
  className?: string;
  children: ReactNode;
}

const EmployeeUiPortContext = createContext<EmployeeUiPortContract | null>(null);

/**
 * React host for the stable employee UI port. Routes select a high-level adapter;
 * the resolved theme/layout/component-set strategies are supplied once to the
 * existing component tree without changing the loaded employee payload.
 */
export function EmployeeUiPortHost({
  adapterKey,
  employeeId,
  payload,
  presentationOverride,
  className,
  children,
}: EmployeeUiPortHostProps) {
  const [observedPayload, setObservedPayload] = useState<ResourcePayload | null>(payload ?? null);

  useEffect(() => {
    if (payload) setObservedPayload(payload);
  }, [payload]);

  useEffect(() => {
    if (payload || !employeeId) return;
    const controller = new AbortController();
    void fetch(`/api/employee/${employeeId}/resources`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) return;
      const value = await response.json().catch(() => null);
      if (value && typeof value === "object") setObservedPayload(value as ResourcePayload);
    }).catch(() => {
      // Presentation discovery is optional. The selected adapter default remains usable.
    });
    return () => controller.abort();
  }, [employeeId, payload]);

  const context = observedPayload?.operating_state?.context;
  const generatedProfileHintPresent = context?.signals?.some((signal) =>
    String(signal.key ?? "").toLowerCase().includes("ui_presentation")) ?? false;
  const approvedPreset = useMemo(() => resolveApprovedUiPreset({
    adapter_key: adapterKey,
    profile_key: context?.profile_key,
    business_kind: context?.business_kind,
    dominant_domains: context?.dominant_domains,
  }), [adapterKey, context]);
  const assignmentOverride = presentationOverride || generatedProfileHintPresent
    ? undefined
    : approvedPreset?.presentation;
  const port = useMemo(() => resolveEmployeeUiPort({
    adapter_key: adapterKey,
    business_kind: context?.business_kind,
    profile_key: context?.profile_key,
    dominant_domains: context?.dominant_domains,
    signals: context?.signals,
    explicit: presentationOverride ?? assignmentOverride,
  }), [adapterKey, assignmentOverride, context, presentationOverride]);
  const appliedPresetRef = presentationOverride || generatedProfileHintPresent
    ? undefined
    : approvedPreset?.preset_ref;
  const tokens = themeTokens(port.presentation.theme_key, port.presentation.brand);
  const variables = {
    "--employee-canvas": tokens.canvas,
    "--employee-surface": tokens.surface,
    "--employee-surface-raised": tokens.surfaceRaised,
    "--employee-ink": tokens.ink,
    "--employee-muted": tokens.muted,
    "--employee-primary": tokens.primary,
    "--employee-secondary": tokens.secondary,
    "--employee-accent": tokens.accent,
    "--employee-line": tokens.line,
    "--employee-radius": tokens.radius,
    "--employee-radius-small": tokens.radiusSmall,
    "--employee-shadow": tokens.shadow,
    "--employee-font": tokens.font,
    "--amtech-canvas": tokens.canvas,
    "--amtech-ink": tokens.ink,
    "--amtech-muted": tokens.muted,
    "--amtech-red": tokens.primary,
    "--amtech-blue": tokens.secondary,
    "--amtech-cyan": tokens.accent,
    "--amtech-line": tokens.line,
    "--amtech-font": tokens.font,
  } as CSSProperties;

  return (
    <EmployeeUiPortContext.Provider value={port}>
      <div
        className={["employee-ui-port", className].filter(Boolean).join(" ")}
        data-ui-adapter={port.adapter_key}
        data-ui-theme={port.presentation.theme_key}
        data-ui-layout={port.presentation.layout_key}
        data-ui-components={port.presentation.component_set_key}
        data-ui-density={port.presentation.density}
        data-ui-source={port.presentation.source}
        data-ui-preset={appliedPresetRef}
        style={variables}
      >
        <style>{PORT_CSS}</style>
        {children}
      </div>
    </EmployeeUiPortContext.Provider>
  );
}

export function useEmployeeUiPort(): EmployeeUiPortContract {
  const value = useContext(EmployeeUiPortContext);
  if (!value) throw new Error("employee_ui_port_provider_required");
  return value;
}

type ThemeTokens = {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  ink: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
  line: string;
  radius: string;
  radiusSmall: string;
  shadow: string;
  font: string;
};

const THEMES: Record<string, ThemeTokens> = {
  amtech_light: {
    canvas: "#f7f9fc", surface: "#ffffff", surfaceRaised: "#ffffff", ink: "#111111", muted: "#667085",
    primary: "#e11d2a", secondary: "#2563eb", accent: "#dff6ff", line: "rgba(17,17,17,.10)",
    radius: "24px", radiusSmall: "14px", shadow: "0 20px 60px rgba(30,48,80,.10)",
    font: "var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif",
  },
  field_notebook: {
    canvas: "#efe9dc", surface: "#fffaf0", surfaceRaised: "#ffffff", ink: "#26231d", muted: "#716a5d",
    primary: "#c2410c", secondary: "#365314", accent: "#fef3c7", line: "rgba(70,57,38,.18)",
    radius: "12px", radiusSmall: "7px", shadow: "0 14px 34px rgba(77,55,28,.13)",
    font: "var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif",
  },
  ledger: {
    canvas: "#eef2f4", surface: "#ffffff", surfaceRaised: "#f8fafb", ink: "#102a2e", muted: "#547078",
    primary: "#0f766e", secondary: "#1d4ed8", accent: "#ccfbf1", line: "rgba(15,75,80,.16)",
    radius: "9px", radiusSmall: "5px", shadow: "0 10px 28px rgba(15,50,56,.09)",
    font: "var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif",
  },
  studio: {
    canvas: "#f3efff", surface: "#ffffff", surfaceRaised: "#fff8fe", ink: "#21152e", muted: "#766681",
    primary: "#7c3aed", secondary: "#db2777", accent: "#ede9fe", line: "rgba(88,45,122,.15)",
    radius: "30px", radiusSmall: "18px", shadow: "0 26px 72px rgba(87,45,130,.15)",
    font: "var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif",
  },
  editorial: {
    canvas: "#f3f0e8", surface: "#fffdf8", surfaceRaised: "#ffffff", ink: "#201d18", muted: "#726b61",
    primary: "#9f1239", secondary: "#1e3a5f", accent: "#fce7f3", line: "rgba(55,45,32,.16)",
    radius: "4px", radiusSmall: "2px", shadow: "0 14px 34px rgba(55,45,32,.10)",
    font: "Georgia,'Times New Roman',serif",
  },
  midnight: {
    canvas: "#07111f", surface: "#0d1b2d", surfaceRaised: "#13243a", ink: "#f5f7fb", muted: "#a6b3c7",
    primary: "#38bdf8", secondary: "#a78bfa", accent: "#172554", line: "rgba(193,220,255,.16)",
    radius: "20px", radiusSmall: "12px", shadow: "0 24px 70px rgba(0,0,0,.34)",
    font: "var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif",
  },
  high_contrast: {
    canvas: "#ffffff", surface: "#ffffff", surfaceRaised: "#ffffff", ink: "#000000", muted: "#242424",
    primary: "#a80000", secondary: "#0033cc", accent: "#fff200", line: "#000000",
    radius: "0px", radiusSmall: "0px", shadow: "4px 4px 0 #000000",
    font: "Arial,Helvetica,sans-serif",
  },
};

function themeTokens(themeKey: EmployeeUiThemeKey, brand: EmployeeUiPortContract["presentation"]["brand"]): ThemeTokens {
  const base = themeKey === "brand" || themeKey.startsWith("custom:") ? THEMES.amtech_light : THEMES[themeKey] ?? THEMES.amtech_light;
  if (themeKey !== "brand" && !themeKey.startsWith("custom:")) return base;
  return {
    ...base,
    primary: brand.primary ?? base.primary,
    secondary: brand.secondary ?? base.secondary,
    accent: brand.accent ?? base.accent,
    canvas: brand.canvas ?? base.canvas,
    surface: brand.surface ?? base.surface,
    surfaceRaised: brand.surface ?? base.surfaceRaised,
    ink: brand.ink ?? base.ink,
    muted: brand.muted ?? base.muted,
  };
}

const PORT_CSS = `
  .employee-ui-port{min-height:100dvh;background:var(--employee-canvas);color:var(--employee-ink);font-family:var(--employee-font)}
  .employee-ui-port .nextgen-employee-shell,.employee-ui-port .os-root,.employee-ui-port .pe-root{background:var(--employee-canvas)!important;color:var(--employee-ink)!important;font-family:var(--employee-font)!important}
  .employee-ui-port .nextgen-topbar,.employee-ui-port .nextgen-conversation,.employee-ui-port .nextgen-context-card,.employee-ui-port .os-header,.employee-ui-port .os-guidance,.employee-ui-port .os-section,.employee-ui-port .os-card,.employee-ui-port .os-loop-card,.employee-ui-port .os-focus,.employee-ui-port .os-command-dock,.employee-ui-port .pe-chat,.employee-ui-port .pe-draft-bar,.employee-ui-port .pe-email{background:var(--employee-surface)!important;color:var(--employee-ink)!important;border-color:var(--employee-line)!important;box-shadow:var(--employee-shadow)}
  .employee-ui-port .nextgen-message.employee,.employee-ui-port .nextgen-prompts button,.employee-ui-port .os-runtime,.employee-ui-port .os-actions .secondary,.employee-ui-port .pe-actions button{background:var(--employee-surface-raised)!important;color:var(--employee-ink)!important;border-color:var(--employee-line)!important}
  .employee-ui-port .nextgen-message.owner,.employee-ui-port .nextgen-composer>button,.employee-ui-port .os-guidance-actions button:not(.secondary),.employee-ui-port .os-command-input>button,.employee-ui-port .os-actions button:not(.secondary),.employee-ui-port .pe-compose button,.employee-ui-port .pe-email button{background:var(--employee-primary)!important;color:#fff!important;border-color:var(--employee-primary)!important}
  .employee-ui-port .nextgen-brand span,.employee-ui-port .os-brand span,.employee-ui-port .nextgen-welcome>p{color:var(--employee-primary)!important}
  .employee-ui-port .nextgen-topbar nav button.active,.employee-ui-port .nextgen-rail-head button,.employee-ui-port .os-card>p,.employee-ui-port .os-section>header p,.employee-ui-port .pe-head p{color:var(--employee-secondary)!important}
  .employee-ui-port .nextgen-employee-shell *,.employee-ui-port .os-root *,.employee-ui-port .pe-root *{border-radius:min(var(--employee-radius),999px)}
  .employee-ui-port textarea,.employee-ui-port input,.employee-ui-port select{border-color:var(--employee-line)!important;background:var(--employee-surface-raised)!important;color:var(--employee-ink)!important}
  .employee-ui-port [class*=muted],.employee-ui-port small,.employee-ui-port .nextgen-welcome>span,.employee-ui-port .os-section>header>span{color:var(--employee-muted)!important}

  .employee-ui-port[data-ui-layout="focus"] .nextgen-talk{grid-template-columns:minmax(0,1fr);width:min(980px,100%)}
  .employee-ui-port[data-ui-layout="focus"] .nextgen-rail{display:none}
  .employee-ui-port[data-ui-layout="focus"] .os-shell,.employee-ui-port[data-ui-layout="focus"] .os-regions{width:min(1040px,100%);margin-inline:auto}
  .employee-ui-port[data-ui-layout="focus"] .os-loop-layout{grid-template-columns:1fr}

  .employee-ui-port[data-ui-layout="canvas"] .nextgen-talk{grid-template-columns:360px minmax(0,1fr);width:min(1500px,100%)}
  .employee-ui-port[data-ui-layout="canvas"] .nextgen-conversation{order:2}
  .employee-ui-port[data-ui-layout="canvas"] .nextgen-rail{order:1;position:relative;top:auto}
  .employee-ui-port[data-ui-layout="canvas"] .os-regions{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:18px}
  .employee-ui-port[data-ui-layout="canvas"] .os-section{grid-column:span 6}
  .employee-ui-port[data-ui-layout="canvas"] .os-section:has(.os-loop-layout){grid-column:1/-1}

  .employee-ui-port[data-ui-layout="form_chat"] .nextgen-talk{grid-template-columns:1fr;width:min(920px,100%)}
  .employee-ui-port[data-ui-layout="form_chat"] .nextgen-rail{display:none}
  .employee-ui-port[data-ui-layout="form_chat"] .nextgen-conversation{border-radius:var(--employee-radius);box-shadow:none}
  .employee-ui-port[data-ui-layout="form_chat"] .pe-shell{grid-template-columns:minmax(320px,520px) minmax(0,1fr)}

  .employee-ui-port[data-ui-layout="boundless"] .nextgen-topbar{position:relative;background:transparent!important;border:0!important;box-shadow:none}
  .employee-ui-port[data-ui-layout="boundless"] .nextgen-talk{width:100%;padding:0;grid-template-columns:1fr}
  .employee-ui-port[data-ui-layout="boundless"] .nextgen-rail{display:none}
  .employee-ui-port[data-ui-layout="boundless"] .nextgen-conversation{min-height:calc(100dvh - 68px);border:0!important;border-radius:0!important;box-shadow:none}
  .employee-ui-port[data-ui-layout="boundless"] .os-shell{width:100%;max-width:none;padding-inline:clamp(18px,6vw,100px)}

  .employee-ui-port[data-ui-components="compact"]{--employee-radius:10px;--employee-radius-small:5px}
  .employee-ui-port[data-ui-components="compact"] .os-shell,.employee-ui-port[data-ui-components="compact"] .nextgen-talk{gap:10px;padding:10px}
  .employee-ui-port[data-ui-components="compact"] .os-section,.employee-ui-port[data-ui-components="compact"] .os-card,.employee-ui-port[data-ui-components="compact"] .nextgen-context-card{padding:11px!important}

  .employee-ui-port[data-ui-components="editorial"] h1,.employee-ui-port[data-ui-components="editorial"] h2,.employee-ui-port[data-ui-components="editorial"] h3{font-family:Georgia,'Times New Roman',serif;font-weight:500;letter-spacing:-.035em}
  .employee-ui-port[data-ui-components="editorial"] button,.employee-ui-port[data-ui-components="editorial"] input,.employee-ui-port[data-ui-components="editorial"] textarea{font-family:var(--font-inter),Inter,system-ui,sans-serif}

  .employee-ui-port[data-ui-components="terminal"]{--employee-radius:0px;--employee-radius-small:0px;--employee-shadow:none;--employee-font:'SFMono-Regular',Consolas,'Liberation Mono',monospace}
  .employee-ui-port[data-ui-components="terminal"] *{letter-spacing:0!important}
  .employee-ui-port[data-ui-components="terminal"] h1,.employee-ui-port[data-ui-components="terminal"] h2,.employee-ui-port[data-ui-components="terminal"] h3{text-transform:uppercase}

  .employee-ui-port[data-ui-components="form_forward"] .pe-compose,.employee-ui-port[data-ui-components="form_forward"] .pe-email{padding:clamp(18px,4vw,36px)}
  .employee-ui-port[data-ui-components="form_forward"] textarea,.employee-ui-port[data-ui-components="form_forward"] input{min-height:56px;font-size:16px}

  .employee-ui-port[data-ui-density="calm"] .nextgen-thread,.employee-ui-port[data-ui-density="calm"] .os-shell{padding:clamp(24px,5vw,64px)}
  .employee-ui-port[data-ui-density="dense"] .nextgen-thread,.employee-ui-port[data-ui-density="dense"] .os-shell{padding:12px}

  @media(max-width:900px){
    .employee-ui-port[data-ui-layout="canvas"] .nextgen-talk,.employee-ui-port[data-ui-layout="form_chat"] .pe-shell{grid-template-columns:1fr}
    .employee-ui-port[data-ui-layout="canvas"] .nextgen-conversation,.employee-ui-port[data-ui-layout="canvas"] .nextgen-rail{order:initial}
    .employee-ui-port[data-ui-layout="canvas"] .os-section{grid-column:1/-1}
  }
`;
