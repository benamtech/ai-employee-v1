import { NextResponse } from "next/server";
import { managerPost } from "../../_lib/manager";
import { setVisitorCookie, visitorToken } from "../_lib";

export async function POST() {
  const res = await managerPost("/manager/public-estimator/session", {
    visitor_token: await visitorToken(),
  });
  const json = await res.json().catch(() => ({}));
  const out = NextResponse.json(json, { status: res.status });
  if (res.ok && json.visitor_token) await setVisitorCookie(out, String(json.visitor_token), json.expires_at ? String(json.expires_at) : undefined);
  return out;
}
