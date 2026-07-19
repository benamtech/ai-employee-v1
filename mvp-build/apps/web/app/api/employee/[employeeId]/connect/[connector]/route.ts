import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { managerPost } from "../../../../../_lib/manager";

function safeReturnPath(value: string | null, employeeId: string): string {
  const fallback = `/agent/${encodeURIComponent(employeeId)}`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value) || value.length > 500) return fallback;
  return value;
}

function googleConsentUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "accounts.google.com") return null;
    return url;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; connector: string }> },
) {
  const { employeeId, connector } = await params;
  if (connector !== "gmail") return NextResponse.json({ error: "connector_not_supported" }, { status: 404 });
  const cookieStore = await cookies();
  const ownerSession = cookieStore.get("amtech_owner_session")?.value;
  if (!ownerSession) {
    const login = new URL("/login", req.url);
    login.searchParams.set("returnTo", new URL(req.url).pathname + new URL(req.url).search);
    return NextResponse.redirect(login);
  }
  const returnTo = safeReturnPath(new URL(req.url).searchParams.get("returnTo"), employeeId);
  const response = await managerPost(`/manager/employee/${encodeURIComponent(employeeId)}/workbench/connect/${connector}`, {
    owner_session_token: ownerSession,
    return_to: returnTo,
  });
  const json = await response.json().catch(() => ({})) as {
    error?: string;
    message?: string;
    proof?: { consent_url?: unknown };
  };
  if (!response.ok || json.error) {
    const failure = new URL(`/agent/${encodeURIComponent(employeeId)}/connect/${connector}`, req.url);
    failure.searchParams.set("state", "error");
    failure.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(failure);
  }
  const consent = googleConsentUrl(json.proof?.consent_url);
  if (!consent) return NextResponse.json({ error: "connector_consent_url_invalid" }, { status: 502 });
  return NextResponse.redirect(consent);
}
