#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { arg, assert, fetchJson, requireArg, requireEnv, waitFor, writeProof } from "./production-proof-lib.mjs";

requireEnv(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MANAGER_API_ORIGIN",
  "MANAGER_INTERNAL_TOKEN",
  "OWNER_SESSION_TOKEN",
);
const accountId = requireArg("--account");
const employeeId = requireArg("--employee");
const task = arg("--task", "Create a complete draft estimate for Acceptance Test Customer to paint one 12x12 bedroom, including labor, materials, assumptions, and a clear owner-review action. Do not send it to a customer.");
const managerOrigin = process.env.MANAGER_API_ORIGIN.replace(/\/$/, "");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const startedAt = new Date().toISOString();

async function resources() {
  const result = await fetchJson(`${managerOrigin}/manager/employee/${encodeURIComponent(employeeId)}/resources`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ owner_session_token: process.env.OWNER_SESSION_TOKEN }),
  });
  assert(result.response.status === 200, "owner_resources_unavailable", { status: result.response.status, body: result.json });
  assert(result.json.account_id === accountId, "owner_session_account_mismatch", { expected: accountId, actual: result.json.account_id });
  return result.json;
}

const before = await resources();
const previousEnvelopeIds = new Set((before.surface_envelopes ?? []).map((envelope) => envelope.id));
const previousArtifactIds = new Set((before.artifacts ?? []).map((artifact) => artifact.id));

const turn = await fetchJson(`${managerOrigin}/manager/employee/${encodeURIComponent(employeeId)}/message`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ owner_session_token: process.env.OWNER_SESSION_TOKEN, message: task }),
  timeout: Number(process.env.WORK_OBJECT_TURN_TIMEOUT_MS ?? 120_000),
});
assert([200, 202].includes(turn.response.status), "owner_task_not_accepted", { status: turn.response.status, body: turn.json });
assert(turn.json.turn_job_id, "owner_task_missing_turn_job_id", turn.json);

const accepted = await waitFor("provider-backed generated work object", async () => {
  const snapshot = await resources();
  const newEnvelopes = (snapshot.surface_envelopes ?? []).filter((envelope) => !previousEnvelopeIds.has(envelope.id));
  const newArtifacts = (snapshot.artifacts ?? []).filter((artifact) => !previousArtifactIds.has(artifact.id));
  const envelope = newEnvelopes.find((candidate) =>
    candidate.resource &&
    candidate.safety?.owner_safe === true &&
    candidate.render_hints?.tier &&
    candidate.proof?.run_id &&
    (candidate.proof?.source_id || candidate.proof?.artifact_id),
  );
  const { data: gatewayAudit, error } = await db.from("model_gateway_request_audit")
    .select("request_id,employee_id,credential_id,credential_version,provider,upstream_model,status,correlation_id,created_at")
    .eq("employee_id", employeeId)
    .eq("status", "ok")
    .gte("created_at", startedAt)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return {
    done: Boolean(envelope && gatewayAudit),
    value: envelope && gatewayAudit ? { snapshot, envelope, newArtifacts, gatewayAudit } : undefined,
  };
}, { timeoutMs: Number(process.env.WORK_OBJECT_PROOF_TIMEOUT_MS ?? 300_000), intervalMs: 2_000 });

const diagnostics = await fetchJson(`${managerOrigin}/manager/materialization/diagnostics`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ account_id: accountId, employee_id: employeeId, limit: 50 }),
});
assert(diagnostics.response.status === 200, "materialization_diagnostics_failed", { status: diagnostics.response.status, body: diagnostics.json });
const diagnosticEnvelope = (diagnostics.json.latest_envelopes ?? []).find((item) => item.id === accepted.envelope.id);
assert(diagnosticEnvelope, "generated_envelope_missing_from_diagnostics");
assert((diagnostics.json.render_errors ?? []).length === 0, "generated_work_object_render_errors", diagnostics.json.render_errors);

const provider_backed = Boolean(
  accepted.gatewayAudit.request_id &&
  accepted.gatewayAudit.provider &&
  accepted.gatewayAudit.upstream_model &&
  accepted.envelope.proof?.run_id,
);
assert(provider_backed, "work_object_not_provider_backed", { gatewayAudit: accepted.gatewayAudit, proof: accepted.envelope.proof });

await writeProof("generated-work-object-live", "passed", {
  provider_backed,
  account_id: accountId,
  employee_id: employeeId,
  owner_turn: { status: turn.response.status, turn_job_id: turn.json.turn_job_id },
  gateway_request: accepted.gatewayAudit,
  envelope: {
    id: accepted.envelope.id,
    kind: accepted.envelope.kind,
    title: accepted.envelope.title,
    status: accepted.envelope.status,
    render_hints: accepted.envelope.render_hints,
    safety: accepted.envelope.safety,
    proof: accepted.envelope.proof,
    resource: {
      resource_type: accepted.envelope.resource.resource_type,
      resource_id: accepted.envelope.resource.resource_id,
      title: accepted.envelope.resource.title,
      body_kind: accepted.envelope.resource.body_kind ?? null,
    },
    actions: (accepted.envelope.actions ?? []).map((action) => ({ action: action.action, label: action.label, gated: Boolean(action.gated) })),
  },
  new_artifact_ids: accepted.newArtifacts.map((artifact) => artifact.id),
  materialization: {
    latest_resources: (diagnostics.json.latest_resources ?? []).filter((resource) => resource.resource_id === accepted.envelope.resource.resource_id),
    latest_actions: diagnostics.json.latest_actions ?? [],
    render_errors: diagnostics.json.render_errors ?? [],
  },
});
