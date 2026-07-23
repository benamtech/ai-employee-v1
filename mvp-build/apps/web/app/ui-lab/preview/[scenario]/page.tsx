import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../../_lib/ui-fixtures";
import {
  FIXTURE_SCENARIOS,
  type FixtureScenarioId,
} from "../../../agent/[employeeId]/fixture-runtime";
import { ProductionFixtureLabClient } from "../../[scenario]/ProductionFixtureLabClient";
import { parseUiLabPreviewConfig } from "../../ui-lab-config";

export const metadata = { title: "UI Lab preview — AMTECH" };

export default async function UiLabPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenario: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!uiFixtureMode()) notFound();
  const { scenario } = await params;
  const match = FIXTURE_SCENARIOS.find((item) => item.id === scenario);
  if (!match) notFound();
  const { config, mode } = parseUiLabPreviewConfig(match.id as FixtureScenarioId, await searchParams);

  return (
    <ProductionFixtureLabClient
      scenarioId={match.id as FixtureScenarioId}
      employeeId={match.employeeId}
      config={config}
      mode={mode}
    />
  );
}
