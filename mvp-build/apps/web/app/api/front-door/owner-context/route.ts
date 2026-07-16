import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../_lib/manager";

export async function POST(req: Request) {
  const token = (await cookies()).get("amtech_owner_session")?.value;
  if (!token) return NextResponse.json({ error: "owner_session_missing" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const res = await managerPost(MANAGER_API.onboardingOwnerContext, {
    owner_session_token: token,
    session_id: body?.session_id,
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
