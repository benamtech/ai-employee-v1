import { describe, expect, it } from "vitest";
import {
  extractJson,
  openAiCompatibleRequestBody,
  orchestratorModelConfig,
} from "../../apps/manager/src/lib/orchestrator-model";

describe("orchestrator model adapter", () => {
  it("uses OpenAI-compatible defaults with OPENAI_API_KEY fallback", () => {
    const config = orchestratorModelConfig({
      OPENAI_API_KEY: "sk-test",
    });
    expect(config.apiKey).toBe("sk-test");
    expect(config.baseUrl).toBe("https://api.openai.com/v1");
    expect(config.model).toBe("gpt-4.1");
    expect(config.responseFormat).toBe("json_schema");
  });

  it("accepts XAI_API_KEY for Grok OpenAI-compatible deployments", () => {
    const config = orchestratorModelConfig({
      XAI_API_KEY: "xai-test",
      ORCHESTRATOR_API_BASE_URL: "https://api.x.ai/v1",
      ORCHESTRATOR_MODEL: "grok-4.3",
    });
    expect(config.apiKey).toBe("xai-test");
    expect(config.baseUrl).toBe("https://api.x.ai/v1");
    expect(config.model).toBe("grok-4.3");
  });

  it("allows provider base URL, model, and response_format override", () => {
    const config = orchestratorModelConfig({
      ORCHESTRATOR_API_KEY: "provider-key",
      ORCHESTRATOR_API_BASE_URL: "https://provider.example/v1/",
      ORCHESTRATOR_MODEL: "custom-chat-model",
      ORCHESTRATOR_MAX_TOKENS: "900",
      ORCHESTRATOR_TEMPERATURE: "0.1",
      ORCHESTRATOR_RESPONSE_FORMAT: "none",
    });
    expect(config.apiKey).toBe("provider-key");
    expect(config.baseUrl).toBe("https://provider.example/v1");
    expect(config.model).toBe("custom-chat-model");
    expect(config.maxTokens).toBe(900);
    expect(config.temperature).toBe(0.1);
    expect(config.responseFormat).toBe("none");
  });

  it("builds a chat-completions request body with strict structured output by default", () => {
    const body = openAiCompatibleRequestBody(
      {
        apiKey: "sk-test",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4.1",
        maxTokens: 1200,
        temperature: 0.2,
        responseFormat: "json_schema",
      },
      [
        { role: "system", content: "Return JSON." },
        { role: "user", content: "{\"message\":\"hello\"}" },
      ],
    );
    expect(body).toMatchObject({
      model: "gpt-4.1",
      max_tokens: 1200,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "amtech_onboarding_response",
          strict: true,
        },
      },
    });
    expect(body.messages).toEqual([
      { role: "system", content: "Return JSON." },
      { role: "user", content: "{\"message\":\"hello\"}" },
    ]);
  });

  it("extracts the onboarding JSON contract from surrounding text", () => {
    const parsed = extractJson(`ignore
{
  "assistant_message": "What kind of jobs do you estimate most?",
  "state": "business_context_collected",
  "manifest_patch": {"business_kind":"painting"},
  "ready_for_phone_verification": false,
  "missing_fields": ["phone_e164"]
}
ignore`);
    expect(parsed.assistant_message).toContain("estimate");
    expect(parsed.manifest_patch.business_kind).toBe("painting");
    expect(parsed.missing_fields).toEqual(["phone_e164"]);
  });
});
