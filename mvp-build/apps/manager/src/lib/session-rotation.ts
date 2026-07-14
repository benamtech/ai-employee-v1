import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId, rotateAtTokens } from "@amtech/shared";
import { orThrow } from "./db.js";

/**
 * CE-3 session rotation — rotate the employee to a FRESH transcript before Hermes'
 * lossy compression fires, preserving the stable memory scope.
 *
 * Two phases, both run INSIDE the per-employee turn lock so serialization +
 * no-double-delivery hold:
 *   - `rotateSessionIfNeeded` — PRE-turn (the post-previous-session boundary).
 *     Reads the active transcript's last recorded occupancy and, if over
 *     threshold, rotates BEFORE this turn runs, so the turn executes on the fresh
 *     transcript and its `pre_llm_call` primer re-fires with carryover on the same
 *     turn.
 *   - `recordSessionOccupancy` — POST-turn. Persists the turn's prompt-token
 *     occupancy (only known after the turn) so the NEXT turn's pre-turn check can
 *     decide. No rotation here.
 *
 * Fail-open: any error returns a no-op result and never throws, so a missing
 * migration / transient DB error can never block a turn — Hermes compression
 * remains the parachute.
 */

/** Env kill-switch so rotation can be disabled without redeploying agents. */
function rotationDisabled(): boolean {
  return process.env.AMTECH_SESSION_ROTATION_DISABLED === "1";
}

/**
 * The employee's model id, as a capability input for the context-window lookup
 * ONLY (never a behavior branch). Mirrors profile-renderer's model selection:
 * production ships claude-opus-4-8; local no-key bridge points at the bridge
 * worker. Per-employee model storage is a future seam (LLM provider registry).
 */
export function resolveEmployeeModelId(): string {
  if (process.env.HERMES_MODEL_PROVIDER) return process.env.HERMES_MODEL_DEFAULT ?? "bridge-agent";
  return "claude-opus-4-8";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Current context occupancy (prompt tokens of the last turn) from a provider
 * `usage` object, tolerant of shape across providers. Returns null when no token
 * field is present (caller then SKIPS rotation for that turn).
 *
 * Anthropic reports cache tokens SEPARATELY from `input_tokens`, so they are
 * additive to reflect true context size; OpenAI's `cached_tokens` is a subset of
 * `prompt_tokens` and is intentionally NOT added. Exact field semantics are a
 * live-Hermes proof item.
 */
export function promptTokensFrom(usage: Record<string, unknown> | undefined | null): number | null {
  if (!usage || typeof usage !== "object") return null;
  const u = usage as Record<string, unknown>;
  const base = num(u.prompt_tokens) ?? num(u.input_tokens) ?? num(u.promptTokens) ?? num(u.inputTokens);
  if (base == null) return null;
  const cacheRead = num(u.cache_read_input_tokens) ?? 0;
  const cacheCreate = num(u.cache_creation_input_tokens) ?? 0;
  return base + cacheRead + cacheCreate;
}

export interface RecordOccupancyInput {
  account_id: string;
  employee_id: string;
  /** api.sessionId — the Hermes transcript/run id this turn ran on. */
  transcript_session_id: string;
  /** api.sessionKey — the stable X-Hermes-Session-Key memory scope (preserved). */
  memory_session_key: string;
  usage: Record<string, unknown> | undefined;
}

export interface RotationResult {
  rotated: boolean;
  context_tokens?: number;
  new_transcript_session_id?: string;
  skipped?: "disabled" | "no_active" | "under_threshold" | "error";
}

interface ActiveSessionRow {
  transcript_session_id: string;
  account_id?: string | null;
  memory_session_key?: string | null;
  context_tokens?: number | null;
  turn_count?: number | null;
}

/**
 * POST-turn: persist this turn's prompt-token occupancy on the active transcript
 * row so the next turn's pre-turn check can decide whether to rotate. Never
 * rotates. Occupancy unknown (`usage` missing a token field) still bumps the turn
 * count so lineage is tracked; the pre-turn check simply won't trip without a
 * number.
 */
export async function recordSessionOccupancy(db: SupabaseClient, input: RecordOccupancyInput): Promise<{ context_tokens: number | null }> {
  try {
    const tokens = promptTokensFrom(input.usage);
    const nowIso = new Date().toISOString();
    const existing = orThrow(
      await db
        .from("employee_sessions")
        .select("transcript_session_id,context_tokens,turn_count")
        .eq("employee_id", input.employee_id)
        .eq("transcript_session_id", input.transcript_session_id)
        .maybeSingle(),
      "employee_sessions.lookup",
    ) as ActiveSessionRow | null;

    if (!existing) {
      await db.from("employee_sessions").insert({
        employee_id: input.employee_id,
        transcript_session_id: input.transcript_session_id,
        account_id: input.account_id,
        memory_session_key: input.memory_session_key,
        context_tokens: tokens ?? 0,
        turn_count: 1,
        status: "active",
        pending_carryover: false,
        created_at: nowIso,
        updated_at: nowIso,
      });
    } else {
      await db
        .from("employee_sessions")
        .update({
          context_tokens: tokens ?? existing.context_tokens ?? 0,
          turn_count: Number(existing.turn_count ?? 0) + 1,
          updated_at: nowIso,
        })
        .eq("employee_id", input.employee_id)
        .eq("transcript_session_id", input.transcript_session_id);
    }
    return { context_tokens: tokens };
  } catch {
    return { context_tokens: null };
  }
}

/**
 * PRE-turn: if the active transcript's recorded occupancy is at/over the rotate
 * threshold (rotate_ratio x context_window, clamped <=400k), rotate BEFORE this
 * turn runs. Marks the current row `rotated`, mints a fresh transcript id,
 * preserves the memory key, writes a new active row with `pending_carryover=true`,
 * and repoints `runtime_endpoints.api_session_id`. The turn then runs on the fresh
 * transcript and re-primes via the existing pre_llm_call gate.
 */
export async function rotateSessionIfNeeded(
  db: SupabaseClient,
  // CE-4 seam: an optional `rotate_ratio` (from a business-type/operator-mode
  // ContextPolicy) overrides the 0.40 default. Absent → today's behavior.
  input: { account_id: string; employee_id: string; rotate_ratio?: number },
): Promise<RotationResult> {
  if (rotationDisabled()) return { rotated: false, skipped: "disabled" };
  try {
    const active = orThrow(
      await db
        .from("employee_sessions")
        .select("transcript_session_id,account_id,memory_session_key,context_tokens,turn_count")
        .eq("employee_id", input.employee_id)
        .eq("status", "active")
        .maybeSingle(),
      "employee_sessions.active",
    ) as ActiveSessionRow | null;
    if (!active) return { rotated: false, skipped: "no_active" };

    const tokens = Number(active.context_tokens ?? 0);
    const rotateAt = rotateAtTokens(resolveEmployeeModelId(), input.rotate_ratio);
    if (tokens < rotateAt) return { rotated: false, context_tokens: tokens, skipped: "under_threshold" };

    const nowIso = new Date().toISOString();
    // Mark current rotated BEFORE inserting the new active row so the
    // partial-unique (one active per employee) never conflicts.
    await db
      .from("employee_sessions")
      .update({ status: "rotated", updated_at: nowIso })
      .eq("employee_id", input.employee_id)
      .eq("transcript_session_id", active.transcript_session_id);

    const newTranscript = newId(ID_PREFIX.transcriptSession);
    await db.from("employee_sessions").insert({
      employee_id: input.employee_id,
      transcript_session_id: newTranscript,
      account_id: active.account_id ?? input.account_id,
      memory_session_key: active.memory_session_key ?? "", // PRESERVED
      context_tokens: 0,
      turn_count: 0,
      status: "active",
      rotated_from: active.transcript_session_id,
      pending_carryover: true,
      created_at: nowIso,
      updated_at: nowIso,
    });

    // Repoint the transcript id only; leave api_session_key (memory scope) intact.
    await db
      .from("runtime_endpoints")
      .update({ api_session_id: newTranscript })
      .eq("employee_id", input.employee_id);

    return { rotated: true, context_tokens: tokens, new_transcript_session_id: newTranscript };
  } catch {
    return { rotated: false, skipped: "error" };
  }
}
