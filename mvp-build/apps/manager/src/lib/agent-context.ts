import type { SupabaseClient } from "@amtech/db";
import type { ContextPolicy } from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import type { buildBusinessBrainIndex } from "./business-brain.js";

const MAX_ESTIMATED_TOKENS = 2000;
const SESSION_TARGET_TOKENS = 400000;
const MAX_CHARS = MAX_ESTIMATED_TOKENS * 4;

type BrainIndex = Awaited<ReturnType<typeof buildBusinessBrainIndex>>;

export function estimatedTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function pushLine(lines: string[], line: string): void {
  if (!line.trim()) return;
  const next = [...lines, line].join("\n");
  if (estimatedTokens(next) <= MAX_ESTIMATED_TOKENS) lines.push(line);
}

function compact(value: string, max = 180): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

/**
 * CE-3 carryover: when the primer fires on a transcript that was just rotated
 * (`pending_carryover`), it carries STATE + next step forward — not the raw
 * transcript. `last_decision` / `next_action` are sourced from Manager state
 * (snapshot), not the old conversation.
 */
export interface SessionCarryover {
  pending: boolean;
  last_decision?: string | null;
  next_action?: string | null;
}

export function buildAgentContext(input: {
  snapshot: EmployeeSnapshot;
  brain: BrainIndex;
  carryover?: SessionCarryover;
  /**
   * CE-4 seam: optional business-type/operator-mode policy. Absent → today's
   * behavior exactly. When present, it prepends a one-line emphasis; the custody
   * framing line below is always emitted (it is accurate regardless of policy).
   */
  policy?: ContextPolicy;
}): string {
  const s = input.snapshot;
  const b = input.brain;
  const lines: string[] = [];
  pushLine(lines, "AMTECH session primer: use references, not payload memory.");
  if (input.policy?.primer_emphasis) pushLine(lines, input.policy.primer_emphasis);
  pushLine(lines, `Session budget target: stay under ${SESSION_TARGET_TOKENS} total tokens; rotate before compaction in CE-3.`);
  pushLine(lines, "Custody: money and customer-facing actions are prepared for owner approval; read-only connectors are used directly.");
  const priorEmployeeReplies = (s.messages ?? []).filter((m) => m.direction === "to_owner").length;
  if (priorEmployeeReplies === 0) {
    pushLine(lines, "First owner contact: give a light orientation in business language, show one useful next step, and avoid subsystem/tool jargon.");
  }
  if (input.carryover?.pending) {
    pushLine(lines, "Continuing from a rotated session; prior detail is in Hermes session_search and the brain/facts resources.");
    if (input.carryover.last_decision) pushLine(lines, `Last decision: ${input.carryover.last_decision}`);
    if (input.carryover.next_action) pushLine(lines, `Next action: ${input.carryover.next_action}`);
  }
  pushLine(lines, `Business brain index: ${b.resources.brain}`);
  pushLine(lines, `Explicit facts resource: ${b.resources.facts}`);
  pushLine(lines, `Recall: use Hermes session_search before asking the owner to repeat prior context.`);
  pushLine(lines, `Profile package: ${b.brain_index.profile_package}; slots: ${b.brain_index.context_slots.map((slot) => slot.key).join(", ") || "none"}.`);
  pushLine(lines, `Counts: facts ${b.proof.fact_count}, connectors ${b.proof.connector_count}, artifacts ${b.proof.artifact_count}, open approvals ${b.proof.open_approval_count}, work items ${b.proof.work_queue_count}, capabilities ${b.proof.capability_count}.`);
  pushLine(lines, `Resources: ${Object.values(b.resources).join(", ")}.`);

  for (const slot of (b.brain_index.context_slots ?? []).slice(0, 6)) {
    const facts = "facts" in slot && Array.isArray(slot.facts) ? slot.facts : [];
    if (!facts.length) continue;
    pushLine(lines, `Business context - ${slot.title}:`);
    for (const fact of facts.slice(0, 6)) {
      const key = "key" in fact ? String(fact.key) : "fact";
      const value = "value" in fact ? String(fact.value) : "";
      pushLine(lines, `- ${key}: ${compact(value)}`);
    }
  }

  for (const connection of (s.connection_surfaces ?? []).slice(0, 4)) {
    pushLine(lines, `Connection: ${connection.label} is ${connection.state}${connection.health ? ` (${connection.health})` : ""}.`);
  }
  for (const item of (s.resurface_items ?? []).slice(0, 4)) {
    pushLine(lines, `Needs attention: ${item.title} [${item.status}] -> ${item.target?.kind ?? "resource"}:${item.target?.id ?? item.id}.`);
  }
  for (const task of (s.tasks ?? []).slice(0, 4)) {
    pushLine(lines, `Task: ${task.title} [${task.status}]${task.target_id ? ` -> ${task.target_id}` : ""}.`);
  }
  for (const approval of (s.approvals ?? []).slice(0, 3)) {
    pushLine(lines, `Open approval: ${approval.id} ${approval.action_key} risk=${approval.risk_level}.`);
  }
  pushLine(lines, "Do not paste raw provider payloads, secrets, full snapshots, or facts dumps into the conversation.");

  const text = lines.join("\n");
  return text.length <= MAX_CHARS ? text : text.slice(0, MAX_CHARS).replace(/\s+\S*$/, "");
}

/**
 * Result of trying to acquire the once-per-session primer gate:
 * - `primed`         — gate acquired now; caller should return the primer.
 * - `already_primed` — a row already exists for this transcript (PK conflict);
 *                      caller returns empty context.
 * - `claim_failed`   — the insert failed for a NON-conflict reason (table absent
 *                      because `0029` is unapplied, or a transient DB error). This
 *                      MUST be distinguished from `already_primed`: reporting it as
 *                      already-primed makes the employee NEVER prime (silent). The
 *                      caller fails open (primes anyway) and surfaces it loudly.
 */
export type PrimerClaim = "primed" | "already_primed" | "claim_failed";

/**
 * The single most important open item for a rotated-session handoff, sourced from
 * Manager state (snapshot) — not the old transcript. Prefers an open approval
 * (the owner is waiting), then a resurfaced item, then a task.
 */
export function deriveNextAction(snapshot: EmployeeSnapshot): string | null {
  const approval = (snapshot.approvals ?? [])[0];
  if (approval) return `Resolve approval ${approval.action_key} (${approval.id})`;
  const resurface = (snapshot.resurface_items ?? [])[0];
  if (resurface) return resurface.title;
  const task = (snapshot.tasks ?? [])[0];
  if (task) return task.title;
  return null;
}

export async function claimAgentContextPrimer(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  transcript_session_id: string;
}): Promise<PrimerClaim> {
  const { error } = await db.from("agent_context_primer_sessions").insert({
    account_id: input.account_id,
    employee_id: input.employee_id,
    transcript_session_id: input.transcript_session_id,
    created_at: new Date().toISOString(),
  });
  if (!error) return "primed";
  // 23505 = unique_violation on the (employee_id, transcript_session_id) PK: this
  // transcript already primed. Any other code (42P01 undefined_table, transient,
  // etc.) is a claim failure, not an already-primed signal.
  return (error as { code?: string }).code === "23505" ? "already_primed" : "claim_failed";
}
