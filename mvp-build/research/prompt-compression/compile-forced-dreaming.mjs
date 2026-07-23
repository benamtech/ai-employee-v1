#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASIS = [
  'bug', 'feature', 'user', 'operator', 'architecture', 'protocol',
  'market', 'weird', 'constraint', 'test', 'failure', 'recovery'
];

const FAMILIES = [
  ['minimal-invariant-fix', { bug: 1, constraint: 0.8, test: 0.8 }],
  ['architecture-recomposition', { architecture: 1, protocol: 0.8, recovery: 0.5 }],
  ['operator-workflow', { operator: 1, user: 0.7, failure: 0.6 }],
  ['future-feature-enabler', { feature: 1, market: 0.6, architecture: 0.5 }],
  ['adversarial-boundary', { failure: 1, test: 0.9, weird: 0.6 }],
  ['constraint-inversion', { constraint: -1, weird: 1, protocol: 0.5 }],
  ['recovery-first', { recovery: 1, failure: 0.8, operator: 0.5 }],
  ['cross-lens-resonance', { user: 0.6, operator: 0.6, architecture: 0.6, feature: 0.6 }]
];

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error(`Invalid argument near ${key ?? '<end>'}`);
    out[key.slice(2)] = value;
  }
  return out;
}

function normalizeTask(input) {
  if (!input || typeof input !== 'object') throw new Error('Task must be a JSON object');
  const id = String(input.id ?? '').trim();
  const goal = String(input.goal ?? '').trim();
  if (!id || !goal) throw new Error('Task requires non-empty id and goal');
  return {
    id,
    goal,
    phase: String(input.phase ?? 'design'),
    source_sha: String(input.source_sha ?? '')
  };
}

function slot(id, family, lensVector, goal) {
  return {
    id,
    lens_vector: lensVector,
    mechanism_family: family,
    forced_output: {
      mechanism: `Derive a mechanism-level candidate for ${goal} from the declared lens vector. Do not restate another slot.`,
      repository_evidence: [],
      invariants: [],
      effects: [],
      prediction: '',
      falsifier: '',
      maximum_patch: [],
      verification: [],
      counterfactual: '',
      novelty_claim: '',
      unknowns: []
    }
  };
}

function cosine(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0; let aa = 0; let bb = 0;
  for (const key of keys) {
    const x = Number(a[key] ?? 0); const y = Number(b[key] ?? 0);
    dot += x * y; aa += x * x; bb += y * y;
  }
  if (aa === 0 || bb === 0) return 0;
  return dot / Math.sqrt(aa * bb);
}

function verifyVectors(slots, maximumPairSimilarity) {
  const violations = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const similarity = cosine(slots[i].lens_vector, slots[j].lens_vector);
      if (similarity > maximumPairSimilarity) {
        violations.push({ a: slots[i].id, b: slots[j].id, similarity });
      }
    }
  }
  return violations;
}

const args = parseArgs(process.argv);
if (!args.task || !args.out) {
  throw new Error('Usage: node compile-forced-dreaming.mjs --task <task.json> --out <envelope.json> [--count 8]');
}

const task = normalizeTask(JSON.parse(readFileSync(resolve(args.task), 'utf8')));
const count = Math.max(4, Math.min(Number(args.count ?? 8), FAMILIES.length));
const slots = FAMILIES.slice(0, count).map(([family, vector], index) => slot(`dream-${String(index + 1).padStart(2, '0')}`, family, vector, task.goal));
const maximumPairSimilarity = 0.92;
const vectorViolations = verifyVectors(slots, maximumPairSimilarity);
if (vectorViolations.length) throw new Error(`Lens basis violates separation constraint: ${JSON.stringify(vectorViolations)}`);

const envelope = {
  schema: 'amtech.forced-dreaming.v1',
  task,
  basis: BASIS,
  constraints: {
    minimum_candidates: count,
    minimum_mechanism_families: Math.min(5, count),
    maximum_pair_similarity: maximumPairSimilarity,
    independent_generation: true,
    forbid_early_ranking: true,
    require_counterfactual: true,
    require_weird_candidate: true
  },
  slots,
  selection: {
    gate: 'only_after_all_slots_complete_and_diversity_verified',
    pareto_axes: ['repository-fidelity', 'mechanism-diversity', 'predicted-value', 'testability', 'patch-boundedness'],
    prohibition: 'no_candidate_selected_by_style_or_unverified_novelty'
  },
  compiler_notes: {
    semantic_rule: 'Generate slots independently. Do not expose prior slot contents to later explorers.',
    trust_boundary: 'Lens vectors and novelty are P0 search controls; repository facts, invariant closure, tests, and exact evidence remain authoritative.',
    completion_rule: 'A slot is incomplete until mechanism, evidence, invariants, effects, prediction, falsifier, patch boundary, and argv verification are concrete.'
  }
};

writeFileSync(resolve(args.out), `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ok: true, out: resolve(args.out), slots: slots.length, basis_dimensions: BASIS.length })}\n`);
