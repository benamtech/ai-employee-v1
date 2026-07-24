import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const engine = resolve(root, 'decision/engine/repoctl.mjs');
const registry = JSON.parse(readFileSync(resolve(root, 'decision/engine/representation-registry.json'), 'utf8')) as {
  dialects: Array<{ id: string; status: string; generator?: string; verifier?: string }>;
};

function run(...args: string[]) {
  return JSON.parse(execFileSync(process.execPath, [engine, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024
  }));
}

describe('repository-native software experiment compiler', () => {
  it('registers the executable base cascade and bounded future dialects', () => {
    const implemented = new Set(registry.dialects.filter((item) => item.status === 'implemented').map((item) => item.id));
    for (const id of [
      'repo.fact.v1', 'authority.dag.v1', 'dependency.graph.v1', 'invariant.hypergraph.v1',
      'correspondence.v1', 'spectral.hypergraph.v1', 'task.diffusion.v1', 'effect.frontier.v1',
      'experiment.design.v1', 'claim.certificate.v1', 'evidence.ledger.v1', 'external.acceptance.v1'
    ]) expect(implemented.has(id), id).toBe(true);

    const future = new Set(registry.dialects.filter((item) => item.status === 'registered_future').map((item) => item.id));
    for (const id of [
      'transition.system.v1', 'constraint.smt.v1', 'rewrite.egraph.v1', 'queueing.state.v1',
      'koopman.episode.v1', 'topology.complex.v1', 'embedding.code-change.v1', 'trajectory.episode.v1'
    ]) expect(future.has(id), id).toBe(true);
  });

  it('passes the registry and trusted-verifier doctor', () => {
    const result = run('doctor');
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.implemented_dialects).toContain('spectral.hypergraph.v1');
  });

  it('executes the full isolated experiment lifecycle with P1, P2, and P3 evidence', () => {
    const result = run('self-test');
    expect(result.ok).toBe(true);
    expect(result.verified.ok).toBe(true);
    expect(result.verified.phase).toBe('finished');
    expect(result.verified.results.certificate.evidence_class).toBe('P1');
    expect(result.verified.results.certificate.residual.max).toBeLessThanOrEqual(1e-9);
    expect(result.verified.results.correspondence.ok).toBe(true);
    expect(result.evaluated.maximum_evidence_class).toBe('P3');
    expect(result.evaluated.uncovered_paths).toEqual([]);
    expect(result.checked.non_mutating).toBe(true);
    expect(result.checked.findings).toEqual([]);
    expect(result.evaluated.verification_results.every((entry: { ok: boolean }) => entry.ok)).toBe(true);
  });

  it('executes verification commands without a shell', () => {
    const source = readFileSync(engine, 'utf8');
    const core = readFileSync(resolve(root, 'decision/engine/lib/core.mjs'), 'utf8');
    expect(source).toContain('verification');
    expect(core).toContain('shell: false');
    expect(core).not.toContain('execSync(');
  });

  it('exposes a non-mutating strict check command and external acceptance dialect', () => {
    const doctor = run('doctor');
    expect(doctor.engine_version).toBe('1.1.0');
    expect(doctor.implemented_dialects).toContain('external.acceptance.v1');

    const help = execFileSync(process.execPath, [engine, 'help'], { cwd: root, encoding: 'utf8' });
    expect(help).toContain('check --transaction path [--strict]');
    expect(help).toContain('evaluate --transaction path [--outcomes outcomes.json] [--overrides overrides.json] [--allow-dirty]');
  });

  it('bounds broad effect-frontier artifacts with deterministic diagnostics', async () => {
    const { computeEffectFrontier } = await import('../../decision/engine/analyze/effect-frontier.mjs');
    const dependencyGraph = {
      content_digest: 'sha256:dependency',
      source_sha: 'test-sha',
      payload: {
        nodes: [
          { id: 'file:a.ts', path: 'a.ts' },
          { id: 'file:b.ts', path: 'b.ts' },
          { id: 'file:c.ts', path: 'c.ts' },
          { id: 'file:d.ts', path: 'd.ts' },
        ],
        edges: [
          { id: 'e1', from: 'file:a.ts', to: 'file:b.ts', type: 'Imports', evidence: { path: 'a.ts' } },
          { id: 'e2', from: 'file:b.ts', to: 'file:c.ts', type: 'Imports', evidence: { path: 'b.ts' } },
          { id: 'e3', from: 'file:c.ts', to: 'file:d.ts', type: 'Imports', evidence: { path: 'c.ts' } },
        ],
      },
    };
    const diffusion = {
      content_digest: 'sha256:diffusion',
      payload: {
        seeds: { 'file:a.ts': 1, 'file:b.ts': 1, 'file:c.ts': 1, 'file:d.ts': 1 },
        ranked_nodes: [
          { id: 'file:a.ts', score: 4 },
          { id: 'file:b.ts', score: 3 },
          { id: 'file:c.ts', score: 2 },
          { id: 'file:d.ts', score: 1 },
        ],
      },
    };
    const hypergraph = {
      content_digest: 'sha256:hypergraph',
      payload: {
        hyperedges: [{
          id: 'h1',
          kind: 'source-test-execution',
          hard: true,
          relation_ids: ['r1', 'r2', 'r3'],
          members: ['file:a.ts', 'file:b.ts', 'file:c.ts', 'file:d.ts'],
        }],
      },
    };

    const result = computeEffectFrontier(
      { task_id: 'BROAD', paths: [] },
      diffusion,
      dependencyGraph,
      hypergraph,
      { max_seed_ids: 2, max_effects: 20, max_evidence_members: 2 },
    );

    expect(result.payload.diagnostics.raw_seed_count).toBe(4);
    expect(result.payload.diagnostics.used_seed_count).toBe(2);
    expect(result.payload.diagnostics.truncated).toBe(true);
    expect(result.payload.diagnostics.limit_reasons).toContain('max_seed_ids');
    expect(result.payload.effects.length).toBeLessThanOrEqual(20);
    expect(result.payload.effects.every((effect: { evidence?: Record<string, unknown> }) => !Object.hasOwn(effect.evidence ?? {}, 'members'))).toBe(true);
    expect(result.payload.effects.some((effect: { evidence?: { member_count?: number } }) => effect.evidence?.member_count === 4)).toBe(true);
  });

  it('retains one canonical pre-task onboarding contract', () => {
    const onboarding = readFileSync(resolve(root, 'decision/SESSION_ONBOARDING.md'), 'utf8');
    const rootAgents = readFileSync(resolve(root, '../AGENTS.md'), 'utf8');
    const scopedAgents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8');

    expect(rootAgents).toContain('mvp-build/decision/SESSION_ONBOARDING.md');
    expect(scopedAgents).toContain('decision/SESSION_ONBOARDING.md');
    expect(onboarding).toContain('Do not create the next transaction until the user supplies the actual task');
    expect(onboarding).toContain('node decision/engine/repoctl.mjs doctor');
    expect(onboarding).toContain('node decision/engine/repoctl.mjs self-test');
    expect(onboarding).toContain('Prefer machine queries');
    expect(onboarding).toContain('READY FOR TASK PROMPT');
  });
});
