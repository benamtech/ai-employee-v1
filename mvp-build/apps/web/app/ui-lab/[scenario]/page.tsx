import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../_lib/ui-fixtures";
import { FIXTURE_SCENARIOS, type FixtureScenarioId } from "../../agent/[employeeId]/fixture-runtime";
import { ProductionFixtureLabClient } from "./ProductionFixtureLabClient";

export const metadata = { title: "UI Lab — AMTECH" };

export default async function FixtureLabScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  if (!uiFixtureMode()) notFound();
  const { scenario } = await params;
  const match = FIXTURE_SCENARIOS.find((item) => item.id === scenario);
  if (!match) notFound();

  return <ProductionFixtureLabClient scenarioId={match.id as FixtureScenarioId} employeeId={match.employeeId} />;
}
