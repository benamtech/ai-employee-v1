#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Repository governance validator.
 *
 * This validates durable structure and cross-file invariants. It deliberately does
 * not pin transient commit SHAs, workflow run IDs, test counts, or prose status
 * sentences. Those values belong in machine-readable evidence records and may change
 * without requiring validator source edits.
 */

const root = process.cwd();
const activeProgramRelative = "second-half-plan/2026-07-19-ratified-standard-production-program";
const activeProgram = resolve(root, activeProgramRelative);
const failures = [];
const passes = [];

function check(id, condition, detail) {
  (condition ? passes : failures).push({ id, detail });
}

async function read(path) {
  return readFile(resolve(root, path), "utf8");
}

async function exists(path) {
  try {
    await access(resolve(root, path));
    return true;
  } catch {
    return false;
  }
}

function parseJson(path, text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push({ id: `JSON-${path}`, detail: `invalid JSON: ${String(error)}` });
    return null;
  }
}

function isSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/i.test(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function unique(values) {
  return new Set(values).size === values.length;
}

function sameSet(left, right) {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

const requiredPaths = [
  "../identity.md",
  "../README.md",
  "../AGENTS.md",
  "../CLAUDE.md",
  "../CONTRIBUTING.md",
  "../CODEGRAPH.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CODEGRAPH.md",
  "STANDARD.md",
  "memory/MEMORY.md",
  "second-half-plan/README.md",
  `${activeProgramRelative}/README.md`,
  `${activeProgramRelative}/04-dependency-ordered-production-plan.md`,
  `${activeProgramRelative}/07-verification-and-handoff-matrix.md`,
  `${activeProgramRelative}/08-production-issue-vector.json`,
  `${activeProgramRelative}/09-workstream-execution-map.md`,
  `${activeProgramRelative}/10-test-suite-disposition.md`,
  `${activeProgramRelative}/13-resolution-ledger.json`,
  `${activeProgramRelative}/17-ws03-p0-fisher-frontier.md`,
  `${activeProgramRelative}/18-ws03-p0-task-contract.json`,
  "docs/architecture/README.md",
  "docs/architecture/17-hermes-upstream-review-protocol.md",
  "validation/hermes-upstream-baseline.json",
  "../.github/workflows/phase-2-remediation-plan.yml",
  "../.github/workflows/main-integration-gates.yml",
  "../.github/pull_request_template.md",
];

const requiredExistence = await Promise.all(requiredPaths.map(async (path) => [path, await exists(path)]));
check(
  "GOV-01",
  requiredExistence.every(([, present]) => present),
  `required authority/evidence files exist; missing: ${requiredExistence.filter(([, present]) => !present).map(([path]) => path).join(", ") || "none"}`,
);

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
  verificationMatrix,
  memoryIndex,
  packageJsonText,
  issueVectorText,
  resolutionLedgerText,
  ws03ContractText,
  workflow,
  mainIntegrationWorkflow,
  prTemplate,
  hermesProtocol,
  hermesBaselineText,
] = await Promise.all([
  read("../README.md"),
  read("../CONTRIBUTING.md"),
  read("../AGENTS.md"),
  read("../CODEGRAPH.md"),
  read("AGENTS.md"),
  read("CODEGRAPH.md"),
  read("STANDARD.md"),
  read("second-half-plan/README.md"),
  read(`${activeProgramRelative}/README.md`),
  read(`${activeProgramRelative}/04-dependency-ordered-production-plan.md`),
  read(`${activeProgramRelative}/09-workstream-execution-map.md`),
  read(`${activeProgramRelative}/10-test-suite-disposition.md`),
  read(`${activeProgramRelative}/07-verification-and-handoff-matrix.md`),
  read("memory/MEMORY.md"),
  read("package.json"),
  read(`${activeProgramRelative}/08-production-issue-vector.json`),
  read(`${activeProgramRelative}/13-resolution-ledger.json`),
  read(`${activeProgramRelative}/18-ws03-p0-task-contract.json`),
  read("../.github/workflows/phase-2-remediation-plan.yml"),
  read("../.github/workflows/main-integration-gates.yml"),
  read("../.github/pull_request_template.md"),
  read("docs/architecture/17-hermes-upstream-review-protocol.md"),
  read("validation/hermes-upstream-baseline.json"),
]);

const packageJson = parseJson("package.json", packageJsonText) ?? {};
const issueVector = parseJson("08-production-issue-vector.json", issueVectorText) ?? {};
const resolutionLedger = parseJson("13-resolution-ledger.json", resolutionLedgerText) ?? {};
const ws03Contract = parseJson("18-ws03-p0-task-contract.json", ws03ContractText) ?? {};
const hermesBaseline = parseJson("hermes-upstream-baseline.json", hermesBaselineText) ?? {};
const scripts = packageJson.scripts ?? {};

check(
  "GOV-02",
  standard.includes("# AMTECH Standard v0.2 — Ratified Production Standard")
    && standard.includes("Status: **ratified and effective**"),
  "ratified Standard remains canonical",
);

const planEntries = await readdir(resolve(root, "second-half-plan"), { withFileTypes: true });
const activeMarkers = [];
for (const entry of planEntries) {
  if (!entry.isDirectory()) continue;
  const readmePath = `second-half-plan/${entry.name}/README.md`;
  if (!(await exists(readmePath))) continue;
  const body = await read(readmePath);
  if (body.includes("Status: **active and canonical**")) activeMarkers.push(entry.name);
}
check(
  "GOV-03",
  activeMarkers.length === 1
    && activeMarkers[0] === "2026-07-19-ratified-standard-production-program"
    && planIndex.includes("2026-07-19-ratified-standard-production-program/README.md"),
  `exactly one active production program exists; found: ${activeMarkers.join(", ") || "none"}`,
);

check(
  "GOV-04",
  [rootReadme, rootCodegraph, scopedCodegraph, planIndex, activePlan, memoryIndex]
    .every((doc) => doc.includes("current `main`") || doc.includes("current main") || doc.includes("then-current `main`")),
  "current authority entrypoints route work from reviewed current-main branches without pinning one transient SHA",
);

check(
  "GOV-05",
  contributing.includes("npm run hooks:install")
    && contributing.includes("npm run repo:verify:quick")
    && contributing.includes("Six-point rubric")
    && rootAgents.includes("Required contributor gate")
    && scopedAgents.includes("Hermes upstream review"),
  "contributor and agent entrypoints expose executable gates",
);

const requiredScripts = [
  "hooks:install",
  "repo:rubric",
  "repo:verify:quick",
  "repo:verify:full",
  "test:repo-governance",
  "test:unit",
  "test:integration",
  "test:production-boundary",
  "build",
  "hermes:upstream:check",
];
check(
  "GOV-06",
  requiredScripts.every((name) => isNonEmptyString(scripts[name])),
  `package scripts expose required governance, test, build, and upstream checks; missing: ${requiredScripts.filter((name) => !isNonEmptyString(scripts[name])).join(", ") || "none"}`,
);

check(
  "GOV-07",
  workflow.includes("npm run test:repo-governance")
    && workflow.includes("npm run typecheck")
    && workflow.includes("npm run lint")
    && !workflow.includes("npm run test:unit")
    && !workflow.includes("npm run build")
    && mainIntegrationWorkflow.includes("pull_request:")
    && mainIntegrationWorkflow.includes("branches: [main]")
    && mainIntegrationWorkflow.includes("npm run repo:verify:full")
    && mainIntegrationWorkflow.includes("npm run test:unit")
    && mainIntegrationWorkflow.includes("npm run test:production-boundary")
    && mainIntegrationWorkflow.includes("npm run build"),
  "governance and main-integration workflows retain non-overlapping responsibilities",
);

check(
  "GOV-08",
  prTemplate.includes("## Six-point rubric")
    && prTemplate.includes("## TDD and verification")
    && prTemplate.includes("## Evidence boundary")
    && hermesProtocol.includes("upstream is intelligence, not authority")
    && hermesProtocol.includes("npm run hermes:upstream:check")
    && hermesBaseline.upstream_repository === "NousResearch/hermes-agent"
    && isSha(hermesBaseline.reviewed_main_sha)
    && isNonEmptyString(hermesBaseline.watched_paths?.["hermes_cli/__init__.py"])
    && isNonEmptyString(hermesBaseline.watched_paths?.["web/src/App.tsx"]),
  "PR evidence contract and pinned Hermes intelligence boundary remain intact",
);

const expectedSchema = [
  "id", "workstream", "priority", "production_blocking", "evidence_confidence",
  "user_impact", "authority_safety_risk", "dependency_centrality", "blast_radius",
  "reversibility_risk", "maintainability_drag", "production_readiness_gap", "title",
  "affected_boundaries", "evidence",
];
const issueRows = Array.isArray(issueVector.issues) ? issueVector.issues : [];
const issueIds = issueRows.map((row) => row?.[0]);
const workstreams = issueRows.map((row) => row?.[1]);
const scoreIndexes = [3, 4, 5, 6, 7, 8, 9, 10, 11];
const issueRowsValid = issueRows.every((row) => Array.isArray(row)
  && row.length === expectedSchema.length
  && /^ISS-\d{3}$/.test(row[0])
  && /^WS-0[1-9]$/.test(row[1])
  && ["P0", "P1", "P2"].includes(row[2])
  && scoreIndexes.every((index) => typeof row[index] === "number" && row[index] >= 0 && row[index] <= 1)
  && isNonEmptyString(row[12])
  && Array.isArray(row[13])
  && Array.isArray(row[14]));
check(
  "GOV-09",
  issueVector.repository === "benamtech/ai-employee-v1"
    && JSON.stringify(issueVector.schema) === JSON.stringify(expectedSchema)
    && issueRows.length === 38
    && unique(issueIds)
    && unique(workstreams.filter((value, index, values) => values.indexOf(value) === index))
    && new Set(workstreams).size === 9
    && issueRowsValid
    && isSha(issueVector.baseline?.merge_sha)
    && isSha(issueVector.baseline?.cutover_head),
  "immutable issue vector has a complete valid schema, 38 unique issues, and nine workstreams",
);

const allIssueIds = new Set(issueIds);
const resolutions = Array.isArray(resolutionLedger.issue_resolutions) ? resolutionLedger.issue_resolutions : [];
const resolvedIds = resolutions.map((entry) => entry?.id);
const remainingIds = Array.isArray(resolutionLedger.remaining_issue_ids) ? resolutionLedger.remaining_issue_ids : [];
const resolvedSet = new Set(resolvedIds);
const remainingSet = new Set(remainingIds);
const overlap = resolvedIds.filter((id) => remainingSet.has(id));
const union = new Set([...resolvedIds, ...remainingIds]);
const evidenceHeadsValid = [
  resolutionLedger.implementation_evidence_head,
  resolutionLedger.ws01_implementation_evidence_head,
  resolutionLedger.ws02_protocol_implementation_evidence_head,
].filter((value) => value != null).every(isSha);
const workflowEvidenceValid = resolutionLedger.workflow_evidence
  && Object.values(resolutionLedger.workflow_evidence).every(isNonEmptyString);
check(
  "GOV-10",
  resolutionLedger.baseline_issue_vector === "08-production-issue-vector.json"
    && resolutions.every((entry) => allIssueIds.has(entry?.id) && isNonEmptyString(entry?.state) && isNonEmptyString(entry?.evidence))
    && unique(resolvedIds)
    && unique(remainingIds)
    && remainingIds.every((id) => allIssueIds.has(id))
    && overlap.length === 0
    && sameSet(union, allIssueIds)
    && evidenceHeadsValid
    && workflowEvidenceValid
    && resolutionLedger.production_ready === (remainingIds.length === 0),
  `resolution ledger partitions every baseline issue exactly once; overlap: ${overlap.join(", ") || "none"}`,
);

const controls = Array.isArray(resolutionLedger.control_resolutions) ? resolutionLedger.control_resolutions : [];
const controlIds = controls.map((entry) => entry?.id);
const controlsValid = controls.every((entry) => isNonEmptyString(entry?.id)
  && isNonEmptyString(entry?.state)
  && (!entry.evidence_head || isSha(entry.evidence_head))
  && isNonEmptyString(entry?.scope)
  && Array.isArray(entry?.does_not_resolve)
  && entry.does_not_resolve.every((id) => remainingSet.has(id)));
check(
  "GOV-11",
  unique(controlIds) && controlsValid,
  "control resolutions are unique, evidence-bound when applicable, and cannot claim unresolved issues",
);

const frontiers = Array.isArray(resolutionLedger.prepared_frontiers) ? resolutionLedger.prepared_frontiers : [];
let frontierDocsExist = true;
for (const frontier of frontiers) {
  if (!isNonEmptyString(frontier?.id) || !isNonEmptyString(frontier?.state) || !Array.isArray(frontier?.documents)) {
    frontierDocsExist = false;
    continue;
  }
  for (const document of frontier.documents) {
    if (!isNonEmptyString(document) || !(await exists(`${activeProgramRelative}/${document}`))) frontierDocsExist = false;
  }
}
check(
  "GOV-12",
  frontierDocsExist,
  "prepared frontiers point to existing task/evidence documents",
);

const rubricValues = Object.values(ws03Contract.rubric ?? {});
const ws03RequiredCommands = [
  "npm run test:unit",
  "npm run test:integration",
  "npm run test:production-boundary",
  "npm run repo:verify:full",
  "npm run build",
];
check(
  "GOV-13",
  ws03Contract.task_id === "AMTECH-P0-WS03-000"
    && ws03Contract.repository === "benamtech/ai-employee-v1"
    && /^agent\/ws03-/.test(ws03Contract.branch ?? "")
    && Array.isArray(ws03Contract.start_conditions) && ws03Contract.start_conditions.length >= 3
    && Array.isArray(ws03Contract.success_criteria) && ws03Contract.success_criteria.length >= 5
    && Array.isArray(ws03Contract.allowed_files)
    && ws03Contract.allowed_files.some((path) => String(path).includes("migrations/0073"))
    && Array.isArray(ws03Contract.forbidden_files)
    && ws03Contract.forbidden_files.some((path) => String(path).includes("0001") && String(path).includes("0072"))
    && Array.isArray(ws03Contract.required_tests)
    && ws03RequiredCommands.every((command) => ws03Contract.required_tests.includes(command))
    && ws03Contract.required_tests.some((test) => /managed Supabase/i.test(test))
    && rubricValues.length === 6
    && rubricValues.every((value) => typeof value === "number" && value >= 0 && value <= 1),
  "WS-03 contract preserves start guards, migration immutability, required proof classes, and bounded rubric",
);

check(
  "GOV-14",
  roadmap.includes("### Phase 1.1 — Repository authority and test-contract truth")
    && roadmap.includes("### Phase 1.9 — Human-surface acceptance, capacity, and pilot preparation")
    && roadmap.includes("## Phase 2 — Frozen exact release candidate")
    && workstreamMap.includes("## WS-01 — Repository authority and test-contract truth")
    && workstreamMap.includes("## WS-09 — Human-surface acceptance, capacity, and controlled pilot")
    && activePlan.includes("13-resolution-ledger.json")
    && activePlan.includes("17-ws03-p0-fisher-frontier.md")
    && activePlan.includes("18-ws03-p0-task-contract.json")
    && testDisposition.includes("A suite is evidence only for the boundary it exercises")
    && verificationMatrix.includes("Source/CI evidence boundary"),
  "roadmap, workstreams, evidence classes, and WS-03 routes remain structurally connected",
);

const report = {
  generated_at: new Date().toISOString(),
  validator_version: "2.0.0-structural",
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
