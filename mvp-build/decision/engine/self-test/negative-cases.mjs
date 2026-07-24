import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { startTransaction, admitPlan, evaluateTransaction, finishTransaction, checkTransaction } from '../repoctl.mjs';
import { fileExists, readJson, writeJson } from '../lib/core.mjs';

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'repoctl-negative-'));
  await mkdir(resolve(root, 'src'), { recursive: true });
  await mkdir(resolve(root, 'tests'), { recursive: true });
  await mkdir(resolve(root, 'decision'), { recursive: true });
  await mkdir(resolve(root, 'mvp-build'), { recursive: true });
  await writeFile(resolve(root, 'AGENTS.md'), '# AGENTS\nRead `CODEGRAPH.md`.\n');
  await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nCurrent status.\n');
  await writeFile(resolve(root, 'decision/active.json'), '{"status":"active"}\n');
  await writeFile(resolve(root, 'authority-map.json'), JSON.stringify({ exact_status: { owner: 'CODEGRAPH.md' }, agent_entry: ['AGENTS.md'], decision: { router: 'decision/active.json' }, historical: [] }, null, 2));
  await writeFile(resolve(root, 'mvp-build/authority-map.json'), JSON.stringify({ exact_status: { owner: 'CODEGRAPH.md' }, agent_entry: ['AGENTS.md'], decision: { router: 'decision/active.json' }, historical: [] }, null, 2));
  await writeFile(resolve(root, 'src/a.mjs'), "export const value = 1;\n");
  await writeFile(resolve(root, 'tests/a.test.mjs'), "import { value } from '../src/a.mjs';\nif (value !== 1) process.exit(1);\n");
  await writeFile(resolve(root, 'package.json'), JSON.stringify({ type: 'module', scripts: { test: 'node tests/a.test.mjs' } }, null, 2));
  execFileSync('git', ['-C', root, 'init', '-q']);
  execFileSync('git', ['-C', root, 'config', 'user.email', 'negative@example.com']);
  execFileSync('git', ['-C', root, 'config', 'user.name', 'Negative Test']);
  execFileSync('git', ['-C', root, 'add', '.']);
  execFileSync('git', ['-C', root, 'commit', '-qm', 'base']);
  return root;
}

async function withTx(t, { allowed = ['src/a.mjs'], allowedEvidence = ['P0', 'P1', 'P2', 'P3'], predictions = [] } = {}) {
  const root = await fixture();
  t.after(async () => rm(root, { recursive: true, force: true }));
  const task = {
    task_id: 'NEGATIVE-CASE',
    goal: 'Exercise repoctl negative gate behavior',
    task_seeds: allowed,
    maximum_patch: { maximum_files: Math.max(1, allowed.length), allowed_paths: allowed },
    allowed_evidence_classes: allowedEvidence,
    predictions
  };
  const dir = resolve(root, 'decision/tx');
  await startTransaction({ root, task, out: dir });
  return { root, dir, hypergraph: await readJson(resolve(dir, 'invariant-hypergraph.json')) };
}

function hardEdge(hypergraph, anchor) {
  const edge = hypergraph.payload.hyperedges.find((item) => item.hard && item.anchor === `file:${anchor}`)
    ?? hypergraph.payload.hyperedges.find((item) => item.hard && item.members.includes(`file:${anchor}`));
  assert.ok(edge, `missing hard edge for ${anchor}`);
  return edge.id;
}

function acceptedProof(hypergraph, anchor, argv = ['node', '-e', 'process.exit(0)']) {
  return [{ hyperedge_id: hardEdge(hypergraph, anchor), status: 'accepted', evidence: [{ kind: 'command', argv }] }];
}

async function admit(root, dir, plan) {
  const path = resolve(dir, 'plan.json');
  await writeJson(path, plan);
  return admitPlan({ root, transactionDir: dir, plan: { ...plan, __path: path } });
}

function commit(root, paths, message = 'candidate') {
  execFileSync('git', ['-C', root, 'add', ...paths]);
  execFileSync('git', ['-C', root, 'commit', '-qm', message]);
}

async function rejects(promise, pattern) {
  await assert.rejects(promise, (error) => {
    assert.match(error.message, pattern);
    return true;
  });
}

test('rejects failing accepted evidence', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['CODEGRAPH.md'] });
  const edge = hardEdge(hypergraph, 'CODEGRAPH.md');
  await admit(root, dir, {
    maximum_patch: { maximum_files: 1, allowed_paths: ['CODEGRAPH.md'] },
    proof_obligations: [{ hyperedge_id: edge, status: 'accepted', evidence: [{ argv: ['node', '-e', 'process.exit(1)'] }] }],
    verification: { commands: [{ argv: ['node', '-e', 'process.exit(1)'] }] }
  });
  await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nCurrent status changed.\n');
  commit(root, ['CODEGRAPH.md']);
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /verification_failed|unresolved_hard_hyperedges/);
});

test('rejects inflated plan file caps', async (t) => {
  const { root, dir } = await withTx(t, { allowed: ['src/a.mjs'] });
  await rejects(admit(root, dir, { maximum_patch: { maximum_files: 2, allowed_paths: ['src/a.mjs'] }, verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } }), /maximum_files_exceeds_capsule/);
});

test('rejects plan paths outside capsule, effects, and discovered-later bounds', async (t) => {
  const { root, dir } = await withTx(t, { allowed: ['src/a.mjs'] });
  await rejects(admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs', 'src/out-of-bounds.mjs'] }, verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } }), /allowed_paths_exceed_capsule/);
});

test('rejects evaluation and finish without executable evidence', async (t) => {
  const { root, dir } = await withTx(t, { allowed: ['src/a.mjs'] });
  await admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, verification: { commands: [] } });
  await writeFile(resolve(root, 'src/a.mjs'), 'export const value = 1;\nexport const changed = true;\n');
  commit(root, ['src/a.mjs']);
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /evidence_absent/);
  await rejects(finishTransaction({ root, transactionDir: dir }), /evidence_ledger_missing|invalid evaluated/);
});

test('rejects supplied prediction outcome overrides', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, {
    allowed: ['src/a.mjs'],
    predictions: [{ id: 'p1', horizon: 1, type: 'direct', claim: 'No uncovered paths.', falsifier: 'Any uncovered path.', metric: 'uncovered_changed_paths', expected: 0 }]
  });
  await admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, proof_obligations: acceptedProof(hypergraph, 'src/a.mjs', ['node', 'tests/a.test.mjs']), verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } });
  await writeFile(resolve(root, 'src/a.mjs'), 'export const value = 1;\nexport const changed = true;\n');
  commit(root, ['src/a.mjs']);
  await rejects(evaluateTransaction({ root, transactionDir: dir, outcomes: [{ prediction_id: 'p1', observed: { value: 99, passed: true }, attestor: 'agent' }] }), /prediction_supplied_override/);
});

test('treats planned touched hard edges as unresolved', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['CODEGRAPH.md'] });
  const edge = hardEdge(hypergraph, 'CODEGRAPH.md');
  await admit(root, dir, {
    maximum_patch: { maximum_files: 1, allowed_paths: ['CODEGRAPH.md'] },
    proof_obligations: [{ hyperedge_id: edge, status: 'planned', evidence: [{ argv: ['node', '-e', 'process.exit(0)'] }] }],
    verification: { commands: [{ argv: ['node', '-e', 'process.exit(0)'] }] }
  });
  await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nCurrent status changed.\n');
  commit(root, ['CODEGRAPH.md']);
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /planned_touched_hard_hyperedges/);
});

test('rejects introduced authority cycles', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['mvp-build/authority-map.json'] });
  const edge = hardEdge(hypergraph, 'mvp-build/authority-map.json');
  await admit(root, dir, {
    maximum_patch: { maximum_files: 1, allowed_paths: ['mvp-build/authority-map.json'] },
    proof_obligations: [{ hyperedge_id: edge, status: 'accepted', evidence: [{ argv: ['node', '-e', 'process.exit(0)'] }] }],
    verification: { commands: [{ argv: ['node', '-e', 'process.exit(0)'] }] }
  });
  await writeFile(resolve(root, 'mvp-build/authority-map.json'), JSON.stringify({ self: 'mvp-build/authority-map.json', exact_status: { owner: 'CODEGRAPH.md' }, agent_entry: ['AGENTS.md'], decision: { router: 'decision/active.json' }, historical: [] }, null, 2));
  commit(root, ['mvp-build/authority-map.json']);
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /unoverridden_authority_cycle/);
});

test('rejects removed hard-edge anchors', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['tests/a.test.mjs'] });
  const edge = hardEdge(hypergraph, 'tests/a.test.mjs');
  await admit(root, dir, {
    maximum_patch: { maximum_files: 1, allowed_paths: ['tests/a.test.mjs'] },
    proof_obligations: [{ hyperedge_id: edge, status: 'accepted', evidence: [{ argv: ['node', '-e', 'process.exit(0)'] }] }],
    verification: { commands: [{ argv: ['node', '-e', 'process.exit(0)'] }] }
  });
  execFileSync('git', ['-C', root, 'rm', 'tests/a.test.mjs', '-q']);
  execFileSync('git', ['-C', root, 'commit', '-qm', 'remove anchor']);
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /unoverridden_removed_hard_edge_anchor|unresolved_hard_hyperedges/);
});

test('rejects bad overrides', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['CODEGRAPH.md'] });
  const edge = hardEdge(hypergraph, 'CODEGRAPH.md');
  await admit(root, dir, {
    maximum_patch: { maximum_files: 1, allowed_paths: ['CODEGRAPH.md'] },
    proof_obligations: [{ hyperedge_id: edge, status: 'accepted', evidence: [{ argv: ['node', '-e', 'process.exit(0)'] }] }],
    verification: { commands: [{ argv: ['node', '-e', 'process.exit(0)'] }] }
  });
  await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nCurrent status changed.\n');
  commit(root, ['CODEGRAPH.md']);
  await rejects(evaluateTransaction({ root, transactionDir: dir, overrides: { overrides: [{ id: 'bad', accepted: true, attestor_type: 'human', references: ['not-a-flagged-edge'] }] } }), /bad_override|invalid_overrides/);
});

test('retains but does not honor agent overrides', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['CODEGRAPH.md'] });
  const edge = hardEdge(hypergraph, 'CODEGRAPH.md');
  await admit(root, dir, {
    maximum_patch: { maximum_files: 1, allowed_paths: ['CODEGRAPH.md'] },
    proof_obligations: [{ hyperedge_id: edge, status: 'missing' }],
    verification: { commands: [{ argv: ['node', '-e', 'process.exit(0)'] }] }
  });
  await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nCurrent status changed.\n');
  commit(root, ['CODEGRAPH.md']);
  await rejects(evaluateTransaction({ root, transactionDir: dir, overrides: { overrides: [{ id: 'agent', accepted: true, attestor_type: 'agent', references: [edge] }] } }), /unresolved_hard_hyperedges|evidence_promotions/);
});

test('blocks P4 without accepted external acceptance', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['src/a.mjs'], allowedEvidence: ['P0', 'P1', 'P2', 'P3', 'P4'] });
  await admit(root, dir, { claimed_evidence_class: 'P4', maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, proof_obligations: acceptedProof(hypergraph, 'src/a.mjs', ['node', 'tests/a.test.mjs']), verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } });
  await writeFile(resolve(root, 'src/a.mjs'), 'export const value = 1;\nexport const changed = true;\n');
  commit(root, ['src/a.mjs']);
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /P4_without_external_acceptance|unearned_claim/);
});

test('blocks dirty evaluate unless allow-dirty is explicit', async (t) => {
  const { root, dir } = await withTx(t, { allowed: ['src/a.mjs'] });
  await admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } });
  await writeFile(resolve(root, 'src/a.mjs'), 'export const value = 1;\nexport const changed = true;\n');
  await rejects(evaluateTransaction({ root, transactionDir: dir }), /working tree is not clean/);
});

test('records allow-dirty ledger stamping', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['src/a.mjs'] });
  await admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, proof_obligations: acceptedProof(hypergraph, 'src/a.mjs', ['node', 'tests/a.test.mjs']), verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } });
  await writeFile(resolve(root, 'src/a.mjs'), 'export const value = 1;\nexport const changed = true;\n');
  await evaluateTransaction({ root, transactionDir: dir, allowDirty: true });
  const ledger = await readJson(resolve(dir, 'evidence-ledger.json'));
  assert.equal(ledger.payload.worktree_dirty.allowed, true);
  assert.deepEqual(ledger.payload.worktree_dirty.paths, ['src/a.mjs']);
});

test('strict check is non-mutating and exits finding-positive through result', async (t) => {
  const { root, dir } = await withTx(t, { allowed: ['src/a.mjs'] });
  await admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } });
  await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nOut of scope.\n');
  commit(root, ['CODEGRAPH.md']);
  const checked = await checkTransaction({ root, transactionDir: dir, strict: true });
  assert.equal(checked.ok, false);
  assert.equal(checked.non_mutating, true);
  assert.equal(await fileExists(resolve(dir, 'evidence-ledger.json')), false);
});

test('check and full evaluate agree on changed-path parity', async (t) => {
  const { root, dir, hypergraph } = await withTx(t, { allowed: ['src/a.mjs'] });
  await admit(root, dir, { maximum_patch: { maximum_files: 1, allowed_paths: ['src/a.mjs'] }, proof_obligations: acceptedProof(hypergraph, 'src/a.mjs', ['node', 'tests/a.test.mjs']), verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] } });
  await writeFile(resolve(root, 'src/a.mjs'), 'export const value = 1;\nexport const changed = true;\n');
  commit(root, ['src/a.mjs']);
  const checked = await checkTransaction({ root, transactionDir: dir, strict: true });
  assert.equal(checked.ok, true);
  await evaluateTransaction({ root, transactionDir: dir });
  const ledger = await readJson(resolve(dir, 'evidence-ledger.json'));
  assert.deepEqual(checked.changed_paths, ledger.payload.changed_paths);
});
