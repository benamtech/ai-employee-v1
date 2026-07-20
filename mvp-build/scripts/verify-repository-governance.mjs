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
  contributing,
  rootAgents,
  scopedAgents,
  standard,
  planIndex,
  activePlan,
  packageJsonText,
  workflow,
  prTemplate,
  hermesProtocol,
  hermesBaselineText,
  mainIntegrationWorkflow,
] = await Promise.all([
  read("../CONTRIBUTING.md"),
  read("../AGENTS.md"),
  read("AGENTS.md"),
  read("STANDARD.md"),
  read("second-half-plan/README.md"),
  read("second-half-plan/2026-07-19-ratified-standard-production-program/README.md"),
  read("package.json"),
  read("../.github/workflows/phase-2-remediation-plan.yml"),
  read("../.github/pull_request_template.md"),
  read("docs/architecture/17-hermes-upstream-review-protocol.md"),
  read("validation/hermes-upstream-baseline.json"),
  read("../.github/workflows/main-integration-gates.yml"),
]);

const packageJson = JSON.parse(packageJsonText);
const hermesBaseline = JSON.parse(hermesBaselineText);
const scripts = packageJson.scripts ?? {};

check("GOV-01", standard.includes("# AMTECH Standard v0.2 — Ratified Production Standard")
  && standard.includes("Status: **ratified and effective**"), "ratified Standard remains canonical");
check("GOV-02", planIndex.includes("one active production program")
  && planIndex.includes("2026-07-19-ratified-standard-production-program/README.md")
  && activePlan.includes("Status: **active and canonical**"), "one active production program remains explicit");
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
  && mainIntegrationWorkflow.includes("Main Integration Gates OK"), "main cutover has a canonical merge-readiness gate");

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
