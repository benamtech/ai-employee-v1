import { describe, expect, it } from "vitest";
import { parseSseFrames } from "../../apps/manager/src/lib/hermes-client";
import { supportsLiveRunEvents, supportsLiveRuns } from "../../apps/manager/src/lib/hermes-live-turn";
import { workVerbForTool, isSafeWorkVerb } from "../../apps/manager/src/lib/work-verbs";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const s of chunks) controller.enqueue(enc.encode(s));
      controller.close();
    },
  });
}

async function collect(body: ReadableStream<Uint8Array>) {
  const frames = [];
  for await (const f of parseSseFrames(body)) frames.push(f);
  return frames;
}

describe("parseSseFrames", () => {
  it("parses event + data frames", async () => {
    const frames = await collect(streamOf([
      "event: tool.started\ndata: {\"tool\":\"send_email\"}\n\n",
      "event: run.completed\ndata: {\"output\":\"done\"}\n\n",
    ]));
    expect(frames).toHaveLength(2);
    expect(frames[0]).toEqual({ event: "tool.started", data: '{"tool":"send_email"}' });
    expect(frames[1]!.event).toBe("run.completed");
  });

  it("reassembles a frame split across chunk boundaries and ignores keepalive comments", async () => {
    const frames = await collect(streamOf([":keepalive\n\n", "event: assistant", ".delta\nda", "ta: hi\n\n"]));
    expect(frames).toEqual([{ event: "assistant.delta", data: "hi" }]);
  });

  it("handles CRLF line endings", async () => {
    const frames = await collect(streamOf(["event: tool.completed\r\ndata: {}\r\n\r\n"]));
    expect(frames[0]!.event).toBe("tool.completed");
  });
});

describe("current Hermes capability negotiation", () => {
  it("recognizes the official object-valued runs and run_events_sse capability shape", () => {
    const capabilities = {
      features: {
        run_submission: true,
        run_status: true,
        run_events_sse: true,
        session_key_header: "X-Hermes-Session-Key",
      },
      endpoints: {
        runs: { method: "POST", path: "/v1/runs" },
        run_status: { method: "GET", path: "/v1/runs/{run_id}" },
        run_events: { method: "GET", path: "/v1/runs/{run_id}/events" },
      },
    } as never;
    expect(supportsLiveRuns(capabilities)).toBe(true);
    expect(supportsLiveRunEvents(capabilities)).toBe(true);
  });

  it("still recognizes the older flat endpoint aliases", () => {
    const capabilities = {
      features: { runs: true, run_events: true },
      endpoints: { runs: "/v1/runs", run_events: "/v1/runs/{id}/events" },
    } as never;
    expect(supportsLiveRuns(capabilities)).toBe(true);
    expect(supportsLiveRunEvents(capabilities)).toBe(true);
  });
});

describe("work-verbs (owner-safe progress)", () => {
  it("maps known tools to warm verbs and never leaks a raw tool name", () => {
    expect(workVerbForTool("send_email")).toBe("Drafting the email");
    expect(workVerbForTool("create_stripe_invoice")).toBe("Preparing the invoice");
    const unknown = workVerbForTool("exfiltrate_secrets_v2");
    expect(unknown).toBe("Working on it");
    expect(unknown).not.toContain("exfiltrate");
    expect(isSafeWorkVerb(unknown)).toBe(true);
    expect(isSafeWorkVerb("exfiltrate_secrets_v2")).toBe(false);
  });
});
