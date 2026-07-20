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
  && workflow.includes("github.event_name == 'push'")
  && workflow.includes("Standard Integrity OK"), "ratification workflow differentiates PR/push and emits a clear summary");
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
  && mainIntegrationWorkflow.includes("Main Integration Gates OK"), "main has a canonical merge-readiness gate");

const currentAuthorityDocs = [rootReadme, contributing, rootAgents, rootCodegraph, scopedAgents, scopedCodegraph, planIndex, activePlan, memoryIndex];
check("GOV-11", currentAuthorityDocs.every((doc) => doc.includes("main@5e5b8d7") || doc.includes("current `main`"))
  && rootCodegraph.includes("PR `#23` merged")
  && scopedCodegraph.includes("PR `#23` merged")
  && memoryIndex.includes("PR `#23` merged")
  && !rootCodegraph.includes("Draft PR: `#23`")
  && !scopedCodegraph.includes("Draft PR: `#23`")
  && !memoryIndex.includes("Draft PR: `#23`"), "current authority documents describe the merged-main baseline rather than a draft cutover");

check("GOV-12", roadmap.includes("### Phase 1.1 — Repository authority and test-contract truth")
  && roadmap.includes("### Phase 1.9 — Human-surface acceptance, capacity, and pilot preparation")
  && roadmap.includes("## Phase 2 — Frozen exact release candidate")
  && workstreamMap.includes("## WS-01 — Repository authority and test-contract truth")
  && workstreamMap.includes("## WS-09 — Human-surface acceptance, capacity, and controlled pilot")
  && testDisposition.includes("`npm run test:unit` | stale/migrating and currently red")
  && verificationMatrix.includes("30 files and 112 tests"), "active program exposes the full phased roadmap and known broad-suite failure");

check("GOV-13", issueVector.version === "2026-07-20.post-merge.1"
  && issueVector.baseline?.merge_sha === "5e5b8d7c7a5e20490d58855ffb4450b13b53cd03"
  && issueVector.baseline?.cutover_head === "d131dd09e216fc9dcf0444afd1eb1494194f52eb"
  && Array.isArray(issueVector.issues)
  && issueVector.issues.length === 38
  && new Set(issueVector.issues.map((issue) => issue[0])).size === 38
  && new Set(issueVector.issues.map((issue) => issue[1])).size === 9, "machine issue vector binds current coordinates and contains 38 unique issues across nine workstreams");

check("GOV-14", activePlan.includes("The broad historical `npm run test:unit` aggregate remains explicitly red")
  && testDisposition.includes("Curated green suites do not imply the broad aggregate is green")
  && verificationMatrix.includes("A curated green suite is proof only for its named contracts"), "test evidence boundaries prohibit curated-green/broad-green substitution");

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
