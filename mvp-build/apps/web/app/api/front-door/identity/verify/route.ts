import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { managerPost } from "../../../_lib/manager";

export async function POST(req: Request) {
  const ownerSessionToken = (await cookies()).get("amtech_owner_session")?.value;
  if (!ownerSessionToken) return NextResponse.json({ error: "owner_session_missing" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const response = await managerPost("/manager/onboarding/identity/verify", {
    ...body,
    owner_session_token: ownerSessionToken,
  });
  const json = await response.json().catch(() => ({}));
  return NextResponse.json(json, { status: response.status });
}
