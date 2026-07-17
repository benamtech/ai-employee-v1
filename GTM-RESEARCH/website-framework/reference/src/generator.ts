import { DESIGN_CAPABILITIES, type DesignCapability, type FeatureMap } from "./benchmark.js";
import { compileSite, type ModuleKind, type ModuleSource, type PageSource, type SiteSource } from "./framework.js";
import { sha256 } from "./core.js";

export interface VariantPlan {
  id: string;
  pageId: string;
  moduleOrder: string[];
  density: "compact" | "balanced" | "deep";
  proofEmphasis: "workflow" | "security" | "economics";
  requiredCapabilities: DesignCapability[];
}
export interface ScaleReport {
  pageCount: number;
  variantCount: number;
  buildMs: number;
  htmlBytes: number;
  instructionBytes: number;
  packedVectorBytes: number;
  graphBytes: number;
  buildHash: string;
  deterministic: boolean;
}

const VERTICALS = ["painting", "landscaping", "hvac", "roofing", "plumbing", "electrical", "flooring", "property-management", "bookkeeping", "dental"];
const TASKS = ["estimate-follow-up", "missed-call-intake", "invoice-reminders", "change-orders", "scheduling", "review-requests", "document-collection", "job-proof", "lead-qualification", "customer-updates"];
const STAGES = ["diagnose", "compare", "implement", "operate", "recover"];
const CONSTRAINTS = ["owner-approval", "no-api-keys", "low-technical-burden", "audit-proof"];

export function generateSyntheticSite(pageCount: number): SiteSource {
  if (!Number.isInteger(pageCount) || pageCount <= 0) throw new RangeError("pageCount must be positive integer");
  const evidence = [
    { id: "evidence:offer", level: 4 as const, summary: "Canonical approved AMTECH offer." },
    { id: "evidence:approval", level: 3 as const, summary: "Owner approval boundary architecture." },
    { id: "evidence:workflow", level: 2 as const, summary: "Synthetic workflow fixture for compiler validation." },
  ];
  const claims = [
    { id: "claim:offer", text: "Start free. Managed AI Employee from $400.", evidenceIds: ["evidence:offer"], requiredLevel: 4 as const },
    { id: "claim:approval", text: "The employee asks before customer, money, reputation, or destructive actions.", evidenceIds: ["evidence:approval"], requiredLevel: 3 as const },
  ];
  const informationObjects = Array.from({ length: pageCount }, (_, index) => ({
    id: `info:${String(index + 1).padStart(4, "0")}`,
    kind: (index % 5 === 0 ? "calculation" : index % 5 === 1 ? "workflow" : index % 5 === 2 ? "comparison" : index % 5 === 3 ? "diagram" : "field-note") as "calculation" | "workflow" | "comparison" | "diagram" | "field-note",
    title: `Distinct operating object ${index + 1}`,
    body: `Deterministic information object ${index + 1} models one bounded operator decision, input, approval, result, and recovery path.`,
    evidenceIds: ["evidence:workflow"],
  }));

  const modules: ModuleSource[] = Array.from({ length: pageCount }, (_, index) => {
    const vertical = VERTICALS[index % VERTICALS.length];
    const task = TASKS[Math.floor(index / VERTICALS.length) % TASKS.length];
    const stage = STAGES[Math.floor(index / (VERTICALS.length * TASKS.length)) % STAGES.length];
    return {
      id: `module:answer:${String(index + 1).padStart(4, "0")}`,
      kind: "answer" as ModuleKind,
      layoutRole: "lead" as const,
      heading: `${humanize(task)} for ${humanize(vertical)} operators`,
      body: `A ${humanize(vertical)} operator at the ${stage} stage needs a specific ${humanize(task)} workflow rather than a generic automation page.`,
      claimIds: ["claim:approval"],
      informationObjectIds: [informationObjects[index].id],
      requiredCapabilities: capabilitiesFor(index),
      sourceIds: [`source:opportunity:${index + 1}`],
    };
  });
  modules.push({
    id: "module:shared-cta", kind: "cta", layoutRole: "conversion", heading: "Build your AI Employee",
    body: "Start with one useful employee, then add managed connections and recovery when needed.", claimIds: ["claim:offer"],
    informationObjectIds: [], requiredCapabilities: ["conversion-panel", "responsive-grid", "mobile-priority"], sourceIds: ["source:offer"],
  });

  const pages: PageSource[] = Array.from({ length: pageCount }, (_, index) => {
    const vertical = VERTICALS[index % VERTICALS.length];
    const task = TASKS[Math.floor(index / VERTICALS.length) % TASKS.length];
    const stage = STAGES[Math.floor(index / (VERTICALS.length * TASKS.length)) % STAGES.length];
    const constraint = CONSTRAINTS[Math.floor(index / (VERTICALS.length * TASKS.length * STAGES.length)) % CONSTRAINTS.length];
    const id = `page:${String(index + 1).padStart(4, "0")}`;
    const links = pageCount === 1 ? [] : unique([`page:${String(((index + 1) % pageCount) + 1).padStart(4, "0")}`, `page:${String(((index + 7) % pageCount) + 1).padStart(4, "0")}`]).filter((target) => target !== id);
    const features: FeatureMap = { vertical, task, stage, constraint, proof: index % 2 === 0 ? "workflow" : "security", surface: "canonical-page" };
    return {
      id,
      route: `/${vertical}/${task}/${stage}-${constraint}-${index + 1}`,
      canonicalQuestion: `How should ${humanize(vertical)} operators ${humanize(task)} during ${stage} with ${humanize(constraint)}?`,
      title: `${humanize(task)} for ${humanize(vertical)} operators | AMTECH`,
      description: `A specific ${humanize(stage)}-stage workflow for ${humanize(task)} with ${humanize(constraint)}.`,
      features,
      moduleIds: [modules[index].id, "module:shared-cta"],
      internalPageIds: links,
      requiredCapabilities: capabilitiesFor(index),
      instructionPointers: [`${`/${vertical}/${task}/${stage}-${constraint}-${index + 1}`}/use.md`],
      indexable: true,
    };
  });
  return { baseUrl: "https://example.amtechai.com", evidence, claims, informationObjects, modules, pages };
}

export function generateVariantPlans(source: SiteSource, variantsPerPage = 3): VariantPlan[] {
  if (variantsPerPage < 1 || variantsPerPage > 3) throw new RangeError("variantsPerPage must be 1..3");
  return source.pages.flatMap((page, pageIndex) => Array.from({ length: variantsPerPage }, (_, variantIndex) => ({
    id: `variant:${page.id}:${variantIndex + 1}`,
    pageId: page.id,
    moduleOrder: variantIndex === 1 ? [...page.moduleIds].reverse() : [...page.moduleIds],
    density: variantIndex === 0 ? "balanced" : variantIndex === 1 ? "compact" : "deep",
    proofEmphasis: (variantIndex === 0 ? "workflow" : variantIndex === 1 ? "security" : "economics") as "workflow" | "security" | "economics",
    requiredCapabilities: unique([...page.requiredCapabilities, DESIGN_CAPABILITIES[(pageIndex + variantIndex) % DESIGN_CAPABILITIES.length]]),
  })));
}

export function runScaleCompilation(pageCount: number, now: () => number): ScaleReport {
  const source = generateSyntheticSite(pageCount);
  const start = now();
  const first = compileSite(source, 512);
  const buildMs = now() - start;
  const second = compileSite({ ...source, pages: [...source.pages].reverse(), modules: [...source.modules].reverse(), informationObjects: [...source.informationObjects].reverse() }, 512);
  const variants = generateVariantPlans(source, 3);
  return {
    pageCount,
    variantCount: variants.length,
    buildMs,
    htmlBytes: first.pages.reduce((sum, page) => sum + byteLength(page.html), 0),
    instructionBytes: first.pages.reduce((sum, page) => sum + byteLength(page.instructionMarkdown ?? ""), 0),
    packedVectorBytes: first.packed.pageVectors.byteLength,
    graphBytes: first.packed.graphOffsets.byteLength + first.packed.graphTargets.byteLength,
    buildHash: first.buildHash,
    deterministic: first.buildHash === second.buildHash && sha256(JSON.stringify(variants)) === sha256(JSON.stringify(generateVariantPlans(source, 3))),
  };
}

function capabilitiesFor(index: number): DesignCapability[] {
  const capabilities = new Set<DesignCapability>(["semantic-hierarchy", "responsive-grid", "mobile-priority", "structured-data-visible", "conversion-panel", "instruction-pointer"]);
  if (index % 2 === 0) capabilities.add("workflow-steps");
  if (index % 3 === 0) capabilities.add("evidence-dense");
  if (index % 5 === 0) capabilities.add("comparison-table");
  if (index % 7 === 0) capabilities.add("progressive-disclosure");
  if (index % 11 === 0) capabilities.add("media-slot");
  return [...capabilities].sort();
}
function byteLength(value: string): number { return new TextEncoder().encode(value).byteLength; }
function humanize(value: string): string { return value.replaceAll("-", " "); }
function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
