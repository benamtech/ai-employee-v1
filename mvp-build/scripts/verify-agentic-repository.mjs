#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const requiredFiles = [
  'AGENTS.md', 'CLAUDE.md', 'CODEGRAPH.md', 'authority-map.json',
  'decision/active.json', 'decision/README.md', 'decision/protocol-v1.json',
  'decision/representation-contract.md', 'decision/engine/repoctl.mjs',
  'decision/engine/representation-registry.json',
  'decision/engine/extract/repository-facts.mjs',
  'decision/engine/represent/authority-dag.mjs',
  'decision/engine/represent/dependency-graph.mjs',
  'decision/engine/represent/invariant-hypergraph.mjs',
  'decision/engine/analyze/spectral-hypergraph.mjs',
  'decision/engine/analyze/task-diffusion.mjs',
  'decision/engine/analyze/effect-frontier.mjs',
  'decision/engine/verify/verify-correspondence.mjs',
  'decision/engine/verify/verify-certificate.mjs',
  'decision/engine/verify/verify-task-capsule.mjs',
  'decision/engine/verify/verify-transaction.mjs',
  'decision/trace013/task_state.json',
  'decision/trace013/candidate_descriptors.json',
  'decision/trace013/compute.mjs',
  'decision/trace013/implementation_contract.json',
  'decision/trace013/verification_plan.json',
  'decision/trace013/retrospective_cases.json',
  'decision/trace013/retrospective_benchmark.mjs',
  'tests/unit/decision-engine-contract.test.ts',
  'ui-lab/README.md', 'memory/MEMORY.md'
];
for (const path of requiredFiles) {
  try { await access(join(root, path)); }
  catch { errors.push(`missing agentic contract file: ${path}`); }
}

const read = (path) => readFile(join(root, path), 'utf8');
const json = async (path) => JSON.parse(await read(path));
const authority = await json('authority-map.json');
const active = await json('decision/active.json');
const protocol = await json('decision/protocol-v1.json');
const trace013 = await json('decision/trace013/task_state.json');
const registry = await json('decision/engine/representation-registry.json');

const traceIdFromPath = (value) => String(value ?? '').match(/trace\d+/)?.[0] ?? null;
const routedLatestTrace = traceIdFromPath(authority?.decision?.latest_completed_trace);
const reservedNextTrace = traceIdFromPath(authority?.decision?.next_trace_reserved);
const productionTraceIds = new Set((active?.production_trace_chain ?? []).map((item) => item?.id).filter(Boolean));

if (authority?.exact_status?.owner !== 'mvp-build/CODEGRAPH.md') errors.push('authority-map exact-status owner must be mvp-build/CODEGRAPH.md');
if (authority?.decision?.router !== 'mvp-build/decision/active.json') errors.push('authority-map must route through decision/active.json');
if (authority?.decision?.executable_engine !== 'mvp-build/decision/engine/repoctl.mjs') errors.push('authority-map must route to the executable experiment compiler');
if (Number(protocol?.protocol_revision) < 5) errors.push('decision protocol revision must include the P0-P4 proof taxonomy');
for (const key of ['P0_representation_calculation', 'P1_formal_model_property', 'P2_representation_fidelity', 'P3_executable_software', 'P4_external_production_acceptance']) {
  if (!protocol?.proof_classes?.[key]) errors.push(`decision protocol missing proof class: ${key}`);
}
if (!String(trace013.status).includes('implementation')) errors.push('Trace013 must identify the experiment compiler implementation transaction');
if (trace013.starting_sha !== '9f9874242e3740059e9f4f857c2f164962bc91d6') errors.push('Trace013 starting SHA changed');
if (!productionTraceIds.has('trace013')) errors.push('decision production trace chain must retain Trace013 compiler baseline');
const implemented = new Set((registry.dialects ?? []).filter((item) => item.status === 'implemented').map((item) => item.id));
for (const id of ['repo.fact.v1', 'authority.dag.v1', 'dependency.graph.v1', 'invariant.hypergraph.v1', 'correspondence.v1', 'spectral.hypergraph.v1', 'task.diffusion.v1', 'effect.frontier.v1', 'experiment.design.v1', 'claim.certificate.v1', 'evidence.ledger.v1']) {
  if (!implemented.has(id)) errors.push(`implemented representation missing: ${id}`);
}
if (!['active_decision_transaction', 'no_open_decision_transaction'].includes(active?.status)) errors.push(`invalid decision router status: ${active?.status}`);
if (active?.status === 'active_decision_transaction') {
  const activeId = active?.active_transaction?.id;
  if (!activeId) errors.push('active decision transaction missing id');
  if (activeId && activeId !== reservedNextTrace && !productionTraceIds.has(activeId)) {
    errors.push(`active decision transaction ${activeId} must match the reserved next trace or declared trace chain`);
  }
}
if (active?.status === 'no_open_decision_transaction') {
  const latestId = active?.latest_completed_trace?.id;
  if (!latestId) errors.push('completed decision router missing latest trace id');
  if (latestId && !productionTraceIds.has(latestId)) errors.push(`completed decision router ${latestId} missing from production trace chain`);
  if (routedLatestTrace && latestId !== routedLatestTrace) {
    errors.push(`completed decision router ${latestId} must match authority-map latest trace ${routedLatestTrace}`);
  }
}

function runJson(label, argv, timeout = 240_000) {
  const result = spawnSync(process.execPath, argv, { cwd: root, encoding: 'utf8', shell: false, timeout, maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    errors.push(`${label} failed: ${result.error ?? result.stderr ?? result.stdout}`);
    return null;
  }
  try { return JSON.parse(result.stdout); }
  catch (error) { errors.push(`${label} returned invalid JSON: ${error}`); return null; }
}

const selection = runJson('Trace013 candidate computation', ['decision/trace013/compute.mjs']);
if (selection && selection.selected !== 'R05') errors.push(`Trace013 selected unexpected candidate: ${selection.selected}`);
const doctor = runJson('experiment compiler doctor', ['decision/engine/repoctl.mjs', 'doctor']);
if (doctor && !doctor.ok) errors.push(...doctor.errors.map((error) => `doctor:${error}`));
const selfTest = runJson('experiment compiler self-test', ['decision/engine/repoctl.mjs', 'self-test']);
if (selfTest && !selfTest.ok) errors.push(`experiment compiler self-test reported failure: ${JSON.stringify(selfTest.verified?.errors ?? selfTest)}`);
if (selfTest?.verified?.results?.certificate?.evidence_class !== 'P1') errors.push('self-test did not produce a P1 formal-model certificate');
if (selfTest?.verified?.results?.correspondence?.ok !== true) errors.push('self-test did not produce verified P2 correspondence');
if (selfTest?.evaluated?.maximum_evidence_class !== 'P3') errors.push('self-test did not produce P3 executable evidence');
const retrospective = runJson('Trace013 retrospective benchmark', ['decision/trace013/retrospective_benchmark.mjs']);
if (retrospective?.summary?.cases !== 6) errors.push(`retrospective benchmark must execute six historical cases; received ${retrospective?.summary?.cases}`);
for (const arm of ['treatment', 'lexical_baseline']) {
  for (const [metric, value] of Object.entries(retrospective?.summary?.[arm] ?? {})) {
    if (!Number.isFinite(value)) errors.push(`retrospective benchmark produced non-finite ${arm}.${metric}`);
  }
}
if (retrospective?.classification?.causal_engineering_improvement !== 'unestablished; requires prospective matched tasks and independent outcomes') {
  errors.push('retrospective benchmark must preserve the causal nonclaim');
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  checked: requiredFiles,
  compiler_baseline_trace: 'trace013',
  routed_latest_trace: active.status === 'no_open_decision_transaction' ? active.latest_completed_trace.id : active.active_transaction.id,
  selected_candidate: selection.selected,
  engine_version: doctor.engine_version,
  implemented_dialects: doctor.implemented_dialects,
  proof_chain: ['P1 formal model certificate', 'P2 correspondence', 'P3 executable self-test'],
  retrospective_summary: retrospective.summary,
  retrospective_classification: retrospective.classification,
  current_transaction_state: active.status
}, null, 2));
