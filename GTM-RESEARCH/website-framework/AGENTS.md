# AGENTS.md — Website Framework Rules

Status: active  
Updated: 2026-07-17

## Read first

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `CODEGRAPH.md`
5. `README.md`
6. `memory/MEMORY.md`
7. newest immutable file under `memory/`
8. `23-groundwork-orchestration-implementation.md`
9. `22-agent-operated-framework-workflow-validation-matrix.md`
10. `21-vector-to-generation-job-compiler.md`
11. `20-agent-operated-vector-site-generation-and-wasm.md`
12. `18-vector-node-path-web-framework-model.md`
13. `19-vector-native-corrections-and-csi-validation.md`
14. newest validation report
15. `site-manifest.yaml`
16. `reference/README.md`
17. supplied design/product authorities when changing UI or interaction behavior

## Scope

This subtree is an agent-operated vector-native website-generation research framework. The groundwork orchestration is source-wired; production acceptance is not.

The coding agent is first-class at:

```text
project formation
  inspect -> normalize -> source/evidence/asset ledgers
  -> independent context corpus -> ontology/vector candidates -> selected corpus

page generation
  PageGenerationJob -> research -> concept -> content -> utility/task
  -> SEO/graph -> UI -> critic -> bounded repair/reject
```

`site-manifest.yaml` is downstream compiled corpus state. Users should not hand-author the vector space, page matrix, generation jobs, packed IR, or renderer plan.

## Groundwork path

Use the source path in this order:

```text
normalizeProjectInput
-> freezeContextCorpus
-> fitIsotonicCalibration
-> compilePageCoordinates
-> selectCorpusPlan
-> compilePageGenerationJobs
-> runPageGenerationJob / executeFrameworkProject
-> buildFrameworkPreview
-> current manifest/SiteSource/PageIR compiler
```

Never create a parallel manifest, context corpus, page-selection path, or agent runner.

## Validation rule

Every substantive feature, workflow stage, algorithm choice, agent/developer experience, UI behavior, runtime, publication step, and measurement path must define:

```text
feature
workflow step
algorithm choice
user effect
developer/agent effect
validation vector
pass vector
fail vector
simpler baseline
hard or soft severity
measured finding and evidence
```

Use `reference/src/validation-contracts.ts`. A hard failed report stops the orchestration. Pending or not-run state must remain visible; do not rewrite it as pass.

## ProjectInput and ledgers

- Project identity/version and project hash are required.
- Business purpose, at least one offer/service, and audience are hard requirements.
- Brand name, voice, palette, visual rules, and component rules must be explicit.
- Sources require stable IDs, retrieval dates, applicability, confidence, and normalized hashes.
- Assets require stable IDs, purpose/alt state, rights state, and hashes.
- Browser targets, deployment target, accessibility standard, and positive performance budgets must exist before UI generation.
- Page count is not a goal; outcomes and an initial corpus cap are required.

Do not invent business truth, pricing, proof, rights, or technical constraints.

## Context corpus and calibration

- Acceptance contexts must be independently sourced or field-derived.
- The page-generation agent cannot author its own sole acceptance cases.
- Each accepted context needs query/task, atoms, source IDs, positive weight, provenance, assessor identities, graded judgments, and rationale.
- Preserve Perfect/Good/Fair/Bad labels and disagreement.
- Freeze train/validation/test membership and split hashes before generation.
- Fit calibration on train only; validation and test remain evaluation-only.
- Run typed eligibility before similarity.
- Ineligible fit is exactly zero.
- Do not use shifted cosine as probability.
- Current synthetic fixture calibration is plumbing, not external relevance proof.

## Page coordinates and corpus selection

A candidate coordinate must bind:

```text
prospect-context prototype set
+ explicit primary prototype
+ intent
+ service/offer
+ problem/topic
+ workflow/integration
+ information or executable utility object
+ evidence boundary
+ desired outcome
+ conversion path
```

Rules:
- all declared prototypes survive;
- primary identity cannot depend on array order;
- eligibility and prohibited combinations precede scoring;
- evidence and information/utility objects are required;
- no Cartesian emission;
- selection uses a finite budget and reports train/validation/test coverage;
- duplicate and cannibalization rejection reasons remain visible;
- facility-location, information, rare-tail, diversity, and CSI arms must be distinguishable;
- test cases never tune selection.

## Typed graph

Published or generated edges require:
- stable ID;
- known source/destination pages;
- recognized type;
- rationale;
- source IDs;
- eligibility;
- priority.

Raw vector neighbors are candidate suggestions only. They do not become published links automatically.

## PageGenerationJob and agent execution

A job is a typed noindex contract, not a free-form prompt. It must contain sources, evidence, claims, prototypes, modules, graph requirements, cannibalization exclusions, brand/assets, design capabilities, conversion path, generation plan, validation plan, and stable hash.

Agent executors must:
- run ordered passes;
- use only declared sources;
- return declared validation attributes;
- emit checkpoint hashes and reviewable artifacts;
- use bounded repair;
- reject when the repair budget is exhausted;
- never silently publish.

Provider adapters for Codex, Claude Code, Pi, or another model must implement `AgentPassExecutor`; provider-specific state cannot become canonical framework truth.

## Preview and operator UX

Current semantic commands:

```bash
npm run framework:doctor
npm run framework:plan
npm run framework:validate
npm run framework:preview
```

The review artifact must expose:
- project and corpus identity;
- split counts;
- selected and rejected coordinates;
- rejection reasons;
- explicit primary prototypes;
- held-out coverage;
- generation status and hard failures;
- every validation report and hash.

Preview must work without production runtime or JavaScript.

## UI and public AI Employee rules

UI consumes semantic modules, page geometry, browser policy, capabilities, brand/assets, and publication state. It cannot alter canonical intent, prototypes, evidence, claims, graph semantics, indexability, metadata, accessibility, or JS-disabled completeness.

Public AI Employee execution remains a connected but separate interaction plane. A distinct task surface requires a static explanation/fallback, secure controls, explicit session streaming, typed artifact, approval/proof, recovery, and a materially distinct task or decision value.

## Performance and Wasm

Use TypeScript typed arrays as the oracle and compare Zig native scalar/SIMD and Zig Wasm scalar/SIMD on realistic full-loop workloads. Retain advanced kernels only when end-to-end gains survive startup, copying, memory, binary-size, debugging, and operational costs.

Canonical HTML must remain static and Wasm-free.

## Memory protocol

- `memory/MEMORY.md` is the cumulative TOON-style current-state index.
- Every substantial session creates `memory/YYYY-MM-DD-HHMM-<slug>.md`.
- Timestamped files are immutable. Never overwrite, repurpose, compress away, or refresh them.
- Add newest handoff first and reconcile current facts, proof, blockers, and next actions in `MEMORY.md`.
- Record exact branch, commit, CI run, artifact digest, hashes, validation not run, and remaining risks.

## Publication boundary

No page enters an indexable cohort until relevance, information gain, evidence, distinctness, utility/task, path, UI, accessibility, browser, crawl, canonical, lifecycle-cost, and publication gates pass.

Source tests and synthetic scale never prove indexing, ranking, AI citation, conversion, gross profit, revenue, or lifecycle return.
