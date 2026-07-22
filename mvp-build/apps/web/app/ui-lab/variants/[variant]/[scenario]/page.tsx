import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../../../_lib/ui-fixtures";
import { FIXTURE_SCENARIOS, type FixtureScenarioId } from "../../../../agent/[employeeId]/fixture-runtime";
import { uiVariantManifest } from "../../../../../ui-variants/registry.generated";
import { UiVariantWorkbenchClient } from "./UiVariantWorkbenchClient";

export const metadata = { title: "UI Variant Workbench — AMTECH" };

export default async function UiVariantWorkbenchPage({ params }: { params: Promise<{ variant: string; scenario: string }> }) {
  if (!uiFixtureMode()) notFound();
  const { variant, scenario } = await params;
  if (!uiVariantManifest(variant)) notFound();
  if (!FIXTURE_SCENARIOS.some((item) => item.id === scenario)) notFound();
  return <UiVariantWorkbenchClient variantId={variant} scenarioId={scenario as FixtureScenarioId} />;
}
