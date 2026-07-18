import { sha256 } from "./core.js";
import type { LayoutRole, ModuleKind } from "./framework.js";
import type { ManifestFeatureAtom, ManifestPrototype } from "./manifest.js";
import type { DesignCapability } from "./benchmark.js";
import type { NormalizedProject } from "./project-input.js";
import type { SelectedCorpusPlan } from "./corpus-plan.js";
import { JOB_VALIDATION, ORCHESTRATION_VALIDATION, RUN_VALIDATION, coordinateSimilarity } from "./page-coordinate.js";
import type { TypedGraphEdge } from "./typed-graph.js";
import { buildValidationReport, finding, type ValidationFinding, type ValidationReport } from "./validation-contracts.js";

export type GenerationPassName = "research" | "concept" | "content" | "utility-task" | "seo-graph" | "ui" | "critic" | "repair";
export interface PageGenerationJob {
  jobId: string;
  pageId: string;
  route: string;
  targetPrototypes: readonly ManifestPrototype[];
  primaryPrototypeId: string;
  canonicalQuestion: string;
  intent: string;
  serviceOfferIds: readonly string[];
  topicProblemIds: readonly string[];
  workflowIntegrationIds: readonly string[];
  desiredOutcomeIds: readonly string[];
  contextAttributes: readonly ManifestFeatureAtom[];
  excludedContexts: readonly (readonly ManifestFeatureAtom[])[];
  informationObjectIds: readonly string[];
  utilityOrTaskContractIds: readonly string[];
  evidenceIds: readonly string[];
  allowedClaimIds: readonly string[];
  prohibitedClaimIds: readonly string[];
  requiredModuleKinds: readonly ModuleKind[];
  requiredLayoutRoles: readonly LayoutRole[];
  requiredGraphEdges: readonly TypedGraphEdge[];
  cannibalizationExclusions: readonly string[];
  brandPackId: string;
  designCapabilityIds: readonly DesignCapability[];
  assetIds: readonly string[];
  conversionPathId: string;
  publicationGate: "research";
  generationPlan: readonly GenerationPassName[];
  validationAttributeIds: readonly string[];
  sourceIds: readonly string[];
  validation: ValidationReport;
  jobHash: string;
}
export interface AgentPassRequest { job: PageGenerationJob; pass: GenerationPassName; attempt: number; priorOutputs: readonly AgentPassOutput[]; failureContext?: readonly ValidationFinding[]; }
export interface AgentPassOutput { pass: GenerationPassName; status: "pass" | "fail"; summary: string; artifacts: Readonly<Record<string, unknown>>; usedSourceIds: readonly string[]; findings: readonly ValidationFinding[]; outputHash?: string; }
export interface AgentPassExecutor { id: string; execute(request: AgentPassRequest): Promise<AgentPassOutput>; }
export interface GenerationRunEvent { sequence: number; pass: GenerationPassName; attempt: number; state: "started" | "passed" | "failed" | "repair-started" | "repaired" | "rejected"; detail: string; }
export interface GenerationRunResult { jobId: string; executorId: string; status: "completed" | "rejected"; outputs: readonly AgentPassOutput[]; events: readonly GenerationRunEvent[]; checkpointHashes: readonly string[]; validation: ValidationReport; runHash: string; }

export function compilePageGenerationJobs(
  project: NormalizedProject,
  plan: SelectedCorpusPlan,
  options: { allowedClaimIds?: readonly string[]; prohibitedClaimIds?: readonly string[]; cannibalizationThreshold?: number } = {},
): PageGenerationJob[] {
  const selectedIds = new Set(plan.selected.map((item) => item.id));
  const evidenceById = new Map(project.evidenceLedger.map((item) => [item.id, item]));
  const sourceIds = new Set(project.sourceLedger.map((item) => item.id));
  const assetIds = new Set(project.assetLedger.map((item) => item.id));

  return plan.selected.map((coordinate) => {
    const primary = required(new Map(coordinate.prototypes.map((item) => [item.id, item])), coordinate.primaryPrototypeId);
    const jobSourceIds = new Set(coordinate.sourceIds);
    for (const evidenceId of coordinate.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) throw new Error(`coordinate ${coordinate.id} references unknown evidence ${evidenceId}`);
      for (const sourceId of evidence.sourceIds) jobSourceIds.add(sourceId);
    }
    for (const sourceId of jobSourceIds) if (!sourceIds.has(sourceId)) throw new Error(`coordinate ${coordinate.id} references unknown source ${sourceId}`);
    const boundedAssetIds = project.assetLedger.filter((item) => item.rights !== "unknown").map((item) => item.id).sort();
    for (const assetId of boundedAssetIds) if (!assetIds.has(assetId)) throw new Error(`unknown asset ${assetId}`);

    const canonical = {
      jobId: `job:${coordinate.id}`,
      pageId: coordinate.id,
      route: coordinate.route,
      targetPrototypes: coordinate.prototypes,
      primaryPrototypeId: coordinate.primaryPrototypeId,
      canonicalQuestion: coordinate.canonicalQuestion,
      intent: coordinate.intent,
      serviceOfferIds: coordinate.serviceOfferIds,
      topicProblemIds: coordinate.topicProblemIds,
      workflowIntegrationIds: coordinate.workflowIntegrationIds,
      desiredOutcomeIds: coordinate.desiredOutcomeIds,
      contextAttributes: primary.feature_atoms,
      excludedContexts: coordinate.eligibility.excludedAtomSets,
      informationObjectIds: coordinate.informationObjectIds,
      utilityOrTaskContractIds: coordinate.utilityOrTaskContractIds,
      evidenceIds: coordinate.evidenceIds,
      allowedClaimIds: [...(options.allowedClaimIds ?? [])].sort(),
      prohibitedClaimIds: [...(options.prohibitedClaimIds ?? [])].sort(),
      requiredModuleKinds: coordinate.requiredModuleKinds,
      requiredLayoutRoles: coordinate.requiredLayoutRoles,
      requiredGraphEdges: coordinate.graphEdges.filter((edge) => selectedIds.has(edge.fromPageId) && selectedIds.has(edge.toPageId)),
      cannibalizationExclusions: plan.selected.filter((item) => item.id !== coordinate.id && coordinateSimilarity(coordinate, item) >= (options.cannibalizationThreshold ?? 0.9)).map((item) => item.id).sort(),
      brandPackId: `${project.input.id}:brand`,
      designCapabilityIds: coordinate.requiredCapabilities,
      assetIds: boundedAssetIds,
      conversionPathId: coordinate.conversionPathId,
      publicationGate: "research" as const,
      generationPlan: ["research", "concept", "content", "utility-task", "seo-graph", "ui", "critic"] as const,
      validationAttributeIds: ORCHESTRATION_VALIDATION.map((item) => item.id),
      sourceIds: [...jobSourceIds].sort(),
    };
    const validation = buildValidationReport(`generation-job:${coordinate.id}`, JOB_VALIDATION, [
      finding("coordinate.primary", coordinate.prototypes.some((item) => item.id === coordinate.primaryPrototypeId) ? "pass" : "fail", "job retains explicit primary"),
      finding("coordinate.eligibility", coordinate.contextCompatibility.some((item) => item.eligible) ? "pass" : "fail", "job originates from eligible coordinate"),
      finding("coordinate.specificity", coordinate.informationObjectIds.length > 0 && coordinate.evidenceIds.length > 0 ? "pass" : "fail", "job binds evidence and information/utility"),
      finding("selection.coverage", "pass", "job originates from selected corpus"),
      finding("selection.balance", "pass", "selection objectives recorded"),
      finding("job.contract", canonical.sourceIds.length > 0 && canonical.generationPlan.length > 0 && canonical.publicationGate === "research" ? "pass" : "fail", "typed noindex generation job complete"),
    ]);
    return { ...canonical, validation, jobHash: sha256(JSON.stringify({ ...canonical, validationHash: validation.reportHash })) };
  }).sort((left, right) => left.jobId.localeCompare(right.jobId));
}

export async function runPageGenerationJob(
  job: PageGenerationJob,
  executor: AgentPassExecutor,
  options: { maximumRepairAttempts: number } = { maximumRepairAttempts: 1 },
): Promise<GenerationRunResult> {
  if (!executor.id.trim()) throw new Error("agent executor ID is required");
  if (!Number.isInteger(options.maximumRepairAttempts) || options.maximumRepairAttempts < 0) throw new Error("maximumRepairAttempts must be a non-negative integer");
  const outputs: AgentPassOutput[] = [];
  const events: GenerationRunEvent[] = [];
  const hashes: string[] = [];
  let sequence = 0;
  let rejected = false;

  for (const pass of job.generationPlan) {
    let attempt = 0;
    while (attempt <= options.maximumRepairAttempts) {
      events.push({ sequence: sequence++, pass, attempt, state: "started", detail: `starting ${pass}` });
      const output = canonicalOutput(await executor.execute({ job, pass, attempt, priorOutputs: outputs }));
      validateOutput(job, pass, output);
      outputs.push(output);
      hashes.push(output.outputHash!);
      if (output.status === "pass" && !hardFailure(output.findings)) {
        events.push({ sequence: sequence++, pass, attempt, state: "passed", detail: output.summary });
        break;
      }
      events.push({ sequence: sequence++, pass, attempt, state: "failed", detail: output.summary });
      if (attempt >= options.maximumRepairAttempts) {
        events.push({ sequence: sequence++, pass, attempt, state: "rejected", detail: "repair budget exhausted" });
        rejected = true;
        break;
      }
      events.push({ sequence: sequence++, pass: "repair", attempt, state: "repair-started", detail: `repairing ${pass}` });
      const repair = canonicalOutput(await executor.execute({ job, pass: "repair", attempt, priorOutputs: outputs, failureContext: output.findings }));
      validateOutput(job, "repair", repair);
      outputs.push(repair);
      hashes.push(repair.outputHash!);
      if (repair.status !== "pass" || hardFailure(repair.findings)) {
        events.push({ sequence: sequence++, pass: "repair", attempt, state: "rejected", detail: repair.summary });
        rejected = true;
        break;
      }
      events.push({ sequence: sequence++, pass: "repair", attempt, state: "repaired", detail: repair.summary });
      attempt += 1;
    }
    if (rejected) break;
  }

  const completed = new Set(outputs.filter((item) => item.status === "pass" && item.pass !== "repair").map((item) => item.pass));
  const complete = job.generationPlan.every((pass) => completed.has(pass));
  const validation = buildValidationReport(`generation-run:${job.jobId}`, RUN_VALIDATION, [
    finding("coordinate.primary", job.targetPrototypes.some((item) => item.id === job.primaryPrototypeId) ? "pass" : "fail", "primary retained"),
    finding("coordinate.eligibility", "pass", "eligibility resolved before job"),
    finding("coordinate.specificity", job.informationObjectIds.length > 0 ? "pass" : "fail", "information/utility present"),
    finding("selection.coverage", "pass", "selected plan origin"),
    finding("selection.balance", "pass", "selection objectives recorded"),
    finding("job.contract", "pass", "deterministic noindex job"),
    finding("runner.checkpoints", complete && !rejected ? "pass" : "fail", complete && !rejected ? `${job.generationPlan.length} passes completed` : "generation rejected or incomplete"),
  ]);
  const canonical = { jobId: job.jobId, executorId: executor.id, status: rejected || !complete ? "rejected" : "completed", outputs, events, checkpointHashes: hashes, validationHash: validation.reportHash };
  return { ...canonical, status: canonical.status as "completed" | "rejected", validation, runHash: sha256(JSON.stringify(canonical)) };
}

function canonicalOutput(output: AgentPassOutput): AgentPassOutput { const canonical = { pass: output.pass, status: output.status, summary: output.summary, artifacts: Object.fromEntries(Object.entries(output.artifacts).sort(([left], [right]) => left.localeCompare(right))), usedSourceIds: [...new Set(output.usedSourceIds)].sort(), findings: [...output.findings].sort((left, right) => left.attributeId.localeCompare(right.attributeId)) }; return { ...canonical, outputHash: output.outputHash ?? sha256(JSON.stringify(canonical)) }; }
function validateOutput(job: PageGenerationJob, expected: GenerationPassName, output: AgentPassOutput): void { if (output.pass !== expected) throw new Error(`executor returned ${output.pass} for ${expected}`); if (!output.summary.trim() || output.findings.length === 0) throw new Error(`pass ${expected} requires summary and findings`); const sources = new Set(job.sourceIds); for (const id of output.usedSourceIds) if (!sources.has(id)) throw new Error(`pass ${expected} used undeclared source ${id}`); const attributes = new Set(job.validationAttributeIds); for (const item of output.findings) if (!attributes.has(item.attributeId)) throw new Error(`pass ${expected} returned undeclared validation attribute ${item.attributeId}`); }
function hardFailure(findings: readonly ValidationFinding[]): boolean { const ids = new Set(ORCHESTRATION_VALIDATION.filter((item) => item.severity === "hard").map((item) => item.id)); return findings.some((item) => item.state === "fail" && ids.has(item.attributeId)); }
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V { const value = map.get(key); if (value === undefined) throw new Error(`missing ${String(key)}`); return value; }
