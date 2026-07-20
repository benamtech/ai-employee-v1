import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { managerPost } from "../../_lib/manager";

export async function POST(req: Request) {
  const ownerSessionToken = (await cookies()).get("amtech_owner_session")?.value;
  if (!ownerSessionToken) return NextResponse.json({ error: "owner_session_missing" }, { status: 401 });

  const identityResponse = await managerPost("/manager/onboarding/identity/status", {
    owner_session_token: ownerSessionToken,
  });
  const identity = await identityResponse.json().catch(() => ({}));
  if (!identityResponse.ok || identity.allowed !== true) {
    const rejected = identity.error === "identity_rejected_permanent";
    return NextResponse.json({
      error: identity.error ?? "identity_unverified",
      user_facing_summary_hint: rejected
        ? "Business identity was rejected. Activation remains blocked; contact AMTECH support with the legal business documents used."
        : "Verify the business in the required secure identity panel before starting the employee.",
      identity: identity.identity ?? null,
    }, { status: rejected ? 403 : 409 });
  }

  const body = await req.json().catch(() => ({}));
  const response = await managerPost("/manager/onboarding/provision-from-session", {
    ...body,
    owner_session_token: ownerSessionToken,
  });
  const json = await response.json().catch(() => ({}));
  return NextResponse.json(json, { status: response.status });
}
