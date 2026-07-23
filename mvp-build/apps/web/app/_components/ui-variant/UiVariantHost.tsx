"use client";

import { Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { EmployeeExperienceModelV1, UiVariantIntentRequest, UiVariantIntentResult } from "@amtech/shared";
import { UI_VARIANT_REGISTRY, isUiVariantRegistryId, type UiVariantRegistryId } from "./registry.generated";

export function UiVariantHost({
  variantId,
  model,
  referenceClient,
  dispatchIntent,
  viewport = "responsive",
}: {
  variantId: string;
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

  const Component = entry.Component;
  return (
    <div
      className="amtech-ui-variant-host"
      data-ui-variant={entry.manifest.id}
      data-ui-variant-status={entry.manifest.status}
      data-ui-variant-isolation={entry.manifest.isolation}
      style={style}
    >
      <Suspense fallback={<VariantLoading name={entry.manifest.name} />}>
        <Component
          manifest={entry.manifest}
          model={model}
          environment={environment}
          slots={{ reference_client: referenceClient }}
          dispatchIntent={dispatchIntent}
        />
      </Suspense>
    </div>
  );
}

function VariantLoading({ name }: { name: string }) {
  return <div role="status" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 32, fontFamily: "system-ui" }}>Loading {name}…</div>;
}
