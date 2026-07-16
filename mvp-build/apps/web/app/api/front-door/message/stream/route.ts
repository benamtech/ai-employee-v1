import { managerHeaders, managerOrigin } from "../../../_lib/manager";

export async function POST(req: Request) {
  const res = await fetch(`${managerOrigin()}/manager/orchestrator/web/stream`, {
    method: "POST",
    headers: managerHeaders(),
    body: JSON.stringify(await req.json()),
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
