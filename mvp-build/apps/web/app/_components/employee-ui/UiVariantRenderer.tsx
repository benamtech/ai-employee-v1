"use client";

import { Component, Suspense, type ComponentType, type ReactNode } from "react";
import type {
  EmployeeUiPortContract,
  ResourcePayload,
  UiVariantExperienceModel,
  UiVariantIntent,
  UiVariantIntentResult,
  UiVariantRenderProps,
} from "@amtech/shared";
import { UI_VARIANT_LOADERS, uiVariantManifest } from "../../../ui-variants/registry.generated";

export interface UiVariantRendererProps {
  variantId: string;
  payload: ResourcePayload;
  port: EmployeeUiPortContract;
  scenarioId?: string;
  runtime?: {
    health?: UiVariantExperienceModel["runtime"]["health"];
    phase?: string | null;
    summary?: string;
    observed_at?: string | null;
    running?: boolean;
  };
  onIntent?: (intent: UiVariantIntent) => Promise<UiVariantIntentResult> | UiVariantIntentResult;
  webClient?: ReactNode;
}

export function UiVariantRenderer({ variantId, payload, port, scenarioId, runtime, onIntent, webClient }: UiVariantRendererProps) {
  const manifest = uiVariantManifest(variantId);
  const LazyVariant = UI_VARIANT_LOADERS[variantId as keyof typeof UI_VARIANT_LOADERS] as ComponentType<UiVariantRenderProps> | undefined;
  if (!manifest || !LazyVariant) return <VariantFailure title="Variant unavailable" detail={variantId} />;
  if (!manifest.adapters.includes(port.adapter_key)) return <VariantFailure title="Adapter unsupported" detail={`${variantId} does not declare ${port.adapter_key}`} />;

  const model = buildUiVariantExperienceModel(payload, port, scenarioId, runtime);
  const dispatch = async (intent: UiVariantIntent): Promise<UiVariantIntentResult> => {
    if (onIntent) return onIntent(intent);
    return { accepted: false, code: "ui_variant_intent_unhandled", message: `No host handler for ${intent.type}` };
  };

  return (
    <VariantErrorBoundary variantId={variantId}>
      <section
        className="ui-variant-runtime"
        data-ui-variant={variantId}
        data-ui-variant-status={manifest.status}
        style={{ contain: "layout paint style", containerType: "inline-size", minHeight: "100dvh" }}
      >
        <Suspense fallback={<VariantLoading name={manifest.name} />}>
          <LazyVariant model={model} dispatch={dispatch} slots={{ web_client: webClient }} />
        </Suspense>
      </section>
    </VariantErrorBoundary>
  );
}

export function buildUiVariantExperienceModel(
  payload: ResourcePayload,
  port: EmployeeUiPortContract,
  scenarioId?: string,
  runtime?: UiVariantRendererProps["runtime"],
): UiVariantExperienceModel {
  const operating = payload.operating_state;
  const employee = payload.employee;
  return {
    version: 1,
    identity: {
      employee_id: payload.employee_id ?? employee?.id ?? "unknown-employee",
      employee_name: operating?.context.employee_name ?? employee?.name ?? "AI Employee",
      business_name: operating?.context.business_name,
      business_kind: operating?.context.business_kind,
      profile_key: operating?.context.profile_key,
      status: employee?.status,
    },
    adapter: port.adapter_key,
    presentation: port.presentation,
    runtime: {
      health: runtime?.health ?? payload.runtime_health?.status ?? "unknown",
      phase: runtime?.phase,
      summary: runtime?.summary ?? payload.runtime_health?.message ?? operating?.guidance.summary ?? "Employee state loaded.",
      observed_at: runtime?.observed_at ?? payload.runtime_health?.checked_at,
      is_fixture: Boolean(scenarioId),
      is_running: runtime?.running ?? false,
    },
    conversation: payload.messages ?? [],
    approvals: payload.approvals ?? [],
    work: {
      loops: operating?.loops ?? [],
      tasks: payload.tasks ?? [],
      active_saves: operating?.active_saves ?? [],
      delegated: operating?.delegated_work ?? [],
    },
    attention: payload.resurface_items ?? [],
    decisions: operating?.decisions ?? [],
    changes: operating?.changes ?? [],
    connections: payload.connection_surfaces ?? [],
    abilities: payload.abilities ?? [],
    capabilities: payload.capabilities ?? [],
    evidence: operating?.evidence ?? [],
    outputs: payload.outputs ?? [],
    environment: {
      scenario_id: scenarioId,
      viewport: typeof window === "undefined" ? null : `${window.innerWidth}x${window.innerHeight}`,
      reduced_motion: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      color_scheme: typeof window === "undefined" ? "unknown" : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    },
  };
}

class VariantErrorBoundary extends Component<{ variantId: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("ui_variant_render_failed", this.props.variantId, error); }
  render() {
    if (this.state.error) return <VariantFailure title="Variant crashed safely" detail={this.state.error.message} />;
    return this.props.children;
  }
}

function VariantLoading({ name }: { name: string }) {
  return <div role="status" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", font: "700 14px system-ui" }}>Loading {name}…</div>;
}

function VariantFailure({ title, detail }: { title: string; detail: string }) {
  return <div role="alert" style={{ minHeight: "100dvh", display: "grid", placeContent: "center", gap: 8, padding: 24, fontFamily: "system-ui" }}><strong>{title}</strong><span>{detail}</span></div>;
}
