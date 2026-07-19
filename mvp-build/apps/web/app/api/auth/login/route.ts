import { NextResponse } from "next/server";
import { managerPost } from "../../_lib/manager";

function supabaseAuthConfig(): { url: string; anonKey: string } | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url: url.replace(/\/$/, ""), anonKey } : null;
}

export async function POST(req: Request) {
  const input = await req.json().catch(() => ({})) as {
    email?: string;
    password?: string;
    account_id?: string;
  };
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "email_and_password_required" }, { status: 400 });
  }
  const config = supabaseAuthConfig();
  if (!config) {
    return NextResponse.json({ error: "owner_login_unavailable" }, { status: 503 });
  }

  const authResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  }).catch(() => null);
  if (!authResponse) {
    return NextResponse.json({ error: "owner_login_unavailable" }, { status: 503 });
  }
  const auth = await authResponse.json().catch(() => ({})) as { access_token?: string };
  if (!authResponse.ok || !auth.access_token) {
    return NextResponse.json({ error: "invalid_login" }, { status: 401 });
  }

  const managerResponse = await managerPost("/manager/auth/owner-login", {
    access_token: auth.access_token,
    ...(input.account_id ? { account_id: input.account_id } : {}),
  });
  const json = await managerResponse.json().catch(() => ({}));
  const response = NextResponse.json(json, { status: managerResponse.status });
  if (managerResponse.ok && json.owner_session_token) {
    response.cookies.set("amtech_owner_session", String(json.owner_session_token), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: json.owner_session_expires_at ? new Date(json.owner_session_expires_at) : undefined,
    });
  }
  return response;
}
