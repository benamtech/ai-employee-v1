import { describe, expect, it } from "vitest";
// Dev-only local tooling (ESM .mjs). Imported for its pure helpers; the worker's
// hard-pinned model tier is the load-bearing invariant under test.
// @ts-expect-error — untyped local .mjs helper module
import { toMessage, buildWorkerPrompt, stripCodeFences, BRIDGE_WORKER_MODEL, toStreamJsonInput, resultTextFromEvent } from "../../infra/scripts/local/model-bridge-lib.mjs";

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

  it("teaches the worker the tool-call protocol and lists offered tools", () => {
    const prompt = buildWorkerPrompt({
      messages: [{ role: "user", content: "make me an estimate" }],
      tools: [
        { type: "function", function: { name: "create_estimate_artifact", description: "Create an estimate", parameters: { type: "object" } } },
      ],
    });
    expect(prompt).toMatch(/"tool_calls"/);
    expect(prompt).toContain("create_estimate_artifact");
    expect(prompt).toContain("Create an estimate");
    expect(prompt).toMatch(/parameters \(JSON Schema\)/);
  });

  it("honors tool_choice: forced function and 'none'", () => {
    const forced = buildWorkerPrompt({
      messages: [{ role: "user", content: "x" }],
      tools: [{ type: "function", function: { name: "set_internal_reminder" } }],
      tool_choice: { type: "function", function: { name: "set_internal_reminder" } },
    });
    expect(forced).toMatch(/MUST call the tool "set_internal_reminder"/);

    const none = buildWorkerPrompt({
      messages: [{ role: "user", content: "x" }],
      tools: [{ type: "function", function: { name: "set_internal_reminder" } }],
      tool_choice: "none",
    });
    expect(none).toMatch(/Output ONLY the assistant's reply text/);
    expect(none).not.toContain("----- TOOLS -----");
  });

  it("surfaces prior assistant tool_calls in the serialized conversation so the worker can chain", () => {
    const prompt = buildWorkerPrompt({
      messages: [
        { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "create_estimate_artifact", arguments: "{}" } }] },
        { role: "tool", name: "create_estimate_artifact", content: "{\"artifact_id\":\"art_1\"}" },
      ],
      tools: [{ type: "function", function: { name: "render_estimate_pdf" } }],
    });
    expect(prompt).toContain("(tool_calls)");
    expect(prompt).toContain("art_1");
  });

  it("strips accidental markdown code fences around JSON", () => {
    expect(stripCodeFences("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
    expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
  });

  it("frames a parked prompt as a single stream-json user message (warm-instance input)", () => {
    const line = toStreamJsonInput("hello there");
    const parsed = JSON.parse(line);
    expect(parsed).toEqual({ type: "user", message: { role: "user", content: "hello there" } });
    expect(line).not.toContain("\n"); // caller adds the newline frame
  });

  it("extracts a turn completion only from a result event, flagging errors", () => {
    expect(resultTextFromEvent({ type: "assistant", message: {} })).toBeNull();
    expect(resultTextFromEvent({ type: "system", subtype: "init" })).toBeNull();
    expect(resultTextFromEvent(null)).toBeNull();
    expect(resultTextFromEvent({ type: "result", subtype: "success", is_error: false, result: "ALPHA" }))
      .toEqual({ text: "ALPHA", isError: false });
    expect(resultTextFromEvent({ type: "result", subtype: "error_during_execution", is_error: true, result: "boom" }))
      .toEqual({ text: "boom", isError: true });
    expect(resultTextFromEvent({ type: "result", subtype: "success", is_error: false }))
      .toEqual({ text: "", isError: false });
  });
});
