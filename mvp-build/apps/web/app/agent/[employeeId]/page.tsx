import { AgentSurface } from "./AgentSurface";
import { uiFixtureMode } from "../../_lib/ui-fixtures";

export const metadata = { title: "Your employee — AMTECH" };

export default async function AgentPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  return <AgentSurface employeeId={employeeId} fixtureMode={uiFixtureMode()} />;
}
