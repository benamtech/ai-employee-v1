import { cookies } from "next/headers";
import { MANAGER_API } from "@amtech/shared";
import { managerOrigin, managerHeaders } from "../../../_lib/manager";

// Live Work Surface stream (Phase 5). Pass-through proxy of the Manager SSE
// endpoint — the browser holds one EventSource to Next, Next relays Manager. The
// owner session (httpOnly cookie) is forwarded only on the private Manager hop;
// the browser never talks to Supabase or Manager directly.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STREAM_REAUTH_MS = Math.max(15_000, Number(process.env.OWNER_STREAM_REAUTH_MS ?? 60_000));

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("amtech_owner_session")?.value ?? "";
  const url = `${managerOrigin()}${MANAGER_API.employeeStream(employeeId)}?owner_session_token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const reauthTimer = setTimeout(() => controller.abort("owner_stream_reauthorization"), STREAM_REAUTH_MS);

  const upstream = await fetch(url, {
    headers: { ...managerHeaders(), Accept: "text/event-stream" },
    signal: controller.signal,
    cache: "no-store",
  });

  if (!upstream.body) {
    clearTimeout(reauthTimer);
    return new Response(null, { status: upstream.status });
  }

  const reader = upstream.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(stream) {
      try {
        const next = await reader.read();
        if (next.done) {
          clearTimeout(reauthTimer);
          stream.close();
          return;
        }
        stream.enqueue(next.value);
      } catch (error) {
        clearTimeout(reauthTimer);
        stream.error(error);
      }
    },
    async cancel(reason) {
      clearTimeout(reauthTimer);
      controller.abort(reason);
      await reader.cancel(reason).catch(() => undefined);
    },
  });

  return new Response(body, {
    status: upstream.ok ? 200 : upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
