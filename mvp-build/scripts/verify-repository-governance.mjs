#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFile(resolve(root, path), "utf8");
const failures = [];
const passes = [];

function check(id, condition, detail) {
  (condition ? passes : failures).push({ id, detail });
}

const [
  rootReadme,
  contributing,
  rootAgents,
  rootCodegraph,
  scopedAgents,
  scopedCodegraph,
  standard,
  planIndex,
  activePlan,
  roadmap,
  workstreamMap,
  testDisposition,
  issueVectorText,
  resolutionLedgerText,
  memoryIndex,
  verificationMatrix,
  packageJsonText,
  workflow,
  prTemplate,
  hermesProtocol,
  hermesBaselineText,
  mainIntegrationWorkflow,
] = await Promise.all([
  read("../README.md"),
  read("../CONTRIBUTING.md"),
  read("../AGENTS.md"),
  read("../CODEGRAPH.md"),
  read("AGENTS.md"),
  read("CODEGRAPH.md"),
  read("STANDARD.md"),
  read("second-half-plan/README.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/README.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/13-resolution-ledger.json"),
  read("memory/MEMORY.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/07-verification-and-handoff-matrix.md"),
  read("package.json"),
  read("../.github/workflows/phase-2-remediation-plan.yml"),
  read("../.github/pull_request_template.md"),
  read("docs/architecture/17-hermes-upstream-review-protocol.md"),
  read("validation/hermes-upstream-baseline.json"),
  read("../.github/workflows/main-integration-gates.yml"),
]);

const packageJson = JSON.parse(packageJsonText);
const hermesBaseline = JSON.parse(hermesBaselineText);
const issueVector = JSON.parse(issueVectorText);
const resolutionLedger = JSON.parse(resolutionLedgerText);
const scripts = packageJson.scripts ?? {};

check("GOV-01", standard.includes("# AMTECH Standard v0.2 — Ratified Production Standard")
  && standard.includes("Status: **ratified and effective**"), "ratified Standard remains canonical");
check("GOV-02", planIndex.includes("one active production program")
  && planIndex.includes("2026-07-19-ratified-standard-production-program/README.md")
  && activePlan.includes("Status: **active and canonical"), "one active production program remains explicit");
check("GOV-03", contributing.includes("npm run hooks:install")
  && contributing.includes("npm run repo:verify:quick")
  && contributing.includes("Six-point rubric"), "contributor start, hooks, verification, and rubric are documented");
check("GOV-04", rootAgents.includes("Required contributor gate")
  && scopedAgents.includes("Hermes upstream review"), "root and scoped agent rules route contributors through executable gates");
check("GOV-05", [
  "hooks:install",
  "repo:rubric",
  "repo:verify:quick",
  "repo:verify:full",
  "test:repo-governance",
  "hermes:upstream:check",
].every((name) => typeof scripts[name] === "string"), "package scripts expose governance and upstream checks");
check("GOV-06", workflow.includes("npm run test:repo-governance")
  && workflow.includes("npm run typecheck")
  && workflow.includes("npm run lint")
  && workflow.includes("Standard Integrity OK")
  && !workflow.includes("npm run test:unit")
  && !workflow.includes("npm run build")
  && !workflow.includes("employee-production-tuesday")
  && !workflow.includes("branches:\n      - research"), "ratification workflow owns governance only and carries no duplicate broad/build or historical branch gate");
check("GOV-07", prTemplate.includes("## Six-point rubric")
  && prTemplate.includes("## TDD and verification")
  && prTemplate.includes("## Evidence boundary"), "pull-request template requires rubric, TDD, and evidence boundaries");
check("GOV-08", hermesBaseline.upstream_repository === "NousResearch/hermes-agent"
  && typeof hermesBaseline.reviewed_main_sha === "string"
  && hermesBaseline.reviewed_main_sha.length === 40
  && hermesBaseline.watched_paths?.["hermes_cli/__init__.py"]
  && hermesBaseline.watched_paths?.["web/src/App.tsx"], "Hermes upstream baseline pins official repository and watched paths");
check("GOV-09", hermesProtocol.includes("upstream is intelligence, not authority")
  && hermesProtocol.includes("npm run hermes:upstream:check")
  && hermesProtocol.includes("active pull requests"), "Hermes review protocol preserves pinning and PR intelligence");
check("GOV-10", mainIntegrationWorkflow.includes("pull_request:")
  && mainIntegrationWorkflow.includes("branches: [main]")
  && mainIntegrationWorkflow.includes("npm run repo:verify:full")
  && mainIntegrationWorkflow.includes("npm run test:production-boundary")
  && mainIntegrationWorkflow.includes("broad-unit:")
  && mainIntegrationWorkflow.includes("npm run test:unit")
  && mainIntegrationWorkflow.includes("Broad unit:")
  && mainIntegrationWorkflow.includes("Main Integration Gates OK"), "main has one canonical merge gate including the broad aggregate");

const currentAuthorityDocs = [rootReadme, contributing, rootAgents, rootCodegraph, scopedAgents, scopedCodegraph, planIndex, activePlan, memoryIndex];
check("GOV-11", currentAuthorityDocs.every((doc) => doc.includes("current `main`") || doc.includes("main@5e5b8d7") || doc.includes("main@816aae3"))
  && activePlan.includes("main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8")
  && !rootCodegraph.includes("Draft PR: `#23`")
  && !scopedCodegraph.includes("Draft PR: `#23`")
  && !memoryIndex.includes("Draft PR: `#23`"), "current authority documents describe reviewed work from current main rather than an active cutover branch");

check("GOV-12", roadmap.includes("### Phase 1.1 — Repository authority and test-contract truth")
  && roadmap.includes("### Phase 1.9 — Human-surface acceptance, capacity, and pilot preparation")
  && roadmap.includes("## Phase 2 — Frozen exact release candidate")
  && workstreamMap.includes("## WS-01 — Repository authority and test-contract truth")
  && workstreamMap.includes("## WS-09 — Human-surface acceptance, capacity, and controlled pilot")
  && testDisposition.includes("106 test files passed")
  && testDisposition.includes("613 tests passed")
  && verificationMatrix.includes("accepted: 106 files / 613 tests"), "active program records the full roadmap and authoritative WS-01 broad-suite closure");

check("GOV-13", issueVector.version === "2026-07-20.post-merge.1"
  && issueVector.baseline?.merge_sha === "5e5b8d7c7a5e20490d58855ffb4450b13b53cd03"
  && issueVector.baseline?.cutover_head === "d131dd09e216fc9dcf0444afd1eb1494194f52eb"
  && Array.isArray(issueVector.issues)
  && issueVector.issues.length === 38
  && new Set(issueVector.issues.map((issue) => issue[0])).size === 38
  && new Set(issueVector.issues.map((issue) => issue[1])).size === 9, "baseline machine issue vector remains immutable and contains 38 unique issues across nine workstreams");

check("GOV-14", activePlan.includes("broad unit: **106 files / 613 tests**")
  && testDisposition.includes("curated and broad results are independently reported")
  && verificationMatrix.includes("Broad and curated suites are independently reported")
  && !activePlan.includes("aggregate remains explicitly red"), "test evidence reports broad and curated boundaries independently without retaining a false current-red claim");

check("GOV-15", activePlan.includes("Caller-supplied provider")
  && activePlan.includes("Remote MCP authorization, MCP Apps host conformance, AG-UI replay mapping")
  && verificationMatrix.includes("Provider-authority lock")
  && verificationMatrix.includes("does not establish remote MCP authorization")
  && testDisposition.includes("obsolete suites were removed atomically rather than skipped"), "provider authority is locked without overclaiming remote protocol or live acceptance, and obsolete tests are removed rather than hidden");

const resolvedIssueIds = new Set((resolutionLedger.issue_resolutions ?? []).filter((entry) => entry.state === "source_ci_resolved").map((entry) => entry.id));
const providerControl = (resolutionLedger.control_resolutions ?? []).find((entry) => entry.id === "CTRL-WS02-PROVIDER-AUTHORITY");
check("GOV-16", resolutionLedger.baseline_issue_vector === "08-production-issue-vector.json"
  && resolutionLedger.implementation_evidence_head === "1460960f415fafc20582313b1dd2117b781a63f7"
  && ["ISS-001", "ISS-002", "ISS-003", "ISS-004", "ISS-005", "ISS-006"].every((id) => resolvedIssueIds.has(id))
  && providerControl?.state === "source_ci_accepted"
  && providerControl?.does_not_resolve?.length === 5
  && resolutionLedger.production_ready === false, "resolution ledger closes WS-01, records the bounded provider control, and preserves open production gates");

const report = {
  generated_at: new Date().toISOString(),
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
