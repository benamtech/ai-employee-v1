import { AgentClient } from "./AgentClient";

export const metadata = { title: "Your employee — AMTECH" };

export default async function AgentSurface({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  return <AgentClient employeeId={employeeId} />;
}
