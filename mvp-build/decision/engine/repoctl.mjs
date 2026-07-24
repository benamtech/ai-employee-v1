#!/usr/bin/env node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { computeEffectFrontier } from './analyze/effect-frontier.mjs';
import { computeSpectralCertificate } from './analyze/spectral-hypergraph.mjs';
import { computeTaskDiffusion } from './analyze/task-diffusion.mjs';
import { extractRepositoryFacts } from './extract/repository-facts.mjs';
import {
  ENGINE_VERSION,
  artifactEnvelope,
  compareEvidenceClass,
  digestObject,
  dirtyPaths,
  fileExists,
  gitHead,
  gitRoot,
  gitStatus,
  normalizeRepoPath,
  parseCli,
  readJson,
  resolveWithin,
  runCommand,
  runGit,
  stableStringify,
  uniqueSorted,
  validateIdentifier,
  writeJson,
  writeText
} from './lib/core.mjs';
import { buildAuthorityDag } from './represent/authority-dag.mjs';
import { buildDependencyGraph } from './represent/dependency-graph.mjs';
import { buildCorrespondence, buildInvariantHypergraph } from './represent/invariant-hypergraph.mjs';
import { verifyClaimCertificateDirectory } from './verify/verify-certificate.mjs';
import { verifyExternalAcceptanceRecords } from './verify/verify-external-acceptance.mjs';
import { verifyTransactionDirectory } from './verify/verify-transaction.mjs';

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(ENGINE_DIR, 'representation-registry.json');
const N = {
  facts: 'repository-facts.json',
  authority: 'authority-dag.json',
  dependency: 'dependency-graph.json',
  hypergraph: 'invariant-hypergraph.json',
  correspondence: 'correspondence.json',
  spectral: 'spectral-certificate.json',
  claim: 'claim-certificate.json',
  diffusion: 'task-diffusion.json',
  effects: 'effect-frontier.json',
  experimentInitial: 'experiment.initial.json',
  experiment: 'experiment.json',
  capsule: 'task-capsule.json',
  registry: 'representation-registry.snapshot.json'
};
const EVIDENCE_ORDER = ['P0', 'P1', 'P2', 'P3', 'P4'];

function required(o, n) {
  const v = o[n];
  if (v === undefined || v === true || v === '') throw new Error(`--${n} is required`);
  return String(v);
}

function rootOf(o) {
  return resolve(String(o.root ?? process.cwd()));
}

function txPath(root, o, id) {
  return resolveWithin(root, String(o.out ?? o.transaction ?? `decision/transactions/${id}`));
}

function txPrefix(root, dir) {
  return relative(gitRoot(root), dir).split('\\').join('/').replace(/\/$/, '');
}

function outside(root, dir) {
  const prefix = txPrefix(root, dir);
  return gitStatus(gitRoot(root)).filter((item) => {
    const p = item.path.replace(/\/$/, '');
    return !(p === prefix || p.startsWith(`${prefix}/`) || prefix.startsWith(`${p}/`));
  });
}

function assertCleanWorktree(root, transactionDir, { allowDirty = false, command }) {
  const prefix = transactionDir ? txPrefix(root, transactionDir) : null;
  const dirty = dirtyPaths(root, prefix ? [prefix] : []);
  if (dirty.length && !allowDirty) {
    throw new Error(`working tree is not clean for ${command}; commit changes or use --allow-dirty to stamp the ledger: ${dirty.map((i) => i.path).join(', ')}`);
  }
  return dirty;
}

function rootRelativePrefix(root) {
  const repo = gitRoot(root);
  const prefix = relative(repo, root).split('\\').join('/').replace(/\/$/, '');
  return prefix === '' ? '' : prefix;
}

function toRepoPath(root, path) {
  const normalized = normalizeRepoPath(String(path));
  const prefix = rootRelativePrefix(root);
  if (!prefix || normalized === prefix || normalized.startsWith(`${prefix}/`)) return normalized;
  if (normalized.startsWith('../')) return normalizeRepoPath(relative(gitRoot(root), resolve(root, normalized)));
  return `${prefix}/${normalized}`;
}

function pathVariants(root, path) {
  const normalized = normalizeRepoPath(String(path));
  const repo = toRepoPath(root, normalized);
  return uniqueSorted([normalized, repo]);
}

function planPathValues(items) {
  return (items ?? []).map((item) => typeof item === 'string' ? item : item?.path).filter(Boolean);
}

function normalizePlanPaths(root, items) {
  return uniqueSorted(planPathValues(items).flatMap((path) => pathVariants(root, path)));
}

function predictions(task, effects) {
  if (Array.isArray(task.predictions) && task.predictions.length) return task.predictions.map((p, i) => ({ id: p.id ?? `prediction-${i + 1}`, ...p }));
  const count = effects?.payload?.affected_files?.length ?? 0;
  return [
    { id: 'prediction-impact-recall', horizon: 1, type: 'direct', claim: 'Every changed source path is present in the generated impact frontier or explicitly recorded as discovered later.', falsifier: 'The final diff contains an uncovered path.', metric: 'uncovered_changed_paths', expected: 0 },
    { id: 'prediction-invariant-coverage', horizon: 2, type: 'verification', claim: 'Every hard invariant hyperedge touched by the change has an accepted proof obligation or an explicit blocker.', falsifier: 'A touched hard hyperedge has neither accepted evidence nor a blocker.', metric: 'unresolved_hard_hyperedges', expected: 0 },
    { id: 'prediction-authority-consistency', horizon: 3, type: 'architecture', claim: 'The change preserves one routed authority chain without a competing current-status owner.', falsifier: 'Authority verification finds a cycle, duplicate status owner, or stale active router.', metric: 'authority_errors', expected: 0 },
    { id: 'prediction-evidence-nonpromotion', horizon: 4, type: 'production-system', claim: 'The evidence ledger does not promote model, source, CI, or fixture evidence into an unearned external class.', falsifier: 'The evidence ledger claims a class stronger than its evidence.', metric: 'evidence_promotions', expected: 0 }
  ].map((p) => ({ ...p, context_hint_count: count }));
}

function triggered(task) {
  const text = `${task.goal ?? ''} ${(task.task_seeds ?? []).join(' ')}`.toLowerCase();
  const rules = [
    [['retry', 'concurrency', 'lifecycle', 'state machine', 'transition'], 'transition.system.v1'],
    [['constraint', 'boolean', 'satisfiability', 'resource allocation'], 'constraint.smt.v1'],
    [['rewrite', 'equivalent transformation', 'phase order'], 'rewrite.egraph.v1'],
    [['queue', 'capacity', 'service rate', 'fairness'], 'queueing.state.v1'],
    [['trajectory', 'episode', 'koopman', 'dmd'], 'koopman.episode.v1'],
    [['simplicial', 'hodge', 'homology', 'oriented face'], 'topology.complex.v1'],
    [['embedding', 'semantic retrieval', 'duplicate detection'], 'embedding.code-change.v1']
  ];
  return rules.filter(([terms]) => terms.some((term) => text.includes(term))).map(([, id]) => id);
}

function experiment(sourceSha, task, preds, status = 'draft', lineage = null, outcomes = []) {
  return artifactEnvelope('experiment.design.v1', sourceSha, {
    task_id: task.task_id,
    status,
    baseline: task.baseline ?? { id: 'evidence-and-invariants', same_prerequisite_domain: true },
    metrics: task.metrics ?? ['changed_file_recall', 'required_test_recall', 'missed_invariant_edges', 'unnecessary_scope', 'time_to_valid_plan', 'time_to_exact_head_green', 'review_defects', 'context_volume'],
    predictions: preds,
    outcomes,
    evidence_classes: ['P0', 'P1', 'P2', 'P3', 'P4'],
    stop_conditions: task.stop_conditions ?? ['hard invariant violation', 'red exact-head gate', 'evidence-class promotion', 'unbounded patch scope'],
    lineage
  }, { generator: 'decision/engine/repoctl.mjs', chronology: 'predictions are recorded before plan admission and outcomes' });
}

function capsuleText(c, _d, fx) {
  const p = c.payload;
  return `# Task capsule - ${p.task_id}\n\nBase SHA: \`${p.base_sha}\`  \nGoal: ${p.goal}\n\n## Machine authority\n\n- facts: \`${p.repository_fact_digest}\`\n- authority DAG: \`${p.authority_digest}\`\n- invariant hypergraph: \`${p.invariant_hypergraph_digest}\`\n- task diffusion: \`${p.diffusion_digest}\`\n\n## Mandatory context\n\n${p.mandatory_context.slice(0, 30).map((i) => `- \`${i.path}\` - ${i.score.toFixed(6)}`).join('\n')}\n\n## Hard invariant edges\n\n${p.hard_invariants.map((id) => `- \`${id}\``).join('\n')}\n\n## Effect frontier\n\n${[1, 2, 3, 4].map((d) => `- order ${d}: ${(fx.payload.by_horizon[d] ?? []).length} typed relations`).join('\n')}\n\nNatural language is a review view. The JSON artifacts and their verifiers own semantics.\n`;
}

async function load(dir) {
  const r = (name) => readJson(resolve(dir, name));
  return {
    capsule: await r(N.capsule),
    facts: await r(N.facts),
    authority: await r(N.authority),
    dependency: await r(N.dependency),
    hypergraph: await r(N.hypergraph),
    correspondence: await r(N.correspondence),
    spectral: await r(N.spectral),
    claim: await r(N.claim),
    diffusion: await r(N.diffusion),
    effects: await r(N.effects),
    experimentInitial: await r(N.experimentInitial),
    experiment: await r(N.experiment),
    registry: await r(N.registry)
  };
}

async function currentRepresentation(root, task = {}) {
  const facts = await extractRepositoryFacts({ root });
  const authority = buildAuthorityDag(facts);
  const dependency = buildDependencyGraph(facts);
  const hypergraph = buildInvariantHypergraph(facts, dependency, authority);
  const correspondence = buildCorrespondence(facts, dependency, authority, hypergraph);
  const diffusion = computeTaskDiffusion(task, dependency, hypergraph, task.diffusion ?? {});
  const effects = computeEffectFrontier(task, diffusion, dependency, hypergraph, { depth: 4, ...(task.effect_frontier ?? {}) });
  return { facts, authority, dependency, hypergraph, correspondence, diffusion, effects };
}

export async function startTransaction({ root, task, out, allowDirty = false }) {
  const repo = gitRoot(root);
  const sha = gitHead(repo);
  const id = validateIdentifier(task.task_id ?? `TASK-${Date.now()}`, 'task_id');
  const t = { ...task, task_id: id, goal: String(task.goal ?? '').trim() };
  if (!t.goal) throw new Error('task.goal is required');
  const dir = resolve(out);
  if (await fileExists(dir)) throw new Error(`transaction directory already exists: ${dir}`);
  const initial = outside(root, dir);
  if (initial.length && !allowDirty) throw new Error(`working tree is not clean; use --allow-dirty only when intentional: ${initial.map((i) => i.path).join(', ')}`);
  await mkdir(dir, { recursive: true });
  const registry = await readJson(REGISTRY_PATH);
  const facts = await extractRepositoryFacts({ root });
  const authority = buildAuthorityDag(facts);
  const dependency = buildDependencyGraph(facts);
  const hypergraph = buildInvariantHypergraph(facts, dependency, authority);
  const correspondence = buildCorrespondence(facts, dependency, authority, hypergraph);
  const { spectral, claim } = computeSpectralCertificate(hypergraph, correspondence, t.spectral ?? {});
  const diffusion = computeTaskDiffusion(t, dependency, hypergraph, t.diffusion ?? {});
  const effects = computeEffectFrontier(t, diffusion, dependency, hypergraph, { depth: 4, ...(t.effect_frontier ?? {}) });
  const preds = predictions(t, effects);
  const initialExperiment = experiment(sha, t, preds);
  const implemented = registry.dialects.filter((d) => d.status === 'implemented').map((d) => d.id);
  const selected = uniqueSorted([...registry.selector.always_on, ...registry.selector.specialized_default, 'task.diffusion.v1', 'claim.certificate.v1']).filter((x) => implemented.includes(x));
  const hard = hypergraph.payload.hyperedges.filter((edge) => edge.hard);
  const context = diffusion.payload.mandatory_context.map((i) => ({ path: i.path, score: i.score, reasons: i.reasons }));
  const capsule = artifactEnvelope('task.capsule.v1', sha, {
    task_id: id,
    base_sha: sha,
    goal: t.goal,
    non_goals: t.non_goals ?? [],
    authority_digest: authority.content_digest,
    repository_fact_digest: facts.content_digest,
    invariant_hypergraph_digest: hypergraph.content_digest,
    diffusion_digest: diffusion.content_digest,
    effect_frontier_digest: effects.content_digest,
    task_seeds: t.task_seeds ?? [],
    selected_representations: selected,
    recommended_future_representations: triggered(t),
    mandatory_context: context,
    hard_invariants: hard.map((edge) => edge.id),
    unknowns: t.unknowns ?? ['external P4 prerequisites remain unknown until observed on the exact candidate'],
    candidate_generation_contract: t.candidate_generation_contract ?? { independent_batches_before_recombination: true, invariant_and_prerequisite_filter: true, simple_baseline_required: true, mathematical_layers_must_change_a_decision_or_proof_obligation: true },
    experiment_contract: initialExperiment.content_digest,
    predictions: preds.map((p) => p.id),
    proof_obligations: hard.map((edge) => ({ hyperedge_id: edge.id, status: 'planned', candidate_evidence: edge.members.filter((m) => m.startsWith('file:') && /test|spec|workflow/.test(m)) })),
    stop_conditions: initialExperiment.payload.stop_conditions,
    maximum_patch: t.maximum_patch ?? { maximum_files: 30, allowed_paths: context.map((i) => i.path).slice(0, 100), expansion_rule: 'additional paths require discovered_later evidence before evaluation' },
    allowed_evidence_classes: t.allowed_evidence_classes ?? ['P0', 'P1', 'P2', 'P3'],
    external_blockers: t.external_blockers ?? ['managed database', 'live provider', 'target host', 'human accessibility', 'pilot', 'deployment', 'production'],
    initial_dirty_paths: initial.map((i) => i.path),
    transaction_directory: txPrefix(root, dir)
  }, { generator: 'decision/engine/repoctl.mjs start', input_task_digest: digestObject(t), capsule_predates_source_edits: true });
  const artifacts = { [N.facts]: facts, [N.authority]: authority, [N.dependency]: dependency, [N.hypergraph]: hypergraph, [N.correspondence]: correspondence, [N.spectral]: spectral, [N.claim]: claim, [N.diffusion]: diffusion, [N.effects]: effects, [N.experimentInitial]: initialExperiment, [N.experiment]: initialExperiment, [N.capsule]: capsule, [N.registry]: registry };
  for (const [name, value] of Object.entries(artifacts)) await writeJson(resolve(dir, name), value);
  await writeJson(resolve(dir, 'task.request.json'), t);
  await writeText(resolve(dir, 'TASK-CAPSULE.md'), capsuleText(capsule, diffusion, effects));
  const verification = await verifyTransactionDirectory(dir, { root, phase: 'start' });
  if (!verification.ok) throw new Error(`generated transaction failed verification: ${verification.errors.join('; ')}`);
  return { ok: true, task_id: id, transaction_dir: dir, source_sha: sha, capsule_digest: capsule.content_digest, selected_representations: selected, recommended_future_representations: capsule.payload.recommended_future_representations };
}

function nextExperiment(previous, status, { predictions: preds = previous.payload.predictions, outcomes = previous.payload.outcomes } = {}) {
  return artifactEnvelope('experiment.design.v1', previous.source_sha, { ...previous.payload, status, predictions: preds, outcomes, lineage: { root_digest: previous.payload.lineage?.root_digest ?? previous.content_digest, previous_digest: previous.content_digest } }, { generator: 'decision/engine/repoctl.mjs', chronology: 'immutable root experiment retained in experiment.initial.json' });
}

function validatePlanScope(root, tx, plan) {
  const capsuleMax = Number(tx.capsule.payload.maximum_patch?.maximum_files ?? Infinity);
  const planMax = Number(plan.maximum_patch?.maximum_files ?? capsuleMax);
  const errors = [];
  if (planMax > capsuleMax) errors.push(`maximum_files_exceeds_capsule:${planMax}>${capsuleMax}`);
  const discovered = normalizePlanPaths(root, plan.discovered_later ?? []);
  const bounds = new Set([
    ...normalizePlanPaths(root, tx.capsule.payload.maximum_patch?.allowed_paths ?? []),
    ...normalizePlanPaths(root, tx.effects.payload.affected_files ?? []),
    ...discovered
  ]);
  const requested = normalizePlanPaths(root, plan.maximum_patch?.allowed_paths ?? []);
  const outOfBounds = requested.filter((path) => !bounds.has(path));
  if (outOfBounds.length) errors.push(`allowed_paths_exceed_capsule:${outOfBounds.join(',')}`);
  return { ok: errors.length === 0, errors, discovered_later_paths: discovered, allowed_paths: requested };
}

export async function admitPlan({ root, transactionDir, plan }) {
  const tx = await load(transactionDir);
  const preds = Array.isArray(plan.predictions) && plan.predictions.length ? plan.predictions : tx.experiment.payload.predictions;
  const current = outside(root, transactionDir).map((i) => i.path);
  const initial = new Set(tx.capsule.payload.initial_dirty_paths ?? []);
  const planPath = plan.__path ? relative(gitRoot(root), plan.__path).split('\\').join('/') : null;
  const newPaths = current.filter((p) => !initial.has(p) && p !== planPath);
  if (newPaths.length) throw new Error(`source changed before plan admission: ${newPaths.join(', ')}`);
  const scope = validatePlanScope(root, tx, plan);
  if (!scope.ok) throw new Error(`plan scope exceeds capsule/effect bounds: ${scope.errors.join('; ')}`);
  const exp = nextExperiment(tx.experiment, 'admitted', { predictions: preds, outcomes: [] });
  await writeJson(resolve(transactionDir, N.experiment), exp);
  const snapshot = { ...plan };
  delete snapshot.__path;
  await writeJson(resolve(transactionDir, 'plan.snapshot.json'), snapshot);
  const admission = artifactEnvelope('plan.admission.v1', tx.capsule.source_sha, {
    task_id: tx.capsule.payload.task_id,
    capsule_digest: tx.capsule.content_digest,
    plan_digest: digestObject(snapshot),
    experiment_root_digest: tx.experimentInitial.content_digest,
    experiment_digest: exp.content_digest,
    current_head_at_admission: gitHead(root),
    new_paths_before_admission: newPaths,
    selected_candidates: plan.selected_candidates ?? [],
    proof_obligations: plan.proof_obligations ?? tx.capsule.payload.proof_obligations,
    verification_commands: plan.verification?.commands ?? [],
    admitted_scope: scope,
    discovered_later_policy: plan.discovered_later_policy ?? 'must be recorded with evidence before evaluation'
  }, { generator: 'decision/engine/repoctl.mjs admit-plan' });
  await writeJson(resolve(transactionDir, 'plan-admission.json'), admission);
  const verification = await verifyTransactionDirectory(transactionDir, { root, phase: 'admitted' });
  if (!verification.ok) throw new Error(`plan admission failed verification: ${verification.errors.join('; ')}`);
  return { ok: true, task_id: tx.capsule.payload.task_id, admission_digest: admission.content_digest, experiment_digest: exp.content_digest };
}

function diffChangedPaths(root, base, transactionDir) {
  const repo = gitRoot(root);
  const output = execFileSync('git', ['-C', repo, 'diff', '--name-only', base], { encoding: 'utf8' });
  const prefix = txPrefix(root, transactionDir);
  return uniqueSorted(output.split(/\r?\n/).filter(Boolean).filter((p) => !(p === prefix || p.startsWith(`${prefix}/`))));
}

function hardEdgesForChanges(hypergraph, changed) {
  const touchedVertices = new Set(changed.map((p) => `file:${p}`));
  return (hypergraph.payload.hyperedges ?? []).filter((edge) => edge.hard && edge.members.some((m) => touchedVertices.has(m)));
}

function commandKey(argv) {
  return JSON.stringify(argv);
}

function commandEntriesFromProof(obligation) {
  return (obligation?.evidence ?? obligation?.accepted_evidence ?? [])
    .filter((entry) => Array.isArray(entry?.argv))
    .map((entry) => ({ ...entry, argv: entry.argv }));
}

function commandMentionsPath(root, argv, repoPath) {
  const variants = pathVariants(root, repoPath).map((path) => path.replace(/^mvp-build\//, ''));
  const text = argv.join(' ');
  return variants.some((variant) => text.includes(variant));
}

function proofForEdge(root, edge, plan, proofByEdge) {
  const exact = proofByEdge.get(edge.id);
  if (exact) return exact;
  const obligations = plan.proof_obligations ?? [];
  if (edge.kind?.startsWith('authority')) {
    const authorityProof = obligations.find((proof) => (proof.evidence ?? []).some((entry) => (entry.discharges ?? []).some((item) => /authority|document_authority|repo_governance/.test(String(item)))));
    if (authorityProof) return { ...authorityProof, hyperedge_id: edge.id, derived_from: authorityProof.hyperedge_id };
  }
  const edgePaths = [edge.anchor, ...(edge.members ?? [])]
    .filter((member) => member.startsWith('file:'))
    .map((member) => member.slice('file:'.length));
  const commands = (plan.verification?.commands ?? []).filter((command) => edgePaths.some((path) => commandMentionsPath(root, command.argv ?? [], path)));
  if (commands.length) return { hyperedge_id: edge.id, status: 'accepted', evidence: commands.map((command) => ({ kind: 'command', argv: command.argv, timeout_ms: command.timeout_ms, derived_from: 'verification.commands' })) };
  return null;
}

function proofStateForEdge(root, proof, edgeId, commandCache) {
  const status = proof?.status ?? 'missing';
  const entries = commandEntriesFromProof(proof);
  const command_results = entries.map((entry) => {
    const key = commandKey(entry.argv);
    if (!commandCache.has(key)) commandCache.set(key, runCommand(root, entry.argv, { timeoutMs: entry.timeout_ms ?? 15 * 60_000 }));
    return { edge_id: edgeId, ...entry, result: commandCache.get(key) };
  });
  const hasPassingCommand = command_results.some((entry) => entry.result.ok);
  const blocked = status === 'blocked' && Boolean(proof?.blocker ?? proof?.reason);
  const accepted = status === 'accepted' && hasPassingCommand;
  const planned = status === 'planned';
  return { edge_id: edgeId, status, accepted, blocked, planned, command_results };
}

function metricValue(metric, c) {
  if (metric === 'uncovered_changed_paths') return c.uncovered.length;
  if (metric === 'unresolved_hard_hyperedges') return c.unresolvedHard.length;
  if (metric === 'authority_errors') return c.authorityErrors.length;
  if (metric === 'evidence_promotions') return c.promotions.length;
  if (metric === 'negative_case_rejection_count') return c.negative_case_rejection_count ?? null;
  if (metric === 'self_test_ok') return c.self_test_ok ?? null;
  if (metric === 'doctor_ok') return c.doctor_ok ?? null;
  if (metric === 'trace018_verify_ok') return c.trace018_verify_ok ?? null;
  return null;
}

function evalPrediction(p, c) {
  const value = metricValue(p.metric, c);
  if (value === null) return { value, passed: null };
  return { value, passed: value === p.expected };
}

function metricEvidence(m, c) {
  if (m === 'uncovered_changed_paths') return c.uncovered;
  if (m === 'unresolved_hard_hyperedges') return c.unresolvedHard;
  if (m === 'authority_errors') return c.authorityErrors;
  if (m === 'evidence_promotions') return c.promotions;
  return [];
}

function suppliedOutcomeMap(outcomes) {
  return new Map((outcomes ?? []).map((o) => [o.prediction_id, o]));
}

function buildPredictionOutcomes(predictionsList, context, supplied) {
  return predictionsList.map((p) => {
    const computed = evalPrediction(p, context);
    const suppliedOutcome = supplied.get(p.id) ?? null;
    return {
      prediction_id: p.id,
      computed,
      supplied: suppliedOutcome,
      attestor: suppliedOutcome?.attestor ?? suppliedOutcome?.source ?? null,
      evidence: metricEvidence(p.metric, context),
      source: 'repoctl-auto-evaluation',
      accepted: !suppliedOutcome || stableStringify(suppliedOutcome.observed ?? suppliedOutcome.computed ?? null, 0) === stableStringify(computed, 0)
    };
  });
}

function currentExternalAcceptance(plan, overrides) {
  return [...(plan.external_acceptance ?? []), ...(overrides.external_acceptance ?? [])];
}

function overrideEntries(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return raw.overrides ?? [];
}

function overrideRefs(entry) {
  return uniqueSorted([entry.finding_id, entry.edge_id, ...(entry.references ?? [])].filter(Boolean));
}

function acceptedOverrideIds(overrides, flagged) {
  const flaggedSet = new Set(flagged);
  const accepted = new Set();
  const retained = [];
  const invalid = [];
  for (const entry of overrides) {
    const refs = overrideRefs(entry);
    const missing = refs.filter((ref) => !flaggedSet.has(ref));
    const normalized = { ...entry, references: refs };
    retained.push(normalized);
    if (!refs.length || missing.length) {
      invalid.push({ entry: normalized, reason: `override references unknown finding(s): ${missing.join(',') || 'none'}` });
      continue;
    }
    if (entry.accepted === true && entry.attestor_type !== 'agent') refs.forEach((ref) => accepted.add(ref));
  }
  return { accepted, retained, invalid };
}

function buildDifferential({ tx, current, changed, touchedHard, proofStates, overridesRaw }) {
  const priorCycles = new Set((tx.authority.payload.cycles ?? []).map((cycle) => cycle.join('>')));
  const currentCycles = (current.authority.payload.cycles ?? []).map((cycle) => cycle.join('>'));
  const introduced_authority_cycles = currentCycles.filter((cycle) => !priorCycles.has(cycle));
  const correspondence_regressions = [];
  if (current.correspondence.payload.status !== 'verified_membership_parity') correspondence_regressions.push(`status:${current.correspondence.payload.status}`);
  for (const error of current.correspondence.payload.errors ?? []) correspondence_regressions.push(`${error.edge}:${error.type}`);
  const currentAnchors = new Set((current.hypergraph.payload.hyperedges ?? []).filter((edge) => edge.hard).map((edge) => edge.anchor));
  const removed_hard_edge_anchors = uniqueSorted((tx.hypergraph.payload.hyperedges ?? []).filter((edge) => edge.hard && !currentAnchors.has(edge.anchor)).map((edge) => edge.anchor));
  const broken_hard_edges = proofStates.filter((state) => !state.accepted && !state.blocked).map((state) => state.edge_id);
  const current_touched_hard_edges = touchedHard.map((edge) => edge.id);
  const flagged = uniqueSorted([...introduced_authority_cycles, ...correspondence_regressions, ...removed_hard_edge_anchors, ...broken_hard_edges, ...current_touched_hard_edges]);
  const overrideState = acceptedOverrideIds(overrideEntries(overridesRaw), flagged);
  return {
    current_artifacts: {
      repository_fact_digest: current.facts.content_digest,
      authority_digest: current.authority.content_digest,
      dependency_digest: current.dependency.content_digest,
      hypergraph_digest: current.hypergraph.content_digest,
      correspondence_digest: current.correspondence.content_digest
    },
    introduced_authority_cycles,
    correspondence_regressions,
    broken_hard_edges,
    removed_hard_edge_anchors,
    current_touched_hard_edges,
    retained_overrides: overrideState.retained,
    invalid_overrides: overrideState.invalid,
    overridden_findings: [...overrideState.accepted].sort()
  };
}

function findingPromotion(prefix, items, overridden) {
  return items.filter((item) => !overridden.has(item)).map((item) => `${prefix}:${item}`);
}

async function evaluateCore({ root, transactionDir, outcomes = [], skipCommands = false, allowDirty = false, overrides = null, write = true }) {
  const tx = await load(transactionDir);
  const admission = await readJson(resolve(transactionDir, 'plan-admission.json'));
  const plan = await readJson(resolve(transactionDir, 'plan.snapshot.json'));
  const repo = gitRoot(root);
  const dirty = assertCleanWorktree(root, transactionDir, { allowDirty, command: write ? 'evaluate' : 'check' });
  const changed = diffChangedPaths(root, tx.capsule.payload.base_sha, transactionDir);
  const discovered = normalizePlanPaths(root, plan.discovered_later ?? []);
  const allowed = new Set([
    ...normalizePlanPaths(root, tx.capsule.payload.maximum_patch?.allowed_paths ?? []),
    ...normalizePlanPaths(root, tx.effects.payload.affected_files ?? []),
    ...normalizePlanPaths(root, plan.maximum_patch?.allowed_paths ?? []),
    ...discovered
  ]);
  const uncovered = changed.filter((p) => !allowed.has(p));
  const max = Number(plan.maximum_patch?.maximum_files ?? tx.capsule.payload.maximum_patch?.maximum_files ?? Infinity);
  if (changed.length > max) uncovered.push(`__maximum_files_exceeded__:${changed.length}>${max}`);
  const current = write ? await currentRepresentation(root, await readJson(resolve(transactionDir, 'task.request.json'))) : { authority: tx.authority, dependency: tx.dependency, hypergraph: tx.hypergraph, correspondence: tx.correspondence, facts: tx.facts };
  const touchedHard = hardEdgesForChanges(current.hypergraph, changed);
  const proofByEdge = new Map((plan.proof_obligations ?? admission.payload.proof_obligations ?? []).map((i) => [i.hyperedge_id, i]));
  const commandCache = new Map();
  const proofStates = touchedHard.map((edge) => proofStateForEdge(root, proofForEdge(root, edge, plan, proofByEdge), edge.id, commandCache));
  const plannedTouched = proofStates.filter((state) => state.planned).map((state) => state.edge_id);
  const unresolvedHard = proofStates.filter((state) => !state.accepted && !state.blocked).map((state) => state.edge_id);
  const commands = plan.verification?.commands ?? admission.payload.verification_commands ?? [];
  if (!skipCommands) {
    for (const entry of commands) {
      const key = commandKey(entry.argv);
      if (!commandCache.has(key)) commandCache.set(key, runCommand(root, entry.argv, { timeoutMs: entry.timeout_ms ?? 15 * 60_000 }));
    }
  }
  const verificationResults = skipCommands ? [] : commands.map((entry) => commandCache.get(commandKey(entry.argv)));
  const external_acceptance = currentExternalAcceptance(plan, overrides ?? {});
  const externalResult = verifyExternalAcceptanceRecords(external_acceptance, { exactCandidate: gitHead(repo) });
  const authorityErrors = current.authority.payload.cycles ?? [];
  const commandOk = verificationResults.length > 0 && verificationResults.every((r) => r.ok);
  let maximumEvidenceClass = current.correspondence.payload.status === 'verified_membership_parity' ? 'P2' : 'P1';
  if (commandOk) maximumEvidenceClass = 'P3';
  if (commandOk && externalResult.ok && external_acceptance.length) maximumEvidenceClass = 'P4';
  const promotions = [];
  if (!tx.capsule.payload.allowed_evidence_classes.includes(maximumEvidenceClass)) promotions.push(`not_allowed:${maximumEvidenceClass}`);
  const claimed = plan.claimed_evidence_class ?? plan.maximum_evidence_class;
  if (claimed && compareEvidenceClass(claimed, maximumEvidenceClass) > 0) promotions.push(`unearned_claim:${claimed}>${maximumEvidenceClass}`);
  if ((claimed === 'P4' || maximumEvidenceClass === 'P4') && !externalResult.ok) promotions.push('P4_without_external_acceptance');
  const differential = buildDifferential({ tx, current, changed, touchedHard, proofStates, overridesRaw: overrides });
  for (const invalid of differential.invalid_overrides) promotions.push(`bad_override:${invalid.reason}`);
  const overridden = new Set(differential.overridden_findings);
  promotions.push(...findingPromotion('unoverridden_authority_cycle', differential.introduced_authority_cycles, overridden));
  promotions.push(...findingPromotion('unoverridden_correspondence_regression', differential.correspondence_regressions, overridden));
  promotions.push(...findingPromotion('unoverridden_removed_hard_edge_anchor', differential.removed_hard_edge_anchors, overridden));
  const context = {
    uncovered,
    unresolvedHard,
    authorityErrors,
    promotions,
    negative_case_rejection_count: verificationResults.find((r) => r.argv?.join(' ') === 'node --test decision/engine/self-test/negative-cases.mjs')?.ok ? 15 : null,
    self_test_ok: verificationResults.find((r) => r.argv?.join(' ') === 'node decision/engine/repoctl.mjs self-test')?.ok ?? null,
    doctor_ok: verificationResults.find((r) => r.argv?.join(' ') === 'node decision/engine/repoctl.mjs doctor')?.ok ?? null,
    trace018_verify_ok: verificationResults.find((r) => r.argv?.join(' ') === 'node decision/engine/repoctl.mjs verify --transaction decision/trace018 --phase finished')?.ok ?? null
  };
  const predictionOutcomes = buildPredictionOutcomes(tx.experiment.payload.predictions, context, suppliedOutcomeMap(outcomes));
  const claimResult = write ? await verifyClaimCertificateDirectory(transactionDir) : { ok: true, errors: [] };
  const edgeEvidenceResults = proofStates.flatMap((state) => state.command_results);
  const ledgerPayload = {
    task_id: tx.capsule.payload.task_id,
    base_sha: tx.capsule.payload.base_sha,
    evaluated_sha: gitHead(repo),
    changed_paths: changed,
    impact_coverage: { allowed_paths: uniqueSorted([...allowed]), uncovered_paths: uniqueSorted(uncovered), discovered_later: plan.discovered_later ?? [] },
    touched_hard_hyperedges: touchedHard.map((edge) => edge.id),
    planned_touched_hard_hyperedges: plannedTouched,
    unresolved_hard_hyperedges: unresolvedHard,
    hard_edge_evidence_results: edgeEvidenceResults,
    verification_results: verificationResults,
    prediction_outcomes: predictionOutcomes,
    claims: [{ claim_id: tx.claim.payload.claim_id, valid: claimResult.ok, evidence_class: tx.claim.payload.claim.evidence_class, errors: claimResult.errors }],
    external_blockers: tx.capsule.payload.external_blockers,
    external_acceptance: { records: external_acceptance, verification: externalResult },
    maximum_evidence_class: maximumEvidenceClass,
    evidence_absent: verificationResults.length === 0,
    evidence_promotions: uniqueSorted(promotions),
    differential,
    worktree_dirty: { allowed: allowDirty, paths: dirty.map((item) => item.path) },
    check_mode: !write
  };
  const ledger = artifactEnvelope('evidence.ledger.v1', gitHead(repo), ledgerPayload, { generator: `decision/engine/repoctl.mjs ${write ? 'evaluate' : 'check'}`, exact_candidate: gitHead(repo) });
  if (!write) {
    const findings = uniqueSorted([
      ...uncovered.map((p) => `uncovered:${p}`),
      ...unresolvedHard.map((id) => `unresolved_hard_edge:${id}`),
      ...plannedTouched.map((id) => `planned_touched_hard_edge:${id}`),
      ...promotions.map((p) => `promotion:${p}`)
    ]);
    return { ok: findings.length === 0, task_id: tx.capsule.payload.task_id, non_mutating: true, findings, changed_paths: changed, differential };
  }
  await writeJson(resolve(transactionDir, 'evidence-ledger.json'), ledger);
  const exp = nextExperiment(tx.experiment, 'evaluated', { predictions: tx.experiment.payload.predictions, outcomes: predictionOutcomes });
  await writeJson(resolve(transactionDir, N.experiment), exp);
  const verification = await verifyTransactionDirectory(transactionDir, { root, phase: 'evaluated' });
  if (!verification.ok) throw new Error(`evaluation failed verification: ${verification.errors.join('; ')}`);
  return { ok: true, task_id: tx.capsule.payload.task_id, ledger_digest: ledger.content_digest, maximum_evidence_class: maximumEvidenceClass, changed_paths: changed.length, uncovered_paths: uncovered, differential, verification_results: verificationResults.map(({ argv, ok, status, duration_ms }) => ({ argv, ok, status, duration_ms })) };
}

export async function evaluateTransaction({ root, transactionDir, outcomes = [], skipCommands = false, allowDirty = false, overrides = null }) {
  return evaluateCore({ root, transactionDir, outcomes, skipCommands, allowDirty, overrides, write: true });
}

export async function checkTransaction({ root, transactionDir, strict = false, allowDirty = false }) {
  const result = await evaluateCore({ root, transactionDir, skipCommands: true, allowDirty, write: false });
  return { ...result, ok: strict ? result.findings.length === 0 : true, strict };
}

export async function finishTransaction({ root, transactionDir, allowDirty = false }) {
  const tx = await load(transactionDir);
  assertCleanWorktree(root, transactionDir, { allowDirty, command: 'finish' });
  const evaluated = await verifyTransactionDirectory(transactionDir, { root, phase: 'evaluated' });
  if (!evaluated.ok) throw new Error(`cannot finish invalid evaluated transaction: ${evaluated.errors.join('; ')}`);
  const ledger = await readJson(resolve(transactionDir, 'evidence-ledger.json'));
  const exp = nextExperiment(tx.experiment, 'finished', { predictions: tx.experiment.payload.predictions, outcomes: tx.experiment.payload.outcomes });
  await writeJson(resolve(transactionDir, N.experiment), exp);
  const final = artifactEnvelope('experiment.transaction.v1', gitHead(root), {
    task_id: tx.capsule.payload.task_id,
    status: 'finished',
    base_sha: tx.capsule.payload.base_sha,
    final_sha: gitHead(root),
    capsule_digest: tx.capsule.content_digest,
    plan_admission_digest: (await readJson(resolve(transactionDir, 'plan-admission.json'))).content_digest,
    evidence_ledger_digest: ledger.content_digest,
    experiment_digest: exp.content_digest,
    certificate_digest: tx.claim.content_digest,
    correspondence_digest: tx.correspondence.content_digest,
    maximum_evidence_class: ledger.payload.maximum_evidence_class,
    external_blockers: ledger.payload.external_blockers,
    external_acceptance: ledger.payload.external_acceptance,
    worktree_dirty: { allowed: allowDirty },
    outcome_calibration: exp.payload.outcomes
  }, { generator: 'decision/engine/repoctl.mjs finish' });
  await writeJson(resolve(transactionDir, 'transaction.json'), final);
  const verification = await verifyTransactionDirectory(transactionDir, { root, phase: 'finished' });
  if (!verification.ok) throw new Error(`final transaction failed verification: ${verification.errors.join('; ')}`);
  await writeText(resolve(transactionDir, 'HANDOFF.md'), `# Experiment handoff - ${tx.capsule.payload.task_id}\n\n- base: \`${tx.capsule.payload.base_sha}\`\n- final: \`${gitHead(root)}\`\n- maximum evidence class: \`${ledger.payload.maximum_evidence_class}\`\n- P1 certificate: ${tx.claim.payload.claim.statement}\n- P2 correspondence: ${tx.correspondence.payload.status}\n- external blockers: ${ledger.payload.external_blockers.join(', ')}\n\nThe machine artifacts and small verifiers are canonical for this transaction.\n`);
  return { ok: true, task_id: tx.capsule.payload.task_id, transaction_digest: final.content_digest, maximum_evidence_class: ledger.payload.maximum_evidence_class };
}

async function query(dir, q, o) {
  const tx = await load(dir);
  const value = o.entity ?? o.path ?? o.hyperedge ?? o.claim ?? o.candidate ?? '';
  if (q === 'authority') {
    const t = String(value).toLowerCase();
    return { nodes: tx.authority.payload.nodes.filter((n) => JSON.stringify(n).toLowerCase().includes(t)), edges: tx.authority.payload.edges.filter((e) => JSON.stringify(e).toLowerCase().includes(t)) };
  }
  if (q === 'impact') {
    const id = String(value).startsWith('file:') ? String(value) : `file:${value}`;
    return { id, edges: tx.dependency.payload.edges.filter((e) => e.from === id || e.to === id), hyperedges: tx.hypergraph.payload.hyperedges.filter((e) => e.members.includes(id)), effects: tx.effects.payload.effects.filter((e) => e.from === id || e.to === id || e.origin === id) };
  }
  if (q === 'invariants') {
    const t = String(value);
    return tx.hypergraph.payload.hyperedges.filter((e) => e.id.includes(t) || e.members.some((m) => m.includes(t)));
  }
  if (q === 'proofs') {
    const id = String(value);
    return { hyperedge: tx.hypergraph.payload.hyperedges.find((e) => e.id === id) ?? null, correspondence: tx.correspondence.payload.mappings.find((m) => m.representation_id === id) ?? null, obligation: tx.capsule.payload.proof_obligations.find((i) => i.hyperedge_id === id) ?? null };
  }
  if (q === 'effects') {
    const depth = Math.min(4, Number(o.depth ?? 4));
    const t = String(value);
    return tx.effects.payload.effects.filter((e) => e.horizon <= depth && (!t || JSON.stringify(e).includes(t)));
  }
  if (q === 'evidence') {
    const ledger = resolve(dir, 'evidence-ledger.json');
    return { claim: JSON.stringify(tx.claim).includes(String(value)) ? tx.claim : null, ledger: await fileExists(ledger) ? await readJson(ledger) : null };
  }
  throw new Error(`unknown query: ${q}`);
}

async function doctor() {
  const registry = await readJson(REGISTRY_PATH);
  const errors = [];
  const ids = new Set();
  for (const d of registry.dialects ?? []) {
    if (ids.has(d.id)) errors.push(`duplicate_dialect:${d.id}`);
    ids.add(d.id);
    if (d.status === 'implemented') {
      if (!d.generator) errors.push(`implemented_generator_missing:${d.id}`);
      else if (!(await fileExists(resolve(ENGINE_DIR, d.generator)))) errors.push(`generator_not_found:${d.id}:${d.generator}`);
      if (!d.verifier) errors.push(`implemented_verifier_missing:${d.id}`);
      else if (!(await fileExists(resolve(ENGINE_DIR, d.verifier)))) errors.push(`verifier_not_found:${d.id}:${d.verifier}`);
    }
  }
  for (const id of [...registry.selector.always_on, ...registry.selector.specialized_default]) if (!ids.has(id)) errors.push(`selector_unknown_dialect:${id}`);
  for (const schema of ['repository-facts', 'task-capsule', 'claim-certificate', 'correspondence', 'experiment', 'evidence-ledger']) if (!(await fileExists(resolve(ENGINE_DIR, 'schemas', `${schema}.schema.json`)))) errors.push(`schema_missing:${schema}`);
  if (!ids.has('external.acceptance.v1')) errors.push('external_acceptance_dialect_missing');
  return { ok: errors.length === 0, errors, engine_version: ENGINE_VERSION, implemented_dialects: registry.dialects.filter((i) => i.status === 'implemented').map((i) => i.id) };
}

async function selfTest() {
  const root = await mkdtemp(resolve(tmpdir(), 'amtech-experiment-engine-'));
  try {
    await mkdir(resolve(root, 'src'), { recursive: true });
    await mkdir(resolve(root, 'tests'), { recursive: true });
    await mkdir(resolve(root, 'decision'), { recursive: true });
    await writeFile(resolve(root, 'src/b.mjs'), 'export const value = 1;\n');
    await writeFile(resolve(root, 'src/a.mjs'), "import { value } from './b.mjs';\nexport function readValue(){ return value; }\n");
    await writeFile(resolve(root, 'tests/a.test.mjs'), "import { readValue } from '../src/a.mjs';\nif (readValue() !== 1) process.exit(1);\n");
    await writeFile(resolve(root, 'AGENTS.md'), '# AGENTS\nRead `CODEGRAPH.md` and `decision/active.json`.\n');
    await writeFile(resolve(root, 'CODEGRAPH.md'), '# CODEGRAPH\nCurrent authority.\n');
    await writeFile(resolve(root, 'decision/active.json'), '{"status":"active"}\n');
    await writeFile(resolve(root, 'authority-map.json'), JSON.stringify({ exact_status: { owner: 'CODEGRAPH.md' }, agent_entry: ['AGENTS.md'], decision: { router: 'decision/active.json' }, historical: [] }, null, 2));
    await writeFile(resolve(root, 'package.json'), JSON.stringify({ type: 'module', scripts: { test: 'node tests/a.test.mjs' } }, null, 2));
    execFileSync('git', ['-C', root, 'init', '-q']);
    execFileSync('git', ['-C', root, 'config', 'user.email', 'selftest@example.com']);
    execFileSync('git', ['-C', root, 'config', 'user.name', 'Self Test']);
    execFileSync('git', ['-C', root, 'add', '.']);
    execFileSync('git', ['-C', root, 'commit', '-qm', 'fixture']);
    const task = { task_id: 'SELFTEST-ENGINE', goal: 'Change src/a.mjs while preserving imports, tests, and authority routing', paths: ['src/a.mjs'], maximum_patch: { maximum_files: 2, allowed_paths: ['src/a.mjs'] } };
    const dir = resolve(root, 'decision/transactions/SELFTEST-ENGINE');
    const started = await startTransaction({ root, task, out: dir });
    const hypergraph = await readJson(resolve(dir, 'invariant-hypergraph.json'));
    const touched = (hypergraph.payload.hyperedges ?? [])
      .filter((edge) => edge.hard && edge.members.includes('file:src/a.mjs'))
      .map((edge) => ({ hyperedge_id: edge.id, status: 'accepted', evidence: [{ kind: 'command', argv: ['node', 'tests/a.test.mjs'] }] }));
    const planPath = resolve(dir, 'plan.json');
    const plan = { selected_candidates: ['SELFTEST-C1'], maximum_patch: { maximum_files: 2, allowed_paths: ['src/a.mjs'] }, proof_obligations: touched, verification: { commands: [{ argv: ['node', 'tests/a.test.mjs'] }] }, __path: planPath };
    await writeJson(planPath, { ...plan, __path: undefined });
    const admitted = await admitPlan({ root, transactionDir: dir, plan });
    await writeFile(resolve(root, 'src/a.mjs'), "import { value } from './b.mjs';\nexport function readValue(){ return Number(value); }\n");
    execFileSync('git', ['-C', root, 'add', 'src/a.mjs']);
    execFileSync('git', ['-C', root, 'commit', '-qm', 'candidate']);
    const checked = await checkTransaction({ root, transactionDir: dir, strict: true });
    const evaluated = await evaluateTransaction({ root, transactionDir: dir });
    const finished = await finishTransaction({ root, transactionDir: dir });
    const verified = await verifyTransactionDirectory(dir, { root, phase: 'finished' });
    return { ok: started.ok && admitted.ok && checked.ok && evaluated.ok && finished.ok && verified.ok, started, admitted, checked, evaluated, finished, verified };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function main() {
  const { positionals, options } = parseCli(process.argv.slice(2));
  const command = positionals[0];
  if (!command || ['help', '--help', '-h'].includes(command)) {
    console.log(`repoctl ${ENGINE_VERSION}\n\nCommands:\n  start --task task.json [--out path] [--allow-dirty]\n  admit-plan --transaction path --plan plan.json\n  check --transaction path [--strict] [--allow-dirty]\n  evaluate --transaction path [--outcomes outcomes.json] [--overrides overrides.json] [--allow-dirty] [--skip-commands]\n  finish --transaction path [--allow-dirty]\n  verify --transaction path [--phase start|admitted|evaluated|finished]\n  query <authority|impact|invariants|proofs|effects|evidence> --transaction path [selector]\n  doctor\n  self-test`);
    return;
  }
  const root = rootOf(options);
  let result;
  if (command === 'start') {
    const task = await readJson(resolve(root, required(options, 'task')));
    result = await startTransaction({ root, task, out: txPath(root, options, task.task_id ?? `TASK-${Date.now()}`), allowDirty: Boolean(options['allow-dirty']) });
  } else if (command === 'admit-plan') {
    const path = resolve(root, required(options, 'plan'));
    result = await admitPlan({ root, transactionDir: txPath(root, options, 'unused'), plan: { ...(await readJson(path)), __path: path } });
  } else if (command === 'check') {
    result = await checkTransaction({ root, transactionDir: txPath(root, options, 'unused'), strict: Boolean(options.strict), allowDirty: Boolean(options['allow-dirty']) });
  } else if (command === 'evaluate') {
    result = await evaluateTransaction({ root, transactionDir: txPath(root, options, 'unused'), outcomes: options.outcomes ? await readJson(resolve(root, String(options.outcomes))) : [], overrides: options.overrides ? await readJson(resolve(root, String(options.overrides))) : null, allowDirty: Boolean(options['allow-dirty']), skipCommands: Boolean(options['skip-commands']) });
  } else if (command === 'finish') {
    result = await finishTransaction({ root, transactionDir: txPath(root, options, 'unused'), allowDirty: Boolean(options['allow-dirty']) });
  } else if (command === 'verify') {
    result = await verifyTransactionDirectory(txPath(root, options, 'unused'), { root, phase: String(options.phase ?? 'auto') });
  } else if (command === 'query') {
    result = await query(txPath(root, options, 'unused'), positionals[1], options);
  } else if (command === 'doctor') {
    result = await doctor();
  } else if (command === 'self-test') {
    result = await selfTest();
  } else {
    throw new Error(`unknown command: ${command}`);
  }
  console.log(stableStringify(result));
  if (result?.ok === false) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message, stack: error.stack }, null, 2));
  process.exitCode = 1;
});
