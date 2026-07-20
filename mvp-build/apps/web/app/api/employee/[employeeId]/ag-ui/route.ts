import { cookies } from "next/headers";
import {
  MANAGER_API,
  projectWorkStreamEventToAgUi,
  type AssignmentScopedWorkStreamEvent,
  type WorkStreamAssignmentScope,
} from "@amtech/shared";
import { managerHeaders, managerOrigin } from "../../../_lib/manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STREAM_REAUTH_MS = Math.max(15_000, Number(process.env.OWNER_STREAM_REAUTH_MS ?? 60_000));

function sameScope(left: WorkStreamAssignmentScope, right: WorkStreamAssignmentScope): boolean {
  return left.account_id === right.account_id
    && left.employee_id === right.employee_id
    && left.assignment_id === right.assignment_id
    && left.authority_version === right.authority_version;
}

function scopeFrom(value: Record<string, unknown>): WorkStreamAssignmentScope | null {
  if (typeof value.account_id !== "string"
    || typeof value.employee_id !== "string"
    || typeof value.assignment_id !== "string"
    || typeof value.authority_version !== "string") return null;
  return {
    account_id: value.account_id,
    employee_id: value.employee_id,
    assignment_id: value.assignment_id,
    authority_version: value.authority_version,
  };
}

async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      buffer += decoder.decode(next.value, { stream: true }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = raw.split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^ /, ""))
          .join("\n");
        if (data) {
          try { yield JSON.parse(data) as Record<string, unknown>; } catch { /* durable state remains authoritative */ }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/**
 * AG-UI is a transport projection over the same durable employee workspace. It adds
 * no authority and forwards no raw Hermes/provider event. Assignment and authority
 * version must remain stable for the entire connection; reconnect re-authorizes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const token = (await cookies()).get("amtech_owner_session")?.value ?? "";
  if (!token) return new Response(JSON.stringify({ error: "owner_session_missing" }), { status: 401 });

  const abort = new AbortController();
  const reauthorize = setTimeout(() => abort.abort("owner_stream_reauthorization"), STREAM_REAUTH_MS);
  const upstream = await fetch(`${managerOrigin()}${MANAGER_API.employeeStream(employeeId)}`, {
    method: "GET",
    headers: {
      ...managerHeaders(),
      Accept: "text/event-stream",
      "X-AMTECH-Owner-Session": token,
    },
    cache: "no-store",
    signal: abort.signal,
  });
  if (!upstream.ok || !upstream.body) {
    clearTimeout(reauthorize);
    return new Response(await upstream.text().catch(() => ""), { status: upstream.status });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let scope: WorkStreamAssignmentScope | null = null;
      let sequence = 0;
      try {
        for await (const raw of parseSse(upstream.body!)) {
          const nextScope = scopeFrom(raw);
          if (!nextScope) continue;
          if (!scope) scope = nextScope;
          else if (!sameScope(scope, nextScope)) throw new Error("ag_ui_authority_scope_drift");
          const events = projectWorkStreamEventToAgUi(raw as unknown as AssignmentScopedWorkStreamEvent, {
            account_id: scope.account_id,
            employee_id: scope.employee_id,
            assignment_id: scope.assignment_id,
            authority_version: scope.authority_version,
            thread_id: `employee:${scope.employee_id}:assignment:${scope.assignment_id}`,
            sequence,
          });
          sequence += events.length;
          for (const event of events) {
            controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
          }
        }
        controller.close();
      } catch (error) {
        console.warn("[web] AG-UI stream interrupted", error instanceof Error ? error.name : "unknown");
        controller.enqueue(encoder.encode(`event: RUN_ERROR\ndata: ${JSON.stringify({
          type: "RUN_ERROR",
          timestamp: Date.now(),
          sequence,
          message: "ag_ui_stream_interrupted",
        })}\n\n`));
        controller.close();
      } finally {
        clearTimeout(reauthorize);
      }
    },
    cancel(reason) {
      clearTimeout(reauthorize);
      abort.abort(reason);
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
      "X-AMTECH-Protocol": "ag-ui",
    },
  });
}
