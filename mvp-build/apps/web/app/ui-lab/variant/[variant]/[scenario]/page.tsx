import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../../../../_lib/ui-fixtures";
import { FIXTURE_SCENARIOS, type FixtureScenarioId } from "../../../../../agent/[employeeId]/fixture-runtime";
import { isUiVariantRegistryId } from "../../../../../_components/ui-variant/registry.generated";
import { parseUiLabPreviewConfig } from "../../../../ui-lab-config";
import { VariantFixtureLabClient } from "./VariantFixtureLabClient";

export const metadata = { title: "UI Variant Lab — AMTECH" };

export default async function UiVariantScenarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; scenario: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!uiFixtureMode()) notFound();
  const { variant, scenario } = await params;
  if (!isUiVariantRegistryId(variant)) notFound();
  const fixture = FIXTURE_SCENARIOS.find((item) => item.id === scenario);
  if (!fixture) notFound();
  const { config } = parseUiLabPreviewConfig(fixture.id as FixtureScenarioId, await searchParams);
  return <VariantFixtureLabClient variantId={variant} scenarioId={fixture.id as FixtureScenarioId} employeeId={fixture.employeeId} config={config} />;
}
