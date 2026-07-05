import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../../../_lib/manager";

/**
 * Owner-driven connector start. Mirrors approval/resolve: resolve the owner's
 * account from /resources, then call the Manager connector tool. Returns the tool
 * envelope (whose proof carries consent_url) so the client can open OAuth directly.
 * This path does NOT depend on the model discovering HTTP tool-calling; the same
 * Manager tool remains the single source of truth for the employee-initiated path.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const body = await req.json().catch(() => ({}));
  const provider = typeof body.provider === "string" ? body.provider : "gmail";
  const cookieStore = await cookies();
  const resourceRes = await managerPost(MANAGER_API.employeeResources(employeeId), {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
  });
  const resources = await resourceRes.json().catch(() => ({}));
  if (!resourceRes.ok || !resources.account_id) {
    return NextResponse.json(resources, { status: resourceRes.status });
  }
  // Gmail is the only connector wired today; keep the route provider-general so the
  // next connector (Stripe/Drive) reuses it by adding a tool mapping here.
  if (provider !== "gmail") {
    return NextResponse.json({ error: "unsupported_provider", provider }, { status: 400 });
  }
  const res = await managerPost("/manager/tools/connect_email", {
    account_id: resources.account_id,
    employee_id: employeeId,
    provider: "gmail",
    requested_scopes: [],
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
