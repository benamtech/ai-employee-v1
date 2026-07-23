import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateGatewayRequestEnvelope } from "../../apps/manager/src/lib/model-gateway-http.js";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.MODEL_GATEWAY_INPUT_CENTS_PER_MILLION;
  delete process.env.MODEL_GATEWAY_OUTPUT_CENTS_PER_MILLION;
  delete process.env.MODEL_GATEWAY_PROVIDER_TIMEOUT_MS;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

function body(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    model: "provider-model",
    messages: [{ role: "user", content: "bounded request" }],
    max_tokens: 1024,
    ...overrides,
  };
}

describe("model gateway request envelope", () => {
  it("computes one finite reservation and provider timeout before admission", () => {
    const envelope = validateGatewayRequestEnvelope(body(), "revision-1");
    expect(envelope).toMatchObject({
      revision_id: "revision-1",
      provider_timeout_ms: 30_000,
    });
    expect(Number.isSafeInteger(envelope.reserve_amount_minor)).toBe(true);
    expect(envelope.reserve_amount_minor).toBeGreaterThan(0);
  });

  it.each([
    ["string", "1024"],
    ["zero", 0],
    ["negative", -1],
    ["fractional", 1.5],
    ["too-large", 128_001],
    ["null", null],
  ])("rejects %s output-token authority before admission", (_label, value) => {
    expect(() => validateGatewayRequestEnvelope(body({ max_tokens: value }))).toThrow("model_gateway_max_output_tokens_invalid");
  });

  it("accepts the responses-style max_output_tokens field when max_tokens is absent", () => {
    const request = body({ max_tokens: undefined, max_output_tokens: 2048 });
    delete request.max_tokens;
    expect(validateGatewayRequestEnvelope(request).reserve_amount_minor).toBeGreaterThan(0);
  });

  it.each([
    ["MODEL_GATEWAY_INPUT_CENTS_PER_MILLION", "not-a-number"],
    ["MODEL_GATEWAY_OUTPUT_CENTS_PER_MILLION", "-1"],
  ])("fails closed for invalid %s configuration", (name, value) => {
    process.env[name] = value;
    expect(() => validateGatewayRequestEnvelope(body())).toThrow("model_gateway_pricing_configuration_invalid");
  });

  it.each(["999", "120001", "not-a-number"])("fails closed for invalid provider timeout %s", (value) => {
    process.env.MODEL_GATEWAY_PROVIDER_TIMEOUT_MS = value;
    expect(() => validateGatewayRequestEnvelope(body())).toThrow("model_gateway_provider_timeout_invalid");
  });

  it.each(["", " contains spaces ", "x".repeat(161)])("rejects invalid explicit revision %s", (revision) => {
    expect(() => validateGatewayRequestEnvelope(body(), revision)).toThrow("model_gateway_request_revision_invalid");
  });
});
