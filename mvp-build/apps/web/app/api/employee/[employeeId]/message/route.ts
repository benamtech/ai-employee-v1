import { cookies } from "next/headers";
import { proxyJson } from "../../../_lib/manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const body = await req.json();
  const cookieStore = await cookies();
  return proxyJson(`/manager/employee/${employeeId}/message`, {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
    message: body.message,
  });
}
