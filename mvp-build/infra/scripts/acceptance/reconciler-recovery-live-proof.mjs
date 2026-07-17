#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { rm, utimes } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { createProvisionerIdempotencyStore } from "../../../apps/manager/dist/lib/provisioner-idempotency.js";
import {
  assert,
  fetchJson,
  requireArg,
  requireDestructiveApproval,
  requireEnv,
  run,
  waitFor,
  writeProof,
} from "./production-proof-lib.mjs";

requireEnv(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MANAGER_API_ORIGIN",
  "MANAGER_INTERNAL_TOKEN",
  "MANAGER_CONTAINER_NAME",
  "PROVISIONER_STATE_DIR",
);
const employeeId = requireArg("--employee");
requireDestructiveApproval(employeeId);
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const managerOrigin = process.env.MANAGER_API_ORIGIN.replace(/\/$/, "");
const proofSuffix = `${Date.now()}_${randomUUID().slice(0, 8)}`;

async function getEmployee() {
  const { data, error } = await db.from("employees").select("id,account_id,status,name").eq("id", employeeId).maybeSingle();
  if (error) throw error;
  assert(data?.status === "live", "destructive_employee_must_start_live", data);
  return data;
}

async function queue(accountId, commandType, reason) {
  const result = await fetchJson(`${managerOrigin}/manager/provisioning/commands`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      employee_id: employeeId,
      command_type: commandType,
      requested_by: "production-recovery-acceptance",
      idempotency_key: `acceptance:${commandType}:${employeeId}:${Date.now()}:${randomUUID()}`,
      payload: { reason },
    }),
  });
  assert([200, 202].includes(result.response.status) && result.json.command_id, "recovery_command_not_queued", { status: result.response.status, body: result.json });
  return result.json.command_id;
}

async function waitCommand(commandId, timeoutMs = 300_000) {
  return waitFor(`command:${commandId}`, async () => {
    const { data, error } = await db.from("provisioning_commands").select("id,status,evidence,error,provisioning_job_id,attempt_count,completed_at").eq("id", commandId).maybeSingle();
    if (error) throw error;
    if (["failed", "compensated"].includes(data?.status)) throw new Error(`command_${data.status}:${JSON.stringify(data.error ?? data.evidence)}`);
    return { done: data?.status === "succeeded", value: data };
  }, { timeoutMs, intervalMs: 1_000 });
}

const employee = await getEmployee();
const evidence = { employee_id: employeeId, account_id: employee.account_id };

const managerBefore = run("docker", ["inspect", "--format", "{{.Id}}", process.env.MANAGER_CONTAINER_NAME]).output;
run("docker", ["restart", process.env.MANAGER_CONTAINER_NAME], { timeout: 120_000 });
await waitFor("manager health after reboot", async () => {
  try {
    const health = await fetchJson(`${managerOrigin}/health`, { timeout: 5_000 });
    return { done: health.response.status === 200 && health.json.status === "ok", value: health.json };
  } catch {
    return { done: false };
  }
}, { timeoutMs: 120_000, intervalMs: 1_000 });
const managerAfter = run("docker", ["inspect", "--format", "{{.Id}}", process.env.MANAGER_CONTAINER_NAME]).output;
const rebootInspectId = await queue(employee.account_id, "inspect_drift", "prove_reboot_reconstruction");
const rebootInspect = await waitCommand(rebootInspectId);
evidence.reboot = { manager_container_before: managerBefore, manager_container_after: managerAfter, command_id: rebootInspectId, command: rebootInspect };

const runtimeName = `amtech-hermes-${employeeId}`;
const networkName = `amtech-employee-${employeeId}`;
const runtimeBefore = run("docker", ["inspect", "--format", "{{.Id}}", runtimeName]).output;
run("docker", ["rm", "-f", runtimeName]);
run("docker", ["network", "rm", networkName], { allowFailure: true });
const repairCommandId = await queue(employee.account_id, "repair_drift", "prove_missing_runtime_and_network_repair");
const repair = await waitCommand(repairCommandId);
const runtimeAfter = run("docker", ["inspect", "--format", "{{.Id}}", runtimeName]).output;
const networkAfter = run("docker", ["network", "inspect", "--format", "{{.Id}}", networkName]).output;
assert(runtimeAfter && runtimeAfter !== runtimeBefore, "drift_repair_did_not_recreate_runtime", { runtimeBefore, runtimeAfter });
assert(Boolean(networkAfter), "drift_repair_did_not_recreate_network");
evidence.drift_repair = { command_id: repairCommandId, runtime_before: runtimeBefore, runtime_after: runtimeAfter, network_after: networkAfter, command: repair };

const { data: sourceManifest, error: manifestError } = await db.from("employee_manifests").select("manifest,raw_answers,transcript_ref,profile_package_key").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(1).maybeSingle();
if (manifestError) throw manifestError;
assert(sourceManifest?.manifest, "source_manifest_missing_for_compensation_fixture");
const disposableEmployeeId = `emp_comp_${proofSuffix}`;
const disposableManifestId = `man_comp_${proofSuffix}`;
const compensationJobId = `pjob_comp_${proofSuffix}`;
try {
  let result = await db.from("employees").insert({ id: disposableEmployeeId, account_id: employee.account_id, name: "Acceptance Compensation Fixture", status: "provisioning" });
  if (result.error) throw result.error;
  result = await db.from("employee_manifests").insert({
    id: disposableManifestId,
    employee_id: disposableEmployeeId,
    manifest: sourceManifest.manifest,
    raw_answers: sourceManifest.raw_answers ?? {},
    transcript_ref: sourceManifest.transcript_ref ?? null,
    profile_package_key: sourceManifest.profile_package_key ?? sourceManifest.manifest.profile_package_key ?? "contractor_estimator",
  });
  if (result.error) throw result.error;
  result = await db.from("provisioning_jobs").insert({
    id: compensationJobId,
    account_id: employee.account_id,
    employee_id: disposableEmployeeId,
    idempotency_key: `acceptance-compensation:${proofSuffix}`,
    operation_key: `acceptance-compensation-op:${proofSuffix}`,
    command_type: "ensure_runtime",
    state: "profile_rendered",
    max_attempts: 1,
    next_attempt_at: new Date().toISOString(),
    worker_context: {
      manifest_id: disposableManifestId,
      package_key: sourceManifest.profile_package_key ?? sourceManifest.manifest.profile_package_key ?? "contractor_estimator",
      runtime_backend: "docker",
      gateway_port: 0,
      compensation_fixture: true,
    },
  });
  if (result.error) throw result.error;
  const compensated = await waitFor("compensation fixture", async () => {
    const { data, error } = await db.from("provisioning_jobs").select("id,state,retry_class,failure_state,worker_context,attempt_count,completed_at").eq("id", compensationJobId).maybeSingle();
    if (error) throw error;
    if (data?.state === "failed" && data?.completed_at) throw new Error(`compensation_fixture_failed_without_compensation:${data.failure_state}`);
    return { done: data?.state === "compensated", value: data };
  }, { timeoutMs: 180_000, intervalMs: 1_000 });
  assert(compensated.worker_context?.compensation_phase === "finalize", "compensation_phases_not_completed", compensated);
  evidence.compensation = { job_id: compensationJobId, state: compensated.state, retry_class: compensated.retry_class, attempt_count: compensated.attempt_count, compensation_phase: compensated.worker_context?.compensation_phase };
} finally {
  await db.from("employees").delete().eq("id", disposableEmployeeId);
}

const markerStore = createProvisionerIdempotencyStore({ root: process.env.PROVISIONER_STATE_DIR, staleMs: 1_000 });
const markerKey = `acceptance:stale-marker:${proofSuffix}`;
try {
  assert(await markerStore.claim("idempotency", markerKey), "acceptance_marker_initial_claim_failed");
  assert(!(await markerStore.claim("idempotency", markerKey)), "fresh_marker_was_reclaimed");
  const old = new Date(Date.now() - 5_000);
  await utimes(markerStore.markerPath("idempotency", markerKey), old, old);
  assert(await markerStore.claim("idempotency", markerKey), "stale_marker_not_reclaimed");
  await markerStore.releaseFailedIdempotencyClaim(markerKey);
  assert(await markerStore.claim("idempotency", markerKey), "failed_marker_not_released_for_retry");
  evidence.failed_marker_recovery = { key: markerKey, stale_reclaimed: true, failed_claim_released: true };
} finally {
  await rm(markerStore.markerPath("idempotency", markerKey), { force: true });
  await rm(markerStore.resultPath(markerKey), { force: true });
}

await writeProof("reconciler-recovery-live", "passed", evidence);
