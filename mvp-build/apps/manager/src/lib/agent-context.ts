import type { SupabaseClient } from "@amtech/db";
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

export function buildAgentContext(input: {
  snapshot: EmployeeSnapshot;
  brain: BrainIndex;
}): string {
  const s = input.snapshot;
  const b = input.brain;
  const lines: string[] = [];
  pushLine(lines, "AMTECH session primer: use references, not payload memory.");
  pushLine(lines, `Session budget target: stay under ${SESSION_TARGET_TOKENS} total tokens; rotate before compaction in CE-3.`);
  pushLine(lines, `Business brain index: ${b.resources.brain}`);
  pushLine(lines, `Explicit facts resource: ${b.resources.facts}`);
  pushLine(lines, `Recall: use Hermes session_search before asking the owner to repeat prior context.`);
  pushLine(lines, `Profile package: ${b.brain_index.profile_package}; slots: ${b.brain_index.context_slots.map((slot) => slot.key).join(", ") || "none"}.`);
  pushLine(lines, `Counts: facts ${b.proof.fact_count}, connectors ${b.proof.connector_count}, artifacts ${b.proof.artifact_count}, open approvals ${b.proof.open_approval_count}, work items ${b.proof.work_queue_count}, capabilities ${b.proof.capability_count}.`);
  pushLine(lines, `Resources: ${Object.values(b.resources).join(", ")}.`);

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

export async function claimAgentContextPrimer(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  session_key: string;
}): Promise<boolean> {
  const { error } = await db.from("agent_context_primer_sessions").insert({
    account_id: input.account_id,
    employee_id: input.employee_id,
    session_key: input.session_key,
    created_at: new Date().toISOString(),
  });
  return !error;
}
