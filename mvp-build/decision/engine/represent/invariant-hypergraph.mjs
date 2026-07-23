import { artifactEnvelope, digestObject, uniqueSorted } from '../lib/core.mjs';
function edgeId(kind, anchor, members) { return `hyperedge:${kind}:${anchor}:${digestObject(members).slice('sha256:'.length, 'sha256:'.length + 12)}`; }
function relationIndex(relations) {
  const byFrom = new Map(); const byTo = new Map();
  for (const relation of relations) { if (!byFrom.has(relation.from)) byFrom.set(relation.from, []); if (!byTo.has(relation.to)) byTo.set(relation.to, []); byFrom.get(relation.from).push(relation); byTo.get(relation.to).push(relation); }
  return { byFrom, byTo };
}
export function buildInvariantHypergraph(facts, dependencyGraph, authorityDag) {
  const graphNodes = dependencyGraph?.payload?.nodes ?? [];
  const vertices = graphNodes.map((node) => ({ id: node.id, kind: node.kind ?? 'unknown', path: node.path ?? null, source_fact: node.path ? `file:${node.path}` : node.id }));
  const vertexIds = new Set(vertices.map((vertex) => vertex.id));
  const relations = facts?.payload?.relations ?? [];
  const { byFrom, byTo } = relationIndex(relations);
  const hyperedges = [];
  for (const file of facts?.payload?.files ?? []) {
    const anchor = file.id;
    const related = [...(byFrom.get(anchor) ?? []).filter((relation)=>['Imports','Defines','ExecutedBy','References','CurrentAuthority'].includes(relation.type)), ...(byTo.get(anchor) ?? []).filter((relation)=>['VerifiedBy','ExecutedBy','References','CurrentAuthority'].includes(relation.type))];
    const members = uniqueSorted([anchor, ...related.flatMap((relation)=>[relation.from, relation.to])]).filter((member)=>vertexIds.has(member));
    if (members.length < 3) continue;
    const types = uniqueSorted(related.map((relation)=>relation.type));
    const hasProof = types.includes('VerifiedBy') || types.includes('ExecutedBy');
    const hasAuthority = types.includes('CurrentAuthority');
    const kind = hasAuthority ? 'authority-obligation' : hasProof ? 'behavioral-obligation' : 'dependency-obligation';
    hyperedges.push({ id: edgeId(kind, anchor, members), kind, anchor, members, weight: hasAuthority ? 3 : hasProof ? 2 : 1, hard: hasAuthority || hasProof, relation_types: types, relation_ids: uniqueSorted(related.map((relation)=>relation.id)), semantics: hasAuthority ? 'the routed authority, referenced source, and verification/execution surfaces form one joint consistency obligation' : hasProof ? 'the source, its dependencies, and its tests or execution surfaces must remain coherent together' : 'the source and its related dependencies form a task-impact obligation', proof_status: hasProof ? 'planned_or_present_not_accepted_for_current_change' : 'representation_only' });
  }
  const authorityMembers = uniqueSorted((authorityDag?.payload?.nodes ?? []).filter((node)=>node.kind !== 'evidence_class').map((node)=>node.id).filter((member)=>vertexIds.has(member)));
  if (authorityMembers.length >= 3) hyperedges.push({ id: edgeId('authority-routing','authority-map',authorityMembers), kind: 'authority-routing', anchor: 'file:mvp-build/authority-map.json', members: authorityMembers, weight: 4, hard: true, relation_types: ['CurrentAuthority','References'], relation_ids: uniqueSorted((authorityDag?.payload?.edges ?? []).filter((edge)=>['CurrentAuthority','References'].includes(edge.type)).map((edge)=>edge.id)), semantics: 'all active authority routers and targets must remain mutually consistent as one many-way obligation', proof_status: authorityDag?.payload?.cycles?.length ? 'failed_cycle' : 'model_verified_pending_exact_software_evidence' });
  const deduped = [...new Map(hyperedges.map((edge)=>[edge.id,edge])).values()].sort((a,b)=>a.id.localeCompare(b.id));
  const usedVertices = new Set(deduped.flatMap((edge)=>edge.members));
  const payload = { vertices: vertices.filter((vertex)=>usedVertices.has(vertex.id)).sort((a,b)=>a.id.localeCompare(b.id)), hyperedges: deduped, facts_digest: facts.content_digest, dependency_graph_digest: dependencyGraph.content_digest, authority_dag_digest: authorityDag.content_digest, coverage_definitions: { touch: 'weighted fraction of hyperedges with at least one represented member', fractional: 'weighted mean represented-member fraction', complete: 'weighted fraction with every declared member represented', proved: 'weighted fraction complete and backed by accepted independent evidence for the exact candidate' }, weight_rule: { authority_routing: 4, authority_obligation: 3, behavioral_obligation: 2, dependency_obligation: 1 }, fidelity: { class: 'P2', status: 'membership_generated_from_fact_relations', facts_digest: facts.content_digest } };
  return artifactEnvelope('invariant.hypergraph.v1', facts.source_sha, payload, { generator: 'decision/engine/represent/invariant-hypergraph.mjs', input_digests: [facts.content_digest, dependencyGraph.content_digest, authorityDag.content_digest], membership_rule: 'anchor plus observed import/definition/execution/test/authority relations; minimum cardinality three' });
}
export function buildCorrespondence(facts, dependencyGraph, authorityDag, hypergraph) {
  const factEntities = new Set([...(facts?.payload?.files ?? []).map((file)=>file.id), ...(facts?.payload?.entities ?? []).map((entity)=>entity.id)]);
  for (const relation of facts?.payload?.relations ?? []) { factEntities.add(relation.from); factEntities.add(relation.to); }
  const relationIds = new Set((facts?.payload?.relations ?? []).map((relation)=>relation.id));
  const mappings = []; const errors = [];
  for (const edge of hypergraph?.payload?.hyperedges ?? []) {
    const missingMembers = edge.members.filter((member)=>!factEntities.has(member));
    const missingRelations = edge.relation_ids.filter((id)=>!relationIds.has(id) && !(authorityDag?.payload?.edges ?? []).some((item)=>item.id===id));
    if (missingMembers.length) errors.push({ edge: edge.id, type: 'missing_members', values: missingMembers });
    if (missingRelations.length) errors.push({ edge: edge.id, type: 'missing_relations', values: missingRelations });
    mappings.push({ representation_id: edge.id, source_fact_ids: uniqueSorted([...edge.members, ...edge.relation_ids]), membership_complete: missingMembers.length === 0 && missingRelations.length === 0, mapping_rule: 'hyperedge members and relation provenance must resolve to extracted repository facts' });
  }
  const payload = { class: 'P2', status: errors.length === 0 ? 'verified_membership_parity' : 'failed', representation_schema: hypergraph.schema, representation_digest: hypergraph.content_digest, source_schema: facts.schema, source_digest: facts.content_digest, auxiliary_digests: [dependencyGraph.content_digest, authorityDag.content_digest], mappings, errors, does_not_claim: ['semantic completeness of every repository invariant','runtime correctness','causal engineering benefit','external acceptance'] };
  return artifactEnvelope('correspondence.v1', facts.source_sha, payload, { generator: 'decision/engine/represent/invariant-hypergraph.mjs#buildCorrespondence', verifier: 'decision/engine/verify/verify-correspondence.mjs' });
}
