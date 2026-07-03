import { proxyJson } from "../../_lib/manager";

export async function POST(req: Request) {
  return proxyJson("/manager/tools/provision_employee", await req.json());
}
