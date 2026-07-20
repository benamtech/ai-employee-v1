import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../../../_lib/manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const body = await req.json();
  const cookieStore = await cookies();
  const ownerSessionToken = cookieStore.get("amtech_owner_session")?.value;
  if (!ownerSessionToken) return NextResponse.json({ error: "owner_session_missing" }, { status: 401 });

  const resourceRes = await managerPost(MANAGER_API.employeeResources(employeeId), {
    owner_session_token: ownerSessionToken,
  });
  const resources = await resourceRes.json().catch(() => ({}));
  if (!resourceRes.ok || !resources.account_id) {
    return NextResponse.json(resources, { status: resourceRes.status });
  }
  const res = await managerPost("/manager/tools/resolve_approval", {
    owner_session_token: ownerSessionToken,
    account_id: resources.account_id,
    employee_id: employeeId,
    approval_id: body.approval_id,
    owner_response: body.owner_response,
    channel: "web",
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
