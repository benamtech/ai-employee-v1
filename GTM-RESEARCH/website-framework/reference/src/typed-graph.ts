import { sha256 } from "./core.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export type GraphEdgeType = "broader" | "narrower" | "prerequisite" | "next-workflow-step" | "integration-dependency" | "proof-control" | "comparison-alternative" | "live-task" | "start-free" | "managed-service";
export interface TypedGraphEdge { id: string; fromPageId: string; toPageId: string; type: GraphEdgeType; rationale: string; sourceIds: readonly string[]; eligibility: readonly string[]; priority: number; }
export interface TypedPageGraph { pageIds: readonly string[]; edges: readonly TypedGraphEdge[]; outgoing: Readonly<Record<string, readonly string[]>>; incoming: Readonly<Record<string, readonly string[]>>; graphHash: string; validation: ValidationReport; }

export const GRAPH_VALIDATION: readonly ValidationAttribute[] = [
  { id: "graph.identity", feature: "Typed graph edge identity", workflowStep: "plan", algorithmChoice: "stable edge IDs and canonical ordering", userEffect: "navigation paths remain explainable and reviewable", developerEffect: "agents can diff graph changes independently of HTML", validationVector: ["unique IDs", "known pages", "stable graph hash"], passVector: ["source reorder preserves graph hash", "duplicate edges fail"], failVector: ["raw destination IDs only", "duplicate edge IDs", "self-loop without explicit allowance"], simplerBaseline: "untyped internal link array", severity: "hard" },
  { id: "graph.semantics", feature: "Semantic node paths", workflowStep: "plan", algorithmChoice: "bounded edge taxonomy with rationale and provenance", userEffect: "each next step follows the current question or completed task", developerEffect: "generation and UI agents know why a link exists and how to present it", validationVector: ["edge type", "rationale", "source IDs", "eligibility", "priority"], passVector: ["every edge has a recognized type", "rationale and source IDs present"], failVector: ["similarity alone publishes a link", "empty rationale", "unknown edge type"], simplerBaseline: "nearest-neighbor links", severity: "hard" },
  { id: "graph.path-utility", feature: "Prospect-path usefulness", workflowStep: "preview", algorithmChoice: "path checks over typed transitions", userEffect: "the site supports useful discovery without forced funneling", developerEffect: "orphan nodes and dead-end conversion paths are visible before publication", validationVector: ["orphan count", "conversion reachability", "cycles", "edge priority"], passVector: ["selected pages have at least one justified incoming or outgoing edge unless declared entry-only", "conversion nodes are reachable"], failVector: ["orphan page", "all links point to sales", "circular path with no informational progress"], simplerBaseline: "manual navigation review", severity: "soft" },
];

export function compileTypedGraph(pageIds: readonly string[], edges: readonly TypedGraphEdge[]): TypedPageGraph {
  const knownPages = new Set(pageIds);
  if (knownPages.size !== pageIds.length) throw new Error("duplicate page IDs in graph");
  const edgeIds = new Set<string>();
  const canonicalEdges = [...edges].map((edge) => {
    if (!edge.id.trim() || edgeIds.has(edge.id)) throw new Error(`invalid or duplicate graph edge ${edge.id}`);
    edgeIds.add(edge.id);
    if (!knownPages.has(edge.fromPageId) || !knownPages.has(edge.toPageId)) throw new Error(`graph edge ${edge.id} references unknown page`);
    if (edge.fromPageId === edge.toPageId) throw new Error(`graph edge ${edge.id} creates a self-loop`);
    if (!edge.rationale.trim() || edge.sourceIds.length === 0) throw new Error(`graph edge ${edge.id} requires rationale and source IDs`);
    if (!Number.isFinite(edge.priority) || edge.priority < 0) throw new Error(`graph edge ${edge.id} requires non-negative priority`);
    return { ...edge, sourceIds: [...new Set(edge.sourceIds)].sort(), eligibility: [...new Set(edge.eligibility)].sort() };
  }).sort(compareEdges);
  const outgoing: Record<string, string[]> = Object.fromEntries([...knownPages].sort().map((id) => [id, []]));
  const incoming: Record<string, string[]> = Object.fromEntries([...knownPages].sort().map((id) => [id, []]));
  for (const edge of canonicalEdges) { outgoing[edge.fromPageId].push(edge.id); incoming[edge.toPageId].push(edge.id); }
  for (const ids of Object.values(outgoing)) ids.sort();
  for (const ids of Object.values(incoming)) ids.sort();
  const orphanIds = [...knownPages].filter((id) => outgoing[id].length === 0 && incoming[id].length === 0).sort();
  const findings = [
    finding("graph.identity", "pass", `${canonicalEdges.length} unique typed edges compiled for ${knownPages.size} pages`),
    finding("graph.semantics", "pass", "all edges include type, rationale, provenance, eligibility, and priority"),
    finding("graph.path-utility", orphanIds.length === 0 ? "pass" : "pending", orphanIds.length === 0 ? "no orphan pages" : `orphan review required for ${orphanIds.join(",")}`),
  ];
  const canonical = { pageIds: [...knownPages].sort(), edges: canonicalEdges, outgoing, incoming };
  return { ...canonical, graphHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport("typed-page-graph", GRAPH_VALIDATION, findings) };
}

export function findTypedPaths(
  graph: TypedPageGraph,
  fromPageId: string,
  predicate: (pageId: string) => boolean,
  maximumDepth = 6,
): string[][] {
  if (!graph.pageIds.includes(fromPageId)) throw new Error(`unknown start page ${fromPageId}`);
  if (!Number.isInteger(maximumDepth) || maximumDepth < 0) throw new Error("maximumDepth must be a non-negative integer");
  const edgeById = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const queue: { pageId: string; path: string[] }[] = [{ pageId: fromPageId, path: [fromPageId] }];
  const output: string[][] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = current.path.length - 1;
    if (depth > maximumDepth) continue;
    if (depth > 0 && predicate(current.pageId)) output.push(current.path);
    if (depth === maximumDepth) continue;
    for (const edgeId of graph.outgoing[current.pageId] ?? []) {
      const edge = edgeById.get(edgeId);
      if (!edge || current.path.includes(edge.toPageId)) continue;
      queue.push({ pageId: edge.toPageId, path: [...current.path, edge.toPageId] });
    }
  }
  return output.sort((left, right) => left.length - right.length || left.join("\0").localeCompare(right.join("\0")));
}
function compareEdges(left: TypedGraphEdge, right: TypedGraphEdge): number { return left.fromPageId.localeCompare(right.fromPageId) || left.priority - right.priority || left.type.localeCompare(right.type) || left.toPageId.localeCompare(right.toPageId) || left.id.localeCompare(right.id); }
