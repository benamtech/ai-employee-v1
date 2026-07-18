#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { openSecret } from "../../../apps/manager/dist/lib/secrets.js";
import { mintModelGatewayCredential, revokeModelGatewayCredential } from "../../../apps/manager/dist/lib/model-gateway.js";
import { arg, assert, fetchJson, requireArg, requireEnv, run, writeProof } from "./production-proof-lib.mjs";

requireEnv(
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SECRET_REF_MASTER_KEY",
  "MODEL_GATEWAY_SIGNING_SECRET",
  "MODEL_GATEWAY_PROVIDER_API_KEY",
  "MODEL_GATEWAY_UPSTREAM_BASE_URL",
  "PUBLIC_API_ORIGIN",
);
const employeeA = requireArg("--employee-a");
const employeeB = requireArg("--employee-b");
assert(employeeA !== employeeB, "two_distinct_employees_required");
const model = arg("--model", process.env.MODEL_GATEWAY_MODEL_ALIAS ?? "amtech-primary");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const temporaryCredentialIds = [];

async function employee(employeeId) {
  const { data, error } = await db.from("employees").select("id,account_id,status").eq("id", employeeId).maybeSingle();
  if (error) throw error;
  assert(data?.status === "live", "employee_not_live", { employee_id: employeeId, status: data?.status });
  return data;
}

async function activeCredential(employeeId) {
  const { data, error } = await db.from("model_gateway_credentials")
    .select("id,account_id,employee_id,credential_version,token_secret_ref,gateway_url,expires_at,revoked_at")
    .eq("employee_id", employeeId)
    .is("revoked_at", null)
    .order("credential_version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  assert(data?.token_secret_ref, "active_gateway_credential_missing", employeeId);
  return { ...data, token: openSecret(data.token_secret_ref) };
}

async function completion(employeeId, token) {
  return fetchJson(`${(process.env.MODEL_GATEWAY_HOST_ORIGIN ?? "http://127.0.0.1:8092").replace(/\/$/, "")}/v1/employees/${encodeURIComponent(employeeId)}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Amtech-Correlation-Id": `acceptance-${Date.now()}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 3, stream: false }),
  });
}

function containerGatewayHealth(employeeId) {
  const python = [
    "import json, os, urllib.request",
    "base=os.environ.get('MODEL_GATEWAY_URL','').split('/v1/')[0]",
    "assert base, 'MODEL_GATEWAY_URL missing'",
    "print(urllib.request.urlopen(base+'/health', timeout=10).read().decode())",
  ].join("; ");
  const result = run("docker", ["exec", `amtech-hermes-${employeeId}`, "python3", "-c", python]);
  const parsed = JSON.parse(result.output);
  assert(parsed.status === "ok" && parsed.boundary === "host-private-model-gateway", "container_private_gateway_unreachable", employeeId);
  return parsed;
}

const employeeRows = await Promise.all([employee(employeeA), employee(employeeB)]);
const credentials = await Promise.all([activeCredential(employeeA), activeCredential(employeeB)]);
const evidence = { employees: [], http_matrix: [], public_ingress: null, temporary_credentials_deleted: false };

try {
  for (const [index, employeeId] of [employeeA, employeeB].entries()) {
    const containerHealth = containerGatewayHealth(employeeId);
    const own = await completion(employeeId, credentials[index].token);
    assert(own.response.status === 200, "own_employee_gateway_request_failed", { employeeId, status: own.response.status, body: own.json });
    evidence.employees.push({
      employee_id: employeeId,
      account_id: employeeRows[index].account_id,
      credential_id: credentials[index].id,
      credential_version: credentials[index].credential_version,
      gateway_url: credentials[index].gateway_url,
      container_health: containerHealth,
      provider_response_id: own.json.id ?? own.json.amtech_gateway?.request_id ?? null,
    });
  }

  const highestVersion = Math.max(...credentials.map((credential) => Number(credential.credential_version ?? 1)));
  const expired = await mintModelGatewayCredential(db, {
    account_id: employeeRows[0].account_id,
    employee_id: employeeA,
    policy: { credential_version: highestVersion + 100, expires_at: new Date(Date.now() - 60_000).toISOString() },
  });
  temporaryCredentialIds.push(expired.credential_id);
  const revoked = await mintModelGatewayCredential(db, {
    account_id: employeeRows[0].account_id,
    employee_id: employeeA,
    policy: { credential_version: highestVersion + 101, expires_at: new Date(Date.now() + 60_000).toISOString() },
  });
  temporaryCredentialIds.push(revoked.credential_id);
  await revokeModelGatewayCredential(db, revoked.credential_id);

  const cases = [
    ["malformed", employeeA, "mgw_malformed"],
    ["expired", employeeA, expired.token],
    ["revoked", employeeA, revoked.token],
    ["cross_employee_a_to_b", employeeB, credentials[0].token],
    ["cross_employee_b_to_a", employeeA, credentials[1].token],
  ];
  for (const [name, routeEmployee, token] of cases) {
    const result = await completion(routeEmployee, token);
    assert(result.response.status === 401, "credential_matrix_case_not_rejected", { name, status: result.response.status, body: result.json });
    evidence.http_matrix.push({ name, route_employee_id: routeEmployee, status: result.response.status, error_code: result.json.error?.code ?? null });
  }

  const publicResult = await fetchJson(`${process.env.PUBLIC_API_ORIGIN.replace(/\/$/, "")}/v1/employees/${encodeURIComponent(employeeA)}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [] }),
  });
  assert(publicResult.response.status === 404, "model_gateway_exposed_on_public_ingress", { status: publicResult.response.status, body: publicResult.json });
  evidence.public_ingress = { status: publicResult.response.status };
} finally {
  if (temporaryCredentialIds.length) {
    const { error } = await db.from("model_gateway_credentials").delete().in("id", temporaryCredentialIds);
    if (error) throw error;
  }
  evidence.temporary_credentials_deleted = true;
}

await writeProof("model-gateway-live", "passed", evidence);
