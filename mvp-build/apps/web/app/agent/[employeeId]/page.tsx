import { AgentClient } from "./AgentClient";

export default async function AgentSurface({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  return <AgentClient employeeId={employeeId} />;
}
