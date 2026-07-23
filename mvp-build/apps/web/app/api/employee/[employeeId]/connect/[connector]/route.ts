import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  genericConnectorRuntimeManifest,
  resolveConnectorRuntimeManifest,
  resolveOwnerManagedConnectorSetup,
} from "@amtech/shared";
import { managerPost } from "../../../../_lib/manager";

function safeReturnPath(value: string | null, employeeId: string): string {
  const fallback = `/agent/${encodeURIComponent(employeeId)}`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value) || value.length > 500) return fallback;
  return value;
}

function providerSetupUrl(value: unknown, allowedHosts: string[]): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function lifecycleReturnPath(employeeId: string, connectorKey: string, deskReturnTo: string): string {
  return `/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(connectorKey)}?returnTo=${encodeURIComponent(deskReturnTo)}`;
}

async function ownerSessionOrLogin(req: Request): Promise<{ token: string } | { redirect: NextResponse }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("amtech_owner_session")?.value;
  if (token) return { token };
  const login = new URL("/login", req.url);
  login.searchParams.set("returnTo", new URL(req.url).pathname + new URL(req.url).search);
  return { redirect: NextResponse.redirect(login) };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; connector: string }> },
) {
  const { employeeId, connector } = await params;
  const owner = await ownerSessionOrLogin(req);
  if ("redirect" in owner) return owner.redirect;
  const returnTo = safeReturnPath(new URL(req.url).searchParams.get("returnTo"), employeeId);
  const managed = resolveOwnerManagedConnectorSetup(connector);

  if (!managed) {
    const runtime = resolveConnectorRuntimeManifest(connector) ?? genericConnectorRuntimeManifest(connector);
    const response = await managerPost(`/manager/employee/${encodeURIComponent(employeeId)}/workbench/connect/${encodeURIComponent(runtime.key)}/request`, {
      owner_session_token: owner.token,
      owner_context: {
        return_to: returnTo,
        setup_experience: runtime.setup_experience,
        requested_from: "capability_drawer",
      },
    });
    const json = await response.json().catch(() => ({})) as { error?: string };
    const target = new URL(`/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(runtime.key)}`, req.url);
    target.searchParams.set("state", response.ok && !json.error ? "requested" : "error");
    target.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(target);
  }

  // Provider callbacks return here first, not directly to the desk. The result
  // page refreshes assignment-bound lifecycle/capability evidence before the owner
  // continues normal work, so "connected" is never optimistic UI state.
  const callbackReturnTo = lifecycleReturnPath(employeeId, managed.key, returnTo);
  const response = await managerPost(`/manager/employee/${encodeURIComponent(employeeId)}/workbench/connect/${encodeURIComponent(managed.key)}`, {
    owner_session_token: owner.token,
    return_to: callbackReturnTo,
  });
  const json = await response.json().catch(() => ({})) as {
    error?: string;
    message?: string;
    proof?: { setup_url?: unknown };
  };
  if (!response.ok || json.error) {
    const failure = new URL(`/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(managed.key)}`, req.url);
    failure.searchParams.set("state", "error");
    failure.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(failure);
  }
  const target = providerSetupUrl(json.proof?.setup_url, managed.allowed_authorization_hosts);
  if (!target) return NextResponse.json({ error: "connector_setup_url_invalid" }, { status: 502 });
  return NextResponse.redirect(target);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; connector: string }> },
) {
  const { employeeId, connector } = await params;
  const owner = await ownerSessionOrLogin(req);
  if ("redirect" in owner) return owner.redirect;
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json().catch(() => ({})) as Record<string, unknown>
    : Object.fromEntries((await req.formData()).entries());
  const response = await managerPost(`/manager/employee/${encodeURIComponent(employeeId)}/workbench/connectors/revoke`, {
    owner_session_token: owner.token,
    connector_key: connector,
    binding_id: typeof body.binding_id === "string" ? body.binding_id : undefined,
    reason: typeof body.reason === "string" ? body.reason : "owner_requested_disconnect",
  });
  const json = await response.json().catch(() => ({}));
  if (contentType.includes("application/json")) return NextResponse.json(json, { status: response.status });
  const returnTo = safeReturnPath(typeof body.return_to === "string" ? body.return_to : null, employeeId);
  const target = new URL(`/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(connector)}`, req.url);
  target.searchParams.set("state", response.ok ? "revoked" : "error");
  target.searchParams.set("returnTo", returnTo);
  // POST/Redirect/GET: 303 prevents browsers from replaying the revoke POST at the
  // result page and makes the disconnect lifecycle idempotent from the UI.
  return NextResponse.redirect(target, 303);
}
