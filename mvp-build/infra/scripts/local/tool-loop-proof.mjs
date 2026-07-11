#!/usr/bin/env node
/**
 * Deterministic local proof for the core agent loop.
 *
 * This does not claim provider/runtime acceptance. It requires a local stack
 * (`npm run live:up`), a provisioned employee, the model bridge + worker, and a
 * live Supabase project. It sends one owner turn, then polls for concrete local
 * proof rows created by employee Manager-tool calls.
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { fetchJson, loadState, managerBase, serviceClient } from "./acceptance/_lib.mjs";

(function loadEnv() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* rely on ambient env */ }
})();

const timeoutMs = Number(process.env.TOOL_LOOP_PROOF_TIMEOUT_MS ?? 180_000);
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function writeProof(body) {
  await mkdir(proofDir, { recursive: true });
  const path = join(proofDir, `tool-loop-proof-${stamp()}.json`);
  await writeFile(path, JSON.stringify(body, null, 2));
  console.log(`proof_json:${path}`);
}

async function latestProof(db, employeeId) {
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const [{ data: audits }, { data: artifacts }, { data: approvals }] = await Promise.all([
    db.from("audit_log").select("id,action,actor,result,created_at").eq("employee_id", employeeId).gte("created_at", since).order("created_at", { ascending: false }).limit(50),
    db.from("artifacts").select("id,kind,title,created_at").eq("employee_id", employeeId).gte("created_at", since).order("created_at", { ascending: false }).limit(10),
    db.from("approvals").select("id,action_key,summary,resolution,created_at").eq("employee_id", employeeId).gte("created_at", since).order("created_at", { ascending: false }).limit(10),
  ]);
  const employeeToolAudit = (audits ?? []).find((row) => row.actor === "employee" && String(row.action ?? "").startsWith("tool:"));
  return {
    employeeToolAudit,
    artifact: (artifacts ?? [])[0],
    approval: (approvals ?? [])[0],
  };
}

async function drainTurns(state, employeeId) {
  const token = process.env.MANAGER_INTERNAL_TOKEN;
  const { res, json } = await fetchJson(`${managerBase(state)}/manager/scheduler/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      job_key: "drain_employee_turns",
      employee_id: employeeId,
      limit: 3,
      runner_type: "manual",
    }),
  });
  if (!res.ok) return { ok: false, status: res.status, json };
  return { ok: true, status: res.status, json };
}

async function main() {
  const state = await loadState();
  const employeeId = process.env.LOCAL_EMPLOYEE_ID ?? state.employee_id;
  const ownerSessionToken = process.env.LOCAL_OWNER_SESSION_TOKEN ?? state.owner_session_token;
  if (!employeeId || !ownerSessionToken) throw new Error("local state missing employee/session; run local bootstrap first");

  const message = process.argv.slice(2).join(" ").trim() || [
    "Create an estimate artifact for a small interior repaint:",
    "one 12x14 bedroom, walls only, minor patching, Scranton PA.",
    "Use Manager tools and request owner approval for the estimate preview.",
  ].join(" ");

  const token = process.env.MANAGER_INTERNAL_TOKEN;
  const { res, json } = await fetchJson(`${managerBase(state)}/manager/employee/${employeeId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ owner_session_token: ownerSessionToken, message }),
  });
  if (!res.ok) throw new Error(`owner turn failed ${res.status}: ${JSON.stringify(json)}`);
  console.log(`owner_turn:${JSON.stringify(json)}`);

  const db = serviceClient();
  const deadline = Date.now() + timeoutMs;
  let proof;
  while (Date.now() < deadline) {
    await drainTurns(state, employeeId).catch(() => null);
    proof = await latestProof(db, employeeId);
    if (proof.employeeToolAudit && proof.artifact && proof.approval) break;
    await sleep(3000);
  }

  if (!proof?.employeeToolAudit || !proof.artifact || !proof.approval) {
    console.error("FAIL tool-loop local proof", JSON.stringify(proof ?? {}, null, 2));
    await writeProof({
      kind: "local_tool_loop",
      status: "fail",
      checked_at: new Date().toISOString(),
      host: hostname(),
      employee_id: employeeId,
      proof: proof ?? null,
    });
    process.exit(1);
  }
  const body = {
    kind: "local_tool_loop",
    status: "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    employee_id: employeeId,
    audit_id: proof.employeeToolAudit.id,
    audit_action: proof.employeeToolAudit.action,
    artifact_id: proof.artifact.id,
    approval_id: proof.approval.id,
  };
  console.log("PASS tool-loop local proof");
  console.log(JSON.stringify(body, null, 2));
  await writeProof(body);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
