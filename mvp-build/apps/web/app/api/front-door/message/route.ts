import { proxyJson } from "../../_lib/manager";

export async function POST(req: Request) {
  return proxyJson("/manager/orchestrator/web", await req.json());
}
