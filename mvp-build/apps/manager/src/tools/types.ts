/**
 * Tool handler contract. Every Manager tool is a handler returning a ToolEnvelope.
 * The `stub()` helper enforces the Phase-0 rules structurally: write audit, run an
 * entitlement check, and return a real `not_implemented` envelope — never a faked
 * provider success.
 */
import {
  notImplemented,
  type ToolEnvelope,
  type ToolName,
} from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { writeAudit } from "../lib/audit.js";
import { checkFeature } from "../lib/entitlements.js";

export interface ToolContext {
  db: SupabaseClient;
  account_id?: string | null;
  employee_id?: string | null;
  /** Canonical execution scope. account_id/employee_id remain compatibility projections only. */
  assignment_id?: string | null;
  /** Authenticated principal supplied by the transport, never by model input. */
  principal_id?: string | null;
  principal_class?: "human" | "employee" | "service" | "platform" | null;
  authenticated_by?: string | null;
  actor: "front_door" | "employee" | "manager" | "owner" | "scheduler";
}

export type ToolHandler = (ctx: ToolContext, input: unknown) => Promise<ToolEnvelope>;

/** Build a Phase-0 stub handler for a tool: audit + entitlement log + not_implemented. */
export function stub(name: ToolName): ToolHandler {
  return async (ctx, _input) => {
    await checkFeature(ctx.db, ctx, name);
    const audit_id = await writeAudit(ctx.db, {
      account_id: ctx.account_id ?? null,
      employee_id: ctx.employee_id ?? null,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: `tool:${name}`,
      result: "failed",
      details: { reason: "not_implemented", phase0_stub: true },
    });
    return notImplemented(name, {
      account_id: ctx.account_id ?? null,
      employee_id: ctx.employee_id ?? null,
      assignment_id: ctx.assignment_id ?? null,
      audit_id,
    });
  };
}
