import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("amtech_owner_session")?.value ?? "";
  const url = new URL(MANAGER_API.employeeStream(employeeId), process.env.MANAGER_BASE_URL ?? "http://localhost:8787");
  url.searchParams.set("owner_session_token", token);

  // Transparent SSE proxy
  const upstream = await fetch(url.toString(), {
    headers: { accept: "text/event-stream" },
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("stream_failed", { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}
