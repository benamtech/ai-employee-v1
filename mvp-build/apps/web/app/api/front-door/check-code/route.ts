import { proxyJson } from "../../_lib/manager";

export async function POST(req: Request) {
  return proxyJson("/manager/tools/check_phone_code", await req.json());
}
