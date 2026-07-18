import { hash32, sha256 } from "./core.js";
import type { HyperVectorPageIR, CompiledFrameworkManifest } from "./manifest.js";
import type { AgenticUiStandard } from "./amtech-design-system.js";

export type ThreeSceneKind = "vector-constellation" | "workflow-lane" | "proof-topology";

export interface ThreeSceneNode {
  id: string;
  label: string;
  role: "page" | "prototype" | "feature" | "neighbor";
  position: readonly [number, number, number];
  size: number;
  colorToken: "red" | "blue" | "cyan" | "green" | "ink";
}

export interface ThreeSceneEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
}

export interface ThreeSceneContract {
  id: string;
  pageId: string;
  kind: ThreeSceneKind;
  label: string;
  description: string;
  posterSvg: string;
  nodes: ThreeSceneNode[];
  edges: ThreeSceneEdge[];
  interaction: {
    requiresUserActivation: true;
    keyboardEquivalent: true;
    reducedMotionMode: "static";
    frameloop: "demand";
  };
  performance: {
    maxDpr: number;
    mobileMaxDpr: number;
    maxDrawCalls: number;
    desktopTriangleBudget: number;
    mobileTriangleBudget: number;
    postprocessing: false;
    wasm: "disabled-until-benchmark-win";
  };
  contentPolicy: {
    canonicalContentInsideScene: false;
    fallbackContainsEquivalentMeaning: true;
  };
  contractHash: string;
}

export function deriveThreeSceneContract(
  compiled: CompiledFrameworkManifest,
  pageId: string,
  standard: AgenticUiStandard,
): ThreeSceneContract | null {
  const artifact = compiled.site.pages.find((candidate) => candidate.page.id === pageId);
  const geometry = compiled.vectorSpace.pages.find((candidate) => candidate.pageId === pageId);
  if (!artifact || !geometry) throw new Error(`Cannot derive 3D contract for missing page ${pageId}`);
  const manifestPage = compiled.manifest.pages.find((candidate) => candidate.id === pageId);
  if (!manifestPage) throw new Error(`Cannot derive 3D contract without manifest page ${pageId}`);
  const technicalAudience = manifestPage.feature_atoms.some((atom) => atom.dimension === "audience" && atom.value === "technical-buyer");
  const explicitMediaSlot = artifact.page.requiredCapabilities.includes("media-slot");
  const structurallyUseful = technicalAudience && artifact.page.modules.some((module) => module.kind === "proof") && artifact.page.modules.some((module) => module.kind === "comparison");
  if (!explicitMediaSlot && !structurallyUseful) return null;

  const kind: ThreeSceneKind = artifact.page.modules.some((module) => module.kind === "workflow")
    ? "workflow-lane"
    : artifact.page.modules.some((module) => module.kind === "proof")
      ? "proof-topology"
      : "vector-constellation";
  const nodes = buildNodes(geometry);
  const edges = buildEdges(geometry, nodes);
  const label = `${artifact.page.canonicalQuestion} — interactive topology`;
  const description = "Optional interactive visualization of the page prototypes, feature atoms, and nearest related pages. The surrounding HTML contains the complete canonical explanation.";
  const posterSvg = renderPosterSvg(nodes, edges, label);
  const stable = {
    id: `three:${pageId}`,
    pageId,
    kind,
    label,
    description,
    posterSvg,
    nodes,
    edges,
    interaction: {
      requiresUserActivation: true as const,
      keyboardEquivalent: true as const,
      reducedMotionMode: "static" as const,
      frameloop: standard.three.frameloop,
    },
    performance: {
      maxDpr: standard.three.maxDpr,
      mobileMaxDpr: standard.three.mobileMaxDpr,
      maxDrawCalls: standard.three.maxDrawCalls,
      desktopTriangleBudget: standard.three.desktopTriangleBudget,
      mobileTriangleBudget: standard.three.mobileTriangleBudget,
      postprocessing: false as const,
      wasm: "disabled-until-benchmark-win" as const,
    },
    contentPolicy: {
      canonicalContentInsideScene: false as const,
      fallbackContainsEquivalentMeaning: true as const,
    },
  };
  return { ...stable, contractHash: sha256(JSON.stringify(stable)) };
}

export function validateThreeSceneContract(contract: ThreeSceneContract): string[] {
  const errors: string[] = [];
  if (!contract.label.trim() || !contract.description.trim()) errors.push("3D scene requires an accessible label and description");
  if (!contract.posterSvg.includes("<svg") || !contract.posterSvg.includes("role=\"img\"")) errors.push("3D scene requires a semantic SVG poster");
  if (!contract.interaction.requiresUserActivation) errors.push("3D scene must not initialize before user activation");
  if (contract.interaction.frameloop !== "demand") errors.push("3D scene must use demand rendering");
  if (contract.performance.maxDpr > 1.5) errors.push("3D scene exceeds maximum DPR");
  if (contract.performance.postprocessing) errors.push("Postprocessing is prohibited by default");
  if (contract.contentPolicy.canonicalContentInsideScene) errors.push("Canonical content cannot be trapped inside WebGL");
  if (!contract.contentPolicy.fallbackContainsEquivalentMeaning) errors.push("Static fallback must carry equivalent meaning");
  if (contract.nodes.length > 96) errors.push("Scene exceeds first-pass node budget");
  if (contract.edges.length > 160) errors.push("Scene exceeds first-pass edge budget");
  return errors;
}

function buildNodes(geometry: HyperVectorPageIR): ThreeSceneNode[] {
  const nodes: ThreeSceneNode[] = [{
    id: geometry.pageId,
    label: geometry.pageId,
    role: "page",
    position: [0, 0, 0],
    size: 1.35,
    colorToken: "red",
  }];
  geometry.prototypes.forEach((prototype, prototypeIndex) => {
    const angle = (prototypeIndex / Math.max(1, geometry.prototypes.length)) * Math.PI * 2;
    const prototypeId = `${geometry.pageId}:${prototype.id}`;
    nodes.push({
      id: prototypeId,
      label: prototype.id,
      role: "prototype",
      position: roundPosition([Math.cos(angle) * 2.4, Math.sin(angle) * 1.1, Math.sin(angle) * 1.4]),
      size: 0.9,
      colorToken: "blue",
    });
    prototype.featureAtoms.slice(0, 12).forEach((atom, atomIndex) => {
      const seed = hash32(`${prototypeId}:${atom.dimension}:${atom.value}`);
      const featureAngle = angle + ((atomIndex + 1) / (prototype.featureAtoms.length + 1)) * Math.PI * 1.5;
      const radius = 3.4 + (seed % 100) / 180;
      nodes.push({
        id: `${prototypeId}:${atom.dimension}:${atom.value}`,
        label: `${atom.dimension}: ${atom.value}`,
        role: "feature",
        position: roundPosition([
          Math.cos(featureAngle) * radius,
          Math.sin(featureAngle) * 1.7,
          ((seed >>> 8) % 200) / 100 - 1,
        ]),
        size: 0.42,
        colorToken: atom.provenance === "researched" ? "green" : atom.provenance === "synthetic" ? "cyan" : "ink",
      });
    });
  });
  geometry.nearestPageIds.slice(0, 4).forEach((neighborId, index) => {
    nodes.push({
      id: neighborId,
      label: neighborId,
      role: "neighbor",
      position: roundPosition([4.6, (index - 1.5) * 1.2, -1.2 + index * 0.8]),
      size: 0.66,
      colorToken: "cyan",
    });
  });
  return nodes;
}

function buildEdges(geometry: HyperVectorPageIR, nodes: readonly ThreeSceneNode[]): ThreeSceneEdge[] {
  const edges: ThreeSceneEdge[] = [];
  for (const prototype of geometry.prototypes) {
    const prototypeId = `${geometry.pageId}:${prototype.id}`;
    edges.push({ id: `edge:${geometry.pageId}:${prototypeId}`, source: geometry.pageId, target: prototypeId, strength: 1 });
    for (const atom of prototype.featureAtoms.slice(0, 12)) {
      const target = `${prototypeId}:${atom.dimension}:${atom.value}`;
      if (nodes.some((node) => node.id === target)) {
        edges.push({ id: `edge:${prototypeId}:${atom.dimension}:${atom.value}`, source: prototypeId, target, strength: 0.7 });
      }
    }
  }
  for (const neighborId of geometry.nearestPageIds.slice(0, 4)) {
    edges.push({ id: `edge:${geometry.pageId}:${neighborId}`, source: geometry.pageId, target: neighborId, strength: 0.45 });
  }
  return edges;
}

function renderPosterSvg(nodes: readonly ThreeSceneNode[], edges: readonly ThreeSceneEdge[], label: string): string {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const palette: Record<ThreeSceneNode["colorToken"], string> = {
    red: "#E11D2A",
    blue: "#2563EB",
    cyan: "#DFF6FF",
    green: "#168A57",
    ink: "#111111",
  };
  const project = (position: readonly [number, number, number]): [number, number] => [
    400 + position[0] * 62 + position[2] * 16,
    220 - position[1] * 58 + position[2] * 8,
  ];
  const lineMarkup = edges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return "";
    const [x1, y1] = project(source.position);
    const [x2, y2] = project(target.position);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2563EB" stroke-opacity="${Math.max(0.12, edge.strength * 0.42)}" stroke-width="${Math.max(1, edge.strength * 2)}"/>`;
  }).join("");
  const nodeMarkup = nodes.map((node) => {
    const [cx, cy] = project(node.position);
    const radius = Math.max(4, node.size * 9);
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${palette[node.colorToken]}" stroke="#FFFFFF" stroke-width="2"><title>${escapeXml(node.label)}</title></circle>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" role="img" aria-label="${escapeXml(label)}"><rect width="800" height="440" rx="24" fill="#F7F9FC"/>${lineMarkup}${nodeMarkup}</svg>`;
}

function roundPosition(position: [number, number, number]): [number, number, number] {
  return position.map((value) => Math.round(value * 1000) / 1000) as [number, number, number];
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
