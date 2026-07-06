import { NextResponse } from "next/server";
import { managerPost } from "../../_lib/manager";

/**
 * Dev-only owner "login". The real /login page is a Phase 1 Supabase Auth stub, and
 * the amtech_owner_session cookie is otherwise only ever set during onboarding — so
 * there is no way to authenticate the Work Surface for an EXISTING employee while
 * testing. This route mints an owner session (via the Manager, which owns the DB +
 * SIGNING_SECRET) and sets the httpOnly cookie, then redirects to that employee's
 * webchat. Just visit /api/dev/login?employeeId=<id> and you land logged in.
 *
 * Double-gated: DEV_OWNER_LOGIN=1 AND not production. Fails closed otherwise.
 */
export async function GET(req: Request) {
  const isProd = (process.env.NODE_ENV as string) === "production";
  if (process.env.DEV_OWNER_LOGIN !== "1" || isProd) {
    return NextResponse.json({ error: "dev_login_disabled" }, { status: 403 });
  }
  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employeeId");
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId query param required" }, { status: 400 });
  }
  const res = await managerPost("/manager/dev/mint-owner-session", { employee_id: employeeId });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.owner_session_token) {
    return NextResponse.json({ error: json?.error ?? "mint_failed" }, { status: res.status || 500 });
  }
  const out = NextResponse.redirect(new URL(`/agent/${employeeId}`, url.origin));
  out.cookies.set("amtech_owner_session", json.owner_session_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    expires: json.owner_session_expires_at ? new Date(json.owner_session_expires_at) : undefined,
  });
  return out;
}
