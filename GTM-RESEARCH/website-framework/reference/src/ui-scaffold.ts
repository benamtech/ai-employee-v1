import { sha256 } from "./core.js";
import type { DesignCapability } from "./benchmark.js";
import type { LayoutRole, ModuleKind } from "./framework.js";
import { pagesForProfile, type CompiledFrameworkManifest } from "./manifest.js";

export interface UiScaffoldPageFixture {
  pageId: string;
  route: string;
  vectorPrototypeIds: string[];
  moduleSequence: { moduleId: string; kind: ModuleKind; layoutRole: LayoutRole; requiredCapabilities: DesignCapability[] }[];
  requiredCapabilities: DesignCapability[];
  variantAxes: string[];
}

export interface UiScaffoldPlan {
  profileId: string;
  vectorSpaceHash: string;
  moduleKinds: ModuleKind[];
  layoutRoles: LayoutRole[];
  requiredCapabilities: DesignCapability[];
  pages: UiScaffoldPageFixture[];
  planHash: string;
}

export function deriveUiScaffoldPlan(compiled: CompiledFrameworkManifest, profileId = compiled.defaultProfile): UiScaffoldPlan {
  const selected = new Set(pagesForProfile(compiled, profileId));
  const manifestPages = new Map(compiled.manifest.pages.map((page) => [page.id, page]));
  const geometry = new Map(compiled.vectorSpace.pages.map((page) => [page.pageId, page]));
  const pages = compiled.site.pages.filter((artifact) => selected.has(artifact.page.id)).map((artifact) => {
    const source = manifestPages.get(artifact.page.id);
    const shape = geometry.get(artifact.page.id);
    if (!source || !shape) throw new Error(`UI scaffold missing source geometry for ${artifact.page.id}`);
    return {
      pageId: artifact.page.id,
      route: artifact.page.route,
      vectorPrototypeIds: shape.prototypes.map((prototype) => prototype.id),
      moduleSequence: artifact.page.modules.map((module) => ({
        moduleId: module.id,
        kind: module.kind,
        layoutRole: module.layoutRole,
        requiredCapabilities: [...module.requiredCapabilities],
      })),
      requiredCapabilities: [...artifact.page.requiredCapabilities],
      variantAxes: [...(source.variant_axes ?? [])].sort(),
    } satisfies UiScaffoldPageFixture;
  }).sort((a, b) => a.pageId.localeCompare(b.pageId));
  if (pages.length === 0) throw new Error(`UI scaffold profile ${profileId} has no pages`);
  const moduleKinds = uniqueSorted(pages.flatMap((page) => page.moduleSequence.map((module) => module.kind)));
  const layoutRoles = uniqueSorted(pages.flatMap((page) => page.moduleSequence.map((module) => module.layoutRole)));
  const requiredCapabilities = uniqueSorted(pages.flatMap((page) => page.requiredCapabilities));
  const stable = { profileId, vectorSpaceHash: compiled.vectorSpace.spaceHash, moduleKinds, layoutRoles, requiredCapabilities, pages };
  return { ...stable, planHash: sha256(JSON.stringify(stable)) };
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] { return [...new Set(values)].sort() as T[]; }
