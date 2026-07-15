import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { managerHeaders, managerOrigin, managerPost } from "../_lib/manager";

export const PUBLIC_ESTIMATOR_COOKIE = "amtech_public_estimator";

export async function visitorToken(): Promise<string | undefined> {
  return (await cookies()).get(PUBLIC_ESTIMATOR_COOKIE)?.value;
}

export async function setVisitorCookie(res: NextResponse, token: string, expiresAt?: string): Promise<void> {
  res.cookies.set(PUBLIC_ESTIMATOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt ? new Date(expiresAt) : undefined,
  });
}

export async function postWithVisitor(path: string, body: Record<string, unknown>): Promise<NextResponse> {
  const token = await visitorToken();
  const res = await managerPost(path, { ...body, visitor_token: token });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function getCurrentDraft(visitor_session_id: string): Promise<NextResponse> {
  const token = await visitorToken();
  const url = new URL(`${managerOrigin()}/manager/public-estimator/current-draft`);
  url.searchParams.set("visitor_session_id", visitor_session_id);
  if (token) url.searchParams.set("visitor_token", token);
  const res = await fetch(url, { method: "GET", headers: managerHeaders() });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
