import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { managerPost } from "../../../_lib/manager";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const response = await managerPost(`/manager/employee/${employeeId}/operating-snapshot`, {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
  });
  const json = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) return NextResponse.json(json, { status: response.status });
  if (!json.operating_state) {
    return NextResponse.json({ error: "operating_state_unavailable" }, { status: 503 });
  }
  return NextResponse.json(json, { status: response.status });
}
