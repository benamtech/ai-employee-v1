import { NextResponse } from "next/server";
import { managerPost } from "../../_lib/manager";

export async function POST(req: Request) {
  const res = await managerPost("/manager/tools/create_account", await req.json());
  const json = await res.json().catch(() => ({}));
  const out = NextResponse.json(json, { status: res.status });
  const token = json?.proof?.owner_session_token;
  const expires = json?.proof?.owner_session_expires_at;
  if (token) {
    out.cookies.set("amtech_owner_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expires ? new Date(expires) : undefined,
    });
  }
  return out;
}
