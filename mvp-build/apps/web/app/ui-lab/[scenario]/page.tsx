import { notFound, redirect } from "next/navigation";
import { FIXTURE_SCENARIOS } from "../../agent/[employeeId]/fixture-runtime";

export const metadata = { title: "UI Lab workbench — AMTECH" };

export default async function FixtureLabScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario } = await params;
  const match = FIXTURE_SCENARIOS.find((item) => item.id === scenario);
  if (!match) notFound();
  redirect(`/ui-lab/fixtures?scenario=${match.id}`);
}
