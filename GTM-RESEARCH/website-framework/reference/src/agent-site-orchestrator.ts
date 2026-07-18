import type { VectorSpaceIdentity } from "./benchmark.js";
import { sha256 } from "./core.js";
import { compileApprovedOntology, type AgentOntologyProposal, type ApprovedOntology, type OntologyCompilerPolicy } from "./ontology-discovery.js";
import { compileOntologyGraph, type CompiledOntologyGraph, type OntologyGraphPolicy } from "./ontology-graph.js";
import { compileOpportunitySpace, type CompiledOpportunitySpace, type OpportunitySpacePolicy } from "./opportunity-space.js";
import { normalizeProjectInput, type NormalizedProject, type ProjectInput } from "./project-input.js";
import { compilePageConceptProposals, compileSiteGenerationPlan, type CompiledPageConcepts, type PageConceptProposal, type SiteGenerationPlan, type SiteGenerationPolicy } from "./site-program.js";
import { assertValidationPass, type ValidationReport } from "./validation-contracts.js";

export interface AgentSiteDiscoveryInput {
  project: ProjectInput;
  ontologyProposal: AgentOntologyProposal;
  vectorIdentity: VectorSpaceIdentity;
  ontologyPolicy?: OntologyCompilerPolicy;
  graphPolicy?: OntologyGraphPolicy;
  opportunityPolicy?: OpportunitySpacePolicy;
  siteGenerationPolicy?: SiteGenerationPolicy;
}

export interface PreparedAgentSiteProgram {
  project: NormalizedProject;
  ontology: ApprovedOntology;
  graph: CompiledOntologyGraph;
  opportunitySpace: CompiledOpportunitySpace;
  siteGenerationPlan: SiteGenerationPlan;
  validationReports: readonly ValidationReport[];
  checkpointHashes: Readonly<Record<string, string>>;
  preparedHash: string;
}

export interface CompiledAgentSiteProgram extends PreparedAgentSiteProgram {
  pageConcepts: CompiledPageConcepts;
  compiledHash: string;
}

export function prepareAgentSiteProgram(input: AgentSiteDiscoveryInput): PreparedAgentSiteProgram {
  const project = normalizeProjectInput(input.project);
  assertValidationPass(project.validation);
  const ontology = compileApprovedOntology(project, input.ontologyProposal, input.ontologyPolicy);
  assertValidationPass(ontology.validation);
  const graph = compileOntologyGraph(ontology, input.graphPolicy);
  assertValidationPass(graph.validation);
  const opportunitySpace = compileOpportunitySpace(project, ontology, graph, input.vectorIdentity, input.opportunityPolicy);
  assertValidationPass(opportunitySpace.validation);
  assertValidationPass(opportunitySpace.selected.validation);
  const siteGenerationPlan = compileSiteGenerationPlan(project, ontology, opportunitySpace.selected, input.siteGenerationPolicy);
  assertValidationPass(siteGenerationPlan.validation);
  const validationReports = [project.validation, ontology.validation, graph.validation, opportunitySpace.validation, opportunitySpace.selected.validation, siteGenerationPlan.validation];
  const checkpointHashes = {
    project: project.projectHash,
    ontology: ontology.ontologyHash,
    graph: graph.graphHash,
    opportunitySpace: opportunitySpace.spaceHash,
    opportunitySelection: opportunitySpace.selected.selectionHash,
    siteGenerationPlan: siteGenerationPlan.planHash,
  };
  const canonical = { projectId: project.input.id, checkpointHashes, validationHashes: validationReports.map((report) => report.reportHash) };
  return { project, ontology, graph, opportunitySpace, siteGenerationPlan, validationReports, checkpointHashes, preparedHash: sha256(JSON.stringify(canonical)) };
}

export function compileAgentSiteProgram(
  prepared: PreparedAgentSiteProgram,
  proposals: readonly PageConceptProposal[],
  policy?: SiteGenerationPolicy,
): CompiledAgentSiteProgram {
  const pageConcepts = compilePageConceptProposals(prepared.siteGenerationPlan, prepared.ontology, proposals, policy);
  assertValidationPass(pageConcepts.validation);
  const canonical = { preparedHash: prepared.preparedHash, pageConceptCompilationHash: pageConcepts.compilationHash };
  return { ...prepared, pageConcepts, compiledHash: sha256(JSON.stringify(canonical)) };
}
