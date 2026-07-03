#!/usr/bin/env node
/**
 * Acceptance Run 5 — Stripe Connect Deposit (doc 03 §5, TEST MODE).
 * Asserts: a connected Stripe account, a deposit invoice with a hosted invoice URL,
 * and a signature-verified webhook event. Test mode is acceptable; manually injected
 * Stripe results are not (a webhook row must have signature_verified = true).
 */
import { runById, runnability, serviceDb, resolveEmployee, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(5);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const employee = await resolveEmployee(db);
  if (!employee) return mkResult(RUN, STATUS.FAIL, { notes: ["no live employee (set SMOKE_EMPLOYEE_ID)"] });

  const proofs = {};
  const fails = [];

  const { data: conn } = await db
    .from("stripe_connections").select("*")
    .eq("employee_id", employee.id).not("connected_account_id", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!conn?.connected_account_id) {
    return mkResult(RUN, STATUS.FAIL, { notes: ["no connected Stripe account (connected_account_id)"] });
  }
  proofs.connected_account = `${conn.connected_account_id} (${conn.onboarding_status})`;

  const { data: invoice } = await db
    .from("stripe_invoices").select("*")
    .eq("stripe_connection_id", conn.id).not("stripe_invoice_id", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!invoice?.stripe_invoice_id || !invoice?.hosted_invoice_url) fails.push("deposit invoice (stripe_invoice_id + hosted_invoice_url)");
  else proofs.invoice = `${invoice.stripe_invoice_id} status=${invoice.status}`;

  const { data: webhook } = await db
    .from("stripe_webhook_events").select("*")
    .eq("signature_verified", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!webhook?.stripe_event_id) fails.push("signature-verified Stripe webhook event");
  else proofs.webhook_event = `${webhook.stripe_event_id} (${webhook.type})`;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, { proofs, notes: fails.map((f) => `missing proof: ${f}`) });
}

await runMain(import.meta.url, verify);
