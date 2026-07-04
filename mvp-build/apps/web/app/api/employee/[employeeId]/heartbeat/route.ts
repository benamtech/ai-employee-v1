import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { proxyJson } from "../../../_lib/manager";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  return proxyJson(MANAGER_API.employeeHeartbeat(employeeId), {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
  });
}
