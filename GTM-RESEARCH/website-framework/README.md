# Hyper-Targeted Search-Distribution Framework

Status: agent-operated vector-native research framework with source-wired groundwork orchestration, deterministic compiler, and UI scaffold; real provider, relevance, browser, runtime, and field acceptance pending  
Updated: 2026-07-17

## Product interface

The intended user interface is a repository-aware coding agent such as Codex, Claude Code, Pi, or an equivalent agentic developer.

```text
user supplies
  business/purpose + offers/services + audiences/locations
  + workflows/integrations + proof/constraints
  + brand/assets/style + repository/deployment goals
        |
        v
coding agent
  inspect -> normalize -> research -> construct context/vector space
  -> plan finite corpus -> compile PageGenerationJobs
  -> research/write/build utility/SEO/graph/UI
  -> validate -> repair -> preview -> emit -> measure
        |
        v
complete static-first website
  stable hyper-targeted pages
  + optional bounded public AI Employee task surfaces
```

The agent is integral at project formation and page generation. The vector system maps, scores, selects, constrains, and validates the page program; bounded agent passes write and build the accepted pages.

The user should not hand-author vectors, page matrices, jobs, packed IR, or renderer plans. `site-manifest.yaml` remains the compiled corpus authority downstream of the new orchestration layer.

## Current executable path

```text
ProjectInput
-> source/evidence/asset ledgers
-> independent ContextCorpus
-> frozen train/validation/test splits
-> train-only isotonic compatibility calibration
-> explicit-primary multi-prototype PageCoordinates
-> typed eligibility before calibrated scoring
-> budgeted composite SelectedCorpusPlan
-> typed semantic page graph
-> deterministic PageGenerationJobs
-> ordered specialized-agent runner with bounded repair
-> JavaScript-free framework preview
-> existing manifest/SiteSource/PageIR/UI emissions
```

Controlling implementation authority: `23-groundwork-orchestration-implementation.md`.

## Implemented and source-tested

- typed validation/pass/fail contracts with hard and soft severity;
- deterministic business, brand, technical, goal, source, evidence, and asset ledgers;
- independent-context provenance enforcement and assessor identities;
- deterministic train/validation/test membership and split hashes;
- Perfect/Good/Fair/Bad judgments with disagreement retention;
- pool-adjacent-violators isotonic calibration with validation/test Brier, MAE, and ECE;
- ineligible compatibility fixed at zero rather than shifted-cosine credit;
- explicit primary prototype identity in the generated-coordinate path;
- typed graph edges with rationale, provenance, eligibility, priority, and path queries;
- candidate coordinates bound to intent, offer, topic, workflow, evidence, utility, outcome, and conversion;
- calibrated facility-location corpus selection with inspectable information, rare-tail, and diversity components;
- duplicate/cannibalization rejection reasons;
- typed noindex `PageGenerationJob` objects;
- provider-neutral agent executor, checkpoint hashes, source restrictions, bounded repair, and rejection;
- static selected/rejected corpus preview with all validation reports;
- operator commands for doctor, plan, validate, and preview;
- existing namespaced/versioned HDC/VSA compiler, packed multi-prototype IR, neutral/AMTECH renderer, browser policy, and bounded R3F build.

## Source map

| Area | Primary source |
|---|---|
| Validation | `reference/src/validation-contracts.ts` |
| Project intake and ledgers | `reference/src/project-input.ts` |
| Context corpus and calibration | `reference/src/context-corpus.ts` |
| Typed graph | `reference/src/typed-graph.ts` |
| Candidate coordinates | `reference/src/page-coordinate.ts` |
| Corpus selection | `reference/src/corpus-plan.ts` |
| Generation jobs and runner | `reference/src/page-generation.ts` |
| Preview UX | `reference/src/framework-preview.ts` |
| Orchestration | `reference/src/framework-orchestrator.ts` |
| Operator commands | `reference/scripts/framework-cli.mjs` |
| End-to-end fixture | `reference/fixtures/orchestration-fixture.mjs` |
| Tests | `reference/test/orchestration.test.mjs` |
| Scientific/operational matrix | `22-agent-operated-framework-workflow-validation-matrix.md` |

## Operator commands

From `GTM-RESEARCH/website-framework/reference`:

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
```

The supplied fixture module proves the API. A real project module must supply approved `ProjectInput`, independent context cases, calibration observations, candidate seeds, selection policy, and an `AgentPassExecutor` adapter.

## Validation model

Every implemented feature records:

```text
feature and workflow step
algorithm choice
user-visible effect
developer/agent effect
validation vector
pass vector
fail vector
simpler baseline
hard/soft severity
measured findings and stable report hash
```

New source-level attributes:

```text
ProjectInput and ledgers: 7
Context and calibration: 4
Typed graph: 3
Coordinate, selection, job, runner, preview: 8
Total: 22
```

These complement the broader 27-feature matrix in `22-agent-operated-framework-workflow-validation-matrix.md` and the existing compiler/UI validation authorities.

## Exact source proof

Validated source head before documentation: `ad3c81cfc202ba94f63f08b54649cfaaf71b00d7`  
GitHub Actions run: `29624909676`

```text
30 tests
30 pass
0 fail

manifest emission: pass
UI emission: pass
orchestration emission: pass
framework validate: pass
framework preview: pass
browser policy: pass
R3F build: pass
artifact upload: pass
```

Groundwork fixture:

```text
contexts: 6 (2 train / 2 validation / 2 test)
candidates: 3
selected: 2
rejected: 1 duplicate
jobs completed: 2/2
validation/test fixture coverage: 1.0 / 1.0
preview hard failures: 0
```

The fixture proves deterministic wiring and rejection behavior. It does not prove real context relevance or SEO value.

## Key pass/fail boundaries

Pass:
- project and source state is typed, provenance-bearing, and deterministic;
- context acceptance is independent of the page-generation agent;
- fitting uses train only and reports untouched validation/test metrics;
- eligibility runs before similarity;
- primary identity survives prototype ordering;
- selected pages bind evidence and distinct utility;
- redundant candidates are rejected with explicit reasons;
- jobs are noindex, source-bound, reviewable, and repair-bounded;
- preview exposes selected, rejected, failed, pending, and passed state;
- canonical HTML remains static and runtime-independent.

Fail:
- an agent writes its own sole validation cases;
- shifted cosine is treated as probability;
- protected/private identity becomes a generation axis;
- the Cartesian product becomes the page corpus;
- a vector without evidence, utility, intent, or conversion becomes a page;
- an untyped nearest-neighbor suggestion becomes a published link;
- one unconstrained prompt publishes the site;
- repair loops are unbounded;
- rejected combinations disappear silently;
- source tests are described as indexing, ranking, conversion, or revenue proof.

## Research floor

- Context-document compatibility and graded judgments: https://arxiv.org/abs/2309.05113
- HDC/VSA structured representations: https://arxiv.org/abs/2112.15424
- Complement Submodular Information: https://arxiv.org/abs/2605.24779
- WebAssembly core/SIMD: https://www.w3.org/TR/wasm-core/
- Cloudflare Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- R3F performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance

These support evaluation and implementation arms. They do not prove search, writing, UI, or commercial superiority.

## Still pending

- arbitrary repository/site inspection and automatic `ProjectInput` generation;
- real customer/search context collection and assessor tooling;
- BM25, learned semantic, facets, and graph prefilter comparison inside orchestration;
- provider adapters for Codex, Claude Code, Pi, or another agent;
- transaction from successful agent outputs into canonical evidence/modules/pages/tasks;
- migration of legacy manifest fixtures to explicit primary IDs and typed edges;
- first-class public AI Employee task-surface IR;
- browser screenshot/accessibility/Core Web Vitals acceptance;
- native Zig versus Wasm scalar/SIMD full-loop benchmarks;
- a reviewed indexed corpus and field search/commercial evidence.

## Read order

1. root/scoped `identity.md`, `AGENTS.md`, and `CODEGRAPH.md`;
2. this README;
3. `memory/MEMORY.md` and newest immutable handoff;
4. `23-groundwork-orchestration-implementation.md`;
5. `22-agent-operated-framework-workflow-validation-matrix.md`;
6. `21-vector-to-generation-job-compiler.md`;
7. `20-agent-operated-vector-site-generation-and-wasm.md`;
8. `18-vector-node-path-web-framework-model.md`;
9. `19-vector-native-corrections-and-csi-validation.md`;
10. newest validation report;
11. `site-manifest.yaml` and `reference/README.md`.

## Next gate

```text
real repository/source ingestion adapters
-> independent context collection and assessor workflow
-> lexical + learned-semantic + facet + graph candidate prefilter
-> provider-neutral agent adapter
-> generated output -> unified manifest transaction
-> first 20–40 real noindex pages
-> browser/accessibility/performance validation
-> separate matched field publication
```
