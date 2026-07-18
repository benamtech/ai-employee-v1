import { sha256 } from "./core.js";
import {
  buildValidationReport,
  finding,
  type ValidationAttribute,
  type ValidationReport,
} from "./validation-contracts.js";

export type SourceKind = "company" | "customer" | "market" | "academic" | "regulatory" | "repository" | "asset";
export type ConfidenceLevel = "low" | "medium" | "high" | "verified";

export interface ProjectSourceInput {
  id: string;
  kind: SourceKind;
  title: string;
  summary: string;
  uri?: string;
  retrievedAt: string;
  freshnessDays?: number;
  applicability: readonly string[];
  confidence: ConfidenceLevel;
  contentHash?: string;
}

export interface ProjectAssetInput {
  id: string;
  kind: "logo" | "image" | "video" | "font-reference" | "design-file" | "document" | "dataset";
  pathOrUri: string;
  altOrPurpose: string;
  rights: "owned" | "licensed" | "public-domain" | "unknown";
  contentHash?: string;
}

export interface BrandInput {
  name: string;
  voice: readonly string[];
  prohibitedLanguage: readonly string[];
  palette: Readonly<Record<string, string>>;
  typography: readonly string[];
  visualRules: readonly string[];
  componentRules: readonly string[];
}

export interface BusinessInput {
  purpose: string;
  services: readonly string[];
  offers: readonly string[];
  audiences: readonly string[];
  locations: readonly string[];
  workflows: readonly string[];
  integrations: readonly string[];
  constraints: readonly string[];
  proofPoints: readonly string[];
  pricingFacts: readonly string[];
}

export interface TechnicalInput {
  repositoryRoot: string;
  framework: string;
  deploymentTarget: string;
  browserTargets: readonly string[];
  performanceBudgets: Readonly<Record<string, number>>;
  accessibilityStandard: string;
}

export interface ProjectGoals {
  primaryConversions: readonly string[];
  searchOutcomes: readonly string[];
  utilityOutcomes: readonly string[];
  publicationRiskTolerance: "low" | "medium" | "high";
  minimumInitialPages?: number;
  maximumInitialPages: number;
}

export interface ProjectInput {
  id: string;
  version: string;
  business: BusinessInput;
  brand: BrandInput;
  technical: TechnicalInput;
  goals: ProjectGoals;
  sources: readonly ProjectSourceInput[];
  assets: readonly ProjectAssetInput[];
}

export interface SourceLedgerEntry extends ProjectSourceInput { normalizedHash: string; }
export interface EvidenceLedgerEntry {
  id: string;
  sourceIds: readonly string[];
  statement: string;
  applicability: readonly string[];
  confidence: ConfidenceLevel;
  freshnessDays?: number;
}
export interface AssetLedgerEntry extends ProjectAssetInput { normalizedHash: string; }

export interface NormalizedProject {
  input: ProjectInput;
  sourceLedger: readonly SourceLedgerEntry[];
  evidenceLedger: readonly EvidenceLedgerEntry[];
  assetLedger: readonly AssetLedgerEntry[];
  missingInformation: readonly string[];
  contradictions: readonly string[];
  projectHash: string;
  validation: ValidationReport;
}

export const PROJECT_INPUT_VALIDATION: readonly ValidationAttribute[] = [
  { id: "project.identity", feature: "ProjectInput identity and versioning", workflowStep: "init", algorithmChoice: "canonical sorted serialization + SHA-256", userEffect: "the user can identify the exact project state being generated", developerEffect: "agents and CI can compare checkpoints without conversational ambiguity", validationVector: ["non-empty id", "non-empty version", "stable hash under source ordering"], passVector: ["same logical project produces same projectHash", "identity changes when canonical truth changes"], failVector: ["anonymous project", "hash depends on array ordering", "silent state replacement"], simplerBaseline: "unversioned JSON object", severity: "hard" },
  { id: "project.business", feature: "Business truth intake", workflowStep: "inspect", algorithmChoice: "typed normalized business contract", userEffect: "services, offers, audiences, workflows, and constraints remain reviewable", developerEffect: "generation jobs do not infer core business truth from prompts", validationVector: ["purpose", "services", "offers", "audiences", "constraints"], passVector: ["at least one service or offer", "purpose is explicit", "constraints are preserved"], failVector: ["empty business purpose", "no offer/service", "agent invents pricing or proof"], simplerBaseline: "free-form project brief", severity: "hard" },
  { id: "project.brand", feature: "Brand and design intake", workflowStep: "inspect", algorithmChoice: "typed brand pack", userEffect: "the generated site reflects supplied voice and visual constraints", developerEffect: "UI agents consume one stable design contract", validationVector: ["brand name", "voice", "palette", "visual rules", "component rules"], passVector: ["brand pack is non-empty", "prohibited language is explicit", "tokens are deterministic"], failVector: ["page-specific invented design system", "missing brand authority", "conflicting palette tokens"], simplerBaseline: "one visual-style prompt", severity: "hard" },
  { id: "project.sources", feature: "Source and evidence ledger", workflowStep: "research", algorithmChoice: "provenance-bearing immutable ledger", userEffect: "the user can see what supports each generated claim and page concept", developerEffect: "agents have bounded source IDs and freshness/applicability metadata", validationVector: ["unique source IDs", "retrieval date", "confidence", "applicability", "hash"], passVector: ["every source has stable identity", "duplicate IDs fail", "source order does not alter hash"], failVector: ["claim source exists only in prompt history", "missing provenance", "duplicate source IDs"], simplerBaseline: "URL list", severity: "hard" },
  { id: "project.assets", feature: "Asset ledger", workflowStep: "inspect", algorithmChoice: "rights-aware typed asset inventory", userEffect: "the user can review which assets are available and legally usable", developerEffect: "renderers receive stable asset IDs instead of guessed paths", validationVector: ["unique asset IDs", "purpose/alt", "rights", "hash"], passVector: ["unknown rights remain explicit", "all assets have stable IDs"], failVector: ["asset usage without rights state", "decorative asset guessed by agent", "duplicate IDs"], simplerBaseline: "assets folder scan", severity: "soft" },
  { id: "project.technical", feature: "Technical and performance contract", workflowStep: "doctor", algorithmChoice: "typed deployment/browser/budget profile", userEffect: "the site is generated for the actual runtime and browser audience", developerEffect: "CSS, rendering, and build decisions have explicit constraints", validationVector: ["framework", "deployment target", "browser targets", "budgets", "accessibility standard"], passVector: ["browser targets are non-empty", "budgets are finite and positive"], failVector: ["CSS generated before targets", "negative budgets", "deployment assumptions hidden"], simplerBaseline: "framework auto-detection only", severity: "hard" },
  { id: "project.goals", feature: "Project goals and one-shot site corpus bounds", workflowStep: "init", algorithmChoice: "typed conversion/search/utility outcomes with minimum and maximum page counts", userEffect: "the user can request a complete site-scale generation run while retaining an explicit upper bound", developerEffect: "ontology discovery and corpus planning must produce enough valid regions before page-generation API work starts", validationVector: ["conversion outcomes", "search outcomes", "utility outcomes", "risk tolerance", "minimum pages", "maximum pages"], passVector: ["at least one outcome", "positive finite bounds", "minimum <= maximum", "risk tolerance explicit"], failVector: ["page count is the only goal", "unbounded site generation", "minimum exceeds maximum", "no measurable outcome"], simplerBaseline: "generate until the agent stops", severity: "hard" },
];

export function normalizeProjectInput(input: ProjectInput): NormalizedProject {
  const missing: string[] = [];
  const contradictions: string[] = [];
  const findings = [];
  if (!input.id.trim() || !input.version.trim()) missing.push("project id/version");
  findings.push(finding("project.identity", missing.length === 0 ? "pass" : "fail", missing.length === 0 ? "project identity and version are present" : `missing ${missing.join(", ")}`));
  const hasBusiness = Boolean(input.business.purpose.trim()) && (input.business.services.length > 0 || input.business.offers.length > 0) && input.business.audiences.length > 0;
  findings.push(finding("project.business", hasBusiness ? "pass" : "fail", hasBusiness ? "business purpose, offer/service surface, and audience are declared" : "business purpose, at least one offer/service, and an audience are required"));
  const brandOk = Boolean(input.brand.name.trim()) && input.brand.voice.length > 0 && Object.keys(input.brand.palette).length > 0 && input.brand.visualRules.length > 0;
  findings.push(finding("project.brand", brandOk ? "pass" : "fail", brandOk ? "brand pack is complete enough for deterministic generation" : "brand name, voice, palette, and visual rules are required"));

  assertUnique(input.sources, "source");
  const sourceLedger = [...input.sources].sort((left, right) => left.id.localeCompare(right.id)).map((source) => ({ ...source, applicability: [...source.applicability].sort(), normalizedHash: source.contentHash ?? sha256(JSON.stringify(canonicalSource(source))) }));
  const sourcesValid = sourceLedger.length > 0 && sourceLedger.every((source) => Boolean(source.title.trim()) && Boolean(source.summary.trim()) && Boolean(source.retrievedAt.trim()) && source.applicability.length > 0 && Boolean(source.confidence));
  findings.push(finding("project.sources", sourcesValid ? "pass" : "fail", sourcesValid ? `${sourceLedger.length} sources normalized with provenance, applicability, and retrieval dates` : "at least one complete source with provenance, applicability, and retrieval date is required"));

  assertUnique(input.assets, "asset");
  const assetLedger = [...input.assets].sort((left, right) => left.id.localeCompare(right.id)).map((asset) => ({ ...asset, normalizedHash: asset.contentHash ?? sha256(JSON.stringify(canonicalAsset(asset))) }));
  const unknownRights = assetLedger.filter((asset) => asset.rights === "unknown").map((asset) => asset.id);
  findings.push(finding("project.assets", unknownRights.length === 0 ? "pass" : "pending", unknownRights.length === 0 ? `${assetLedger.length} assets have explicit rights state` : `rights review required for ${unknownRights.join(", ")}`));

  const budgets = Object.entries(input.technical.performanceBudgets);
  const technicalOk = Boolean(input.technical.framework.trim()) && Boolean(input.technical.deploymentTarget.trim()) && input.technical.browserTargets.length > 0 && budgets.every(([, value]) => Number.isFinite(value) && value > 0);
  findings.push(finding("project.technical", technicalOk ? "pass" : "fail", technicalOk ? "technical target, browser policy, accessibility standard, and budgets are explicit" : "technical target, browser policy, and positive finite budgets are required"));
  const outcomeCount = input.goals.primaryConversions.length + input.goals.searchOutcomes.length + input.goals.utilityOutcomes.length;
  const minimumInitialPages = input.goals.minimumInitialPages ?? 1;
  const goalsOk = outcomeCount > 0
    && Number.isInteger(minimumInitialPages)
    && minimumInitialPages > 0
    && Number.isInteger(input.goals.maximumInitialPages)
    && input.goals.maximumInitialPages >= minimumInitialPages;
  findings.push(finding("project.goals", goalsOk ? "pass" : "fail", goalsOk ? `${outcomeCount} outcomes declared with one-shot site bounds ${minimumInitialPages}..${input.goals.maximumInitialPages}` : "measurable outcomes and positive integer page bounds with minimum <= maximum are required"));

  if (input.business.pricingFacts.length === 0) missing.push("pricing facts");
  if (input.business.proofPoints.length === 0) missing.push("proof points");
  if (!Number.isInteger(minimumInitialPages) || minimumInitialPages < 1) contradictions.push("minimumInitialPages must be a positive integer");
  if (!Number.isInteger(input.goals.maximumInitialPages) || input.goals.maximumInitialPages < minimumInitialPages) contradictions.push("maximumInitialPages must be an integer greater than or equal to minimumInitialPages");
  const evidenceLedger: EvidenceLedgerEntry[] = sourceLedger.map((source) => ({ id: `evidence:${source.id}`, sourceIds: [source.id], statement: source.summary, applicability: [...source.applicability], confidence: source.confidence, ...(source.freshnessDays === undefined ? {} : { freshnessDays: source.freshnessDays }) }));
  const validation = buildValidationReport(`project:${input.id}`, PROJECT_INPUT_VALIDATION, findings);
  const canonical = { input: canonicalProjectInput(input), sourceLedger, evidenceLedger, assetLedger, missingInformation: [...missing].sort(), contradictions: [...contradictions].sort() };
  return { input: canonical.input, sourceLedger, evidenceLedger, assetLedger, missingInformation: canonical.missingInformation, contradictions: canonical.contradictions, projectHash: sha256(JSON.stringify(canonical)), validation };
}

function canonicalProjectInput(input: ProjectInput): ProjectInput {
  return {
    ...input,
    business: { ...input.business, services: sorted(input.business.services), offers: sorted(input.business.offers), audiences: sorted(input.business.audiences), locations: sorted(input.business.locations), workflows: sorted(input.business.workflows), integrations: sorted(input.business.integrations), constraints: sorted(input.business.constraints), proofPoints: sorted(input.business.proofPoints), pricingFacts: sorted(input.business.pricingFacts) },
    brand: { ...input.brand, voice: sorted(input.brand.voice), prohibitedLanguage: sorted(input.brand.prohibitedLanguage), palette: Object.fromEntries(Object.entries(input.brand.palette).sort(([left], [right]) => left.localeCompare(right))), typography: sorted(input.brand.typography), visualRules: sorted(input.brand.visualRules), componentRules: sorted(input.brand.componentRules) },
    technical: { ...input.technical, browserTargets: sorted(input.technical.browserTargets), performanceBudgets: Object.fromEntries(Object.entries(input.technical.performanceBudgets).sort(([left], [right]) => left.localeCompare(right))) },
    goals: { ...input.goals, minimumInitialPages: input.goals.minimumInitialPages ?? 1, primaryConversions: sorted(input.goals.primaryConversions), searchOutcomes: sorted(input.goals.searchOutcomes), utilityOutcomes: sorted(input.goals.utilityOutcomes) },
    sources: [...input.sources].sort((left, right) => left.id.localeCompare(right.id)).map((source) => ({ ...source, applicability: sorted(source.applicability) })),
    assets: [...input.assets].sort((left, right) => left.id.localeCompare(right.id)),
  };
}
function canonicalSource(source: ProjectSourceInput): object { return { ...source, applicability: sorted(source.applicability) }; }
function canonicalAsset(asset: ProjectAssetInput): object { return { ...asset }; }
function sorted(values: readonly string[]): string[] { return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(); }
function assertUnique(items: readonly { id: string }[], label: string): void { const seen = new Set<string>(); for (const item of items) { if (!item.id.trim()) throw new Error(`${label} id is required`); if (seen.has(item.id)) throw new Error(`duplicate ${label} id ${item.id}`); seen.add(item.id); } }
