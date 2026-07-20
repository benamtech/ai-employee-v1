#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { getGoldenEmployeeScenario } from "@amtech/shared";

const scenarioId = process.argv[2] ?? process.env.GOLDEN_SCENARIO_ID ?? "website_employee_a";
const scenario = getGoldenEmployeeScenario(scenarioId);
const managerOrigin = (process.env.MANAGER_API_ORIGIN ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const employeeId = required(process.env.EMPLOYEE_ID, "EMPLOYEE_ID");
const accountId = required(process.env.ACCOUNT_ID, "ACCOUNT_ID");
const assignmentId = required(process.env.ASSIGNMENT_ID, "ASSIGNMENT_ID");
const employeeMcpToken = required(process.env.EMPLOYEE_MCP_TOKEN, "EMPLOYEE_MCP_TOKEN");
const managerToken = required(process.env.MANAGER_INTERNAL_TOKEN, "MANAGER_INTERNAL_TOKEN");
const ownerSessionToken = required(process.env.OWNER_SESSION_TOKEN, "OWNER_SESSION_TOKEN");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";

function required(value, name) {
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function gitSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function parseMcpResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const events = text.split("\n").filter((line) => line.startsWith("data:"));
    for (const line of events.reverse()) {
      try {
        return JSON.parse(line.slice(5).trim());
      } catch {
        // Try the next event.
      }
    }
    throw new Error(`mcp_response_not_json:${text.slice(0, 1000)}`);
  }
}

function parseProofJson(envelope, key) {
  const raw = envelope?.proof?.[key];
  if (typeof raw !== "string") throw new Error(`missing_proof_json:${key}`);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`invalid_proof_json:${key}`);
  }
}

async function mcpTool(name, args) {
  const response = await fetch(`${managerOrigin}/manager/mcp`, {
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.GOLDEN_JOURNEY_TIMEOUT_MS ?? 120_000)),
    headers: {
      Authorization: `Bearer ${employeeMcpToken}`,
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `${name}-${Date.now()}`,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const text = await response.text();
  const rpc = parseMcpResponse(text);
  if (!response.ok || rpc.error) throw new Error(`${name}_mcp_failed:${response.status}:${JSON.stringify(rpc.error ?? rpc).slice(0, 1500)}`);
  const result = rpc.result ?? rpc;
  const envelope = result.structuredContent ?? result;
  if (["failed", "denied"].includes(envelope.status) || result.isError) {
    throw new Error(`${name}_tool_failed:${JSON.stringify(envelope).slice(0, 2000)}`);
  }
  if (envelope.assignment_id !== assignmentId) {
    throw new Error(`${name}_assignment_mismatch:${String(envelope.assignment_id)}`);
  }
  return envelope;
}

async function ownerResolve(approvalId, artifactId) {
  const response = await fetch(`${managerOrigin}/manager/employee/${encodeURIComponent(employeeId)}/workbench/approvals/resolve`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${managerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      owner_session_token: ownerSessionToken,
      approval_id: approvalId,
      artifact_id: artifactId,
      resolution: "approved",
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.status !== "ok") throw new Error(`owner_approval_failed:${response.status}:${JSON.stringify(json).slice(0, 1500)}`);
  if (json.assignment_id !== assignmentId) throw new Error(`owner_resolution_assignment_mismatch:${String(json.assignment_id)}`);
  return json;
}

function proofValue(envelope, key) {
  const value = envelope?.proof?.[key];
  if (typeof value !== "string" || !value) throw new Error(`missing_proof:${key}`);
  return value;
}

const timeline = [];
let finalProof;
try {
  const first = await mcpTool("create_artifact_revision", {
    account_id: accountId,
    employee_id: employeeId,
    kind: scenario.artifact_kind,
    payload: scenario.initial_payload,
    mime_type: scenario.id === "website_employee_a" ? "text/html" : "application/json",
    source_manifest: { scenario_id: scenario.id, sources: scenario.initial_payload.sources ?? [] },
    created_run: `golden:${scenario.id}:initial`,
  });
  const artifactId = proofValue(first, "artifact_id");
  const firstRevisionId = proofValue(first, "revision_id");
  timeline.push({ step: "initial_revision", artifact_id: artifactId, revision_id: firstRevisionId, content_sha256: first.proof.content_sha256 });

  const second = await mcpTool("create_artifact_revision", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
    kind: scenario.artifact_kind,
    payload: scenario.revised_payload,
    mime_type: scenario.id === "website_employee_a" ? "text/html" : "application/json",
    source_manifest: { scenario_id: scenario.id, sources: scenario.revised_payload.sources ?? [] },
    created_run: `golden:${scenario.id}:revised`,
  });
  const secondRevisionId = proofValue(second, "revision_id");
  if (second.proof.revision_number !== 2 || second.proof.parent_revision_id !== firstRevisionId || second.proof.content_sha256 === first.proof.content_sha256) {
    throw new Error("revision_chain_or_diff_failed");
  }
  timeline.push({ step: "revised", revision_id: secondRevisionId, parent_revision_id: second.proof.parent_revision_id, content_sha256: second.proof.content_sha256 });

  const historyBefore = await mcpTool("get_artifact_history", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
  });
  const revisionsBefore = parseProofJson(historyBefore, "revisions_json");
  if (!Array.isArray(revisionsBefore) || revisionsBefore.length < 2) throw new Error("revision_history_missing");
  timeline.push({ step: "diff", before_revision_id: firstRevisionId, after_revision_id: secondRevisionId, distinct_hashes: true });

  const validated = await mcpTool("validate_artifact_revision", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
    revision_id: secondRevisionId,
    validations: scenario.validations,
  });
  if (validated.proof?.status !== "passed") throw new Error(`validation_not_passed:${validated.proof?.status}`);
  const validationIds = parseProofJson(validated, "validation_ids_json");
  timeline.push({ step: "validation", status: validated.proof.status, validation_ids: validationIds });

  const approval = await mcpTool("request_approval", {
    account_id: accountId,
    employee_id: employeeId,
    action_key: scenario.publish_action,
    summary: `Publish ${scenario.title} revision ${second.proof.revision_number} to the AMTECH sandbox.`,
    risk_level: "medium",
    resource_class: "artifact",
    resource_id: artifactId,
    refs: { artifact_id: artifactId, revision_id: secondRevisionId, scenario_id: scenario.id },
    channel: "web",
  });
  if (approval.status !== "needs_confirmation") throw new Error(`approval_gate_missing:${approval.status}`);
  const approvalId = proofValue(approval, "approval_id");
  const approvalSnapshotHash = proofValue(approval, "snapshot_hash");
  timeline.push({ step: "approval_requested", approval_id: approvalId, snapshot_hash: approvalSnapshotHash });

  const resolved = await ownerResolve(approvalId, artifactId);
  if (resolved.proof?.resolution !== "approved") throw new Error("owner_resolution_not_approved");
  timeline.push({ step: "owner_approved", approval_id: approvalId, resolver_principal_id: resolved.proof.resolver_principal_id });

  const published = await mcpTool("publish_artifact_sandbox", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
    approval_id: approvalId,
  });
  const publicationRef = proofValue(published, "publication_ref");
  const effectReceiptId = proofValue(published, "effect_receipt_id");
  if (published.proof?.revision_id !== secondRevisionId) throw new Error("published_revision_mismatch");
  timeline.push({ step: "sandbox_publish", publication_ref: publicationRef, effect_receipt_id: effectReceiptId, idempotent: published.proof.idempotent });

  const verified = await mcpTool("verify_artifact_publication", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
    observed_ref: publicationRef,
  });
  if (verified.proof?.verified !== true) throw new Error("post_publish_verification_failed");
  timeline.push({ step: "post_publish_verification", receipt_id: verified.proof.receipt_id, publication_ref: verified.proof.publication_ref });

  const replay = await mcpTool("publish_artifact_sandbox", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
    approval_id: approvalId,
  });
  if (replay.proof?.effect_receipt_id !== effectReceiptId || replay.proof?.idempotent !== true) throw new Error("publish_replay_not_idempotent");
  timeline.push({ step: "publish_replay", effect_receipt_id: replay.proof.effect_receipt_id, idempotent: replay.proof.idempotent });

  const historyAfter = await mcpTool("get_artifact_history", {
    account_id: accountId,
    employee_id: employeeId,
    artifact_id: artifactId,
  });
  const validations = parseProofJson(historyAfter, "validations_json");
  if (!Array.isArray(validations) || !validations.some((item) => item.validator_key === "post_publish_verification" && item.status === "passed")) {
    throw new Error("verification_receipt_not_in_history");
  }

  finalProof = {
    kind: "golden_artifact_journey",
    status: "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    scenario_id: scenario.id,
    employee_type: scenario.employee_type,
    artifact_kind: scenario.artifact_kind,
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    artifact_id: artifactId,
    current_revision_id: secondRevisionId,
    approval_id: approvalId,
    approval_snapshot_hash: approvalSnapshotHash,
    effect_receipt_id: effectReceiptId,
    publication_ref: publicationRef,
    post_publish_verification_receipt_id: verified.proof.receipt_id,
    timeline,
  };
} catch (error) {
  finalProof = {
    kind: "golden_artifact_journey",
    status: "fail",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    scenario_id: scenario.id,
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    error: String(error?.message ?? error),
    timeline,
  };
}

mkdirSync(proofDir, { recursive: true });
const path = join(proofDir, `golden-${scenario.id}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(path, JSON.stringify(finalProof, null, 2));
console.log(`proof_json:${path}`);
console.log(`${finalProof.status === "pass" ? "PASS" : "FAIL"} golden_artifact_journey scenario=${scenario.id}`);
if (finalProof.status !== "pass") process.exit(1);
