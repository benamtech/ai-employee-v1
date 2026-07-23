import { artifactEnvelope, uniqueSorted } from '../lib/core.mjs';
const RELATION_TYPES = new Set(['Imports','Defines','ExecutedBy','VerifiedBy','References','CurrentAuthority']);
export function buildDependencyGraph(facts) {
  const fileNodes = (facts?.payload?.files ?? []).map((file) => ({ id: file.id, kind: 'file', path: file.path, digest: file.digest, language: file.language, file_kind: file.kind }));
  const entityNodes = (facts?.payload?.entities ?? []).map((entity) => ({ ...entity }));
  const nodes = [...fileNodes, ...entityNodes];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = [];
  for (const relation of facts?.payload?.relations ?? []) {
    if (!RELATION_TYPES.has(relation.type)) continue;
    if (!nodeIds.has(relation.from)) nodes.push({ id: relation.from, kind: relation.from.split(':', 1)[0], external: true });
    if (!nodeIds.has(relation.to)) nodes.push({ id: relation.to, kind: relation.to.split(':', 1)[0], external: true });
    nodeIds.add(relation.from); nodeIds.add(relation.to);
    edges.push({ id: relation.id, type: relation.type, from: relation.from, to: relation.to, evidence: relation.evidence, confidence: relation.confidence });
  }
  const reverse = new Map();
  for (const edge of edges) { if (!reverse.has(edge.to)) reverse.set(edge.to, []); reverse.get(edge.to).push(edge.from); }
  const metrics = nodes.map((node) => ({ id: node.id, out_degree: edges.filter((edge) => edge.from === node.id).length, in_degree: reverse.get(node.id)?.length ?? 0 }));
  const payload = { nodes: nodes.sort((a,b)=>a.id.localeCompare(b.id)), edges: edges.sort((a,b)=>a.id.localeCompare(b.id)), metrics, relation_types: uniqueSorted(edges.map((edge)=>edge.type)), facts_digest: facts.content_digest, fidelity: { class: 'P2', status: 'generated_from_observed_relations', facts_digest: facts.content_digest } };
  return artifactEnvelope('dependency.graph.v1', facts.source_sha, payload, { generator: 'decision/engine/represent/dependency-graph.mjs', input_digest: facts.content_digest, relation_types: [...RELATION_TYPES].sort() });
}
