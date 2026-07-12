import { describe, expect, it } from "vitest";
import { contextWindowFor, rotateAtTokens, DEFAULT_CONTEXT_LENGTH, SESSION_TARGET_TOKENS } from "../../packages/shared/src/model-context";

describe("model context window map (capability input only)", () => {
  it("maps known model families to a window", () => {
    expect(contextWindowFor("claude-opus-4-8")).toBe(200_000);
    expect(contextWindowFor("claude-sonnet-5")).toBe(200_000);
    expect(contextWindowFor("gpt-5.5")).toBe(400_000);
    expect(contextWindowFor("glm-5.2")).toBe(1_000_000);
  });

  it("is case-insensitive and matches by family substring", () => {
    expect(contextWindowFor("Anthropic/Claude-Opus-4-8")).toBe(200_000);
  });

  it("falls back conservatively for unknown / empty models", () => {
    expect(contextWindowFor("some-unknown-model")).toBe(DEFAULT_CONTEXT_LENGTH);
    expect(contextWindowFor(null)).toBe(DEFAULT_CONTEXT_LENGTH);
    expect(contextWindowFor(undefined)).toBe(DEFAULT_CONTEXT_LENGTH);
  });

  it("rotates below Hermes compression threshold (0.40 < 0.50 of the window)", () => {
    // 200k window -> rotate at 0.40 * 200k = 80k, well under the 0.50 compression trip.
    expect(rotateAtTokens("claude-opus-4-8")).toBe(80_000);
  });

  it("clamps the rotate point to the <=400k session ceiling on huge windows", () => {
    // GLM 1M * 0.40 = 400k would exceed the ceiling; clamp to 0.95 * 400k.
    const glm = rotateAtTokens("glm-5.2");
    expect(glm).toBeLessThanOrEqual(SESSION_TARGET_TOKENS);
    expect(glm).toBe(Math.floor(SESSION_TARGET_TOKENS * 0.95));
  });

  it("respects a custom rotate ratio", () => {
    expect(rotateAtTokens("claude-opus-4-8", 0.5)).toBe(100_000);
  });
});
