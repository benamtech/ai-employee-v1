#!/usr/bin/env node
import { join } from "node:path";
import { ROOT, gitSha, readJson, writeProof, writeSdrt } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm s9:go-no-go\nReads exact-SHA local proofs and emits an SDRT-compatible GO/NO-GO decision for beginning S9. It does not execute verification or mutate the repository/runtime.");
  process.exit(0);
}
const sha = gitSha();
const requirements = [
  ["script-audit", (p) => p?.status !== "blocked" && !(p?.findings ?? []).some((f) => f.severity === "critical")],
  ["preflight", (p) => p?.status === "pass"],
  ["build", (p) => p?.status === "pass" && p?.performance?.elapsed_ms <= p?.performance?.budget_seconds * 1000],
  ["build-artifacts", (p) => p?.status === "pass" && p?.artifact_pass && p?.exact_revision_pass],
  ["test", (p) => p?.status === "pass" && p?.performance?.elapsed_ms <= p?.performance?.budget_seconds * 1000],
  ["postgres-tests", (p) => p?.status === "pass"],
  ["typecheck", (p) => p?.status === "pass"],
  ["lint", (p) => p?.status === "pass"],
  ["s1-s8-verification", (p) => p?.status === "pass" && (p?.gates ?? []).every((g) => g.status === "pass")],
  ["dev", (p) => p?.status === "pass" && p?.elapsed_ms <= p?.budget_ms],
];
const checks = [];
const findings = [];
for (const [kind, predicate] of requirements) {
  const proof = readJson(join(ROOT, "local-prod", "reports", `${kind}.json`));
  const exact = proof?.git_sha === sha;
  const ok = exact && predicate(proof);
  checks.push({ kind, status: ok ? "pass" : "fail", proof_sha: proof?.git_sha ?? null, exact_sha: exact });
  if (!ok) findings.push({
    id: `s9_${kind.replaceAll(/[^a-z0-9]+/gi, "_")}`,
    severity: "critical",
    vector: "s9_readiness",
    mitigation: `Produce a passing ${kind} proof on exact clean SHA ${sha}.`,
    test_case_id: `S9-READY-${kind.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-")}`,
    perf_impact: kind,
  });
}
const decision = findings.length === 0 ? "GO_FOR_S9_IMPLEMENTATION" : "NO_GO";
const { proof, latest } = writeProof("s9-go-no-go", {
  status: decision === "GO_FOR_S9_IMPLEMENTATION" ? "pass" : "blocked",
  decision,
  scope: "permission to begin S9 implementation; not remote production promotion",
  checks,
  findings,
  non_claims: [
    "No remote deployment is claimed.",
    "No live provider acceptance is inferred from local fixtures.",
    "No launch promotion occurs from this decision alone.",
  ],
});
const sdrt = writeSdrt("s9-go-no-go", proof);
console.log(`@C|s9_go_no_go|scope:decision|active:${decision}|projection:[D0,D1,D2,D3]`);
for (const finding of findings) {
  console.log(`@E|${finding.id}|type:gap|severity:${finding.severity}|vector:${finding.vector}|perf_impact:${finding.perf_impact}`);
  console.log(`@R|blocks|src:${finding.id}|dst:s9_readiness|severity:${finding.severity}`);
  console.log(`@M|mitigates|src:${finding.id}|dst:${finding.test_case_id}|resolves:pending`);
}
console.log(`proof_json:${latest}`);
console.log(`proof_sdrt:${sdrt}`);
if (decision === "NO_GO") process.exit(1);
