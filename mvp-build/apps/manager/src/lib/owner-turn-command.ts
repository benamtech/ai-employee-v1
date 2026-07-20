import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  DurableEffectAmbiguousError,
  executeDurableCommandEffect,
} from "./durable-command-runtime.js";
import { deliverOwnerTurnToRuntime } from "./runtime.js";
import { stampChannelPresence } from "./channel-router.js";
import { mustWrite } from "./db.js";

export interface OwnerWebTurnCommandInput {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  principal_id: string;
  policy_version: string;
  authenticated_by: string;
  intent_id: string;
  body: string;
  correlation_id?: string | null;
  causation_id?: string | null;
}

export interface OwnerWebTurnAccepted {
  status: "accepted";
  command_id: string;
  assignment_id: string;
  employee_id: string;
  reply: string;
  turn_job_id: string;
  run_id: string;
  receipt: { id: string; status: "accepted"; durable: true };
}

export interface OwnerWebTurnNonAccepted {
  status: "failed" | "ambiguous";
  command_id: string;
  assignment_id: string;
  employee_id: string;
  reply: "";
  turn_job_id: string | null;
  run_id: string | null;
  error: string;
  repair_url: string;
  receipt: { id: string; status: "failed" | "ambiguous"; durable: true };
}

export type OwnerWebTurnCommandResult = OwnerWebTurnAccepted | OwnerWebTurnNonAccepted;

interface OwnerTurnEffectResult {
  assignment_id: string;
  employee_id: string;
  reply: string;
  turn_job_id: string;
  run_id: string;
}

interface TerminalCommandRow {
  terminal_receipt_id?: string | null;
  response?: Record<string, unknown> | null;
}

interface TerminalReceiptRow {
  id: string;
  state: "accepted" | "failed" | "ambiguous";
  error_code?: string | null;
  ambiguity_code?: string | null;
  evidence?: Record<string, unknown> | null;
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

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashJson(value: unknown): string {
  return `sha256:${sha256(JSON.stringify(canonicalize(value)))}`;
}

export function ownerWebTurnCommandIdentity(input: Pick<OwnerWebTurnCommandInput, "assignment_id" | "principal_id" | "intent_id">) {
  const digest = sha256(["owner-web-turn-v1", input.assignment_id, input.principal_id, input.intent_id].join("\u001f"));
  return {
    intent_id: `intent_${digest.slice(0, 32)}`,
    command_id: `cmd_${digest.slice(32)}`,
    intent_key: `owner-web:${input.principal_id}:${input.intent_id}`,
    effect_key: `owner-web-turn:${input.assignment_id}:${input.intent_id}`,
  };
}

export function ownerWebTurnCommandPayload(input: Pick<OwnerWebTurnCommandInput, "employee_id" | "body" | "intent_id">) {
  return {
    schema_version: "owner-web-turn-v1",
    employee_id: input.employee_id,
    intent_id: input.intent_id,
    body_hash: `sha256:${sha256(input.body)}`,
    body_chars: input.body.length,
    channel: "web",
  };
}

async function registerOwnerWebTurnCommand(db: SupabaseClient, input: OwnerWebTurnCommandInput) {
  const identity = ownerWebTurnCommandIdentity(input);
  const payload = ownerWebTurnCommandPayload(input);
  const registered = await db.rpc("register_durable_command", {
    p_intent_id: identity.intent_id,
    p_assignment_id: input.assignment_id,
    p_actor_principal_id: input.principal_id,
    p_actor_class: "human",
    p_authenticated_by: input.authenticated_by,
    p_intent_key: identity.intent_key,
    p_command_id: identity.command_id,
    p_command_type: "owner.web.turn",
    p_command_version: "1.0.0",
    p_policy_version: input.policy_version,
    p_payload: payload,
    p_payload_hash: hashJson(payload),
    p_correlation_id: input.correlation_id ?? identity.intent_id,
    p_causation_id: input.causation_id ?? null,
  });
  if (registered.error) throw registered.error;
  return identity;
}

async function loadTerminalCommand(
  db: SupabaseClient,
  commandId: string,
): Promise<{ replay: TerminalCommandRow; receipt: TerminalReceiptRow } | null> {
  const replay = await db.from("command_replay_responses")
    .select("terminal_receipt_id,response")
    .eq("command_id", commandId)
    .maybeSingle();
  if (replay.error) throw replay.error;
  const replayRow = replay.data as TerminalCommandRow | null;
  if (!replayRow?.terminal_receipt_id) return null;
  const receipt = await db.from("effect_receipts")
    .select("id,state,error_code,ambiguity_code,evidence")
    .eq("id", replayRow.terminal_receipt_id)
    .maybeSingle();
  if (receipt.error) throw receipt.error;
  const receiptRow = receipt.data as TerminalReceiptRow | null;
  if (!receiptRow?.id) return null;
  return { replay: replayRow, receipt: receiptRow };
}

function terminalResult(
  input: OwnerWebTurnCommandInput,
  commandId: string,
  terminal: { replay: TerminalCommandRow; receipt: TerminalReceiptRow },
): OwnerWebTurnCommandResult {
  const result = terminal.replay.response?.result as Partial<OwnerTurnEffectResult> | null | undefined;
  if (terminal.receipt.state === "accepted" && result?.turn_job_id && result.run_id) {
    return {
      status: "accepted",
      command_id: commandId,
      assignment_id: input.assignment_id,
      employee_id: input.employee_id,
      reply: String(result.reply ?? ""),
      turn_job_id: String(result.turn_job_id),
      run_id: String(result.run_id),
      receipt: { id: terminal.receipt.id, status: "accepted", durable: true },
    };
  }
  const status = terminal.receipt.state === "ambiguous" ? "ambiguous" : "failed";
  const evidence = terminal.receipt.evidence ?? {};
  return {
    status,
    command_id: commandId,
    assignment_id: input.assignment_id,
    employee_id: input.employee_id,
    reply: "",
    turn_job_id: typeof evidence.turn_job_id === "string" ? evidence.turn_job_id : null,
    run_id: typeof evidence.run_id === "string" ? evidence.run_id : null,
    error: String(terminal.receipt.ambiguity_code ?? terminal.receipt.error_code ?? `owner_turn_${status}`),
    repair_url: `/manager/employee/${encodeURIComponent(input.employee_id)}/commands/${encodeURIComponent(commandId)}`,
    receipt: { id: terminal.receipt.id, status, durable: true },
  };
}

export async function executeOwnerWebTurnCommand(
  db: SupabaseClient,
  input: OwnerWebTurnCommandInput,
): Promise<OwnerWebTurnCommandResult> {
  const identity = await registerOwnerWebTurnCommand(db, input);
  const existing = await loadTerminalCommand(db, identity.command_id);
  if (existing) return terminalResult(input, identity.command_id, existing);

  try {
    const execution = await executeDurableCommandEffect<OwnerTurnEffectResult>(db, {
      assignment_id: input.assignment_id,
      command_id: identity.command_id,
      effect_key: identity.effect_key,
      provider: "hermes",
      operation: "owner_turn",
      capability_class: "consumer_dedupe",
      request: {
        assignment_id: input.assignment_id,
        employee_id: input.employee_id,
        intent_id: input.intent_id,
        body_hash: ownerWebTurnCommandPayload(input).body_hash,
      },
      apply: async () => {
        const employee = await db.from("employees")
          .select("id,account_id,status")
          .eq("id", input.employee_id)
          .eq("account_id", input.account_id)
          .maybeSingle();
        if (employee.error) throw employee.error;
        if (!employee.data?.id || employee.data.status !== "live") throw new Error("employee_not_live");

        const messageDigest = sha256([input.assignment_id, input.principal_id, input.intent_id].join("\u001f")).slice(0, 32);
        const inboundMessageId = `msg_${messageDigest}`;
        const existingInbound = await db.from("employee_messages")
          .select("id,assignment_id,body")
          .eq("id", inboundMessageId)
          .maybeSingle();
        if (existingInbound.error) throw existingInbound.error;
        if (existingInbound.data && (
          existingInbound.data.assignment_id !== input.assignment_id ||
          existingInbound.data.body !== input.body
        )) {
          throw new Error("intent_id_conflict");
        }
        if (!existingInbound.data) {
          await mustWrite(
            db.from("employee_messages").insert({
              id: inboundMessageId,
              assignment_id: input.assignment_id,
              account_id: input.account_id,
              employee_id: input.employee_id,
              direction: "to_employee",
              source: "web",
              channel: "web",
              body: input.body,
              status: "received",
            }),
            "employee_messages.insert.owner_web_c3",
          );
        }

        await stampChannelPresence(db, {
          account_id: input.account_id,
          employee_id: input.employee_id,
          channel: "web",
          session_info: {
            source: "web_message",
            assignment_id: input.assignment_id,
            intent_id: input.intent_id,
            command_id: identity.command_id,
          },
        });

        const turn = await deliverOwnerTurnToRuntime(db, {
          account_id: input.account_id,
          employee_id: input.employee_id,
          assignment_id: input.assignment_id,
          body: input.body,
          channel: "web",
          idempotency_key: `web:${input.assignment_id}:${input.intent_id}`,
        });
        if (turn.status === "queued") {
          throw new DurableEffectAmbiguousError("hermes_turn_queued", {
            turn_job_id: turn.job_id,
            run_id: turn.run_id,
          });
        }
        if (turn.status === "failed") throw new Error(turn.error ?? "hermes_turn_failed");
        if (!turn.job_id) {
          throw new DurableEffectAmbiguousError("hermes_turn_receipt_missing", { run_id: turn.run_id });
        }

        const outboundMessageId = `${inboundMessageId}_reply`;
        await mustWrite(
          db.from("employee_messages").upsert({
            id: outboundMessageId,
            assignment_id: input.assignment_id,
            account_id: input.account_id,
            employee_id: input.employee_id,
            direction: "to_owner",
            source: "employee",
            channel: "web",
            body: turn.reply ?? "",
            status: "delivered",
          }, { onConflict: "id", ignoreDuplicates: true }),
          "employee_messages.upsert.owner_web_reply_c3",
        );

        return {
          result: {
            assignment_id: input.assignment_id,
            employee_id: input.employee_id,
            reply: turn.reply ?? "",
            turn_job_id: turn.job_id,
            run_id: turn.run_id,
          },
          provider_receipt_id: `hermes-turn-job:${turn.job_id}`,
          evidence: {
            turn_status: turn.status,
            turn_job_id: turn.job_id,
            run_id: turn.run_id,
          },
        };
      },
    });
    return {
      status: "accepted",
      command_id: execution.command_id,
      assignment_id: input.assignment_id,
      employee_id: input.employee_id,
      reply: execution.result.reply,
      turn_job_id: execution.result.turn_job_id,
      run_id: execution.result.run_id,
      receipt: { id: execution.receipt_id, status: "accepted", durable: true },
    };
  } catch (error) {
    const terminal = await loadTerminalCommand(db, identity.command_id);
    if (terminal) return terminalResult(input, identity.command_id, terminal);
    throw error;
  }
}
