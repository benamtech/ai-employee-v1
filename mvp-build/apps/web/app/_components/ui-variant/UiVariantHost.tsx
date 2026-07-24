"use client";

import { Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type {
  EmployeeExperienceModelV1,
  UiVariantAdmission,
  UiVariantIntentRequest,
  UiVariantIntentResult,
} from "@amtech/shared";
import { UI_VARIANT_REGISTRY, isUiVariantRegistryId, type UiVariantRegistryId } from "./registry.generated";

export function UiVariantHost({
  variantId,
  admission,
  model,
  referenceClient,
  dispatchIntent,
  viewport = "responsive",
}: {
  variantId: string;
  admission: UiVariantAdmission;
  model: EmployeeExperienceModelV1;
  referenceClient: ReactNode;
  dispatchIntent: (request: UiVariantIntentRequest) => Promise<UiVariantIntentResult>;
  viewport?: "responsive" | "desktop" | "tablet" | "mobile";
}) {
  const selectedId: UiVariantRegistryId = isUiVariantRegistryId(variantId) ? variantId : "reference-client";
  const entry = UI_VARIANT_REGISTRY[selectedId];
  const [preferences, setPreferences] = useState({ reducedMotion: false, colorScheme: "unknown" as "light" | "dark" | "unknown" });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setPreferences({ reducedMotion: motion.matches, colorScheme: dark.matches ? "dark" : "light" });
    update();
    motion.addEventListener("change", update);
    dark.addEventListener("change", update);
    return () => { motion.removeEventListener("change", update); dark.removeEventListener("change", update); };
  }, []);

  const environment = useMemo(() => ({
    lab: model.metadata.fixture,
    viewport,
    reduced_motion: preferences.reducedMotion,
    color_scheme: preferences.colorScheme,
    locale: typeof navigator === "undefined" ? "en-US" : navigator.language,
  }), [model.metadata.fixture, preferences, viewport]);

  const style = {
    contain: entry.manifest.performance.containment === "layout_paint_style" ? "layout paint style" : entry.manifest.performance.containment === "layout_style" ? "layout style" : "none",
    contentVisibility: entry.manifest.performance.content_visibility,
    containerType: "inline-size",
    minHeight: "100dvh",
  } as CSSProperties;

  // A refused variant never renders: the generated runtime is a boundary, not a preference.
  if (!admission.admitted || admission.variant_id !== entry.manifest.id) {
    return (
      <UiVariantRefused admission={admission} variantName={entry.manifest.name} referenceClient={referenceClient} />
    );
  }

  const Component = entry.Component;
  return (
    <div
      className="amtech-ui-variant-host"
      data-ui-variant={entry.manifest.id}
      data-ui-variant-status={entry.manifest.status}
      data-ui-variant-isolation={entry.manifest.isolation}
      data-ui-variant-admission={admission.reason_code}
      data-ui-variant-tier={admission.tier}
      style={style}
    >
      {admission.requires_banner ? <UiVariantReviewBanner message={admission.owner_message} /> : null}
      <Suspense fallback={<VariantLoading name={entry.manifest.name} />}>
        <Component
          manifest={entry.manifest}
          model={model}
          environment={environment}
          slots={{ reference_client: referenceClient }}
          dispatchIntent={dispatchIntent}
        />
      </Suspense>
      {admission.requires_reference_client && entry.manifest.id !== "reference-client"
        ? <section className="amtech-ui-variant-reference">{referenceClient}</section>
        : null}
    </div>
  );
}

function UiVariantReviewBanner({ message }: { message: string }) {
  return (
    <p
      role="status"
      data-ui-variant-banner="lab_review"
      style={{ margin: 0, padding: "10px 16px", background: "#fef3c7", color: "#854d0e", fontSize: 12, fontWeight: 750, fontFamily: "system-ui" }}
    >
      {message}
    </p>
  );
}

function UiVariantRefused({
  admission,
  variantName,
  referenceClient,
}: {
  admission: UiVariantAdmission;
  variantName: string;
  referenceClient: ReactNode;
}) {
  return (
    <section
      className="amtech-ui-variant-refused"
      data-ui-variant-admission={admission.reason_code}
      data-ui-variant-tier={admission.tier}
      style={{ minHeight: "100dvh", padding: 24, display: "grid", gap: 16, alignContent: "start", fontFamily: "system-ui", color: "#111" }}
    >
      <div style={{ padding: 16, border: "1px solid rgba(17,17,17,.12)", borderRadius: 8, background: "#fff", display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 16 }}>{variantName} was not opened</strong>
        <p style={{ margin: 0, color: "#344054" }}>{admission.owner_message}</p>
        <p style={{ margin: 0, color: "#667085", fontSize: 12 }}>
          Your employee is unchanged. Sample-data versions of every design stay available at <a href="/ui-lab/fixtures">the fixtures route</a>.
        </p>
      </div>
      {referenceClient}
    </section>
  );
}

function VariantLoading({ name }: { name: string }) {
  return <div role="status" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 32, fontFamily: "system-ui" }}>Loading {name}…</div>;
}
