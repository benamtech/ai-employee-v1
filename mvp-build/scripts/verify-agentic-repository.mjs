#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const requiredFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  'CODEGRAPH.md',
  'authority-map.json',
  'decision/active.json',
  'decision/README.md',
  'decision/protocol-v1.json',
  'decision/representation-contract.md',
  'decision/trace010/task_state.json',
  'decision/trace010/generate_inventory.mjs',
  'decision/trace010/verify_inventory.mjs',
  'decision/trace012/task_state.json',
  'decision/trace012/research-and-decision-record.md',
  'decision/trace012/folder-first-ui-variant-extension.md',
  'ui-lab/README.md',
  'memory/MEMORY.md'
];
for (const path of requiredFiles) {
  try { await access(join(root, path)); }
  catch { errors.push(`missing agentic contract file: ${path}`); }
}

const read = (path) => readFile(join(root, path), 'utf8');
const agents = await read('AGENTS.md');
const claude = await read('CLAUDE.md');
const codegraph = await read('CODEGRAPH.md');
const authority = JSON.parse(await read('authority-map.json'));
const active = JSON.parse(await read('decision/active.json'));
const protocol = JSON.parse(await read('decision/protocol-v1.json'));
const representation = await read('decision/representation-contract.md');
const trace010 = JSON.parse(await read('decision/trace010/task_state.json'));
const trace012 = JSON.parse(await read('decision/trace012/task_state.json'));
const memory = await read('memory/MEMORY.md');
const uiLab = await read('ui-lab/README.md');

for (const token of ['Observation', 'Hypothesis', 'Counterexample', 'Invariant', 'Candidate', 'Prediction', 'Test', 'Outcome']) {
  if (!agents.includes(token)) errors.push(`AGENTS.md missing typed reasoning node: ${token}`);
}
if (!claude.includes('Compatibility router')) errors.push('CLAUDE.md must remain a compatibility router');
if (!codegraph.includes('Source migration head: `0082`')) errors.push('CODEGRAPH.md missing source-derived migration head 0082');
if (!codegraph.includes('Trace012') || !codegraph.includes('Trace013')) errors.push('CODEGRAPH.md missing completed/next trace boundary');
if (!codegraph.includes('P1 formal model-property proof')) errors.push('CODEGRAPH.md missing formal model-property proof class');
if (!trace010.starting_sha) errors.push('trace010 task_state missing starting_sha');
if (!String(trace012.status).includes('implementation_complete')) errors.push('trace012 must be recorded as a completed implementation decision');
if (authority?.exact_status?.owner !== 'mvp-build/CODEGRAPH.md') errors.push('authority-map exact-status owner must be mvp-build/CODEGRAPH.md');
if (authority?.decision?.router !== 'mvp-build/decision/active.json') errors.push('authority-map must route through decision/active.json');
if (authority?.decision?.machine_native_representation_contract !== 'mvp-build/decision/representation-contract.md') {
  errors.push('authority-map must route to the machine-native representation contract');
}
if (active?.status !== 'no_open_decision_transaction') errors.push('decision/active.json must state that no new transaction is open');
if (active?.latest_completed_trace?.id !== 'trace012') errors.push('latest completed trace must be trace012');
if (active?.next_transaction?.reserved_id !== 'trace013' || active?.next_transaction?.state !== 'not_created') {
  errors.push('Trace013 must remain reserved and not created on this branch');
}
if (Number(protocol?.protocol_revision) < 5) errors.push('decision protocol revision must include machine-native proof classes');
if (protocol?.representation_contract !== 'representation-contract.md') errors.push('decision protocol must route to representation-contract.md');
for (const proofClass of ['P0_representation_calculation', 'P1_formal_model_property', 'P2_representation_fidelity', 'P3_executable_software', 'P4_external_production_acceptance']) {
  if (!protocol?.proof_classes?.[proofClass]) errors.push(`decision protocol missing proof class: ${proofClass}`);
}
if (protocol?.topology_contract?.spectral?.proof_status?.startsWith('P1') !== true) {
  errors.push('spectral eigenstructure must be allowed as P1 proof under its declared assumptions');
}
for (const token of ['vectors', 'tensors', 'hypergraphs', 'P1 — Formal model-property proof', 'Eigenvectors and other spectral objects are explicitly allowed']) {
  if (!representation.includes(token)) errors.push(`representation contract missing required token: ${token}`);
}
if (!agents.includes('Natural language is the audit/interoperability layer')) {
  errors.push('AGENTS.md must state that natural language is not the mandatory reasoning substrate');
}
if (!memory.includes('2026-07-23-stack-reconciliation-and-main-readiness.md')) errors.push('memory index missing current stack handoff');
if (!uiLab.includes('Canonical agent entry point')) errors.push('UI Lab README must remain the canonical agent entry point');

try {
  await access(join(root, 'decision/trace013'));
  errors.push('decision/trace013 must not exist before the fresh post-merge planning branch');
} catch {
  // Expected on this branch.
}

for (const forbidden of ['quantum proof', 'neural latent access', 'production proven by CI']) {
  if (agents.toLowerCase().includes(forbidden)) errors.push(`unsupported claim in AGENTS.md: ${forbidden}`);
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  checked: requiredFiles,
  latest_completed_trace: 'trace012',
  next_trace: 'trace013:not_created',
  representation_policy: 'machine-native-first-class',
  spectral_proof: 'P1-under-declared-assumptions'
}, null, 2));
