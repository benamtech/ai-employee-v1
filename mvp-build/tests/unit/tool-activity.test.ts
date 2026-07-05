import { describe, expect, it } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  formViewFromJsonSchema,
  validateWorkEventDescriptor,
  renderWorkEventSms,
  type JsonSchemaObject,
  type WorkEventDescriptor,
} from "../../packages/shared/src/work-events";
import { getToolSchema } from "../../packages/shared/src/tool-schemas";

// Native-tool schema fixtures. Spike scaffolding ONLY — the permanent pipeline
// that pulls live native-tool schemas from the Hermes run/event stream is the
// out-of-scope Hermes->Work adapter. Here they stand in for real introspection.
const IMAGE_GEN_SCHEMA: JsonSchemaObject = {
  type: "object",
  properties: {
    prompt: { type: "string", description: "What to generate" },
    size: { type: "string", enum: ["1024x1024", "1792x1024"], description: "Size" },
    when: { type: "string", format: "date", description: "Deliver by" },
  },
  required: ["prompt"],
};
const SESSION_SEARCH_SCHEMA: JsonSchemaObject = {
  type: "object",
  properties: {
    query: { type: "string", description: "Search prior sessions" },
    limit: { type: "number", description: "Max results" },
  },
  required: ["query"],
};

describe("ToolActivityDescriptor — any tool materializes from schema (one code path)", () => {
  it("compiles a NATIVE tool schema (image_gen) into a form with typed fields", () => {
    const view = formViewFromJsonSchema(IMAGE_GEN_SCHEMA, { prompt: "a blue house" });
    expect(view?.kind).toBe("form");
    const byName = Object.fromEntries((view?.fields ?? []).map((f) => [f.name, f]));
    expect(byName.prompt.value).toBe("a blue house");
    expect(byName.prompt.required).toBe(true);
    expect(byName.size.type).toBe("select"); // enum -> select
    expect(byName.size.options).toEqual(["1024x1024", "1792x1024"]);
    expect(byName.when.type).toBe("date"); // format:date -> date
  });

  it("compiles a second NATIVE tool schema (session_search) with a number field — same function", () => {
    const view = formViewFromJsonSchema(SESSION_SEARCH_SCHEMA, { query: "roof job" });
    const byName = Object.fromEntries((view?.fields ?? []).map((f) => [f.name, f]));
    expect(byName.query.required).toBe(true);
    expect(byName.limit.type).toBe("number");
  });

  it("compiles a MANAGER tool schema (via its zod source of truth) with the same path", () => {
    const json = zodToJsonSchema(getToolSchema("save_business_brain_fact"), { $refStrategy: "none" }) as JsonSchemaObject;
    const view = formViewFromJsonSchema(json, { fact: "Owner prefers Benjamin Moore paint" });
    const names = (view?.fields ?? []).map((f) => f.name);
    expect(names).toContain("fact");
    expect(names).toContain("account_id");
    const fact = view?.fields.find((f) => f.name === "fact");
    expect(fact?.value).toBe("Owner prefers Benjamin Moore paint");
  });

  it("materializes a valid tool_activity work event and degrades to an SMS line", () => {
    const descriptor: WorkEventDescriptor = {
      account_id: "acct_1",
      employee_id: "emp_1",
      move: "review",
      title: "Generated a yard-sign mockup",
      summary: "Made a 1024x1024 image from your prompt.",
      suggested_next_action: "Want me to email it to the printer?",
      deliverable: {
        type: "tool_activity",
        title: "image_gen",
        refs: {},
        acceptance: ["approve", "reject"],
        tool: { name: "image_generate", toolset: "image_gen", input_schema: IMAGE_GEN_SCHEMA, input: { prompt: "yard sign" }, result_kind: "media", result_summary: "1 image ready" },
      },
    };
    expect(validateWorkEventDescriptor(descriptor).ok).toBe(true);
    const sms = renderWorkEventSms(descriptor);
    expect(sms).toContain("Generated a yard-sign mockup");
    expect(sms).toContain("email it to the printer");
  });

  it("rejects a tool_activity deliverable with no tool name", () => {
    const bad: WorkEventDescriptor = {
      account_id: "a",
      employee_id: "e",
      move: "notify",
      title: "t",
      summary: "s",
      deliverable: { type: "tool_activity", title: "x", refs: {}, acceptance: ["acknowledge"] },
    };
    const result = validateWorkEventDescriptor(bad);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("tool_activity_missing_tool_name");
  });
});
