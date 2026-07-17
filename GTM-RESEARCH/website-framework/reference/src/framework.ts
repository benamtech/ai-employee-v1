import {
  compileHrrFeatures,
  DEFAULT_VECTOR_SPACE_IDENTITY,
  DESIGN_CAPABILITIES,
  type DesignCapability,
  type FeatureMap,
  type VectorSpaceIdentity,
} from "./benchmark.js";
import { sha256 } from "./core.js";

export type EvidenceLevel = 0 | 1 | 2 | 3 | 4;
export type ModuleKind = "hero" | "answer" | "workflow" | "proof" | "comparison" | "faq" | "cta" | "instruction";
export type LayoutRole = "lead" | "support" | "proof" | "decision" | "conversion";

export interface EvidenceSource { id: string; level: EvidenceLevel; summary: string; url?: string; }
export interface ClaimSource { id: string; text: string; evidenceIds: string[]; requiredLevel: EvidenceLevel; }
export interface InformationObjectSource { id: string; kind: "workflow" | "dataset" | "calculation" | "diagram" | "comparison" | "field-note"; title: string; body: string; evidenceIds: string[]; }
export interface ModuleSource {
  id: string;
  kind: ModuleKind;
  layoutRole: LayoutRole;
  heading?: string;
  body?: string;
  claimIds: string[];
  informationObjectIds: string[];
  requiredCapabilities: DesignCapability[];
  sourceIds: string[];
}
export interface VectorPrototypeSource { id: string; features: FeatureMap; }
export interface PageSource {
  id: string;
  route: string;
  canonicalQuestion: string;
  title: string;
  description: string;
  features: FeatureMap;
  vectorPrototypes?: VectorPrototypeSource[];
  moduleIds: string[];
  internalPageIds: string[];
  requiredCapabilities: DesignCapability[];
  instructionPointers?: string[];
  indexable: boolean;
}
export interface SiteSource {
  baseUrl: string;
  vectorIdentity?: VectorSpaceIdentity;
  evidence: EvidenceSource[];
  claims: ClaimSource[];
  informationObjects: InformationObjectSource[];
  modules: ModuleSource[];
  pages: PageSource[];
}

export interface SemanticModuleIR {
  id: string;
  kind: ModuleKind;
  layoutRole: LayoutRole;
  heading?: string;
  paragraphs: string[];
  informationObjects: { id: string; kind: InformationObjectSource["kind"]; title: string; body: string }[];
  claimIds: string[];
  requiredCapabilities: DesignCapability[];
  sourceIds: string[];
}
export interface VectorPrototypeIR { id: string; features: FeatureMap; }
export interface PageIR {
  id: string;
  route: string;
  canonicalUrl: string;
  canonicalQuestion: string;
  title: string;
  description: string;
  indexable: boolean;
  features: FeatureMap;
  vectorPrototypes: VectorPrototypeIR[];
  modules: SemanticModuleIR[];
  internalPageIds: string[];
  requiredCapabilities: DesignCapability[];
  instructionPointers: string[];
  dependencyIds: string[];
}
export interface PackedSiteIR {
  pageIds: string[];
  routes: string[];
  dimensions: number;
  vectorIdentity: VectorSpaceIdentity;
  pageVectors: Float32Array;
  prototypeOffsets: Uint32Array;
  prototypeIds: string[];
  prototypeVectors: Float32Array;
  graphOffsets: Uint32Array;
  graphTargets: Uint32Array;
  capabilityOffsets: Uint32Array;
  capabilityTargets: Uint16Array;
  stringTable: string[];
}
export interface CompiledPageArtifact {
  page: PageIR;
  html: string;
  instructionMarkdown: string | null;
  sha256: string;
}
export interface CompiledSite {
  pages: CompiledPageArtifact[];
  packed: PackedSiteIR;
  sitemapXml: string;
  dependencyIndex: ReadonlyMap<string, readonly string[]>;
  buildHash: string;
}

export interface DesignComponentContract { kind: ModuleKind; supportedLayoutRoles: LayoutRole[]; capabilities: DesignCapability[]; }
export interface DesignSystemContract {
  id: string;
  capabilities: DesignCapability[];
  components: DesignComponentContract[];
  tokens: { spacingScale: number[]; typeScale: number[]; radii: number[]; maxContentWidths: number[] };
}
export interface DesignSatisfiabilityResult { ok: boolean; missingCapabilities: DesignCapability[]; missingModuleKinds: ModuleKind[]; errors: string[]; }

export function compileSite(source: SiteSource, dimensions = 512): CompiledSite {
  validateSiteSource(source);
  const vectorIdentity = source.vectorIdentity ?? DEFAULT_VECTOR_SPACE_IDENTITY;
  const evidenceById = new Map(source.evidence.map((item) => [item.id, item]));
  const claimById = new Map(source.claims.map((item) => [item.id, item]));
  const infoById = new Map(source.informationObjects.map((item) => [item.id, item]));
  const moduleById = new Map(source.modules.map((item) => [item.id, item]));
  const pageById = new Map(source.pages.map((item) => [item.id, item]));

  const pages: PageIR[] = [...source.pages].sort((a, b) => a.id.localeCompare(b.id)).map((page) => {
    const modules = page.moduleIds.map((moduleId) => {
      const module = required(moduleById, moduleId, `page ${page.id}`);
      const paragraphs: string[] = [];
      if (module.body) paragraphs.push(module.body);
      for (const claimId of module.claimIds) {
        const claim = required(claimById, claimId, `module ${module.id}`);
        for (const evidenceId of claim.evidenceIds) {
          const evidence = required(evidenceById, evidenceId, `claim ${claim.id}`);
          if (evidence.level < claim.requiredLevel) throw new Error(`claim ${claim.id} exceeds evidence ${evidence.id}`);
        }
        paragraphs.push(claim.text);
      }
      const informationObjects = module.informationObjectIds.map((id) => {
        const item = required(infoById, id, `module ${module.id}`);
        for (const evidenceId of item.evidenceIds) required(evidenceById, evidenceId, `information object ${item.id}`);
        return { id: item.id, kind: item.kind, title: item.title, body: item.body };
      });
      return {
        id: module.id,
        kind: module.kind,
        layoutRole: module.layoutRole,
        ...(module.heading ? { heading: module.heading } : {}),
        paragraphs,
        informationObjects,
        claimIds: [...module.claimIds],
        requiredCapabilities: uniqueSorted(module.requiredCapabilities),
        sourceIds: uniqueSorted([...module.sourceIds, ...module.claimIds, ...module.informationObjectIds]),
      } satisfies SemanticModuleIR;
    });
    for (const internalPageId of page.internalPageIds) required(pageById, internalPageId, `page ${page.id}`);
    const dependencies = uniqueSorted([page.id, ...page.moduleIds, ...modules.flatMap((module) => module.sourceIds)]);
    const vectorPrototypes = normalizePrototypes(page);
    return {
      id: page.id,
      route: normalizeRoute(page.route),
      canonicalUrl: `${source.baseUrl.replace(/\/$/, "")}${normalizeRoute(page.route)}`,
      canonicalQuestion: page.canonicalQuestion,
      title: page.title,
      description: page.description,
      indexable: page.indexable,
      features: stableRecord(vectorPrototypes[0].features),
      vectorPrototypes,
      modules,
      internalPageIds: uniqueSorted(page.internalPageIds),
      requiredCapabilities: uniqueSorted([...page.requiredCapabilities, ...modules.flatMap((module) => module.requiredCapabilities)]),
      instructionPointers: uniqueSorted(page.instructionPointers ?? []),
      dependencyIds: dependencies,
    };
  });

  const artifacts = pages.map((page) => {
    const html = renderNeutralHtml(page, pageById);
    const instructionMarkdown = page.instructionPointers.length > 0 ? renderInstructionProjection(page) : null;
    return { page, html, instructionMarkdown, sha256: sha256(`${html}\n${instructionMarkdown ?? ""}`) };
  });
  const packed = packSite(pages, dimensions, vectorIdentity);
  const sitemapXml = renderSitemap(pages);
  const dependencyIndex = buildDependencyIndex(pages);
  const buildHash = sha256(JSON.stringify({
    vectorIdentity,
    pageHashes: artifacts.map((item) => [item.page.id, item.sha256]),
    sitemapXml,
    pageVectors: Array.from(packed.pageVectors),
    prototypeOffsets: Array.from(packed.prototypeOffsets),
    prototypeIds: packed.prototypeIds,
    prototypeVectors: Array.from(packed.prototypeVectors),
    graphOffsets: Array.from(packed.graphOffsets),
    graphTargets: Array.from(packed.graphTargets),
  }));
  return { pages: artifacts, packed, sitemapXml, dependencyIndex, buildHash };
}

export function packSite(
  pages: readonly PageIR[],
  dimensions = 512,
  vectorIdentity: VectorSpaceIdentity = DEFAULT_VECTOR_SPACE_IDENTITY,
): PackedSiteIR {
  const pageIds = pages.map((page) => page.id);
  const pageIndex = new Map(pageIds.map((id, index) => [id, index]));
  const routes = pages.map((page) => page.route);
  const pageVectors = new Float32Array(pages.length * dimensions);
  const prototypeOffsets = new Uint32Array(pages.length + 1);
  const prototypeIds: string[] = [];
  const prototypeVectorValues: number[] = [];

  pages.forEach((page, pageNumber) => {
    prototypeOffsets[pageNumber] = prototypeIds.length;
    page.vectorPrototypes.forEach((prototype, prototypeIndex) => {
      const vector = compileHrrFeatures(prototype.features, dimensions, vectorIdentity);
      prototypeIds.push(`${page.id}\0${prototype.id}`);
      for (let dimension = 0; dimension < dimensions; dimension += 1) {
        prototypeVectorValues.push(vector[dimension]);
        if (prototypeIndex === 0) pageVectors[pageNumber * dimensions + dimension] = vector[dimension];
      }
    });
  });
  prototypeOffsets[pages.length] = prototypeIds.length;

  const graphOffsets = new Uint32Array(pages.length + 1);
  const graphTargetsList: number[] = [];
  pages.forEach((page, index) => {
    graphOffsets[index] = graphTargetsList.length;
    for (const targetId of page.internalPageIds) graphTargetsList.push(required(pageIndex, targetId, `page graph ${page.id}`));
  });
  graphOffsets[pages.length] = graphTargetsList.length;

  const capabilityIndex = new Map(DESIGN_CAPABILITIES.map((capability, index) => [capability, index]));
  const capabilityOffsets = new Uint32Array(pages.length + 1);
  const capabilityTargetsList: number[] = [];
  pages.forEach((page, index) => {
    capabilityOffsets[index] = capabilityTargetsList.length;
    for (const capability of page.requiredCapabilities) capabilityTargetsList.push(required(capabilityIndex, capability, `page capability ${page.id}`));
  });
  capabilityOffsets[pages.length] = capabilityTargetsList.length;

  return {
    pageIds,
    routes,
    dimensions,
    vectorIdentity: { ...vectorIdentity },
    pageVectors,
    prototypeOffsets,
    prototypeIds,
    prototypeVectors: Float32Array.from(prototypeVectorValues),
    graphOffsets,
    graphTargets: Uint32Array.from(graphTargetsList),
    capabilityOffsets,
    capabilityTargets: Uint16Array.from(capabilityTargetsList),
    stringTable: uniqueSorted([...pageIds, ...routes, ...prototypeIds, ...pages.flatMap((page) => page.dependencyIds)]),
  };
}

export function validateDesignSystemSuperset(site: CompiledSite, design: DesignSystemContract): DesignSatisfiabilityResult {
  const requiredCapabilities = new Set(site.pages.flatMap((artifact) => artifact.page.requiredCapabilities));
  const availableCapabilities = new Set(design.capabilities);
  const missingCapabilities = [...requiredCapabilities].filter((capability) => !availableCapabilities.has(capability)).sort();
  const requiredKinds = new Set(site.pages.flatMap((artifact) => artifact.page.modules.map((module) => module.kind)));
  const availableKinds = new Set(design.components.map((component) => component.kind));
  const missingModuleKinds = [...requiredKinds].filter((kind) => !availableKinds.has(kind)).sort();
  const errors: string[] = [];
  if (design.tokens.spacingScale.length < 4) errors.push("spacing scale requires at least four values");
  if (design.tokens.typeScale.length < 5) errors.push("type scale requires at least five values");
  if (design.tokens.maxContentWidths.length < 2) errors.push("at least two content width constraints are required");
  for (const component of design.components) {
    const unsupported = component.capabilities.filter((capability) => !availableCapabilities.has(capability));
    if (unsupported.length > 0) errors.push(`component ${component.kind} declares unavailable capabilities: ${unsupported.join(",")}`);
  }
  return { ok: missingCapabilities.length === 0 && missingModuleKinds.length === 0 && errors.length === 0,
    missingCapabilities, missingModuleKinds, errors };
}

export function createReferenceDesignContract(): DesignSystemContract {
  const kinds: ModuleKind[] = ["hero", "answer", "workflow", "proof", "comparison", "faq", "cta", "instruction"];
  return {
    id: "reference-clean-professional-v1",
    capabilities: [...DESIGN_CAPABILITIES],
    components: kinds.map((kind) => ({ kind, supportedLayoutRoles: ["lead", "support", "proof", "decision", "conversion"], capabilities: [...DESIGN_CAPABILITIES] })),
    tokens: { spacingScale: [4, 8, 12, 16, 24, 32, 48, 64], typeScale: [12, 14, 16, 20, 28, 40, 56], radii: [0, 4, 8, 16], maxContentWidths: [680, 1120, 1440] },
  };
}

function normalizePrototypes(page: PageSource): VectorPrototypeIR[] {
  const declared = page.vectorPrototypes?.length
    ? page.vectorPrototypes
    : [{ id: "primary", features: page.features }];
  const seen = new Set<string>();
  return [...declared].sort((left, right) => left.id.localeCompare(right.id)).map((prototype) => {
    if (!prototype.id.trim()) throw new Error(`page ${page.id} has empty prototype id`);
    if (seen.has(prototype.id)) throw new Error(`page ${page.id} has duplicate prototype ${prototype.id}`);
    seen.add(prototype.id);
    const features = stableRecord(prototype.features);
    if (Object.keys(features).length === 0) throw new Error(`page ${page.id}/${prototype.id} has no vector features`);
    return { id: prototype.id, features };
  });
}

function validateSiteSource(source: SiteSource): void {
  if (!/^https:\/\//.test(source.baseUrl)) throw new Error("baseUrl must be https");
  if (source.vectorIdentity && (!source.vectorIdentity.namespace.trim() || !source.vectorIdentity.symbolVersion.trim())) {
    throw new Error("vector identity requires namespace and symbolVersion");
  }
  assertUnique(source.evidence, "evidence"); assertUnique(source.claims, "claim"); assertUnique(source.informationObjects, "information object");
  assertUnique(source.modules, "module"); assertUnique(source.pages, "page");
  const routes = new Set<string>();
  for (const page of source.pages) {
    const route = normalizeRoute(page.route);
    if (routes.has(route)) throw new Error(`duplicate route: ${route}`);
    routes.add(route);
    if (!page.canonicalQuestion.trim()) throw new Error(`page ${page.id} lacks canonical question`);
    if (page.moduleIds.length === 0) throw new Error(`page ${page.id} has no modules`);
    normalizePrototypes(page);
  }
}
function renderNeutralHtml(page: PageIR, pageById: Map<string, PageSource>): string {
  const modules = page.modules.map((module) => renderModule(module)).join("\n");
  const links = page.internalPageIds.length === 0 ? "" : `<nav aria-label="Related pages"><ul>${page.internalPageIds.map((id) => {
    const target = required(pageById, id, `links for ${page.id}`);
    return `<li><a href="${escapeHtml(normalizeRoute(target.route))}">${escapeHtml(target.title)}</a></li>`;
  }).join("")}</ul></nav>`;
  const pointer = page.instructionPointers[0] ? `<link rel="alternate" type="text/markdown" href="${escapeHtml(page.instructionPointers[0])}">` : "";
  const robots = page.indexable ? "index,follow" : "noindex,nofollow";
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: page.title,
    description: page.description, url: page.canonicalUrl, mainEntity: { "@type": "Question", name: page.canonicalQuestion } }).replaceAll("<", "\\u003c");
  return ["<!doctype html>", '<html lang="en">', "<head>", '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">', `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`, `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(page.canonicalUrl)}">`, pointer,
    `<script type="application/ld+json">${schema}</script>`, "</head>",
    `<body data-page-id="${escapeHtml(page.id)}" data-design-contract="semantic-v1">`, "<main>",
    `<header><p>AMTECH AI Employee</p><h1>${escapeHtml(page.canonicalQuestion)}</h1></header>`, modules, links,
    "</main>", "</body>", "</html>", ""].filter(Boolean).join("\n");
}
function renderModule(module: SemanticModuleIR): string {
  const heading = module.heading ? `<h2>${escapeHtml(module.heading)}</h2>` : "";
  const paragraphs = module.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const information = module.informationObjects.map((item) => `<article data-information-object="${escapeHtml(item.id)}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`).join("");
  return `<section data-module-id="${escapeHtml(module.id)}" data-module-kind="${module.kind}" data-layout-role="${module.layoutRole}">${heading}${paragraphs}${information}</section>`;
}
function renderInstructionProjection(page: PageIR): string {
  return [`# ${page.canonicalQuestion}`, "", `Canonical: ${page.canonicalUrl}`, "", "## Use", "",
    ...page.modules.flatMap((module) => [module.heading ? `### ${module.heading}` : `### ${module.kind}`, ...module.paragraphs, ...module.informationObjects.map((item) => `- ${item.title}: ${item.body}`), ""]),
    "## Related", "", ...page.internalPageIds.map((id) => `- ${id}`), ""].join("\n");
}
function renderSitemap(pages: readonly PageIR[]): string {
  const urls = pages.filter((page) => page.indexable).map((page) => `<url><loc>${escapeHtml(page.canonicalUrl)}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}
function buildDependencyIndex(pages: readonly PageIR[]): ReadonlyMap<string, readonly string[]> {
  const index = new Map<string, Set<string>>();
  for (const page of pages) for (const dependency of page.dependencyIds) {
    const values = index.get(dependency) ?? new Set<string>(); values.add(page.id); index.set(dependency, values);
  }
  return new Map([...index.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, values]) => [id, [...values].sort()] as const));
}
function stableRecord<T extends Record<string, unknown>>(value: T): T { return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) as T; }
function uniqueSorted<T extends string>(values: readonly T[]): T[] { return [...new Set(values)].sort() as T[]; }
function normalizeRoute(route: string): string { const normalized = `/${route}`.replace(/\/{2,}/g, "/").replace(/\/$/, ""); return normalized || "/"; }
function assertUnique(items: readonly { id: string }[], label: string): void { const seen = new Set<string>(); for (const item of items) { if (seen.has(item.id)) throw new Error(`duplicate ${label} id: ${item.id}`); seen.add(item.id); } }
function required<K, V>(map: ReadonlyMap<K, V>, key: K, context: string): V { const value = map.get(key); if (value === undefined) throw new Error(`missing reference ${String(key)} in ${context}`); return value; }
function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
