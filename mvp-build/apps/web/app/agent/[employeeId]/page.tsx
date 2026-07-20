import { AgentSurface } from "./AgentSurface";
import { CapabilityDrawer } from "./components/CapabilityDrawer";
import { uiFixtureMode } from "../../_lib/ui-fixtures";

export const metadata = { title: "Your employee — AMTECH" };

export default async function AgentPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const fixtureMode = uiFixtureMode();
  return (
    <>
      <AgentSurface employeeId={employeeId} fixtureMode={fixtureMode} />
      <CapabilityDrawer employeeId={employeeId} fixtureMode={fixtureMode} />
    </>
  );
}
