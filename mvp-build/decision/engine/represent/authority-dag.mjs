import { artifactEnvelope, uniqueSorted } from '../lib/core.mjs';

const PRIORITY = ['deployed_release_proof','applied_durable_state','committed_source_and_configuration','exact_candidate_executable_evidence','ratified_standard_and_active_program','current_topology_and_architecture','indexed_memory','historical_records'];
function classify(path, facts) {
  if (facts?.payload?.authorities?.historical?.some((item) => path.startsWith(item.path.replace(/\/$/, '')))) return 'historical_records';
  if (/memory\//.test(path)) return 'indexed_memory';
  if (/CODEGRAPH\.md$|docs\/architecture/.test(path)) return 'current_topology_and_architecture';
  if (/STANDARD|production-readiness-program/.test(path)) return 'ratified_standard_and_active_program';
  if (/\.github\/workflows|validation|proof|evidence/.test(path)) return 'exact_candidate_executable_evidence';
  if (/migrations|packages\/db/.test(path)) return 'applied_durable_state';
  return 'committed_source_and_configuration';
}
export function buildAuthorityDag(facts) {
  const nodes = [];
  const edges = [];
  const currentTargets = new Set((facts?.payload?.authorities?.current ?? []).map((item) => item.path));
  for (const file of facts?.payload?.files ?? []) {
    if (!currentTargets.has(file.path) && !/(?:^|\/)(?:AGENTS|CODEGRAPH|STANDARD|README)\.md$/.test(file.path) && !/authority-map\.json$|decision\/active\.json$|production-readiness-program/.test(file.path)) continue;
    nodes.push({ id: file.id, path: file.path, evidence_class: classify(file.path, facts), digest: file.digest });
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const relation of facts?.payload?.relations ?? []) {
    if (!['CurrentAuthority','References'].includes(relation.type)) continue;
    if (!nodeIds.has(relation.from) || !nodeIds.has(relation.to)) continue;
    edges.push({ id: relation.id, type: relation.type, from: relation.from, to: relation.to, evidence: relation.evidence });
  }
  const classNodes = PRIORITY.map((name, index) => ({ id: `evidence-class:${name}`, name, index, kind: 'evidence_class' }));
  for (let index = 0; index < classNodes.length - 1; index += 1) edges.push({ id: `class-order:${index}`, type: 'HigherAuthorityThan', from: classNodes[index].id, to: classNodes[index + 1].id, evidence: { path: 'mvp-build/authority-map.json', pointer: '/evidence_order' } });
  for (const node of nodes) edges.push({ id: `classified:${node.id}`, type: 'ClassifiedAs', from: node.id, to: `evidence-class:${node.evidence_class}`, evidence: { path: node.path, digest: node.digest } });
  const adjacency = new Map();
  for (const edge of edges.filter((edge) => ['CurrentAuthority','References'].includes(edge.type))) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.to);
  }
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(node, stack) {
    if (visiting.has(node)) { cycles.push([...stack, node]); return; }
    if (visited.has(node)) return;
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) visit(next, [...stack, node]);
    visiting.delete(node); visited.add(node);
  }
  for (const node of nodeIds) visit(node, []);
  const payload = { nodes: [...classNodes, ...nodes].sort((a,b)=>a.id.localeCompare(b.id)), edges: edges.sort((a,b)=>a.id.localeCompare(b.id)), evidence_order: PRIORITY, cycles, current_authority_paths: uniqueSorted([...currentTargets]), facts_digest: facts.content_digest, fidelity: { class: 'P2', status: cycles.length === 0 ? 'verified_membership' : 'failed', facts_digest: facts.content_digest } };
  return artifactEnvelope('authority.dag.v1', facts.source_sha, payload, { generator: 'decision/engine/represent/authority-dag.mjs', input_digest: facts.content_digest, algorithm: 'explicit authority-map membership plus observed document references' });
}
