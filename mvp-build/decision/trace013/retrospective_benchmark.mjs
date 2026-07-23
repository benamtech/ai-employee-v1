#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeTaskDiffusion } from '../engine/analyze/task-diffusion.mjs';
import { tokenize } from '../engine/lib/core.mjs';
import { extractRepositoryFacts } from '../engine/extract/repository-facts.mjs';
import { buildAuthorityDag } from '../engine/represent/authority-dag.mjs';
import { buildDependencyGraph } from '../engine/represent/dependency-graph.mjs';
import { buildInvariantHypergraph } from '../engine/represent/invariant-hypergraph.mjs';

const traceRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(traceRoot, '../..');
const cases = JSON.parse(await readFile(resolve(traceRoot, 'retrospective_cases.json'), 'utf8'));
const topK = Number(cases.top_k ?? 80);
const facts = await extractRepositoryFacts({ root: repoRoot });
const authority = buildAuthorityDag(facts);
const dependency = buildDependencyGraph(facts);
const hypergraph = buildInvariantHypergraph(facts, dependency, authority);
const filePaths = facts.payload.files.map((file) => file.path);

function recall(expected, selected) {
  if (!expected.length) return 1;
  const set = new Set(selected);
  return expected.filter((path) => set.has(path)).length / expected.length;
}
function precision(expected, selected) {
  if (!selected.length) return 1;
  const expectedSet = new Set(expected);
  return selected.filter((path) => expectedSet.has(path)).length / selected.length;
}
function lexicalRank(testCase) {
  const tokens = tokenize(`${testCase.goal} ${(testCase.task_seeds ?? []).join(' ')}`);
  return filePaths
    .map((path) => ({
      path,
      score: tokens.reduce((sum, token) => sum + (path.toLowerCase().includes(token) ? 1 : 0), 0)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, topK)
    .map((item) => item.path);
}

const results = [];
for (const testCase of cases.cases) {
  const expected = [...testCase.expected_source_paths, ...testCase.expected_test_paths];
  const diffusion = computeTaskDiffusion({
    task_id: `RETRO-${testCase.id}`,
    goal: testCase.goal,
    task_seeds: testCase.task_seeds,
    paths: []
  }, dependency, hypergraph, { context_limit: topK });
  const treatmentPaths = diffusion.payload.mandatory_context.slice(0, topK).map((item) => item.path);
  const baselinePaths = lexicalRank(testCase);
  const treatment = {
    changed_file_recall: recall(testCase.expected_source_paths, treatmentPaths),
    required_test_recall: recall(testCase.expected_test_paths, treatmentPaths),
    total_recall: recall(expected, treatmentPaths),
    context_precision: precision(expected, treatmentPaths),
    context_count: treatmentPaths.length
  };
  const baseline = {
    changed_file_recall: recall(testCase.expected_source_paths, baselinePaths),
    required_test_recall: recall(testCase.expected_test_paths, baselinePaths),
    total_recall: recall(expected, baselinePaths),
    context_precision: precision(expected, baselinePaths),
    context_count: baselinePaths.length
  };
  const expectedVertices = new Set(expected.map((path) => `file:${path}`));
  const relevantHyperedges = hypergraph.payload.hyperedges.filter((edge) => edge.members.some((member) => expectedVertices.has(member)));
  results.push({
    id: testCase.id,
    expected_paths: expected,
    treatment,
    lexical_baseline: baseline,
    delta: {
      changed_file_recall: treatment.changed_file_recall - baseline.changed_file_recall,
      required_test_recall: treatment.required_test_recall - baseline.required_test_recall,
      total_recall: treatment.total_recall - baseline.total_recall,
      context_precision: treatment.context_precision - baseline.context_precision
    },
    relevant_hyperedges: relevantHyperedges.map((edge) => edge.id),
    top_treatment_paths: treatmentPaths.slice(0, 20),
    top_baseline_paths: baselinePaths.slice(0, 20)
  });
}

function mean(key, arm) {
  return results.reduce((sum, result) => sum + result[arm][key], 0) / results.length;
}
const summary = {
  cases: results.length,
  top_k: topK,
  treatment: {
    changed_file_recall: mean('changed_file_recall', 'treatment'),
    required_test_recall: mean('required_test_recall', 'treatment'),
    total_recall: mean('total_recall', 'treatment'),
    context_precision: mean('context_precision', 'treatment')
  },
  lexical_baseline: {
    changed_file_recall: mean('changed_file_recall', 'lexical_baseline'),
    required_test_recall: mean('required_test_recall', 'lexical_baseline'),
    total_recall: mean('total_recall', 'lexical_baseline'),
    context_precision: mean('context_precision', 'lexical_baseline')
  }
};
summary.delta = Object.fromEntries(Object.keys(summary.treatment).map((key) => [key, summary.treatment[key] - summary.lexical_baseline[key]]));
const report = {
  schema: 'trace013.retrospective-benchmark.v1',
  exact_source_sha: facts.source_sha,
  facts_digest: facts.content_digest,
  dependency_graph_digest: dependency.content_digest,
  invariant_hypergraph_digest: hypergraph.content_digest,
  methodology: {
    treatment: 'task-local dependency-graph plus invariant-hypergraph diffusion without explicit implementation paths',
    control: 'lexical token matching over tracked repository paths',
    historical_cases: 'Trace007 through Trace012 expected source and test surfaces',
    limitation: 'retrospective expected-path labels are hand-curated from completed traces; this is retrieval evaluation, not causal engineering evidence'
  },
  summary,
  results,
  classification: {
    artifact_integrity: 'P3 when executed by exact-head CI',
    representation_usefulness: summary.delta.total_recall > 0 ? 'retrospectively_supportive' : summary.delta.total_recall === 0 ? 'no_measured_recall_advantage' : 'retrospectively_negative_on_total_recall',
    causal_engineering_improvement: 'unestablished; requires prospective matched tasks and independent outcomes'
  }
};
if (process.argv.includes('--write')) {
  await writeFile(resolve(traceRoot, 'retrospective_benchmark.generated.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (results.length !== 6 || !Object.values(summary.treatment).every(Number.isFinite) || !Object.values(summary.lexical_baseline).every(Number.isFinite)) {
  throw new Error('retrospective benchmark failed structural validity');
}
console.log(JSON.stringify(report, null, 2));
