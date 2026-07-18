# 21 — Vector-to-Agent Page Generation Job Compiler

Status: canonical operating-model correction; implementation pending
Updated: 2026-07-17

## Correction

The coding agent **does write and build the pages**.

The framework is not limited to selecting a finished document from a fixed set. It constructs a high-dimensional prospect/context space, chooses valuable page coordinates, then compiles each accepted coordinate into a bounded `PageGenerationJob` executed by one or more specialized agents.

The precise boundary is:

```text
HRR/HDC/vector math alone does not author persuasive copy.
The agent, operating on vector-derived jobs and framework tools, authors the site.
```

Therefore the end-to-end framework is both:

1. a vector-native corpus planner and validator; and
2. an agentic page/content/UI generation system.

## Canonical generation pipeline

```text
user business + brand + assets + goals
-> governed source/evidence/asset ledgers
-> ontology and prospect-context dimensions
-> many coherent context vectors/prototypes
-> context × offer/service/topic/utility candidate coordinates
-> eligibility, relevance, evidence, distinctness, coverage, cost selection
-> accepted PageGenerationJobs
-> specialized agent generation passes
-> semantic modules + utilities + task surfaces + UI plans
-> deterministic compilation and validation
-> static/interactive page emissions
```

`site-manifest.yaml` is compiled project state, not the primary human interface. A repository-aware agent creates and maintains it from the user's materials and the framework's research/validation outputs.

## Prospect-context vectors

A prospect-context vector may combine attributes that appear unrelated in a conventional keyword map:

```text
contractor + homeowner + married + dog owner
contractor + divorced + homeowner + cat owner
carpenter + late twenties + music fan + renter
```

These combinations are not automatically page-worthy. They become candidates because the joint context may alter:

- the problem framing;
- priorities and objections;
- examples and language;
- schedule or workflow constraints;
- service/offer fit;
- proof requirements;
- utility or public AI Employee task;
- CTA and conversion path;
- visual hierarchy or interaction needs.

Use the more precise term **prospect-context attributes** rather than assuming every axis is a classical demographic. Candidate axes may include occupation, household/life stage, property status, pets, interests, location, schedule, device/software environment, task, risk, decision stage, and desired outcome.

### Safety and policy boundary

Do not covertly infer or target named people, protected traits, sensitive conditions, private history, or fingerprint-derived identities. Attributes such as age or marital status require vertical-specific policy review, especially for housing, employment, finance, healthcare, or other regulated opportunity surfaces.

The normal publishing mode is **build-time cohort materialization**: stable pages for reviewable context archetypes. It is not crawler-specific output or invisible individualized SEO content.

## Page coordinate

A page concept is not a context vector alone. It is a structured coordinate:

```text
PageCoordinate =
  ProspectContextPrototypeSet
  × Intent
  × ServiceOrOffer
  × TopicOrProblem
  × WorkflowOrIntegration
  × InformationOrUtilityObject
  × EvidenceBoundary
  × DesiredOutcome
  × ConversionPath
```

Multiple prospect prototypes may map to one page when the answer, utility, proof, and conversion path are materially the same.

One prospect prototype may map to several pages when the intent or information object is genuinely different, for example:

```text
painting contractor + QuickBooks + estimate workflow
  -> how-to article
  -> live estimate generator
  -> QuickBooks integration page
  -> comparison page
  -> managed AI Employee offer page
```

The optimizer must decide whether to split or consolidate. It must not blindly emit the Cartesian product.

## PageGenerationJob

The missing first-class bridge between vector geometry and the coding agent is a typed generation job.

```ts
interface PageGenerationJob {
  jobId: string;
  pageId: string;
  route: string;

  targetPrototypes: PrototypeRef[];
  canonicalQuestion: string;
  intent: IntentRef;
  serviceOfferIds: string[];
  topicProblemIds: string[];
  workflowIntegrationIds: string[];
  desiredOutcomeIds: string[];

  contextAttributes: FeatureAtom[];
  contextRationale: string;
  excludedContexts: FeatureAtom[][];

  informationObjectIds: string[];
  utilityOrTaskContractIds: string[];
  evidenceIds: string[];
  allowedClaimIds: string[];
  prohibitedClaimIds: string[];

  requiredModuleKinds: ModuleKind[];
  requiredGraphEdges: TypedEdgeProposal[];
  cannibalizationExclusions: string[];

  brandPackId: string;
  designCapabilityIds: string[];
  assetIds: string[];
  conversionPathId: string;

  publicationGate: "research" | "reviewed" | "approved";
  generationPlan: GenerationPass[];
  validationPlan: ValidationGate[];
}
```

The job is derived from the vector space and evidence graph. It is not an unconstrained prompt.

## Specialized generation passes

A job may be executed by one agent with several skills or by multiple bounded workers:

1. **Research pass** — verifies context, terminology, demand evidence, competitors, sources, and missing proof.
2. **Concept pass** — resolves canonical question, information gain, utility, split/consolidate decision, and page role.
3. **Content pass** — writes evidence-bounded semantic modules for the exact prospect prototypes.
4. **Utility/task pass** — creates calculators, templates, datasets, public AI Employee task contracts, or interactive tools.
5. **SEO/graph pass** — metadata, structured data, entity relationships, typed internal links, canonical boundaries, and sitemap state.
6. **UI metaprogramming pass** — maps semantic modules, vectors, brand assets, and design capabilities into components/layouts.
7. **Critic pass** — checks thinness, demographic stereotyping, factual drift, duplicate intent, weak utility, accessibility, and conversion coherence.
8. **Compiler repair pass** — responds to machine-readable failures until the job passes or is rejected.

All passes operate on typed state and produce reviewable diffs.

## Content specificity

The page agent should use the full prototype set when deciding:

- which pain is foregrounded;
- which examples feel native;
- which objections are answered;
- which vocabulary and technical depth are appropriate;
- which proof is most credible;
- which utility is useful;
- which offer or CTA is natural;
- which modules and media are necessary.

This permits content that is specifically written for a coherent archetype rather than generic copy with nouns substituted.

### Bad generation

```text
"AI estimates for contractors"
-> replace contractor with carpenter
-> replace city
-> keep identical answer, proof, utility, and CTA
```

### Good generation

```text
carpenter + renter + late-twenties + music fan
+ custom built-ins inquiry + evening lead response

-> examples based on irregular custom-work scopes
-> mobile-first intake because work happens on-site
-> photo/measurement checklist
-> fast after-hours lead qualification
-> estimate assumptions for custom materials
-> public task that converts notes/photos into a draft scope
-> CTA to start a free employee that handles inquiry-to-estimate workflow
```

The identity attributes matter only when they change useful content or task design. Unsupported stereotypes fail validation.

## Scale model

The agent may create hundreds or thousands of `PageGenerationJob` candidates. The framework should only materialize the subset that passes:

```text
hard eligibility
+ independent context support
+ semantic compatibility
+ distinct information/utility
+ evidence sufficiency
+ marginal corpus coverage
+ duplicate/cannibalization limits
+ graph usefulness
+ lifecycle cost/value
+ human review
```

Performance matters because the agent repeatedly:

- generates and revises large candidate sets;
- scores many context/page prototype combinations;
- recalculates marginal coverage after each accepted page;
- checks duplicate matrices and graph topology;
- compiles affected page families;
- runs validation and repair loops.

This is the strongest justification for native/Wasm SIMD kernels. The kernel accelerates the geometry and optimization loop while the agent performs research, writing, coding, and design work.

## Static pages and runtime personalization

The framework supports two distinct outputs:

### Build-time hyper-targeted corpus

Hundreds or thousands of stable canonical pages generated for accepted prospect-context coordinates.

### Optional visitor-time adaptation

Finite, noncanonical variations or explicit task-session behavior may be selected for known, consented, low-risk context. They may not change primary truth, canonical intent, evidence, price, or publication state.

The first is the core search-distribution strategy. The second is optional and separately governed.

## Validation vectors

### Generation-job vector

Measure:

- context/prototype traceability;
- independent context support;
- information-object uniqueness;
- evidence and claim validity;
- content specificity to the target conjunction;
- stereotype or unsupported inference rate;
- duplicate/cannibalization similarity;
- graph/path usefulness;
- utility/task distinctness;
- conversion-path coherence;
- UI capability satisfaction;
- generation cost and repair count.

### Pass

- every emitted page originates from an accepted `PageGenerationJob`;
- every job references one or more explicit prospect-context prototypes;
- generated modules visibly use the joint context rather than isolated nouns;
- each page has distinct information, utility, proof, workflow, or decision value;
- agents cannot exceed allowed evidence or silently invent demographic facts;
- the full corpus improves held-out context coverage relative to simpler planning baselines;
- static HTML remains complete and consistent with the job;
- generation is reproducible from versioned inputs and agent records.

### Fail

- vector combinations are generated solely because they are mathematically possible;
- marital, age, pet, music, or property attributes appear without changing useful content;
- pages stereotype or manipulate groups;
- the generation agent manufactures the contexts that validate its own page;
- pages are title/location/noun swaps;
- the same generic chatbot is presented as distinct utility;
- a page cannot explain why it exists relative to neighboring pages;
- browser/crawler or visitor variants receive materially different canonical truth;
- raw page count is treated as success.

## Immediate implementation implication

The framework's next orchestration layer should compile:

```text
ProjectInput
-> ContextCorpus
-> Ontology/VectorSpace
-> CandidatePageCoordinates
-> SelectedCorpusPlan
-> PageGenerationJobs
-> Agent-generated modules/utilities/UI
-> Manifest/SiteSource/PageIR
-> emissions
```

The current manifest compiler begins near the end of that lifecycle. It must become the deterministic backend of the larger agent-operated generation system, not the place where users manually begin.