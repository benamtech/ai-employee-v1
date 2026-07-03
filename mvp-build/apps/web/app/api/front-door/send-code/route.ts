import { proxyJson } from "../../_lib/manager";

export async function POST(req: Request) {
  return proxyJson("/manager/tools/send_phone_verification", await req.json());
}
