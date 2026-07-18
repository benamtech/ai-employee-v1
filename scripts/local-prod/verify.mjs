#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, gitSha, readJson, writeProof, writeSdrt } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm verify\nRuns source audit, strict preflight, measured typecheck/lint, SDRT parser/type/query/MCP checks, verifies exact-SHA build/test proofs, and emits S1-S8 gate closure. It does not start services or deploy remotely.");
  process.exit(0);
}
const sha = gitSha();
const steps = [];
const findings = [];
function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? ROOT, env: { ...process.env, ...options.env }, stdio: "inherit", timeout: options.timeout ?? 120000 });
  const row = { label, exit_code: result.status ?? 1, status: result.status === 0 ? "pass" : "fail" };
  steps.push(row);
  if (row.status !== "pass") findings.push({ id: `verify_${label}`, severity: "critical", vector: "verification_failure", mitigation: `Resolve ${label} and rerun on the same clean SHA.`, test_case_id: `LP-VERIFY-${label.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-")}`, perf_impact: label });
  return row.status === "pass";
}
function exactProof(kind) {
  const proof = readJson(join(ROOT, "local-prod", "reports", `${kind}.json`));
  const ok = proof?.status === "pass" && proof?.git_sha === sha;
  steps.push({ label: `proof:${kind}`, status: ok ? "pass" : "fail", proof_sha: proof?.git_sha ?? null });
  if (!ok) findings.push({ id: `proof_${kind}`, severity: "critical", vector: "stale_or_missing_evidence", mitigation: `Run the ${kind} gate successfully on exact SHA ${sha}.`, test_case_id: `LP-PROOF-${kind.toUpperCase()}`, perf_impact: kind });
  return ok;
}

run("script_audit", process.execPath, [join(ROOT, "scripts", "local-prod", "audit.mjs")]);
run("preflight", process.execPath, [join(ROOT, "scripts", "local-prod", "preflight.mjs"), "--strict"]);
run("typecheck", "pnpm", ["run", "typecheck"]);
run("lint", "pnpm", ["run", "lint"]);
run("sdrt_validate", "python3", [join(ROOT, "scripts", "sdrt", "sdrt_validator.py"), join(ROOT, "local-prod", "example.sdrt"), "--closed"]);
run("sdrt_roundtrip", "python3", [join(ROOT, "scripts", "sdrt", "sdrt_validator.py"), join(ROOT, "local-prod", "example.sdrt"), "--round-trip"]);
run("sdrt_query", "python3", [join(ROOT, "scripts", "sdrt", "sdrt_validator.py"), join(ROOT, "local-prod", "example.sdrt"), "--query=type:gap"]);
run("sdrt_mcp", "python3", [join(ROOT, "scripts", "sdrt", "sdrt_mcp_server.py"), "--dry-run", join(ROOT, "local-prod", "example.sdrt")]);
exactProof("build-artifacts");
exactProof("test");
exactProof("postgres-tests");

const gates = [
  { gate: "S1", name: "relationship_and_authorization_foundation", files: ["mvp-build/packages/db/migrations/0039_labor_relationship_authorization_foundation.sql", "mvp-build/tests/integration/relationship-authorization-matrix.test.ts"] },
  { gate: "S2", name: "assignment_scope", files: ["mvp-build/packages/shared/src/assignment-resolver.ts", "mvp-build/apps/manager/src/middleware/assignment-guard.ts", "mvp-build/tests/unit/assignment-enforcement-contract.test.ts"] },
  { gate: "S3", name: "session_scope", files: ["mvp-build/packages/shared/src/session-enforcer.ts", "mvp-build/apps/manager/src/lib/owner-session.ts", "mvp-build/tests/unit/assignment-enforcement-contract.test.ts"] },
  { gate: "S4", name: "signed_resource_and_channel_scope", files: ["mvp-build/apps/manager/src/lib/preview-links.ts", "mvp-build/apps/manager/src/webhooks/twilio.ts", "mvp-build/tests/unit/approval-preview-token-contract.test.ts"] },
  { gate: "S5", name: "connector_custody", files: ["mvp-build/packages/shared/src/connector-custody.ts", "mvp-build/apps/manager/src/lib/connector-custody.ts", "mvp-build/tests/integration/connector-commercial-boundary.test.ts"] },
  { gate: "S6", name: "commercial_attribution", files: ["mvp-build/packages/shared/src/commercial-attribution.ts", "mvp-build/apps/manager/src/lib/commercial-attribution.ts", "mvp-build/tests/unit/model-gateway-http-isolation.test.ts"] },
  { gate: "S7", name: "approval_authority", files: ["mvp-build/packages/shared/src/approval-authority.ts", "mvp-build/packages/db/migrations/0050_atomic_preview_approval_consumption.sql", "mvp-build/tests/integration/approval-authority-boundary.test.ts"] },
  { gate: "S8", name: "platform_admin_authority", files: ["mvp-build/packages/db/migrations/0056_platform_admin_authority_activation.sql", "mvp-build/packages/db/migrations/0057_platform_command_actor_enforcement.sql", "mvp-build/apps/manager/src/lib/platform-admin-runtime.ts", "mvp-build/tests/integration/platform-admin-authority-boundary.test.ts", "mvp-build/tests/unit/s8-local-production-contract.test.ts"] },
];
const testProof = readJson(join(ROOT, "local-prod", "reports", "test.json"));
const sourceProofsPass = testProof?.status === "pass" && testProof?.git_sha === sha;
for (const gate of gates) {
  const missing = gate.files.filter((path) => !existsSync(join(ROOT, path)));
  gate.status = missing.length === 0 && sourceProofsPass ? "pass" : "fail";
  gate.missing = missing;
  if (gate.status !== "pass") findings.push({ id: `gate_${gate.gate}`, severity: "critical", vector: "gate_incomplete", mitigation: `Restore required ${gate.gate} sources and pass the exact-SHA full test suite.`, test_case_id: `LP-GATE-${gate.gate}`, perf_impact: "release blocked" });
}
const frozen = spawnSync("git", ["hash-object", "mvp-build/packages/db/migrations/0042_assignment_scope_and_release_evidence_spine.sql"], { cwd: ROOT, encoding: "utf8" });
const frozen0042 = frozen.status === 0 && frozen.stdout.trim() === "4a6fd33c4dd94c1c5a0f9ba4e0b180f411a7601a";
steps.push({ label: "frozen_0042", status: frozen0042 ? "pass" : "fail", blob_sha: frozen.stdout?.trim() ?? null });
if (!frozen0042) findings.push({ id: "frozen_0042_changed", severity: "critical", vector: "migration_rewrite", mitigation: "Restore frozen migration 0042 and express corrections through a new forward migration.", test_case_id: "LP-MIGRATION-0042", perf_impact: "database safety" });

const status = findings.length === 0 ? "pass" : "blocked";
const { proof, latest } = writeProof("s1-s8-verification", { status, steps, gates, frozen_0042: frozen0042, findings });
const sdrt = writeSdrt("s1-s8-verification", proof);
console.log(JSON.stringify({ status, gates: gates.map(({ gate, name, status }) => ({ gate, name, status })), findings: findings.length }, null, 2));
console.log(`proof_json:${latest}`);
console.log(`proof_sdrt:${sdrt}`);
if (status !== "pass") process.exit(1);
