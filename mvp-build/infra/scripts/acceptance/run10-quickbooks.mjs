#!/usr/bin/env node
/**
 * Acceptance Run 10 — QuickBooks Online connector.
 * Asserts, against the live DB, real proof of the full pipeline: a connected
 * QuickBooks connector (realm_id + status connected), at least one COMMITTED
 * pending write carrying a real QBO entity id (qbo_entity_id), and — if any
 * webhook has arrived — a recorded inbound_qbo_event. Manually injected results
 * are not acceptance: a committed write must carry a real qbo_entity_id.
 *
 * REALNESS: `not-run` when QBO/Supabase env is absent; `fail` when env is present
 * but no real proof rows exist; never a fabricated pass.
 */
import { runById, runnability, serviceDb, resolveEmployee, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(10);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const employee = await resolveEmployee(db);
  if (!employee) return mkResult(RUN, STATUS.FAIL, { notes: ["no live employee (set SMOKE_EMPLOYEE_ID)"] });

  const proofs = {};
  const fails = [];

  const { data: conn } = await db
    .from("connector_accounts").select("*")
    .eq("employee_id", employee.id).eq("connector_key", "accounting").eq("provider", "quickbooks")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!conn?.realm_id || conn.status !== "connected") {
    return mkResult(RUN, STATUS.FAIL, { notes: ["no connected QuickBooks connector (realm_id + status=connected)"] });
  }
  proofs.connected = `realm=${conn.realm_id} env=${conn.environment ?? "?"} (${conn.status})`;

  const { data: committed } = await db
    .from("quickbooks_pending_writes").select("*")
    .eq("employee_id", employee.id).eq("status", "committed").not("qbo_entity_id", "is", null)
    .order("committed_at", { ascending: false }).limit(1).maybeSingle();
  if (!committed?.qbo_entity_id) fails.push("a committed write with a real qbo_entity_id (approve + commit_quickbooks_write)");
  else proofs.committed_write = `${committed.entity_type} id=${committed.qbo_entity_id} (approval ${committed.approval_id})`;

  // Webhook proof is optional (depends on whether a change fired during the run),
  // but surface it when present.
  const { data: inbound } = await db
    .from("inbound_qbo_events").select("*")
    .eq("connector_id", conn.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (inbound?.id) proofs.webhook_event = `${inbound.entity_type}:${inbound.entity_id} ${inbound.operation} (${inbound.delivery_status})`;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, { proofs, notes: fails.map((f) => `missing proof: ${f}`) });
}

await runMain(import.meta.url, verify);
