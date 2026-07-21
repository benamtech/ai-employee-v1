#!/usr/bin/env node
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const passes = [];
const failures = [];
const record = (id, ok, detail) => (ok ? passes : failures).push({ id, detail });
const pathOf = (path) => resolve(root, path);
const exists = async (path) => {
  try { await access(pathOf(path)); return true; } catch { return false; }
};
const read = (path) => readFile(pathOf(path), "utf8");
const parse = (name, text) => {
  try { return JSON.parse(text); }
  catch (error) { failures.push({ id: `JSON-${name}`, detail: String(error) }); return {}; }
};
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const sha = (value) => typeof value === "string" && /^[a-f0-9]{40}$/i.test(value);
const unique = (values) => new Set(values).size === values.length;

const required = [
  "../identity.md", "../AGENTS.md", "../CLAUDE.md", "../CONTRIBUTING.md", "../CODEGRAPH.md",
  "AGENTS.md", "CLAUDE.md", "CODEGRAPH.md", "README.md", "STANDARD.md", "STANDARD-V0.2-AMENDMENT-001.md", "GAPS.md", "REMEDIATION.md",
  "validation/standard-v0.2-evolution-vector.json", "validation/standard-v0.2-amendment-001-evolution.json",
  "decision/README.md", "decision/protocol-v1.json", "decision/trace007/compute.py", "decision/trace007/task_state.json",
  "decision/trace007/candidate_population.json", "decision/trace007/candidate_scores.json", "decision/trace007/hypergraph.json",
  "decision/trace007/selection_comparison.json", "decision/trace007/selected_exploration.json",
  "decision/trace007/selected_implementation.json", "decision/trace007/implementation_contract.json",
  "decision/trace007/verification_plan.json", "decision/trace007/decision_record.md",
  "production-readiness-program/README.md", "production-readiness-program/04-dependency-ordered-production-plan.md",
  "production-readiness-program/07-verification-and-handoff-matrix.md", "production-readiness-program/08-production-issue-vector.json",
  "production-readiness-program/09-workstream-execution-map.md", "production-readiness-program/10-test-suite-disposition.md",
  "production-readiness-program/13-resolution-ledger.json", "production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md",
  "docs/architecture/README.md", "docs/architecture/09-current-bug-risk-and-production-gap-register.md",
  "docs/architecture/11-agent-orientation-and-role-map.md", "docs/architecture/12-document-control-memory-and-handoff-map.md",
  "memory/MEMORY.md", "second-half-plan/README.md", "packages/db/migrations/0076_ws08_reconciliation_authority_hardening.sql",
  "../.github/workflows/ws07-ws08-commercial-effect.yml", "../.github/workflows/main-integration-gates.yml",
];
const missing = [];
for (const path of required) if (!(await exists(path))) missing.push(path);
record("GOV-01", missing.length === 0, `required authority files exist; missing=${missing.join(",") || "none"}`);

const [
  rootGraph, scopedGraph, readme, agents, claude, standard, amendment, amendmentEvolutionText,
  gaps, remediation, historicalPlans, decisionDoc, protocolText, traceImplementationText,
  traceComparisonText, programReadme, roadmap, workstreams, testsDoc, verificationDoc,
  ledgerText, issuesText, architectureReadme, architectureRisk, roleMap, documentMap,
  memoryIndex, packageText, migrationLedgerText, workflowText, mainWorkflowText,
] = await Promise.all([
  read("../CODEGRAPH.md"), read("CODEGRAPH.md"), read("README.md"), read("AGENTS.md"), read("CLAUDE.md"),
  read("STANDARD.md"), read("STANDARD-V0.2-AMENDMENT-001.md"), read("validation/standard-v0.2-amendment-001-evolution.json"),
  read("GAPS.md"), read("REMEDIATION.md"), read("second-half-plan/README.md"),
  read("decision/README.md"), read("decision/protocol-v1.json"), read("decision/trace007/selected_implementation.json"),
  read("decision/trace007/selection_comparison.json"), read("production-readiness-program/README.md"),
  read("production-readiness-program/04-dependency-ordered-production-plan.md"),
  read("production-readiness-program/09-workstream-execution-map.md"),
  read("production-readiness-program/10-test-suite-disposition.md"),
  read("production-readiness-program/07-verification-and-handoff-matrix.md"),
  read("production-readiness-program/13-resolution-ledger.json"),
  read("production-readiness-program/08-production-issue-vector.json"),
  read("docs/architecture/README.md"), read("docs/architecture/09-current-bug-risk-and-production-gap-register.md"),
  read("docs/architecture/11-agent-orientation-and-role-map.md"),
  read("docs/architecture/12-document-control-memory-and-handoff-map.md"),
  read("memory/MEMORY.md"), read("package.json"), read("packages/db/migration-ledger.mjs"),
  read("../.github/workflows/ws07-ws08-commercial-effect.yml"), read("../.github/workflows/main-integration-gates.yml"),
]);

const protocol = parse("decision-protocol", protocolText);
const amendmentEvolution = parse("standard-amendment-evolution", amendmentEvolutionText);
const implementation = parse("trace007-selected-implementation", traceImplementationText);
const comparison = parse("trace007-selection-comparison", traceComparisonText);
const ledger = parse("resolution-ledger", ledgerText);
const issues = parse("issue-vector", issuesText);
const pkg = parse("package", packageText);

record("GOV-02", standard.includes("Status: **ratified and effective**")
  && amendment.includes("Status: **ratified additive amendment and effective**")
  && amendment.includes("ENG-12.3A — Computation-first execution loop")
  && amendment.includes("STD-13.3A — Current release status")
  && amendmentEvolution.amendment_id === "amtech-standard-v0.2-amendment-001"
  && amendmentEvolution.destructive_modification === 0
  && amendmentEvolution.summary?.musts_removed_or_weakened === 0,
  "ratified base Standard plus additive computation-first amendment are canonical");

const routedDocs = [rootGraph, scopedGraph, readme, agents, claude, programReadme, roadmap, workstreams, testsDoc, verificationDoc, architectureReadme, architectureRisk, roleMap, documentMap];
record("GOV-03", routedDocs.every((text) => text.includes("decision/README.md") || text.includes("decision protocol") || text.includes("Computation")), "active entrypoints route through computation-first authority");
record("GOV-04", routedDocs.every((text) => text.includes("0076")), "active status maps agree on source migration head 0076");
record("GOV-05", gaps.includes("historical audit; not current execution authority") && gaps.includes("0b22b7d828e43c81992713c578b090b3875f12ac")
  && remediation.includes("historical remediation plan; not current execution authority") && remediation.includes("51bae06670bd4b00dc88dca42f13596b78c22923")
  && historicalPlans.includes("historical and non-canonical"), "historical audits/plans are explicit routers with original evidence references");

const expectedTiers = ["T0_mechanical", "T1_bounded", "T2_consequential", "T3_production_cross_workstream"];
record("GOV-06", protocol.schema === "amtech.computed-decision.v1" && expectedTiers.every((tier) => protocol.tiers?.[tier])
  && protocol.tiers?.T1_bounded?.minimum_candidates === 4 && protocol.tiers?.T2_consequential?.minimum_candidates === 16
  && protocol.tiers?.T3_production_cross_workstream?.minimum_candidates === 64
  && protocol.tiers?.T3_production_cross_workstream?.minimum_random_baselines >= 100
  && Array.isArray(protocol.candidate_dimensions) && protocol.candidate_dimensions.length === 16,
  "machine-readable computation protocol has proportional tiers and complete dimensions");

record("GOV-07", decisionDoc.includes("Unknown evidence remains Unknown") && decisionDoc.includes("Separate implementation compression")
  && decisionDoc.includes("Hodge Laplacians only") && decisionDoc.includes("Koopman propagation only"),
  "human protocol preserves Unknown, compression, and mathematical prerequisites");

const selectedIds = implementation.selected_ids ?? [];
record("GOV-08", JSON.stringify(selectedIds) === JSON.stringify(["D01","D02","D03","D04","D06","D07"])
  && comparison.joint?.metrics?.J === 0.5818732 && comparison.random_feasible?.count >= 100
  && comparison.causality?.classification === "causal", "trace007 selected implementation and comparison remain canonical");

const expectedIssueSchema = ["id","workstream","priority","production_blocking","evidence_confidence","user_impact","authority_safety_risk","dependency_centrality","blast_radius","reversibility_risk","maintainability_drag","production_readiness_gap","title","affected_boundaries","evidence"];
const issueRows = Array.isArray(issues.issues) ? issues.issues : [];
const issueIds = issueRows.map((row) => row?.[0]);
record("GOV-09", issues.repository === "benamtech/ai-employee-v1" && JSON.stringify(issues.schema) === JSON.stringify(expectedIssueSchema)
  && issueRows.length === 38 && unique(issueIds) && issueRows.every((row) => Array.isArray(row) && row.length === expectedIssueSchema.length),
  "immutable issue vector shape remains valid");

const knownIssues = new Set(issueIds);
const resolutions = Array.isArray(ledger.issue_resolutions) ? ledger.issue_resolutions : [];
const remaining = Array.isArray(ledger.remaining_issue_ids) ? ledger.remaining_issue_ids : [];
const controls = Array.isArray(ledger.control_resolutions) ? ledger.control_resolutions : [];
record("GOV-10", ledger.baseline_issue_vector === "08-production-issue-vector.json"
  && ledger.current_stack?.base_pr === 34 && sha(ledger.current_stack?.base_head)
  && ledger.current_stack?.candidate_pr === 35 && ledger.current_stack?.migration_head === "0076"
  && ledger.decision_protocol?.tier === "T3_production_cross_workstream"
  && ledger.decision_protocol?.candidate_count === 64 && ledger.decision_protocol?.random_baseline_count >= 100
  && JSON.stringify(ledger.decision_protocol?.selected_implementation_ids) === JSON.stringify(selectedIds)
  && resolutions.every((entry) => knownIssues.has(entry?.id) && nonempty(entry?.state) && nonempty(entry?.evidence))
  && unique(resolutions.map((entry) => entry.id)) && unique(remaining) && remaining.every((id) => knownIssues.has(id))
  && controls.every((entry) => nonempty(entry?.id) && nonempty(entry?.state) && nonempty(entry?.scope) && Array.isArray(entry?.does_not_resolve))
  && ledger.workflow_evidence && Object.values(ledger.workflow_evidence).every(nonempty)
  && ledger.production_ready === false, "resolution ledger matches current stack, computation, and non-production state");

const stalePatterns = [
  /PR #33\/source/i,
  /migration head remains `0072`/i,
  /Source migration head:\s*`0075`/i,
  /Migration head:\s*`0075`/i,
  /WS-07, WS-08, and WS-09 may appear only/i,
  /second-half-plan\/.*current production/i,
];
const activeDocuments = {
  rootGraph, scopedGraph, readme, agents, claude, programReadme, roadmap, workstreams, testsDoc,
  verificationDoc, architectureReadme, architectureRisk, roleMap, documentMap,
};
const staleHits = [];
for (const [name, text] of Object.entries(activeDocuments)) {
  for (const pattern of stalePatterns) if (pattern.test(text)) staleHits.push(`${name}:${pattern}`);
}
record("GOV-11", staleHits.length === 0, `no stale active authority references; hits=${staleHits.join(",") || "none"}`);

record("GOV-12", migrationLedgerText.includes("const APPLIED_HEAD = 76")
  && workflowText.includes("migrations/0076_*.sql") && workflowText.includes("mvp-build/decision/**")
  && workflowText.includes("STANDARD-V0.2-AMENDMENT-001.md")
  && workflowText.includes("npm run test:repo-governance"), "migration ledger and focused workflow enforce current authority");

const scripts = pkg.scripts ?? {};
const requiredScripts = ["repo:rubric","repo:verify:quick","repo:verify:full","test:repo-governance","test:unit","test:integration","test:production-boundary","test:ws07-ws08","db:verify:commercial-effect-migrations","build"];
record("GOV-13", requiredScripts.every((name) => nonempty(scripts[name]))
  && String(scripts["repo:verify:quick"]).includes("test:repo-governance"), "required computation, governance, test, database, and build scripts are routed");

record("GOV-14", roadmap.includes("## WS-01") && roadmap.includes("## WS-09")
  && workstreams.includes("## Workstream matrix") && workstreams.includes("## Current WS-06/07/08 transaction")
  && testsDoc.includes("Test-design order") && verificationDoc.includes("Evidence-class rule")
  && programReadme.includes("Active decision result"), "roadmap, workstreams, tests, verification, and program are connected without duplicate current plans");

record("GOV-15", memoryIndex.includes("Index — newest first") && mainWorkflowText.includes("npm run repo:verify:full")
  && mainWorkflowText.includes("npm run test:unit") && mainWorkflowText.includes("npm run build"), "memory and main integration routes remain intact");

const report = {
  generated_at: new Date().toISOString(),
  validator_version: "3.1.0-computation-first-amendment",
  status: failures.length ? "fail" : "pass",
  pass_count: passes.length,
  fail_count: failures.length,
  passes,
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error("❌ AMTECH repository governance failed");
  process.exitCode = 1;
} else {
  console.log("✅ AMTECH repository governance OK");
}
