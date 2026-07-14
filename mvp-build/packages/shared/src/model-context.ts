/**
 * Model context-window map — the SINGLE place model metadata enters the
 * context-engineering system.
 *
 * Doctrine (CE README + CE-2/CE-3 plan): CE is model-agnostic. Model identity is
 * allowed to influence CE only as a *capability input* — "how big is this model's
 * context window" — never as a bespoke behavior branch. This module returns that
 * one number and nothing else. Everything downstream (CE-3 rotation trip point,
 * the <=400k session clamp) is computed from ratios that hold across every model,
 * so swapping Opus for GLM changes only the absolute token budget, not the logic.
 *
 * Compression itself (Hermes `compression.threshold`) is a *fraction* of the
 * window that Hermes applies internally, so it needs no lookup here. This map is
 * consumed Manager-side by session rotation to turn a rotate *ratio* into an
 * absolute token count.
 *
 * Values are context-window sizes as capability inputs, not guarantees; unknown
 * models fall back to a conservative window so we rotate early rather than
 * overrun. Keep entries coarse (by family) — precision is not the point.
 */

/** Conservative default window for an unrecognized model id (200k class). */
export const DEFAULT_CONTEXT_LENGTH = 200_000;

/** AMTECH session target ceiling; rotation is clamped to stay at/under this even
 *  on very large windows. Mirrors `SESSION_TARGET_TOKENS` in agent-context.ts. */
export const SESSION_TARGET_TOKENS = 400_000;

/**
 * Substring-keyed window table, matched case-insensitively against the model id.
 * Order matters: the first matching pattern wins, so list more specific patterns
 * before broader family prefixes.
 */
const CONTEXT_WINDOW_PATTERNS: ReadonlyArray<readonly [pattern: string, contextLength: number]> = [
  // Anthropic Claude (Opus / Sonnet / Haiku) — 200k class.
  ["claude-opus", 200_000],
  ["claude-sonnet", 200_000],
  ["claude-haiku", 200_000],
  ["opus-4", 200_000],
  ["sonnet-5", 200_000],
  ["haiku-4", 200_000],
  ["claude", 200_000],
  // OpenAI GPT-5.x — long-context class.
  ["gpt-5", 400_000],
  ["gpt-4.1", 1_000_000],
  ["gpt-4o", 128_000],
  // Zhipu GLM-5.x — ~1M context.
  ["glm-5", 1_000_000],
  ["glm-4", 200_000],
  // Local no-key bridge worker (you-are-the-LLM); keep conservative.
  ["bridge-agent", 200_000],
];

/** Context window (tokens) for a model id — a capability input only. */
export function contextWindowFor(modelId: string | null | undefined): number {
  if (!modelId) return DEFAULT_CONTEXT_LENGTH;
  const id = modelId.trim().toLowerCase();
  for (const [pattern, contextLength] of CONTEXT_WINDOW_PATTERNS) {
    if (id.includes(pattern)) return contextLength;
  }
  return DEFAULT_CONTEXT_LENGTH;
}

/**
 * Absolute prompt-token occupancy at which CE-3 should rotate to a fresh
 * transcript, for a given model. `rotateRatio` (default 0.40) sits BELOW Hermes'
 * compression `threshold` (default 0.50) so rotation trips before lossy
 * compaction, and the result is clamped to `SESSION_TARGET_TOKENS` so a giant
 * window (e.g. GLM's 1M) still rotates by the session ceiling.
 */
export function rotateAtTokens(modelId: string | null | undefined, rotateRatio = 0.4): number {
  const window = contextWindowFor(modelId);
  const safetyCeiling = Math.floor(SESSION_TARGET_TOKENS * 0.95);
  return Math.min(Math.floor(window * rotateRatio), safetyCeiling);
}
