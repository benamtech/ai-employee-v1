import { NextResponse } from "next/server";
import { managerHeaders, managerOrigin } from "../../_lib/manager";

function browserAuthorized(req: Request): boolean {
  const required = process.env.AMTECH_ADMIN_BROWSER_TOKEN;
  if (!required) return process.env.NODE_ENV !== "production";
  return req.headers.get("X-AMTECH-Admin-Token") === required;
}

function adminHeaders(req: Request): HeadersInit {
  const platformUser = process.env.AMTECH_ADMIN_USER_ID ?? "platform_local";
  const supportReason =
    req.headers.get("X-AMTECH-Support-Reason") ??
    process.env.AMTECH_ADMIN_SUPPORT_REASON ??
    "Operator review for pilot readiness";
  return {
    ...managerHeaders(),
    "X-AMTECH-Platform-User-Id": platformUser,
    "X-AMTECH-Support-Reason": supportReason,
  };
}

async function proxy(req: Request, params: Promise<{ path: string[] }>, method: "GET" | "POST") {
  if (!browserAuthorized(req)) {
    return NextResponse.json({ error: "admin_browser_token_required" }, { status: 401 });
  }
  const { path } = await params;
  const url = new URL(req.url);
  const managerPath = `/manager/admin/${path.join("/")}${url.search}`;
  const init: RequestInit = { method, headers: adminHeaders(req) };
  if (method === "POST") init.body = await req.text();
  const res = await fetch(`${managerOrigin()}${managerPath}`, init);
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params, "GET");
}

export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params, "POST");
}
