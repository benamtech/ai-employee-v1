import { cookies } from "next/headers";
import { proxyJson } from "../../../_lib/manager";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  return proxyJson(`/manager/employee/${employeeId}/operating-snapshot`, {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
  });
}
