import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { managerOrigin, managerHeaders } from "../../../_lib/manager";

// Live Work Surface stream (Phase 5). Pass-through proxy of the Manager SSE
// endpoint — the browser holds one EventSource to Next, Next relays Manager. The
// owner session (httpOnly cookie) is forwarded as a query param the Manager
// authorizes; the browser never talks to Supabase directly.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("amtech_owner_session")?.value ?? "";
  const url = `${managerOrigin()}${MANAGER_API.employeeStream(employeeId)}?owner_session_token=${encodeURIComponent(token)}`;
  const upstream = await fetch(url, {
    headers: { ...managerHeaders(), Accept: "text/event-stream" },
  });
  return new Response(upstream.body, {
    status: upstream.ok ? 200 : upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
