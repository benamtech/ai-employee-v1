# Website-Framework Reference Package

Status: executable agent-discovered ontology front end, sparse 10,000-page site-program planner, vector-native compiler, and deterministic UI research reference; real providers, complete page generation, browser-scale acceptance, and field outcomes remain pending

## Primary paths

### Agent-discovered site program

```text
ProjectInput
-> AgentOntologyProposal
-> ApprovedOntology
-> sparse typed ontology graph
-> bounded opportunity candidates
-> ProductionOpportunitySpace
-> SiteGenerationPlan
-> Stage-2 PageConceptProposals
-> CandidatePageSeeds
-> existing coordinate/corpus/job/manifest/PageIR/UI path
```

`prepareAgentSiteProgram()` is the hard-gated entrypoint. It uses:

```text
compileApprovedOntology()
-> compileOntologyGraph()
-> compileProductionOpportunitySpace()
-> compileSparseSiteGenerationPlan()
```

`compileAgentSiteProgram()` then validates Stage-2 proposals and emits deterministic `CandidatePageSeed` objects.

The user supplies project truth and source material. The agents discover ontology and page concepts. The user does not author vector axes, page coordinates, matrices, or jobs.

### Existing independent-context orchestration

```text
ProjectInput
-> source/evidence/asset ledgers
-> independent ContextCorpus + frozen splits
-> isotonic compatibility calibration
-> explicit-primary PageCoordinates
-> finite SelectedCorpusPlan + typed graph
-> PageGenerationJobs
-> bounded provider-neutral agent runner
-> static framework preview
-> ../../site-manifest.yaml
-> SiteSource / PageIR / packed artifacts
-> static HTML, instruction, agent-context, and UI emissions
```

The two paths converge on the existing coordinate, graph, job, manifest, semantic IR, and renderer authorities.

## Workload contract

A site-generation **job** is one finite site project, not request-time serving.

```text
one project
one approved ontology/opportunity space
at least minimumInitialPages selected regions
one PageConceptJob per selected region
all Stage-2 batches
static/compiler outputs
```

The current synthetic scale fixture requires exactly 10,000 page-region jobs and creates 400 batches of 25.

## Commands

```bash
npm install
npm test
npm run framework:doctor
npm run framework:plan
npm run framework:validate
npm run framework:preview
npm run orchestration:check
npm run manifest:emit
npm run ui:emit
npm run browser:check
npm run ui:r3f:build
npm run benchmark:scale
```

## Package layers

| File | Authority |
|---|---|
| `validation-contracts.ts` | Cross-layer validation/pass/fail attributes, findings, severity, reports, hashes |
| `project-input.ts` | Business/brand/technical/goals, ledgers, and minimum/maximum site page bounds |
| `sparse-lexical.ts` | Deterministic tokenization, TF-IDF, BM25, postings, and lexical neighbors |
| `ontology-discovery.ts` | Stage-1 agent proposal approval, safety/materiality/duplicate gates, rejected ledgers |
| `ontology-graph.ts` | Multi-channel sparse graph, hard constraints, k-core pruning, macro-regions |
| `opportunity-space.ts` | Transparent reference opportunity generator/selector |
| `opportunity-generation-optimized.ts` | Cached constrained production candidate generator |
| `opportunity-space-optimized.ts` | Incremental sparse selection and packed HRR vectors |
| `opportunity-space-production.ts` | Production opportunity-space composition |
| `site-program.ts` | Stage-2 PageConceptJob/Proposal contracts and CandidatePageSeed compiler |
| `site-program-optimized.ts` | Bounded sparse page-neighbor retrieval and deterministic batching |
| `agent-site-orchestrator.ts` | End-to-end two-stage site-program entrypoint |
| `acceleration-decision.ts` | Evidence-gated TypeScript/Wasm promotion decision |
| `context-corpus.ts` | Independent contexts, assessors, graded labels, frozen splits, isotonic calibration |
| `typed-graph.ts` | Existing typed semantic page-edge and path compiler |
| `page-coordinate.ts` | Existing explicit-primary coordinates, eligibility, calibrated multi-prototype fit |
| `corpus-plan.ts` | Existing facility/information/rare/diversity finite-corpus selection |
| `page-generation.ts` | Existing typed noindex jobs and bounded provider-neutral agent runner |
| `framework-preview.ts` | Selected/rejected static review artifact |
| `framework-orchestrator.ts` | Existing context/calibration/corpus/job orchestration entrypoint |
| `manifest.ts` | Unified manifest parser/composer and legacy proposal path |
| `framework.ts` | Semantic/packed IR and neutral emissions |
| `ui-scaffold.ts`, `ui-metaprogramming.ts`, `ui-renderer.ts` | Deterministic static UI path |
| `wasm.ts`, `zig/` | Unaccepted numeric-kernel research arm |
| `resolver.ts`, `worker/` | Optional finite runtime research paths |
| `ui-r3f/` | Optional noncanonical visualization adapter |

## Agent ontology emissions

The Stage-1 compiler produces:

- approved attributes with normalized dimensions and material effects;
- rejected attributes with explicit reasons;
- accepted and rejected typed relations;
- accepted and rejected weighted observations;
- deterministic sparse lexical index;
- typed sparse graph and hard constraints;
- core numbers, active/pruned nodes, and macro-regions;
- bounded opportunity candidates;
- selected regions and packed vectors;
- validation reports and checkpoint hashes.

The site-program compiler produces:

- one `PageConceptJob` per selected region;
- bounded nearby-region context;
- deterministic agent/API batches;
- validated Stage-2 proposals;
- deterministic `CandidatePageSeed` objects.

## Validation behavior

The adversarial fixture proves:

- an inferred-sensitive medical trait is rejected;
- an unreviewed age cohort is rejected;
- the weaker duplicate painting attribute is rejected;
- approved lifestyle attributes survive only with reviewer/public-targeting approval and page-changing effects;
- hard exclusions remain outside similarity;
- the optimized candidate generator emits the exact ordered region hashes of the transparent baseline;
- a Stage-2 proposal missing one selected-region attribute fails.

The acceleration fixture proves:

- the measured 10k profile keeps TypeScript because the isolated dense numeric share is below the promotion floor;
- a hypothetical large, parity-safe, repeated, bridge-inclusive kernel benchmark can promote Wasm;
- TypeScript remains the semantic oracle and fallback.

## Exact source proof

Validated source head before documentation: `dcc8beded51290f8084a421996c51c18b2afed83`  
Workflow run: `29628832989`

```text
strict TypeScript build: pass
Node tests: 46/46
manifest emission: pass
UI emission: pass
orchestration check: pass
framework validate: pass
framework preview: pass
browser resolution: pass
R3F build: pass
artifact upload: pass
```

Final recorded 10,000-page site-program profile:

```text
project normalization       0.126 ms
ontology compilation       20.363 ms
graph compilation          36.644 ms
closed itemsets           202.478 ms
candidate generation     2218.216 ms
sparse selection         1784.044 ms
site-program planning     973.168 ms
total                    5284.510 ms

candidates                  15,000
selected                    10,000
batches                        400
packed vector bytes      2,560,000
```

The transparent pre-optimization implementation recorded approximately 29 seconds on the same workflow class. These are synthetic compiler measurements and do not establish content, search, browser, or commercial quality.

## Wasm boundary

Current disposition: keep TypeScript.

The final run measured 49.358 ms for a 1,000-region HRR sample. A linear 10,000-region estimate is approximately 0.49 seconds. That is an estimate, not a direct standalone kernel benchmark, and it is below the current dense-share/absolute-time promotion gate.

Promotion requires an isolated contiguous numeric kernel, 20 or more repeated JavaScript/Wasm runs, bridge costs included, exact selection-hash parity, vector cosine at least 0.999999, at least 1.25 times speedup, at least 500 ms full-build savings, and a retained TypeScript fallback.

## Boundaries

- Synthetic fixtures prove wiring, rejection behavior, deterministic scale, and measured compiler performance only.
- Community detection is descriptive, not page or market truth.
- Sparse clustering becomes relevant only with real customer-row observations and a validated clustering objective.
- The current ontology and 10k regions are not external relevance authority.
- No real Stage-1 or Stage-2 provider is connected.
- Successful Stage-2 output does not yet transact into canonical evidence/modules/pages/tasks.
- The source proves 10,000 validated page-region jobs, not 10,000 complete page bodies and UIs.
- Browser/accessibility/Core Web Vitals, crawler behavior, native/Wasm benefit, indexing, search, conversion, and revenue remain unvalidated.
