import { describe, expect, it } from "vitest";
// Dev-only local tooling (ESM .mjs). Imported for its pure helpers; the worker's
// hard-pinned model tier is the load-bearing invariant under test.
// @ts-expect-error — untyped local .mjs helper module
import { toMessage, buildWorkerPrompt, stripCodeFences, BRIDGE_WORKER_MODEL } from "../../infra/scripts/local/model-bridge-lib.mjs";

describe("model-bridge lib", () => {
  it("hard-pins the worker to the latest Haiku (always-Haiku invariant)", () => {
    expect(BRIDGE_WORKER_MODEL).toBe("claude-haiku-4-5");
  });

  it("keeps an orchestrator JSON answer as raw content (caller re-parses it)", () => {
    const raw = JSON.stringify({ assistant_message: "hi", state: { step: 1 }, manifest_patch: {} });
    const msg = toMessage(raw);
    expect(msg.role).toBe("assistant");
    expect(msg.content).toBe(raw); // NOT unwrapped — it has no content/role/tool_calls key
  });

  it("passes plain text through as assistant content", () => {
    expect(toMessage("just words").content).toBe("just words");
  });

  it("unwraps a genuine OpenAI message object (role/content/tool_calls)", () => {
    const tc = [{ id: "c1", type: "function", function: { name: "f", arguments: "{}" } }];
    const msg = toMessage(JSON.stringify({ role: "assistant", content: null, tool_calls: tc }));
    expect(msg.content).toBeNull();
    expect(msg.tool_calls).toEqual(tc);
  });

  it("builds a worker prompt that includes the conversation and a JSON directive when required", () => {
    const prompt = buildWorkerPrompt({
      messages: [
        { role: "system", content: "Return the onboarding JSON." },
        { role: "user", content: "I paint houses in Scranton." },
      ],
      response_format: { type: "json_schema", json_schema: { name: "onboarding" } },
    });
    expect(prompt).toContain("Return the onboarding JSON.");
    expect(prompt).toContain("I paint houses in Scranton.");
    expect(prompt).toMatch(/Output ONLY valid JSON/);
  });

  it("uses a plain-text directive when no JSON response_format is requested", () => {
    const prompt = buildWorkerPrompt({ messages: [{ role: "user", content: "hello" }] });
    expect(prompt).toMatch(/Output ONLY the assistant's reply text/);
  });

  it("strips accidental markdown code fences around JSON", () => {
    expect(stripCodeFences("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
    expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
  });
});
