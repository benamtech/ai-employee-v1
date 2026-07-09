import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../../../api/_lib/manager";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string; artifactId: string }> },
) {
  const { employeeId, artifactId } = await params;
  const token = new URL(req.url).searchParams.get("t");
  const cookieStore = await cookies();
  const res = await managerPost(MANAGER_API.artifactResolve(employeeId, artifactId), {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
    signed_token: token,
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok && typeof json.html === "string") {
    return new Response(json.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (!res.ok || !json.signed_url) {
    return NextResponse.json(json, { status: res.status });
  }
  return NextResponse.redirect(json.signed_url);
}
