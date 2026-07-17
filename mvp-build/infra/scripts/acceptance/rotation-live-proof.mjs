#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { openSecret } from "../../../apps/manager/dist/lib/secrets.js";
import { assert, fetchJson, requireArg, requireEnv, run, waitFor, writeProof } from "./production-proof-lib.mjs";

requireEnv(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SECRET_REF_MASTER_KEY",
  "MANAGER_API_ORIGIN",
  "MANAGER_INTERNAL_TOKEN",
);
const employeeId = requireArg("--employee");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const managerOrigin = process.env.MANAGER_API_ORIGIN.replace(/\/$/, "");

async function employee() {
  const { data, error } = await db.from("employees").select("id,account_id,status").eq("id", employeeId).maybeSingle();
  if (error) throw error;
  assert(data?.status === "live", "employee_not_live", data);
  return data;
}

async function activeCredential() {
  const { data, error } = await db.from("model_gateway_credentials")
    .select("id,employee_id,account_id,credential_version,token_secret_ref,revoked_at,rotated_from_credential_id")
    .eq("employee_id", employeeId)
    .is("revoked_at", null)
    .order("credential_version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  assert(data?.token_secret_ref, "active_gateway_credential_missing");
  return data;
}

async function runtimeHealth() {
  const { data, error } = await db.from("runtime_endpoints").select("id,health,gateway_port").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  assert(data?.id, "runtime_endpoint_missing");
  return data;
}

async function gatewayRequest(token) {
  const origin = (process.env.MODEL_GATEWAY_HOST_ORIGIN ?? "http://127.0.0.1:8092").replace(/\/$/, "");
  return fetchJson(`${origin}/v1/employees/${encodeURIComponent(employeeId)}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.MODEL_GATEWAY_MODEL_ALIAS ?? "amtech-primary", messages: [{ role: "user", content: "Reply OK." }], max_tokens: 3 }),
  });
}

const employeeRow = await employee();
const oldCredential = await activeCredential();
const oldToken = openSecret(oldCredential.token_secret_ref);
const oldRuntime = await runtimeHealth();
const oldChecksum = oldRuntime.health?.profile_checksum ?? null;
const oldContainerId = run("docker", ["inspect", "--format", "{{.Id}}", `amtech-hermes-${employeeId}`]).output;

const queued = await fetchJson(`${managerOrigin}/manager/provisioning/commands`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    account_id: employeeRow.account_id,
    employee_id: employeeId,
    command_type: "rotate_model_gateway_credential",
    requested_by: "production-acceptance",
    idempotency_key: `acceptance-rotation:${employeeId}:${Date.now()}`,
    payload: { reason: "production_acceptance_rotation" },
  }),
});
assert([200, 202].includes(queued.response.status), "rotation_command_not_queued", { status: queued.response.status, body: queued.json });
const commandId = queued.json.command_id;
assert(commandId, "rotation_command_id_missing", queued.json);

const command = await waitFor("rotation command", async () => {
  const { data, error } = await db.from("provisioning_commands").select("id,status,evidence,error,provisioning_job_id,completed_at").eq("id", commandId).maybeSingle();
  if (error) throw error;
  if (data?.status === "failed" || data?.status === "compensated") throw new Error(`rotation_command_${data.status}:${JSON.stringify(data.error ?? data.evidence)}`);
  return { done: data?.status === "succeeded", value: data };
}, { timeoutMs: Number(process.env.ROTATION_PROOF_TIMEOUT_MS ?? 300_000), intervalMs: 1_000 });

const newCredential = await activeCredential();
const newRuntime = await runtimeHealth();
const newChecksum = newRuntime.health?.profile_checksum ?? command.evidence?.profile_checksum ?? null;
const newContainerId = run("docker", ["inspect", "--format", "{{.Id}}", `amtech-hermes-${employeeId}`]).output;
assert(newCredential.id !== oldCredential.id, "credential_id_did_not_rotate");
assert(Number(newCredential.credential_version) === Number(oldCredential.credential_version) + 1, "credential_version_not_incremented");
assert(newCredential.rotated_from_credential_id === oldCredential.id, "rotation_lineage_missing");
assert(oldChecksum && newChecksum && oldChecksum !== newChecksum, "profile_checksum_did_not_change", { oldChecksum, newChecksum });
assert(oldContainerId !== newContainerId, "runtime_container_not_recreated", { oldContainerId, newContainerId });

const { data: oldRow, error: oldError } = await db.from("model_gateway_credentials").select("id,revoked_at").eq("id", oldCredential.id).maybeSingle();
if (oldError) throw oldError;
assert(Boolean(oldRow?.revoked_at), "old_credential_not_revoked");
const newToken = openSecret(newCredential.token_secret_ref);
const newResponse = await gatewayRequest(newToken);
assert(newResponse.response.status === 200, "new_credential_not_live", { status: newResponse.response.status, body: newResponse.json });
const oldResponse = await gatewayRequest(oldToken);
assert(oldResponse.response.status === 401, "old_credential_still_accepted", { status: oldResponse.response.status, body: oldResponse.json });

await writeProof("credential-rotation-live", "passed", {
  employee_id: employeeId,
  account_id: employeeRow.account_id,
  command_id: commandId,
  provisioning_job_id: command.provisioning_job_id,
  old_credential_id: oldCredential.id,
  new_credential_id: newCredential.id,
  old_version: oldCredential.credential_version,
  new_version: newCredential.credential_version,
  old_checksum: oldChecksum,
  new_checksum: newChecksum,
  old_container_id: oldContainerId,
  new_container_id: newContainerId,
  new_request_id: newResponse.json.amtech_gateway?.request_id ?? newResponse.json.id ?? null,
  old_request_status: oldResponse.response.status,
});
