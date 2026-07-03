#!/usr/bin/env node
/**
 * Acceptance Run 2 — Account, Claim, Provisioning (doc 03 §2).
 * Reads the live DB for the smoke employee and asserts the provisioning proof ids:
 * live employee, verified phone Twilio proof, runtime endpoint (SMS + webchat),
 * first live outbound SMS SID, and a successful provisioning job.
 * (Supersedes the older infra/scripts/phase01-proof.mjs; `smoke:phase01` aliases this.)
 */
import { runById, runnability, serviceDb, resolveEmployee, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(2);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const employee = await resolveEmployee(db);
  if (!employee) {
    return mkResult(RUN, STATUS.FAIL, { notes: ["no live employee (set SMOKE_EMPLOYEE_ID or provision one first)"] });
  }

  const proofs = { employee: `${employee.id} (${employee.status})` };
  const fails = [];
  if (employee.status !== "live") fails.push("employee.status != live");

  const { data: phone } = await db
    .from("verified_phones").select("*")
    .eq("account_id", employee.account_id).order("verified_at", { ascending: false }).limit(1).maybeSingle();
  if (!phone?.twilio_proof || Object.keys(phone.twilio_proof).length === 0) fails.push("verified phone Twilio proof");
  else proofs.verified_phone = phone.id;

  const { data: runtime } = await db.from("runtime_endpoints").select("*").eq("employee_id", employee.id).maybeSingle();
  if (!runtime?.webchat_api_url || !runtime?.sms_number_e164) fails.push("runtime endpoint webchat + SMS number");
  else proofs.runtime_endpoint = `${runtime.sms_number_e164} ${runtime.webchat_api_url}`;
  if (!runtime?.health?.first_sms_sid) fails.push("first live SMS SID in runtime health");
  else proofs.first_sms_sid = runtime.health.first_sms_sid;

  const { data: firstSms } = await db
    .from("employee_messages").select("*")
    .eq("employee_id", employee.id).eq("channel", "sms").eq("direction", "to_owner")
    .not("provider_id", "is", null).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!firstSms?.provider_id) fails.push("outbound employee SMS provider id");
  else proofs.outbound_sms_provider_id = firstSms.provider_id;

  const { data: job } = await db.from("provisioning_jobs").select("*").eq("employee_id", employee.id).maybeSingle();
  if (!job || job.state !== "success") fails.push("successful provisioning job (state=success)");
  else proofs.provisioning_job = job.id;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, {
    proofs,
    notes: fails.map((f) => `missing proof: ${f}`),
  });
}

await runMain(import.meta.url, verify);
