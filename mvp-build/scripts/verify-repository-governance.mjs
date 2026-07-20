#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

// Validate durable structure only. Evidence values such as SHAs, run IDs, counts,
// and prose status belong in the resolution ledger, not in validator source.
const root = process.cwd();
const program = "second-half-plan/2026-07-19-ratified-standard-production-program";
const passes = [];
const failures = [];
const record = (id, ok, detail) => (ok ? passes : failures).push({ id, detail });
const read = (path) => readFile(resolve(root, path), "utf8");
const exists = async (path) => {
  try { await access(resolve(root, path)); return true; } catch { return false; }
};
const parse = (name, text) => {
  try { return JSON.parse(text); }
  catch (error) { failures.push({ id: `JSON-${name}`, detail: String(error) }); return {}; }
};
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const sha = (value) => typeof value === "string" && /^[a-f0-9]{40}$/i.test(value);
const unique = (values) => new Set(values).size === values.length;
const sameSet = (a, b) => a.size === b.size && [...a].every((value) => b.has(value));

const required = [
  "../identity.md", "../README.md", "../AGENTS.md", "../CLAUDE.md", "../CONTRIBUTING.md", "../CODEGRAPH.md",
  "AGENTS.md", "CLAUDE.md", "CODEGRAPH.md", "STANDARD.md", "memory/MEMORY.md", "second-half-plan/README.md",
  `${program}/README.md`, `${program}/04-dependency-ordered-production-plan.md`, `${program}/07-verification-and-handoff-matrix.md`,
  `${program}/08-production-issue-vector.json`, `${program}/09-workstream-execution-map.md`, `${program}/10-test-suite-disposition.md`,
  `${program}/13-resolution-ledger.json`, `${program}/17-ws03-p0-fisher-frontier.md`, `${program}/18-ws03-p0-task-contract.json`,
  "docs/architecture/README.md", "docs/architecture/17-hermes-upstream-review-protocol.md", "validation/hermes-upstream-baseline.json",
  "../.github/workflows/phase-2-remediation-plan.yml", "../.github/workflows/main-integration-gates.yml", "../.github/pull_request_template.md",
];
const missing = [];
for (const path of required) if (!(await exists(path))) missing.push(path);
record("GOV-01", missing.length === 0, `required files exist; missing: ${missing.join(", ") || "none"}`);

const [
  rootReadme, rootCodegraph, scopedCodegraph, contributing, rootAgents, scopedAgents,
  standard, planIndex, activePlan, roadmap, workstreamsDoc, testsDoc, verificationDoc,
  memoryIndex, packageText, issuesText, ledgerText, ws03Text, governanceWorkflow,
  mainWorkflow, prTemplate, hermesProtocol, hermesBaselineText,
] = await Promise.all([
  read("../README.md"), read("../CODEGRAPH.md"), read("CODEGRAPH.md"), read("../CONTRIBUTING.md"),
  read("../AGENTS.md"), read("AGENTS.md"), read("STANDARD.md"), read("second-half-plan/README.md"),
  read(`${program}/README.md`), read(`${program}/04-dependency-ordered-production-plan.md`),
  read(`${program}/09-workstream-execution-map.md`), read(`${program}/10-test-suite-disposition.md`),
  read(`${program}/07-verification-and-handoff-matrix.md`), read("memory/MEMORY.md"), read("package.json"),
  read(`${program}/08-production-issue-vector.json`), read(`${program}/13-resolution-ledger.json`),
  read(`${program}/18-ws03-p0-task-contract.json`), read("../.github/workflows/phase-2-remediation-plan.yml"),
  read("../.github/workflows/main-integration-gates.yml"), read("../.github/pull_request_template.md"),
  read("docs/architecture/17-hermes-upstream-review-protocol.md"), read("validation/hermes-upstream-baseline.json"),
]);
const pkg = parse("package.json", packageText);
const issues = parse("issue-vector", issuesText);
const ledger = parse("resolution-ledger", ledgerText);
const ws03 = parse("ws03-contract", ws03Text);
const hermes = parse("hermes-baseline", hermesBaselineText);

record("GOV-02", standard.includes("Status: **ratified and effective**"), "ratified Standard remains canonical");
const dirs = await readdir(resolve(root, "second-half-plan"), { withFileTypes: true });
const active = [];
for (const entry of dirs) {
  if (!entry.isDirectory() || !(await exists(`second-half-plan/${entry.name}/README.md`))) continue;
  if ((await read(`second-half-plan/${entry.name}/README.md`)).includes("Status: **active and canonical**")) active.push(entry.name);
}
record("GOV-03", active.length === 1 && active[0] === "2026-07-19-ratified-standard-production-program", `one active program: ${active.join(", ") || "none"}`);
record("GOV-04",
  rootReadme.includes("mvp-build/second-half-plan/README.md")
    && rootCodegraph.includes("single active production program")
    && scopedCodegraph.includes("second-half-plan/2026-07-19-ratified-standard-production-program")
    && planIndex.includes("2026-07-19-ratified-standard-production-program/README.md")
    && activePlan.includes("New work starts on reviewed task branches from current `main`")
    && memoryIndex.includes("Index — newest first"),
  "entrypoints route to one active program and current-main task branches");
record("GOV-05", contributing.includes("Six-point rubric") && rootAgents.includes("Required contributor gate") && scopedAgents.includes("Hermes upstream review"), "contributor gates remain routed");

const scripts = pkg.scripts ?? {};
const requiredScripts = ["repo:rubric", "repo:verify:quick", "repo:verify:full", "test:repo-governance", "test:unit", "test:integration", "test:production-boundary", "build", "hermes:upstream:check"];
record("GOV-06", requiredScripts.every((name) => nonempty(scripts[name])), "required scripts exist");
record("GOV-07",
  governanceWorkflow.includes("npm run test:repo-governance") && governanceWorkflow.includes("npm run typecheck") && governanceWorkflow.includes("npm run lint")
    && !governanceWorkflow.includes("npm run test:unit") && !governanceWorkflow.includes("npm run build")
    && mainWorkflow.includes("npm run repo:verify:full") && mainWorkflow.includes("npm run test:unit")
    && mainWorkflow.includes("npm run test:production-boundary") && mainWorkflow.includes("npm run build"),
  "governance and merge workflows have distinct responsibilities");
record("GOV-08",
  prTemplate.includes("## Evidence boundary") && hermesProtocol.includes("upstream is intelligence, not authority")
    && hermes.upstream_repository === "NousResearch/hermes-agent" && sha(hermes.reviewed_main_sha)
    && sha(hermes.watched_paths?.["hermes_cli/__init__.py"]) && sha(hermes.watched_paths?.["web/src/App.tsx"]),
  "PR and Hermes evidence contracts remain intact");

const expectedSchema = ["id","workstream","priority","production_blocking","evidence_confidence","user_impact","authority_safety_risk","dependency_centrality","blast_radius","reversibility_risk","maintainability_drag","production_readiness_gap","title","affected_boundaries","evidence"];
const rows = Array.isArray(issues.issues) ? issues.issues : [];
const ids = rows.map((row) => row?.[0]);
const rowValid = rows.every((row) => Array.isArray(row) && row.length === expectedSchema.length
  && /^ISS-\d{3}$/.test(row[0]) && /^WS-0[1-9]$/.test(row[1]) && ["P0","P1","P2"].includes(row[2])
  && [3,4,5,6,7,8,9,10,11].every((i) => typeof row[i] === "number" && row[i] >= 0 && row[i] <= 1)
  && nonempty(row[12]) && Array.isArray(row[13]) && Array.isArray(row[14]));
record("GOV-09", issues.repository === "benamtech/ai-employee-v1" && JSON.stringify(issues.schema) === JSON.stringify(expectedSchema)
  && rows.length === 38 && unique(ids) && new Set(rows.map((row) => row[1])).size === 9 && rowValid
  && sha(issues.baseline?.merge_sha) && sha(issues.baseline?.cutover_head), "immutable issue vector is valid");

const all = new Set(ids);
const resolutions = Array.isArray(ledger.issue_resolutions) ? ledger.issue_resolutions : [];
const resolved = resolutions.map((entry) => entry?.id);
const remaining = Array.isArray(ledger.remaining_issue_ids) ? ledger.remaining_issue_ids : [];
const remainingSet = new Set(remaining);
const overlap = resolved.filter((id) => remainingSet.has(id));
const evidenceHeads = [ledger.implementation_evidence_head, ledger.ws01_implementation_evidence_head, ledger.ws02_protocol_implementation_evidence_head].filter(Boolean);
record("GOV-10", ledger.baseline_issue_vector === "08-production-issue-vector.json"
  && resolutions.every((entry) => all.has(entry?.id) && nonempty(entry?.state) && nonempty(entry?.evidence))
  && unique(resolved) && unique(remaining) && remaining.every((id) => all.has(id)) && overlap.length === 0
  && sameSet(new Set([...resolved, ...remaining]), all) && evidenceHeads.every(sha)
  && ledger.workflow_evidence && Object.values(ledger.workflow_evidence).every(nonempty)
  && ledger.production_ready === (remaining.length === 0), "resolution ledger partitions every issue exactly once");

const controls = Array.isArray(ledger.control_resolutions) ? ledger.control_resolutions : [];
record("GOV-11", unique(controls.map((entry) => entry?.id)) && controls.every((entry) => nonempty(entry?.id) && nonempty(entry?.state)
  && (!entry.evidence_head || sha(entry.evidence_head)) && nonempty(entry?.scope) && Array.isArray(entry?.does_not_resolve)
  && entry.does_not_resolve.every((id) => remainingSet.has(id))), "control claims reference only unresolved issues");

let frontierValid = true;
for (const frontier of Array.isArray(ledger.prepared_frontiers) ? ledger.prepared_frontiers : []) {
  if (!nonempty(frontier?.id) || !nonempty(frontier?.state) || !Array.isArray(frontier?.documents)) frontierValid = false;
  for (const doc of frontier?.documents ?? []) if (!nonempty(doc) || !(await exists(`${program}/${doc}`))) frontierValid = false;
}
record("GOV-12", frontierValid, "prepared frontiers point to real documents");

const ws03Commands = ["npm run test:unit", "npm run test:integration", "npm run test:production-boundary", "npm run repo:verify:full", "npm run build"];
const rubric = Object.values(ws03.rubric ?? {});
record("GOV-13", ws03.task_id === "AMTECH-P0-WS03-000" && ws03.repository === "benamtech/ai-employee-v1"
  && /^agent\/ws03-/.test(ws03.branch ?? "") && ws03.start_conditions?.length >= 3 && ws03.success_criteria?.length >= 5
  && ws03.allowed_files?.some((path) => String(path).includes("migrations/0073"))
  && ws03.forbidden_files?.some((path) => String(path).includes("0001") && String(path).includes("0072"))
  && ws03Commands.every((cmd) => ws03.required_tests?.includes(cmd)) && ws03.required_tests?.some((test) => /managed Supabase/i.test(test))
  && rubric.length === 6 && rubric.every((value) => typeof value === "number" && value >= 0 && value <= 1), "WS-03 start and proof guards remain intact");
record("GOV-14", roadmap.includes("### Phase 1.1") && roadmap.includes("### Phase 1.9") && roadmap.includes("## Phase 2")
  && workstreamsDoc.includes("## WS-01") && workstreamsDoc.includes("## WS-09")
  && activePlan.includes("13-resolution-ledger.json") && activePlan.includes("17-ws03-p0-fisher-frontier.md") && activePlan.includes("18-ws03-p0-task-contract.json")
  && testsDoc.includes("A suite is evidence only for the boundary it exercises") && verificationDoc.includes("Source/CI evidence boundary"), "roadmap and evidence routes are connected");

const report = { generated_at: new Date().toISOString(), validator_version: "2.1.0-structural", status: failures.length ? "fail" : "pass", pass_count: passes.length, fail_count: failures.length, passes, failures };
console.log(JSON.stringify(report, null, 2));
if (failures.length) { console.error("❌ AMTECH repository governance failed"); process.exitCode = 1; }
else console.log("✅ AMTECH repository governance OK");
