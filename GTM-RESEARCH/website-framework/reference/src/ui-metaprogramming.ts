import { sha256 } from "./core.js";
import type { BrowserTargetReport } from "./browser-targets.js";
import type { LayoutRole, ModuleKind, PageIR, SemanticModuleIR } from "./framework.js";
import type { CompiledFrameworkManifest, ManifestFeatureAtom } from "./manifest.js";
import { deriveUiScaffoldPlan } from "./ui-scaffold.js";
import {
  createAmtechUiStandard,
  validateAmtechUiStandard,
  type AgenticUiStandard,
  type UiDensity,
  type UiLayoutArchetype,
} from "./amtech-design-system.js";
import { deriveThreeSceneContract, validateThreeSceneContract, type ThreeSceneContract } from "./three-scene.js";

export type UiComponentKind =
  | "site-shell"
  | "page-header"
  | "section-shell"
  | "content-stack"
  | "responsive-grid"
  | "evidence-card"
  | "workflow-list"
  | "comparison-table"
  | "disclosure-list"
  | "conversion-panel"
  | "instruction-note"
  | "related-pages"
  | "three-scene-slot";

export interface UiComponentPlan {
  id: string;
  component: UiComponentKind;
  moduleId?: string;
  moduleKind?: ModuleKind;
  layoutRole?: LayoutRole;
  variant: string;
  containerName: string;
  requiredCapabilities: string[];
}

export interface UiPagePerformanceBudget {
  canonicalJavascriptBytes: 0;
  criticalCssBytes: number;
  maximumScenes: 0 | 1;
  maximumInitialImages: number;
  targetLcpMs: number;
  targetInpMs: number;
  targetCls: number;
}

export interface UiPageMetaprogram {
  pageId: string;
  route: string;
  canonicalQuestion: string;
  profileIds: string[];
  matrixCoordinate: Record<string, string[]>;
  vectorPrototypeIds: string[];
  vectorNeighborIds: string[];
  archetype: UiLayoutArchetype;
  density: UiDensity;
  moduleOrder: string[];
  components: UiComponentPlan[];
  variantAxes: string[];
  threeScene: ThreeSceneContract | null;
  performanceBudget: UiPagePerformanceBudget;
  planHash: string;
}

export interface AgenticUiSitePlan {
  standard: AgenticUiStandard;
  scaffoldProfileId: string;
  vectorSpaceHash: string;
  browserReportId: string;
  pages: UiPageMetaprogram[];
  moduleCoverage: Record<ModuleKind, number>;
  layoutRoleCoverage: Record<LayoutRole, number>;
  validationErrors: string[];
  planHash: string;
}

export function compileAgenticUiSitePlan(
  compiled: CompiledFrameworkManifest,
  browser: BrowserTargetReport,
  profileId = "ui-scaffold",
): AgenticUiSitePlan {
  const standard = createAmtechUiStandard(browser);
  const scaffold = deriveUiScaffoldPlan(compiled, profileId);
  const manifestPageById = new Map(compiled.manifest.pages.map((page) => [page.id, page]));
  const geometryById = new Map(compiled.vectorSpace.pages.map((page) => [page.pageId, page]));
  const artifactById = new Map(compiled.site.pages.map((artifact) => [artifact.page.id, artifact.page]));
  const pages = scaffold.pages.map((fixture): UiPageMetaprogram => {
    const manifestPage = required(manifestPageById, fixture.pageId, "manifest page");
    const geometry = required(geometryById, fixture.pageId, "page geometry");
    const page = required(artifactById, fixture.pageId, "page artifact");
    const archetype = chooseArchetype(page);
    const density = chooseDensity(page, manifestPage.variant_axes ?? []);
    const components = page.modules.map((module, index) => componentForModule(module, archetype, index));
    const threeScene = deriveThreeSceneContract(compiled, page.id, standard);
    if (threeScene) components.splice(1, 0, {
      id: `component:${page.id}:three-scene`,
      component: "three-scene-slot",
      variant: threeScene.kind,
      containerName: `scene-${safeName(page.id)}`,
      requiredCapabilities: ["media-slot", "reduced-motion"],
    });
    const stable = {
      pageId: page.id,
      route: page.route,
      canonicalQuestion: page.canonicalQuestion,
      profileIds: [...geometry.profileIds].sort(),
      matrixCoordinate: coordinateFor(manifestPage.feature_atoms),
      vectorPrototypeIds: geometry.prototypes.map((prototype) => prototype.id).sort(),
      vectorNeighborIds: [...geometry.nearestPageIds].sort(),
      archetype,
      density,
      moduleOrder: page.modules.map((module) => module.id),
      components,
      variantAxes: [...(manifestPage.variant_axes ?? [])].sort(),
      threeScene,
      performanceBudget: {
        canonicalJavascriptBytes: 0 as const,
        criticalCssBytes: standard.performance.maxCriticalCssBytes,
        maximumScenes: threeScene ? 1 as const : 0 as const,
        maximumInitialImages: threeScene ? 1 : 0,
        targetLcpMs: standard.performance.targetLcpMs,
        targetInpMs: standard.performance.targetInpMs,
        targetCls: standard.performance.targetCls,
      },
    };
    return { ...stable, planHash: sha256(JSON.stringify(stable)) };
  }).sort((left, right) => left.pageId.localeCompare(right.pageId));

  const moduleCoverage = countBy(
    pages.flatMap((page) => page.components.map((component) => component.moduleKind).filter((kind): kind is ModuleKind => Boolean(kind))),
    ["hero", "answer", "workflow", "proof", "comparison", "faq", "cta", "instruction"],
  );
  const layoutRoleCoverage = countBy(
    pages.flatMap((page) => page.components.map((component) => component.layoutRole).filter((role): role is LayoutRole => Boolean(role))),
    ["lead", "support", "proof", "decision", "conversion"],
  );
  const validationErrors = [
    ...validateAmtechUiStandard(standard),
    ...pages.flatMap(validatePagePlan),
  ];
  const stable = {
    standard,
    scaffoldProfileId: profileId,
    vectorSpaceHash: canonicalUiVectorSpaceHash(compiled),
    browserReportId: browser.reportId,
    pages,
    moduleCoverage,
    layoutRoleCoverage,
    validationErrors,
  };
  return { ...stable, planHash: sha256(JSON.stringify(stable)) };
}

export function validateAgenticUiSitePlan(plan: AgenticUiSitePlan): void {
  if (plan.validationErrors.length > 0) throw new Error(`UI plan failed: ${plan.validationErrors.join("; ")}`);
  for (const [kind, count] of Object.entries(plan.moduleCoverage)) if (count === 0) throw new Error(`UI profile lacks ${kind} constructor coverage`);
  for (const [role, count] of Object.entries(plan.layoutRoleCoverage)) if (count === 0) throw new Error(`UI profile lacks ${role} layout coverage`);
  if (new Set(plan.pages.map((page) => page.planHash)).size !== plan.pages.length) throw new Error("UI page plans must have distinct hashes");
}

function chooseArchetype(page: PageIR): UiLayoutArchetype {
  if (page.modules.some((module) => module.kind === "workflow")) return "workflow-led";
  if (page.modules.some((module) => module.kind === "comparison")) return "comparison-led";
  if (page.modules.some((module) => module.kind === "proof")) return "proof-led";
  if (page.modules.some((module) => module.informationObjects.some((item) => item.kind === "calculation" || item.kind === "dataset"))) return "utility-led";
  return "editorial";
}

function chooseDensity(page: PageIR, variantAxes: readonly string[]): UiDensity {
  const informationCount = page.modules.reduce((sum, module) => sum + module.informationObjects.length + module.paragraphs.length, 0);
  if (variantAxes.includes("density") && informationCount >= 10) return "deep";
  if (informationCount <= 4) return "compact";
  return "balanced";
}

function componentForModule(module: SemanticModuleIR, archetype: UiLayoutArchetype, index: number): UiComponentPlan {
  const componentByKind: Record<ModuleKind, UiComponentKind> = {
    hero: "page-header",
    answer: "content-stack",
    workflow: "workflow-list",
    proof: "evidence-card",
    comparison: "comparison-table",
    faq: "disclosure-list",
    cta: "conversion-panel",
    instruction: "instruction-note",
  };
  return {
    id: `component:${module.id}:${index}`,
    component: componentByKind[module.kind],
    moduleId: module.id,
    moduleKind: module.kind,
    layoutRole: module.layoutRole,
    variant: variantFor(module, archetype),
    containerName: `${safeName(module.kind)}-${index + 1}`,
    requiredCapabilities: [...module.requiredCapabilities],
  };
}

function variantFor(module: SemanticModuleIR, archetype: UiLayoutArchetype): string {
  if (module.kind === "hero") return archetype === "proof-led" ? "technical-clarity" : "operational-outcome";
  if (module.kind === "workflow") return "numbered-operating-path";
  if (module.kind === "proof") return archetype === "proof-led" ? "evidence-ledger" : "bounded-proof";
  if (module.kind === "comparison") return "decision-matrix";
  if (module.kind === "faq") return "native-details";
  if (module.kind === "cta") return "single-primary-action";
  if (module.kind === "instruction") return "compact-pointer";
  return "editorial-stack";
}

function coordinateFor(atoms: readonly ManifestFeatureAtom[]): Record<string, string[]> {
  const coordinate: Record<string, string[]> = {};
  for (const atom of [...atoms].sort((a, b) => a.dimension.localeCompare(b.dimension) || a.value.localeCompare(b.value))) {
    const values = coordinate[atom.dimension] ?? [];
    if (!values.includes(atom.value)) values.push(atom.value);
    coordinate[atom.dimension] = values;
  }
  return coordinate;
}

function canonicalUiVectorSpaceHash(compiled: CompiledFrameworkManifest): string {
  const axes = Object.fromEntries(Object.entries(compiled.vectorSpace.axes).sort(([left], [right]) => left.localeCompare(right)));
  const pages = [...compiled.vectorSpace.pages]
    .sort((left, right) => left.pageId.localeCompare(right.pageId))
    .map((page) => ({
      pageId: page.pageId,
      profileIds: [...page.profileIds].sort(),
      prototypes: [...page.prototypes]
        .sort((left, right) => left.id.localeCompare(right.id))
        .map((prototype) => ({
          id: prototype.id,
          atoms: [...prototype.featureAtoms]
            .sort((left, right) => left.dimension.localeCompare(right.dimension)
              || left.value.localeCompare(right.value)
              || left.source_id.localeCompare(right.source_id)
              || left.provenance.localeCompare(right.provenance)),
          vector: Array.from(prototype.vector),
        })),
      nearestPageIds: [...page.nearestPageIds].sort(),
    }));
  return sha256(JSON.stringify({
    namespace: compiled.vectorSpace.namespace,
    dimensions: compiled.vectorSpace.dimensions,
    axes,
    featureVocabulary: [...compiled.vectorSpace.featureVocabulary].sort(),
    pages,
  }));
}

function validatePagePlan(page: UiPageMetaprogram): string[] {
  const errors: string[] = [];
  if (Object.keys(page.matrixCoordinate).length === 0) errors.push(`${page.pageId} lacks a page-matrix coordinate`);
  if (page.vectorPrototypeIds.length === 0) errors.push(`${page.pageId} lacks vector prototypes`);
  if (page.components.length === 0) errors.push(`${page.pageId} lacks component plans`);
  if (page.performanceBudget.canonicalJavascriptBytes !== 0) errors.push(`${page.pageId} requires canonical JavaScript`);
  if (page.threeScene) errors.push(...validateThreeSceneContract(page.threeScene).map((error) => `${page.pageId}: ${error}`));
  return errors;
}

function countBy<T extends string>(values: readonly T[], universe: readonly T[]): Record<T, number> {
  const output = Object.fromEntries(universe.map((value) => [value, 0])) as Record<T, number>;
  for (const value of values) output[value] += 1;
  return output;
}

function required<K, V>(map: ReadonlyMap<K, V>, key: K, context: string): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Missing ${context}: ${String(key)}`);
  return value;
}

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
