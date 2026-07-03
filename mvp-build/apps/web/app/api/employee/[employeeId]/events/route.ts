import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { managerPost } from "../../../_lib/manager";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const res = await managerPost(MANAGER_API.employeeResources(employeeId), {
    owner_session_token: cookieStore.get("amtech_owner_session")?.value,
  });
  const json = await res.json().catch(() => ({}));
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(`event: snapshot\ndata: ${JSON.stringify(json)}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    status: res.ok ? 200 : res.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
