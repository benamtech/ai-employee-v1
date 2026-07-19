import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../_lib/ui-fixtures";
import { FIXTURE_SCENARIOS, type FixtureScenarioId } from "../../agent/[employeeId]/fixture-runtime";
import { FixtureLabClient } from "./FixtureLabClient";

export const metadata = { title: "Fixture Employee — AMTECH" };

export default async function FixtureLabScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  if (!uiFixtureMode()) notFound();
  const { scenario } = await params;
  const match = FIXTURE_SCENARIOS.find((item) => item.id === scenario);
  if (!match) notFound();

  return <FixtureLabClient scenarioId={match.id as FixtureScenarioId} employeeId={match.employeeId} />;
}
