import { fitIsotonicCalibration, freezeContextCorpus, type CalibrationObservation, type CompatibilityCalibration, type ContextCorpus, type ContextCorpusCase, type SplitPolicy } from "./context-corpus.js";
import { selectCorpusPlan, type CorpusSelectionOptions, type SelectedCorpusPlan } from "./corpus-plan.js";
import { buildFrameworkPreview, renderFrameworkPreviewHtml, type FrameworkPreviewModel } from "./framework-preview.js";
import { compilePageCoordinates, type CandidatePageSeed, type PageCoordinate } from "./page-coordinate.js";
import { compilePageGenerationJobs, runPageGenerationJob, type AgentPassExecutor, type GenerationRunResult, type PageGenerationJob } from "./page-generation.js";
import type { FrameworkManifest } from "./manifest.js";
import { normalizeProjectInput, type NormalizedProject, type ProjectInput } from "./project-input.js";
import { sha256 } from "./core.js";
import { assertValidationPass, type ValidationReport } from "./validation-contracts.js";

export interface FrameworkGroundworkInput { project:ProjectInput; manifest:FrameworkManifest; contextCorpus:{id:string;version:string;cases:readonly ContextCorpusCase[];splitPolicy:SplitPolicy;generationAgentId?:string}; calibrationObservations:readonly CalibrationObservation[]; candidateSeeds:readonly CandidatePageSeed[]; selection:CorpusSelectionOptions; claims?:{allowed?:readonly string[];prohibited?:readonly string[]}; }
export interface PreparedFrameworkProject { project:NormalizedProject; contextCorpus:ContextCorpus; calibration:CompatibilityCalibration; coordinates:readonly PageCoordinate[]; selectedCorpus:SelectedCorpusPlan; generationJobs:readonly PageGenerationJob[]; checkpointHashes:Readonly<Record<string,string>>; validationReports:readonly ValidationReport[]; preparedHash:string; }
export interface ExecutedFrameworkProject extends PreparedFrameworkProject { generationRuns:readonly GenerationRunResult[]; preview:FrameworkPreviewModel; previewHtml:string; executionHash:string; }

export function prepareFrameworkProject(input:FrameworkGroundworkInput):PreparedFrameworkProject{
  const project=normalizeProjectInput(input.project);assertValidationPass(project.validation);
  const contextCorpus=freezeContextCorpus(input.contextCorpus.id,input.contextCorpus.version,input.contextCorpus.cases,input.contextCorpus.splitPolicy,input.contextCorpus.generationAgentId);assertValidationPass(contextCorpus.validation);
  const calibration=fitIsotonicCalibration(`${project.input.id}:compatibility`,input.calibrationObservations);assertValidationPass(calibration.validationReport);
  const coordinates=compilePageCoordinates(input.manifest,contextCorpus,calibration,input.candidateSeeds);for(const coordinate of coordinates)assertValidationPass(coordinate.validation);
  const selectedCorpus=selectCorpusPlan(project,contextCorpus,coordinates,input.selection);assertValidationPass(selectedCorpus.validation);assertValidationPass(selectedCorpus.typedGraph.validation);
  const generationJobs=compilePageGenerationJobs(project,selectedCorpus,{...(input.claims?.allowed===undefined?{}:{allowedClaimIds:input.claims.allowed}),...(input.claims?.prohibited===undefined?{}:{prohibitedClaimIds:input.claims.prohibited})});for(const job of generationJobs)assertValidationPass(job.validation);
  const checkpointHashes={project:project.projectHash,corpus:contextCorpus.corpusHash,calibration:calibration.model.modelHash,coordinates:sha256(JSON.stringify(coordinates.map((x)=>[x.id,x.candidateHash]))),selectedCorpus:selectedCorpus.planHash,generationJobs:sha256(JSON.stringify(generationJobs.map((x)=>[x.jobId,x.jobHash])))};
  const validationReports=[project.validation,contextCorpus.validation,calibration.validationReport,...coordinates.map((x)=>x.validation),selectedCorpus.validation,selectedCorpus.typedGraph.validation,...generationJobs.map((x)=>x.validation)];const canonical={projectId:project.input.id,checkpointHashes,validationHashes:validationReports.map((x)=>x.reportHash)};
  return{project,contextCorpus,calibration,coordinates,selectedCorpus,generationJobs,checkpointHashes,validationReports,preparedHash:sha256(JSON.stringify(canonical))};
}
export async function executeFrameworkProject(prepared:PreparedFrameworkProject,executor:AgentPassExecutor,options:{maximumRepairAttempts?:number}={}):Promise<ExecutedFrameworkProject>{const generationRuns:GenerationRunResult[]=[];for(const job of prepared.generationJobs)generationRuns.push(await runPageGenerationJob(job,executor,{maximumRepairAttempts:options.maximumRepairAttempts??1}));const preview=buildFrameworkPreview(prepared.project,prepared.contextCorpus,prepared.selectedCorpus,prepared.generationJobs,generationRuns,[prepared.calibration.validationReport,prepared.selectedCorpus.typedGraph.validation]);assertValidationPass(preview.validation);const previewHtml=renderFrameworkPreviewHtml(preview);const canonical={preparedHash:prepared.preparedHash,runHashes:generationRuns.map((x)=>x.runHash),previewHash:preview.previewHash,previewHtmlHash:sha256(previewHtml)};return{...prepared,generationRuns,preview,previewHtml,executionHash:sha256(JSON.stringify(canonical))};}
