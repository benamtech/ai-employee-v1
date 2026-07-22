import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../_lib/ui-fixtures";
import {
  FIXTURE_SCENARIOS,
  type FixtureScenarioId,
} from "../../agent/[employeeId]/fixture-runtime";
import { UiLabWorkbenchClient } from "./UiLabWorkbenchClient";

export const metadata = { title: "UI Lab workbench — AMTECH" };

export default async function FixtureLabScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  if (!uiFixtureMode()) notFound();
  const { scenario } = await params;
  const match = FIXTURE_SCENARIOS.find((item) => item.id === scenario);
  if (!match) notFound();

  return <UiLabWorkbenchClient scenarioId={match.id as FixtureScenarioId} />;
}
