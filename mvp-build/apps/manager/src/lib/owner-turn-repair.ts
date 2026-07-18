import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import { mustWrite } from "./db.js";

export interface RepairOwnerWebTurnInput {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  command_id: string;
}

export type RepairOwnerWebTurnResult =
  | {
      status: "accepted";
      command_id: string;
      assignment_id: string;
      employee_id: string;
      reply: string;
      turn_job_id: string;
      run_id: string;
      receipt: { id: string; status: "accepted"; durable: true; reconciled: true };
    }
  | {
      status: "failed";
      command_id: string;
      assignment_id: string;
      employee_id: string;
      reply: "";
      turn_job_id: string;
      run_id: string | null;
      error: string;
      receipt: { id: string; status: "failed"; durable: true; reconciled: true };
    }
  | {
      status: "ambiguous";
      command_id: string;
      assignment_id: string;
      employee_id: string;
      reply: "";
      turn_job_id: string;
      run_id: string | null;
      error: string;
      retry_after: number;
      receipt: { id: string; status: "ambiguous"; durable: true; reconciled: false };
    };

interface CommandRow {
  id: string;
  assignment_id: string;
  actor_principal_id: string;
  command_type: string;
  payload: Record<string, unknown>;
  status: string;
  terminal_receipt_id?: string | null;
}

interface ReceiptRow {
  id: string;
  state: "accepted" | "failed" | "ambiguous";
  evidence?: Record<string, unknown> | null;
  error_code?: string | null;
  ambiguity_code?: string | null;
}

interface ReplayRow {
  response?: Record<string, unknown> | null;
}

interface TurnJobRow {
  id: string;
  assignment_id?: string | null;
  employee_id: string;
  status: string;
  output?: Record<string, unknown> | null;
  error?: string | null;
  run_id?: string | null;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex")}`;
}

function messageId(assignmentId: string, principalId: string, intentId: string): string {
  const digest = createHash("sha256")
    .update([assignmentId, principalId, intentId].join("\u001f"))
    .digest("hex")
    .slice(0, 32);
  return `msg_${digest}`;
}

async function currentTerminal(
  db: SupabaseClient,
  command: CommandRow,
  input: RepairOwnerWebTurnInput,
): Promise<RepairOwnerWebTurnResult | null> {
  if (!command.terminal_receipt_id) return null;
  const [receiptResult, replayResult] = await Promise.all([
    db.from("effect_receipts")
      .select("id,state,evidence,error_code,ambiguity_code")
      .eq("id", command.terminal_receipt_id)
      .maybeSingle(),
    db.from("command_replay_responses")
      .select("response")
      .eq("command_id", command.id)
      .maybeSingle(),
  ]);
  if (receiptResult.error) throw receiptResult.error;
  if (replayResult.error) throw replayResult.error;
  const receipt = receiptResult.data as ReceiptRow | null;
  const replay = replayResult.data as ReplayRow | null;
  if (!receipt) return null;
  const result = replay?.response?.result as Record<string, unknown> | null | undefined;
  const evidence = receipt.evidence ?? {};
  const turnJobId = String(result?.turn_job_id ?? evidence.turn_job_id ?? "");
  const runIdValue = result?.run_id ?? evidence.run_id;
  const runId = typeof runIdValue === "string" ? runIdValue : null;
  if (receipt.state === "accepted" && turnJobId && runId) {
    return {
      status: "accepted",
      command_id: command.id,
      assignment_id: input.assignment_id,
      employee_id: input.employee_id,
      reply: String(result?.reply ?? ""),
      turn_job_id: turnJobId,
      run_id: runId,
      receipt: { id: receipt.id, status: "accepted", durable: true, reconciled: true },
    };
  }
  if (receipt.state === "failed" && turnJobId) {
    return {
      status: "failed",
      command_id: command.id,
      assignment_id: input.assignment_id,
      employee_id: input.employee_id,
      reply: "",
      turn_job_id: turnJobId,
      run_id: runId,
      error: String(receipt.error_code ?? "hermes_turn_failed"),
      receipt: { id: receipt.id, status: "failed", durable: true, reconciled: true },
    };
  }
  if (receipt.state === "ambiguous" && turnJobId) {
    return {
      status: "ambiguous",
      command_id: command.id,
      assignment_id: input.assignment_id,
      employee_id: input.employee_id,
      reply: "",
      turn_job_id: turnJobId,
      run_id: runId,
      error: String(receipt.ambiguity_code ?? "hermes_turn_ambiguous"),
      retry_after: 2,
      receipt: { id: receipt.id, status: "ambiguous", durable: true, reconciled: false },
    };
  }
  return null;
}

export async function repairOwnerWebTurnCommand(
  db: SupabaseClient,
  input: RepairOwnerWebTurnInput,
): Promise<RepairOwnerWebTurnResult> {
  const commandResult = await db.from("durable_commands")
    .select("id,assignment_id,actor_principal_id,command_type,payload,status,terminal_receipt_id")
    .eq("id", input.command_id)
    .eq("assignment_id", input.assignment_id)
    .maybeSingle();
  if (commandResult.error) throw commandResult.error;
  const command = commandResult.data as CommandRow | null;
  if (!command || command.command_type !== "owner.web.turn") throw new Error("owner_turn_command_not_found");
  if (String(command.payload?.employee_id ?? "") !== input.employee_id) throw new Error("owner_turn_command_scope_mismatch");

  if (command.status !== "ambiguous") {
    const terminal = await currentTerminal(db, command, input);
    if (terminal) return terminal;
    throw new Error("owner_turn_command_not_repairable");
  }

  const receiptResult = await db.from("effect_receipts")
    .select("id,state,evidence,error_code,ambiguity_code")
    .eq("id", command.terminal_receipt_id)
    .maybeSingle();
  if (receiptResult.error) throw receiptResult.error;
  const receipt = receiptResult.data as ReceiptRow | null;
  if (!receipt || receipt.state !== "ambiguous") throw new Error("owner_turn_ambiguous_receipt_missing");
  const turnJobId = typeof receipt.evidence?.turn_job_id === "string" ? receipt.evidence.turn_job_id : "";
  if (!turnJobId) throw new Error("owner_turn_job_reference_missing");

  const jobResult = await db.from("employee_turn_jobs")
    .select("id,assignment_id,employee_id,status,output,error,run_id")
    .eq("id", turnJobId)
    .eq("assignment_id", input.assignment_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (jobResult.error) throw jobResult.error;
  const job = jobResult.data as TurnJobRow | null;
  if (!job) throw new Error("owner_turn_job_not_found");

  if (job.status !== "succeeded" && job.status !== "failed") {
    return {
      status: "ambiguous",
      command_id: command.id,
      assignment_id: input.assignment_id,
      employee_id: input.employee_id,
      reply: "",
      turn_job_id: job.id,
      run_id: job.run_id ?? null,
      error: `hermes_turn_${job.status}`,
      retry_after: 2,
      receipt: { id: receipt.id, status: "ambiguous", durable: true, reconciled: false },
    };
  }

  const intentId = String(command.payload?.intent_id ?? "");
  if (!intentId) throw new Error("owner_turn_intent_missing");
  if (job.status === "succeeded") {
    const reply = String(job.output?.reply ?? "");
    const runId = String(job.run_id ?? job.output?.run_id ?? "");
    if (!runId) throw new Error("owner_turn_run_receipt_missing");
    const outboundMessageId = `${messageId(input.assignment_id, command.actor_principal_id, intentId)}_reply`;
    await mustWrite(
      db.from("employee_messages").upsert({
        id: outboundMessageId,
        assignment_id: input.assignment_id,
        account_id: input.account_id,
        employee_id: input.employee_id,
        direction: "to_owner",
        source: "employee",
        channel: "web",
        body: reply,
        status: "delivered",
      }, { onConflict: "id", ignoreDuplicates: true }),
      "employee_messages.upsert.owner_web_reconciled_reply",
    );
    const response = {
      result: {
        assignment_id: input.assignment_id,
        employee_id: input.employee_id,
        reply,
        turn_job_id: job.id,
        run_id: runId,
      },
    };
    const reconciled = await db.rpc("reconcile_ambiguous_command", {
      p_command_id: command.id,
      p_target_state: "accepted",
      p_provider_receipt_id: `hermes-turn-job:${job.id}`,
      p_error_code: null,
      p_response_hash: hashJson(response),
      p_response: response,
      p_evidence: { turn_job_id: job.id, run_id: runId, source: "employee_turn_jobs" },
    });
    if (reconciled.error) throw reconciled.error;
  } else {
    const errorCode = String(job.error ?? "hermes_turn_failed").slice(0, 160);
    const response = { result: null, error_code: errorCode };
    const reconciled = await db.rpc("reconcile_ambiguous_command", {
      p_command_id: command.id,
      p_target_state: "failed",
      p_provider_receipt_id: null,
      p_error_code: errorCode,
      p_response_hash: hashJson(response),
      p_response: response,
      p_evidence: { turn_job_id: job.id, run_id: job.run_id ?? null, source: "employee_turn_jobs" },
    });
    if (reconciled.error) throw reconciled.error;
  }

  const refreshedResult = await db.from("durable_commands")
    .select("id,assignment_id,actor_principal_id,command_type,payload,status,terminal_receipt_id")
    .eq("id", command.id)
    .maybeSingle();
  if (refreshedResult.error) throw refreshedResult.error;
  const refreshed = refreshedResult.data as CommandRow | null;
  if (!refreshed) throw new Error("owner_turn_command_missing_after_reconciliation");
  const terminal = await currentTerminal(db, refreshed, input);
  if (!terminal) throw new Error("owner_turn_reconciliation_receipt_missing");
  return terminal;
}
