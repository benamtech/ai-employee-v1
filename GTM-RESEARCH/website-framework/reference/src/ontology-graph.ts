import { sha256 } from "./core.js";
import { lexicalNeighbors } from "./sparse-lexical.js";
import type { ApprovedOntology, OntologyRelationType } from "./ontology-discovery.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export interface OntologyGraphPolicy {
  minimumLexicalCosine: number;
  minimumCooccurrenceJaccard: number;
  minimumPositiveEdgeWeight: number;
  minimumCore: number;
  lexicalNeighborLimit: number;
}

export interface OntologyGraphEdge {
  id: string;
  leftAttributeId: string;
  rightAttributeId: string;
  weight: number;
  channels: readonly ("explicit" | "cooccurrence" | "lexical")[];
  relationTypes: readonly OntologyRelationType[];
  evidenceIds: readonly string[];
  observationIds: readonly string[];
}

export interface OntologyConstraintEdge {
  fromAttributeId: string;
  toAttributeId: string;
  type: "requires" | "excludes";
  evidenceIds: readonly string[];
  relationId: string;
}

export interface OntologyCommunity {
  id: string;
  attributeIds: readonly string[];
  anchorIds: readonly string[];
  edgeCount: number;
  density: number;
}

export interface CompiledOntologyGraph {
  nodeIds: readonly string[];
  edges: readonly OntologyGraphEdge[];
  constraints: readonly OntologyConstraintEdge[];
  adjacency: Readonly<Record<string, readonly string[]>>;
  edgeWeights: Readonly<Record<string, number>>;
  coreNumbers: Readonly<Record<string, number>>;
  activeNodeIds: readonly string[];
  prunedNodeIds: readonly string[];
  communities: readonly OntologyCommunity[];
  graphHash: string;
  validation: ValidationReport;
}

export const ONTOLOGY_GRAPH_VALIDATION: readonly ValidationAttribute[] = [
  { id: "ontology-graph.channels", feature: "Sparse multi-channel ontology graph", workflowStep: "construct-space", algorithmChoice: "explicit relation + observation co-occurrence + TF-IDF lexical edges", userEffect: "the user can inspect why attributes are connected", developerEffect: "graph construction has deterministic non-embedding baselines", validationVector: ["edge channels", "weights", "stable pair identity", "evidence/observation provenance"], passVector: ["all positive edges have at least one channel", "source order preserves graph hash"], failVector: ["opaque learned edge only", "duplicate pair edges", "missing provenance"], simplerBaseline: "explicit relations only", severity: "hard" },
  { id: "ontology-graph.constraints", feature: "Hard relationship constraints", workflowStep: "construct-space", algorithmChoice: "separate requires/excludes relation plane", userEffect: "impossible or unsafe attribute combinations are removed before page planning", developerEffect: "positive similarity cannot override hard constraints", validationVector: ["requires", "excludes", "known endpoints", "evidence"], passVector: ["constraints remain separate from similarity score", "exclusions are checked symmetrically"], failVector: ["exclusion represented as a weak negative score", "unknown endpoint"], simplerBaseline: "similarity-only candidate generation", severity: "hard" },
  { id: "ontology-graph.pruning", feature: "Sparse graph pruning", workflowStep: "construct-space", algorithmChoice: "k-core decomposition with anchor retention", userEffect: "isolated agent inventions do not dominate the opportunity space", developerEffect: "the candidate generator operates on a bounded sparse graph", validationVector: ["core number", "minimum core", "anchor retention", "pruned node list"], passVector: ["low-core non-anchor nodes are explicit", "anchors survive", "no silent deletion"], failVector: ["all suggestions enter combinations", "anchor removed", "dense all-pairs graph"], simplerBaseline: "degree threshold", severity: "hard" },
  { id: "ontology-graph.communities", feature: "Deterministic macro-regions", workflowStep: "construct-space", algorithmChoice: "connected components over the pruned positive graph", userEffect: "the user sees broad coherent regions before detailed page coordinates", developerEffect: "community detection is deterministic and does not claim semantic optimality", validationVector: ["component membership", "anchors", "density", "stable IDs"], passVector: ["every active node belongs to one component", "community IDs stable"], failVector: ["Leiden modularity presented as semantic truth", "disconnected community", "random seed changes authority"], simplerBaseline: "one global graph", severity: "hard" },
];

export const DEFAULT_ONTOLOGY_GRAPH_POLICY: OntologyGraphPolicy = {
  minimumLexicalCosine: 0.22,
  minimumCooccurrenceJaccard: 0.08,
  minimumPositiveEdgeWeight: 0.08,
  minimumCore: 1,
  lexicalNeighborLimit: 16,
};

export function compileOntologyGraph(
  ontology: ApprovedOntology,
  policy: OntologyGraphPolicy = DEFAULT_ONTOLOGY_GRAPH_POLICY,
): CompiledOntologyGraph {
  validatePolicy(policy);
  const nodeIds = ontology.attributes.map((item) => item.id).sort();
  const nodeSet = new Set(nodeIds);
  const anchors = new Set(ontology.attributes.filter((item) => item.anchorKind).map((item) => item.id));
  const aggregate = new Map<string, MutableEdge>();
  const constraints: OntologyConstraintEdge[] = [];

  for (const relation of ontology.relations) {
    if (relation.type === "requires" || relation.type === "excludes") {
      constraints.push({ fromAttributeId: relation.fromAttributeId, toAttributeId: relation.toAttributeId, type: relation.type, evidenceIds: [...relation.evidenceIds], relationId: relation.id });
      continue;
    }
    addEdgeChannel(aggregate, relation.fromAttributeId, relation.toAttributeId, "explicit", relation.weight, relation.type, relation.evidenceIds, []);
  }

  const support = new Map<string, number>();
  const pairSupport = new Map<string, { weight: number; observationIds: string[] }>();
  for (const observation of ontology.observations) {
    for (const id of observation.attributeIds) support.set(id, (support.get(id) ?? 0) + observation.weight);
    for (let leftIndex = 0; leftIndex < observation.attributeIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < observation.attributeIds.length; rightIndex += 1) {
        const key = pairKey(observation.attributeIds[leftIndex], observation.attributeIds[rightIndex]);
        const current = pairSupport.get(key) ?? { weight: 0, observationIds: [] };
        current.weight += observation.weight;
        current.observationIds.push(observation.id);
        pairSupport.set(key, current);
      }
    }
  }
  for (const [key, pair] of pairSupport) {
    const [left, right] = splitPairKey(key);
    const denominator = (support.get(left) ?? 0) + (support.get(right) ?? 0) - pair.weight;
    const jaccard = denominator <= 0 ? 0 : pair.weight / denominator;
    if (jaccard >= policy.minimumCooccurrenceJaccard) addEdgeChannel(aggregate, left, right, "cooccurrence", jaccard, "cooccurs", [], pair.observationIds);
  }

  for (const nodeId of nodeIds) {
    for (const neighbor of lexicalNeighbors(ontology.lexicalIndex, nodeId, policy.lexicalNeighborLimit)) {
      if (neighbor.cosine < policy.minimumLexicalCosine) continue;
      addEdgeChannel(aggregate, nodeId, neighbor.documentId, "lexical", neighbor.cosine, "compatible", [], []);
    }
  }

  const edges = [...aggregate.values()].map(finalizeEdge)
    .filter((edge) => edge.weight >= policy.minimumPositiveEdgeWeight)
    .sort(compareEdges);
  const adjacencyMutable = new Map(nodeIds.map((id) => [id, [] as string[]]));
  const edgeWeights: Record<string, number> = {};
  for (const edge of edges) {
    adjacencyMutable.get(edge.leftAttributeId)!.push(edge.rightAttributeId);
    adjacencyMutable.get(edge.rightAttributeId)!.push(edge.leftAttributeId);
    edgeWeights[pairKey(edge.leftAttributeId, edge.rightAttributeId)] = edge.weight;
  }
  const adjacency = Object.fromEntries([...adjacencyMutable.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([id, neighbors]) => [id, [...new Set(neighbors)].sort()]));
  const coreNumbers = computeCoreNumbers(nodeIds, adjacency);
  const activeNodeIds = nodeIds.filter((id) => anchors.has(id) || (coreNumbers[id] ?? 0) >= policy.minimumCore);
  const activeSet = new Set(activeNodeIds);
  const prunedNodeIds = nodeIds.filter((id) => !activeSet.has(id));
  const communities = connectedCommunities(activeNodeIds, adjacency, edges, anchors);
  const findings = [
    finding("ontology-graph.channels", edges.every((edge) => edge.channels.length > 0) ? "pass" : "fail", `${edges.length} sparse positive edges compiled from explicit, co-occurrence, and lexical channels`),
    finding("ontology-graph.constraints", "pass", `${constraints.length} hard requires/excludes constraints compiled outside similarity scoring`),
    finding("ontology-graph.pruning", activeNodeIds.length > 0 && [...anchors].every((id) => activeSet.has(id)) ? "pass" : "fail", `active=${activeNodeIds.length}, pruned=${prunedNodeIds.length}, minimumCore=${policy.minimumCore}`),
    finding("ontology-graph.communities", communities.reduce((sum, community) => sum + community.attributeIds.length, 0) === activeNodeIds.length ? "pass" : "fail", `${communities.length} deterministic connected macro-regions`),
  ];
  const canonical = { nodeIds, edges, constraints: [...constraints].sort(compareConstraints), adjacency, edgeWeights: Object.fromEntries(Object.entries(edgeWeights).sort(([left], [right]) => left.localeCompare(right))), coreNumbers, activeNodeIds, prunedNodeIds, communities };
  return { ...canonical, graphHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`ontology-graph:${ontology.id}`, ONTOLOGY_GRAPH_VALIDATION, findings) };
}

export function graphEdgeWeight(graph: CompiledOntologyGraph, left: string, right: string): number {
  if (left === right) return 1;
  return graph.edgeWeights[pairKey(left, right)] ?? 0;
}

export function violatesOntologyConstraints(graph: CompiledOntologyGraph, attributeIds: readonly string[]): string[] {
  const set = new Set(attributeIds);
  const violations: string[] = [];
  for (const constraint of graph.constraints) {
    if (!set.has(constraint.fromAttributeId)) continue;
    if (constraint.type === "excludes" && set.has(constraint.toAttributeId)) violations.push(`excludes:${constraint.fromAttributeId}:${constraint.toAttributeId}`);
    if (constraint.type === "requires" && !set.has(constraint.toAttributeId)) violations.push(`requires:${constraint.fromAttributeId}:${constraint.toAttributeId}`);
    if (constraint.type === "excludes" && set.has(constraint.toAttributeId)) continue;
  }
  return [...new Set(violations)].sort();
}

type MutableEdge = {
  leftAttributeId: string;
  rightAttributeId: string;
  channelWeights: Map<string, number>;
  relationTypes: Set<OntologyRelationType>;
  evidenceIds: Set<string>;
  observationIds: Set<string>;
};

function addEdgeChannel(
  aggregate: Map<string, MutableEdge>,
  leftInput: string,
  rightInput: string,
  channel: "explicit" | "cooccurrence" | "lexical",
  weight: number,
  relationType: OntologyRelationType,
  evidenceIds: readonly string[],
  observationIds: readonly string[],
): void {
  if (leftInput === rightInput) return;
  const [leftAttributeId, rightAttributeId] = leftInput.localeCompare(rightInput) <= 0 ? [leftInput, rightInput] : [rightInput, leftInput];
  const key = pairKey(leftAttributeId, rightAttributeId);
  const current = aggregate.get(key) ?? { leftAttributeId, rightAttributeId, channelWeights: new Map(), relationTypes: new Set(), evidenceIds: new Set(), observationIds: new Set() };
  current.channelWeights.set(channel, Math.max(current.channelWeights.get(channel) ?? 0, weight));
  current.relationTypes.add(relationType);
  for (const id of evidenceIds) current.evidenceIds.add(id);
  for (const id of observationIds) current.observationIds.add(id);
  aggregate.set(key, current);
}
function finalizeEdge(edge: MutableEdge): OntologyGraphEdge {
  const channelWeights = [...edge.channelWeights.values()];
  const complementProduct = channelWeights.reduce((product, value) => product * (1 - Math.max(0, Math.min(1, value))), 1);
  return {
    id: `ontology-edge:${sha256(`${edge.leftAttributeId}\0${edge.rightAttributeId}`).slice(0, 16)}`,
    leftAttributeId: edge.leftAttributeId,
    rightAttributeId: edge.rightAttributeId,
    weight: 1 - complementProduct,
    channels: [...edge.channelWeights.keys()].sort() as OntologyGraphEdge["channels"],
    relationTypes: [...edge.relationTypes].sort(),
    evidenceIds: [...edge.evidenceIds].sort(),
    observationIds: [...edge.observationIds].sort(),
  };
}
function computeCoreNumbers(nodeIds: readonly string[], adjacency: Readonly<Record<string, readonly string[]>>): Record<string, number> {
  const degree = new Map(nodeIds.map((id) => [id, adjacency[id]?.length ?? 0]));
  const remaining = new Set(nodeIds);
  const core: Record<string, number> = {};
  let level = 0;
  while (remaining.size > 0) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of [...remaining].sort()) {
        if ((degree.get(id) ?? 0) > level) continue;
        remaining.delete(id);
        core[id] = level;
        for (const neighbor of adjacency[id] ?? []) if (remaining.has(neighbor)) degree.set(neighbor, Math.max(0, (degree.get(neighbor) ?? 0) - 1));
        changed = true;
      }
    }
    if (remaining.size > 0) level += 1;
  }
  return Object.fromEntries(Object.entries(core).sort(([left], [right]) => left.localeCompare(right)));
}
function connectedCommunities(
  activeNodeIds: readonly string[],
  adjacency: Readonly<Record<string, readonly string[]>>,
  edges: readonly OntologyGraphEdge[],
  anchors: ReadonlySet<string>,
): OntologyCommunity[] {
  const active = new Set(activeNodeIds);
  const visited = new Set<string>();
  const communities: OntologyCommunity[] = [];
  for (const start of [...activeNodeIds].sort()) {
    if (visited.has(start)) continue;
    const queue = [start];
    const members: string[] = [];
    visited.add(start);
    while (queue.length > 0) {
      const current = queue.shift()!;
      members.push(current);
      for (const neighbor of adjacency[current] ?? []) {
        if (!active.has(neighbor) || visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    members.sort();
    const memberSet = new Set(members);
    const edgeCount = edges.filter((edge) => memberSet.has(edge.leftAttributeId) && memberSet.has(edge.rightAttributeId)).length;
    const maximumEdges = members.length < 2 ? 1 : members.length * (members.length - 1) / 2;
    communities.push({ id: `community:${sha256(members.join("\0")).slice(0, 16)}`, attributeIds: members, anchorIds: members.filter((id) => anchors.has(id)), edgeCount, density: edgeCount / maximumEdges });
  }
  return communities.sort((left, right) => left.id.localeCompare(right.id));
}
function validatePolicy(policy: OntologyGraphPolicy): void {
  for (const value of [policy.minimumLexicalCosine, policy.minimumCooccurrenceJaccard, policy.minimumPositiveEdgeWeight]) if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error("ontology graph thresholds must be within [0,1]");
  if (!Number.isInteger(policy.minimumCore) || policy.minimumCore < 0 || !Number.isInteger(policy.lexicalNeighborLimit) || policy.lexicalNeighborLimit < 1) throw new Error("ontology graph integer policy is invalid");
}
function pairKey(left: string, right: string): string { return left.localeCompare(right) <= 0 ? `${left}\0${right}` : `${right}\0${left}`; }
function splitPairKey(key: string): [string, string] { const index = key.indexOf("\0"); return [key.slice(0, index), key.slice(index + 1)]; }
function compareEdges(left: OntologyGraphEdge, right: OntologyGraphEdge): number { return left.leftAttributeId.localeCompare(right.leftAttributeId) || left.rightAttributeId.localeCompare(right.rightAttributeId); }
function compareConstraints(left: OntologyConstraintEdge, right: OntologyConstraintEdge): number { return left.fromAttributeId.localeCompare(right.fromAttributeId) || left.type.localeCompare(right.type) || left.toAttributeId.localeCompare(right.toAttributeId) || left.relationId.localeCompare(right.relationId); }
