#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const fail = (message) => { throw new Error(`post_patch_evidence:${message}`); };
const exactSha = (value) => typeof value === "string" && /^[a-f0-9]{40}$/.test(value);

function verifyFrontier(path, expectedSchema) {
  const frontier = read(path);
  if (frontier.schema !== expectedSchema) fail(`${path}:schema`);
  if (frontier.status !== "observed_post_patch_frontier") fail(`${path}:status`);
  if (frontier.causal_improvement !== "unestablished") fail(`${path}:causal_claim`);
  if (!exactSha(frontier.observed_candidate_sha)) fail(`${path}:observed_sha`);
  if (!Number.isInteger(frontier.workflow_run_id) || frontier.workflow_run_id <= 0) fail(`${path}:workflow_run`);
  if (!Array.isArray(frontier.trajectory_fields) || !Array.isArray(frontier.trajectories)) fail(`${path}:shape`);
  if (frontier.trajectories.length < Math.max(16, Number(frontier.minimum ?? 0))) fail(`${path}:trajectory_count`);
  const required = ["id","evidence","state","missing","failure","capability","assumption","disposition"];
  for (const field of required) if (!frontier.trajectory_fields.includes(field)) fail(`${path}:field:${field}`);
  const ids = new Set();
  for (const row of frontier.trajectories) {
    if (!Array.isArray(row) || row.length !== frontier.trajectory_fields.length) fail(`${path}:row_shape`);
    const value = Object.fromEntries(frontier.trajectory_fields.map((field, index) => [field, row[index]]));
    if (ids.has(value.id)) fail(`${path}:duplicate:${value.id}`);
    ids.add(value.id);
    for (const field of required) if (typeof value[field] !== "string" || !value[field].trim()) fail(`${path}:${value.id}:${field}`);
  }
  return frontier;
}

const trace8 = verifyFrontier("decision/trace008/post_patch_frontier.json", "trace008.frontier.v1");
const trace9 = verifyFrontier("decision/trace009/post_patch_frontier.json", "trace009.frontier.v1");
const calibration = read("decision/trace009/calibration.json");
const selected = read("decision/trace009/selected_implementation.json");
const coverage = read("validation/ui-presentation-coverage.json");
const cases = read("validation/ui-state-machine-cases.json");

if (calibration.schema !== "trace009.calibration.v1" || calibration.causal_improvement !== "unestablished") fail("calibration_claim");
if (!exactSha(calibration.observed_candidate_sha) || calibration.observed_candidate_sha !== trace9.observed_candidate_sha) fail("calibration_sha");
if (calibration.scope?.time_to_green_seconds !== null || calibration.proof_yield?.post_merge_regressions !== null) fail("calibration_unknowns");
if (JSON.stringify(calibration.baseline_comparison?.pareto_selected) !== JSON.stringify(selected.selected_ids)) fail("calibration_pareto_selection");
if (JSON.stringify(calibration.baseline_comparison?.evidence_invariants_baseline) !== JSON.stringify(selected.selected_ids)) fail("calibration_baseline_selection");
if (calibration.baseline_comparison?.selection_jaccard !== 1) fail("calibration_jaccard");
if (!String(calibration.proof_yield?.container_release ?? "").startsWith("observed green")) fail("container_proof_yield");
if (!Array.isArray(coverage.uncovered_combinations)) fail("coverage_uncovered_missing");
if (!Array.isArray(cases.cases) || cases.cases.length < 18) fail("state_machine_cases");

for (const path of [
  "../.github/workflows/trace008-generate.yml",
  "../.github/workflows/ws08-ui-diagnostic.yml",
  "../.github/workflows/ws08-platform-context-patch.yml",
  "../.github/workflows/ws08-db-diagnostic.yml",
]) if (existsSync(resolve(path))) fail(`temporary_workflow:${path}`);

console.log(JSON.stringify({
  status: "ok",
  trace008_trajectories: trace8.trajectories.length,
  trace009_trajectories: trace9.trajectories.length,
  state_machine_cases: cases.cases.length,
  presentation_cases: coverage.cases.length,
  uncovered_combinations: coverage.uncovered_combinations.length,
  causal_improvement: "unestablished",
}, null, 2));
