import { cosine } from "./core.js";
import type { CompiledFrameworkManifest, ManifestFeatureAtom } from "./manifest.js";

export interface HyperAwareAgentContext {
  profileId: string;
  vectorSpace: {
    namespace: string;
    dimensions: number;
    axes: string[];
    spaceHash: string;
  };
  currentPages: {
    pageId: string;
    canonicalQuestion: string;
    targetAtoms: ManifestFeatureAtom[];
    nearestPages: { pageId: string; cosine: number }[];
    informationObjectIds: string[];
    requiredDesignCapabilities: string[];
  }[];
  generationRules: {
    requiredStages: string[];
    requiredOutputs: string[];
    prohibitedOutputs: string[];
    publicationDefault: "noindex";
  };
}

export function buildHyperAwareAgentContext(compiled: CompiledFrameworkManifest, profileId = compiled.defaultProfile): HyperAwareAgentContext {
  const profile = compiled.profiles[profileId];
  if (!profile) throw new Error(`unknown agent context profile ${profileId}`);
  const selected = new Set(profile.page_ids);
  const sourcePageById = new Map(compiled.manifest.pages.map((page) => [page.id, page]));
  const artifactById = new Map(compiled.site.pages.map((artifact) => [artifact.page.id, artifact]));
  const vectorPages = compiled.vectorSpace.pages.filter((page) => selected.has(page.pageId));
  const currentPages = vectorPages.map((page) => {
    const source = sourcePageById.get(page.pageId);
    const artifact = artifactById.get(page.pageId);
    if (!source || !artifact) throw new Error(`agent context missing page ${page.pageId}`);
    const primary = page.prototypes[0];
    const nearestPages = compiled.vectorSpace.pages.filter((candidate) => candidate.pageId !== page.pageId)
      .map((candidate) => ({ pageId: candidate.pageId, cosine: maxCosine(primary.vector, candidate.prototypes.map((prototype) => prototype.vector)) }))
      .sort((left, right) => right.cosine - left.cosine || left.pageId.localeCompare(right.pageId)).slice(0, 5);
    return {
      pageId: page.pageId,
      canonicalQuestion: source.canonical_question,
      targetAtoms: [...primary.featureAtoms],
      nearestPages,
      informationObjectIds: uniqueSorted(artifact.page.modules.flatMap((module) => module.informationObjects.map((item) => item.id))),
      requiredDesignCapabilities: [...artifact.page.requiredCapabilities],
    };
  }).sort((a, b) => a.pageId.localeCompare(b.pageId));
  return {
    profileId,
    vectorSpace: {
      namespace: compiled.vectorSpace.namespace,
      dimensions: compiled.vectorSpace.dimensions,
      axes: Object.keys(compiled.vectorSpace.axes).sort(),
      spaceHash: compiled.vectorSpace.spaceHash,
    },
    currentPages,
    generationRules: {
      requiredStages: [...compiled.manifest.agent_harness.required_stages],
      requiredOutputs: [...compiled.manifest.agent_harness.required_outputs],
      prohibitedOutputs: [...compiled.manifest.agent_harness.prohibited_outputs],
      publicationDefault: "noindex",
    },
  };
}

function maxCosine(vector: Float64Array, candidates: Float64Array[]): number {
  return candidates.reduce((best, candidate) => Math.max(best, cosine(vector, candidate)), Number.NEGATIVE_INFINITY);
}
function uniqueSorted(values: readonly string[]): string[] { return [...new Set(values)].sort(); }
