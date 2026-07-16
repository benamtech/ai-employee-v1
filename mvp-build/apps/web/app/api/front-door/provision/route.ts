import { proxyJson } from "../../_lib/manager";

export async function POST(req: Request) {
  return proxyJson("/manager/onboarding/provision-from-session", await req.json());
}
