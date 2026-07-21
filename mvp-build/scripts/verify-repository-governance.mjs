#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";

const root = process.cwd();
const passes = [];
const failures = [];
const record = (id, ok, detail) => (ok ? passes : failures).push({ id, detail });
const pathOf = (path) => resolve(root, path);
const exists = async (path) => {
  try { await access(pathOf(path)); return true; } catch { return false; }
};
const read = (path) => readFile(pathOf(path), "utf8");
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const unique = (values) => new Set(values).size === values.length;
const candidateId = (value) => typeof value === "string" && /^[A-D][0-9]{2}$/.test(value);
const sorted = (values) => [...values].sort();

function parseJson(name, text) {
  try { return JSON.parse(text); }
  catch (error) {
    failures.push({ id: `JSON-${name}`, detail: String(error) });
    return {};
  }
}

function decodeJson(name, text) {
  const wrapper = parseJson(name, text);
  if (wrapper?.encoding !== "zlib+base64+json") return wrapper;
  try {
    const raw = inflateSync(Buffer.from(wrapper.payload, "base64"));
    const digest = createHash("sha256").update(raw).digest("hex");
    if (digest !== wrapper.sha256 || raw.length !== wrapper.bytes) {
      throw new Error(`compressed payload mismatch digest=${digest} bytes=${raw.length}`);
    }
    return JSON.parse(raw.toString("utf8"));
  } catch (error) {
    failures.push({ id: `DECODE-${name}`, detail: String(error) });
    return {};
  }
}

const required = [
  "../identity.md", "../AGENTS.md", "../CLAUDE.md", "../CONTRIBUTING.md", "../CODEGRAPH.md",
  "AGENTS.md", "CLAUDE.md", "CODEGRAPH.md", "README.md", "STANDARD.md", "STANDARD-V0.2-AMENDMENT-001.md",
  "decision/README.md", "decision/protocol-v1.json", "decision/trace007/compute.py",
  "decision/trace007/task_state.json", "decision/trace007/candidate_population.json",
  "decision/trace007/candidate_scores.json", "decision/trace007/candidate_graph.json",
  "decision/trace007/software_invariant_hypergraph.json", "decision/trace007/selection_comparison.json",
  "decision/trace007/selected_exploration.json", "decision/trace007/selected_implementation.json",
  "decision/trace007/implementation_ablation.json", "decision/trace007/counterexample_matrix.json",
  "decision/trace007/implementation_contract.json", "decision/trace007/verification_plan.json",
  "decision/trace007/decision_record.md", "production-readiness-program/README.md",
  "production-readiness-program/04-dependency-ordered-production-plan.md",
  "production-readiness-program/07-verification-and-handoff-matrix.md",
  "production-readiness-program/08-production-issue-vector.json",
  "production-readiness-program/09-workstream-execution-map.md",
  "production-readiness-program/10-test-suite-disposition.md",
  "production-readiness-program/13-resolution-ledger.json",
  "production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md",
  "docs/architecture/README.md", "memory/MEMORY.md", "second-half-plan/README.md",
  "packages/db/migration-ledger.mjs", "package.json",
  "../.github/workflows/ws07-ws08-commercial-effect.yml", "../.github/workflows/main-integration-gates.yml"
];
const missing = [];
for (const path of required) if (!(await exists(path))) missing.push(path);
record("GOV-01", missing.length === 0,
  `required authority and trace files exist; missing=${missing.join(",") || "none"}`);

const texts = Object.fromEntries(await Promise.all(required
  .filter((path) => path.endsWith(".md") || path.endsWith(".json") || path.endsWith(".mjs") || path.endsWith(".py") || path.endsWith(".yml"))
  .map(async (path) => [path, await read(path)])));

const protocol = parseJson("protocol", texts["decision/protocol-v1.json"]);
const candidateGraph = parseJson("candidate-graph", texts["decision/trace007/candidate_graph.json"]);
const softwareGraph = parseJson("software-graph", texts["decision/trace007/software_invariant_hypergraph.json"]);
const comparison = parseJson("selection-comparison", texts["decision/trace007/selection_comparison.json"]);
const exploration = parseJson("selected-exploration", texts["decision/trace007/selected_exploration.json"]);
const implementation = parseJson("selected-implementation", texts["decision/trace007/selected_implementation.json"]);
const ablation = parseJson("implementation-ablation", texts["decision/trace007/implementation_ablation.json"]);
const verification = parseJson("verification-plan", texts["decision/trace007/verification_plan.json"]);
const issueVector = parseJson("issue-vector", texts["production-readiness-program/08-production-issue-vector.json"]);
const ledger = parseJson("resolution-ledger", texts["production-readiness-program/13-resolution-ledger.json"]);
const pkg = parseJson("package", texts["package.json"]);
const population = decodeJson("candidate-population", texts["decision/trace007/candidate_population.json"]);
const scores = decodeJson("candidate-scores", texts["decision/trace007/candidate_scores.json"]);

record("GOV-02",
  texts["STANDARD.md"].includes("ratified and effective")
  && texts["STANDARD-V0.2-AMENDMENT-001.md"].includes("ratified additive amendment and effective"),
  "ratified Standard and additive amendment remain canonical");

const rootClaudeLines = texts["../CLAUDE.md"].trim().split(/\r?\n/).length;
const scopedClaudeLines = texts["CLAUDE.md"].trim().split(/\r?\n/).length;
record("GOV-03",
  texts["../CLAUDE.md"].includes("AGENTS.md") && texts["CLAUDE.md"].includes("AGENTS.md")
  && rootClaudeLines <= 20 && scopedClaudeLines <= 20,
  `CLAUDE compatibility routers remain short; root=${rootClaudeLines} scoped=${scopedClaudeLines}`);

const statusMirrors = ["../AGENTS.md", "../CODEGRAPH.md", "AGENTS.md", "README.md"];
const duplicatedStatus = statusMirrors.flatMap((path) => {
  const hits = [];
  if (/PR #\d+/i.test(texts[path])) hits.push(`${path}:PR`);
  if (/Source migration head/i.test(texts[path])) hits.push(`${path}:migration`);
  if (/Current main baseline/i.test(texts[path])) hits.push(`${path}:baseline`);
  return hits;
});
record("GOV-04", duplicatedStatus.length === 0,
  `exact product status is owned by scoped CODEGRAPH only; duplicates=${duplicatedStatus.join(",") || "none"}`);

const migrationFiles = await readdir(pathOf("packages/db/migrations"));
const migrationNumbers = migrationFiles
  .map((name) => /^(\d{4})[a-z]?_.*\.sql$/.exec(name))
  .filter(Boolean)
  .map((match) => Number(match[1]));
const sourceHead = Math.max(...migrationNumbers);
const sourceHeadLabel = String(sourceHead).padStart(4, "0");
const ledgerHeadMatch = /const APPLIED_HEAD\s*=\s*(\d+)/.exec(texts["packages/db/migration-ledger.mjs"]);
record("GOV-05",
  Number(ledgerHeadMatch?.[1]) === sourceHead
  && texts["CODEGRAPH.md"].includes(`Source migration head: \`${sourceHeadLabel}\``),
  `migration status is derived from source; head=${sourceHeadLabel}`);

record("GOV-06",
  protocol.schema === "amtech.computed-decision.v1"
  && protocol.protocol_revision >= 3
  && protocol.topology_contract?.candidate_graph
  && protocol.topology_contract?.software_invariant_hypergraph
  && protocol.baseline_contracts?.trace007
  && protocol.feasible_domain?.mandatory_coverage === "constraint_not_objective_bonus"
  && protocol.tiers?.T3_production_cross_workstream?.minimum_random_feasible_baselines >= 1000
  && protocol.tiers?.T3_production_cross_workstream?.minimum_search_restarts >= 32
  && protocol.tiers?.T3_production_cross_workstream?.minimum_weight_sensitivity_runs >= 32,
  "decision protocol separates topologies, declares baseline semantics, equalizes feasibility, and requires sensitivity");

const softwareVertices = new Set(softwareGraph.vertices ?? []);
const softwareEdges = softwareGraph.hyperedges ?? [];
const invalidSoftwareMembers = softwareEdges.flatMap((edge) =>
  (edge.members ?? []).filter((member) => !softwareVertices.has(member)));
record("GOV-07",
  candidateGraph.semantic_boundary?.includes("candidate trajectories")
  && candidateGraph.forbidden_uses?.includes("software invariant completion")
  && softwareVertices.size > 0
  && [...softwareVertices].every((vertex) => !candidateId(vertex))
  && invalidSoftwareMembers.length === 0
  && softwareGraph.coverage_definitions?.touch
  && softwareGraph.coverage_definitions?.fractional
  && softwareGraph.coverage_definitions?.complete
  && softwareGraph.coverage_definitions?.proved,
  `candidate and software topology semantics are distinct; invalid_members=${invalidSoftwareMembers.join(",") || "none"}`);

record("GOV-08",
  comparison.feasible_domain?.rule?.includes("constraint, not an objective reward")
  && comparison.objectives?.no_graph
  && comparison.objectives?.no_diversity
  && comparison.objectives?.evidence_baseline?.contract === "../protocol-v1.json:baseline_contracts.trace007"
  && comparison.classifications?.candidate_graph_terms === "descriptive"
  && comparison.classifications?.software_invariant_graph_terms === "descriptive"
  && comparison.classifications?.causal_improvement === "unestablished"
  && comparison.search?.random_feasible_baselines >= 1000,
  "selection controls share one feasible domain, use the declared baseline contract, and make no causal claim");

record("GOV-09",
  ablation.status === "unestablished"
  && Object.values(ablation.required_independent_outcomes ?? {}).every((value) => value === null)
  && ablation.current_findings?.causal_improvement === "unestablished",
  "implementation ablation remains explicitly unestablished");

const softwareEdgeIds = softwareEdges.map((edge) => edge.id);
const plannedEdgeIds = Object.keys(verification.software_edge_tests ?? {});
record("GOV-10",
  unique(softwareEdgeIds) && unique(plannedEdgeIds)
  && softwareEdgeIds.length > 0
  && softwareEdgeIds.every((id) =>
    Array.isArray(verification.software_edge_tests?.[id])
    && verification.software_edge_tests[id].length > 0)
  && plannedEdgeIds.every((id) => softwareEdgeIds.includes(id)),
  "every software hyperedge has a complete behavioral proof plan");

const candidates = population.candidates ?? [];
const candidateIds = candidates.map((candidate) => candidate.id);
record("GOV-11",
  candidateIds.length >= protocol.tiers?.T3_production_cross_workstream?.minimum_candidates
  && unique(candidateIds)
  && candidateIds.every(candidateId)
  && (exploration.seed_selected_ids ?? []).every((id) => candidateIds.includes(id))
  && (implementation.selected_ids ?? []).every((id) => candidateIds.includes(id))
  && implementation.mathematical_causality === "unestablished",
  "candidate population, feasible seed, and implementation references are structurally valid");

const issueSchema = issueVector.schema ?? [];
const issueRows = Array.isArray(issueVector.issues) ? issueVector.issues : [];
const issueIdIndex = issueSchema.indexOf("id");
const issueIds = issueRows.map((row) => row?.[issueIdIndex]);
const knownIssues = new Set(issueIds);
const resolutions = Array.isArray(ledger.issue_resolutions) ? ledger.issue_resolutions : [];
const remaining = Array.isArray(ledger.remaining_issue_ids) ? ledger.remaining_issue_ids : [];
record("GOV-12",
  issueIdIndex >= 0
  && issueRows.every((row) => Array.isArray(row) && row.length === issueSchema.length)
  && unique(issueIds)
  && resolutions.every((entry) =>
    knownIssues.has(entry?.id) && nonempty(entry?.state) && nonempty(entry?.evidence))
  && unique(resolutions.map((entry) => entry.id))
  && unique(remaining)
  && remaining.every((id) => knownIssues.has(id))
  && ledger.production_ready === false,
  "issue and resolution ledgers satisfy schema/reference invariants without pinned counts or IDs");

const computeText = texts["decision/trace007/compute.py"];
record("GOV-13",
  computeText.includes('load("candidate_graph.json")')
  && computeText.includes('load("software_invariant_hypergraph.json")')
  && computeText.includes('load("implementation_ablation.json")')
  && computeText.includes("validate_baseline_contract")
  && computeText.includes("unclassified_baseline_dimensions")
  && computeText.includes("full_objective_difference")
  && computeText.includes("independent_proof_yield_difference")
  && computeText.includes("random_feasible_baselines")
  && computeText.includes("weight_sensitivity_runs")
  && !computeText.includes("POSITIVE_ALIASES")
  && !computeText.includes("NEGATIVE_ALIASES")
  && !computeText.includes('"C_Omega"')
  && !computeText.includes('"C_H"'),
  "deterministic verifier uses explicit baseline semantics, corrected topology, controls, and sensitivity");

const forbiddenActiveClaims = [
  /graph\/diversity classification\s*=\s*causal/i,
  /graph\/diversity terms are causal/i,
  /C_H\s*=|C_Ω\s*=/,
  /120 feasible random/i
];
const claimDocs = [
  "CODEGRAPH.md", "README.md", "AGENTS.md", "decision/README.md",
  "decision/trace007/decision_record.md", "production-readiness-program/README.md",
  "production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md",
  "production-readiness-program/10-test-suite-disposition.md"
];
const staleClaims = claimDocs.flatMap((path) => forbiddenActiveClaims
  .filter((pattern) => pattern.test(texts[path]))
  .map((pattern) => `${path}:${pattern}`));
record("GOV-14", staleClaims.length === 0,
  `active documents contain no invalid causal/coverage claims; hits=${staleClaims.join(",") || "none"}`);

const scripts = pkg.scripts ?? {};
const requiredScripts = [
  "repo:rubric", "repo:verify:quick", "repo:verify:full", "test:repo-governance",
  "test:unit", "test:integration", "test:production-boundary", "test:ws07-ws08",
  "db:verify:commercial-effect-migrations", "build"
];
record("GOV-15",
  requiredScripts.every((name) => nonempty(scripts[name]))
  && String(scripts["repo:verify:quick"]).includes("test:repo-governance"),
  "required contributor, trace, test, database, and build scripts remain routed");

record("GOV-16",
  texts["../.github/workflows/ws07-ws08-commercial-effect.yml"].includes("python decision/trace007/compute.py")
  && texts["../.github/workflows/ws07-ws08-commercial-effect.yml"].includes("npm run test:repo-governance")
  && texts["../.github/workflows/main-integration-gates.yml"].includes("npm run repo:verify:full"),
  "focused and main workflows execute the structural governance and trace verifier");

record("GOV-17", !(await exists("decision/trace007/hypergraph.json")),
  "legacy conflated hypergraph transport is removed");

const scoreDimensions = scores.dimensions ?? [];
const scoreWeights = scores.weights ?? {};
const baseline = protocol.baseline_contracts?.trace007 ?? {};
const roles = baseline.roles ?? {};
const positiveRequired = roles.positive_required ?? [];
const positiveOptional = roles.positive_optional ?? [];
const penaltyRequired = roles.penalty_required ?? [];
const penaltyOptional = roles.penalty_optional ?? [];
const excluded = roles.excluded ?? [];
const declared = [
  ...positiveRequired,
  ...positiveOptional,
  ...penaltyRequired,
  ...penaltyOptional,
  ...excluded
];
const dimensionSet = new Set(scoreDimensions);
const optionalSet = new Set([...positiveOptional, ...penaltyOptional]);
const duplicateBaseline = declared.filter((dimension, index) => declared.indexOf(dimension) !== index);
const missingRequired = sorted([
  ...positiveRequired.filter((dimension) => !dimensionSet.has(dimension)),
  ...penaltyRequired.filter((dimension) => !dimensionSet.has(dimension))
]);
const unclassified = sorted(scoreDimensions.filter((dimension) => !declared.includes(dimension)));
const staleNonoptional = sorted(declared.filter((dimension) => !dimensionSet.has(dimension) && !optionalSet.has(dimension)));
const semantics = protocol.dimension_semantics ?? {};
const orientationMismatch = scoreDimensions.filter((dimension) => {
  const orientation = semantics?.[dimension]?.orientation;
  const weight = Number(scoreWeights?.[dimension]);
  return !["maximize", "minimize"].includes(orientation)
    || !Number.isFinite(weight)
    || (orientation === "maximize" ? weight < 0 : weight > 0);
});
const usedBySide = {
  positive: [...positiveRequired, ...positiveOptional].filter((dimension) => dimensionSet.has(dimension)),
  penalty: [...penaltyRequired, ...penaltyOptional].filter((dimension) => dimensionSet.has(dimension))
};
const groupProblems = [];
for (const side of ["positive", "penalty"]) {
  const groups = baseline.groups?.[side] ?? {};
  const declaredWeight = Number(baseline[`${side}_group_weight_sum`]);
  const actualWeight = Object.values(groups).reduce((sum, group) => sum + Number(group.weight), 0);
  if (!Number.isFinite(declaredWeight) || Math.abs(actualWeight - declaredWeight) > 1e-12) {
    groupProblems.push(`${side}:weight_sum`);
  }
  const counts = new Map();
  for (const [name, group] of Object.entries(groups)) {
    const used = (group.dimensions ?? []).filter((dimension) => dimensionSet.has(dimension));
    if (used.length === 0) groupProblems.push(`${side}:${name}:empty`);
    for (const dimension of used) counts.set(dimension, (counts.get(dimension) ?? 0) + 1);
  }
  for (const dimension of usedBySide[side]) {
    if ((counts.get(dimension) ?? 0) !== 1) groupProblems.push(`${side}:${dimension}:multiplicity`);
  }
}
record("GOV-18",
  scoreDimensions.length > 0
  && JSON.stringify(scoreDimensions) === JSON.stringify(protocol.candidate_dimensions)
  && duplicateBaseline.length === 0
  && missingRequired.length === 0
  && unclassified.length === 0
  && staleNonoptional.length === 0
  && orientationMismatch.length === 0
  && groupProblems.length === 0,
  `explicit baseline schema valid; duplicate=${sorted(new Set(duplicateBaseline)).join(",") || "none"}; missing_required=${missingRequired.join(",") || "none"}; unclassified=${unclassified.join(",") || "none"}; stale=${staleNonoptional.join(",") || "none"}; orientation=${orientationMismatch.join(",") || "none"}; groups=${groupProblems.join(",") || "none"}`);

const report = {
  generated_at: new Date().toISOString(),
  validator_version: "5.0.0-explicit-baseline-topology-split",
  status: failures.length ? "fail" : "pass",
  source_migration_head: sourceHeadLabel,
  pass_count: passes.length,
  fail_count: failures.length,
  passes,
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error("❌ AMTECH repository governance failed");
  process.exitCode = 1;
} else {
  console.log("✅ AMTECH repository governance OK");
}
