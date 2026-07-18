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
8. `20-agent-operated-vector-site-generation-and-wasm.md`
9. `21-vector-to-generation-job-compiler.md`
10. `22-agent-operated-framework-workflow-validation-matrix.md`
11. `18-vector-node-path-web-framework-model.md`
12. `19-vector-native-corrections-and-csi-validation.md`
13. newest validation report
14. `16-unified-hypervector-manifest-agent-harness.md`
15. `site-manifest.yaml`
16. `reference/README.md`
17. historical specifications when changing their domain
18. supplied design/product authorities for UI or interaction work

## Scope and primary interface

This subtree is an agent-operated, vector-native, hyper-targeted website generation compiler research project. It is not production accepted.

The primary user interface is a repository-aware coding agent. The user supplies business purpose, services/offers, audiences/locations, workflows/integrations, proof/constraints, brand/assets/style, repository state, deployment target, and success criteria.

The coding agent performs the site-generation work:

```text
inspect -> normalize -> research -> construct independent context corpus
-> generate ontology/vector space and candidate page coordinates
-> select finite corpus -> compile PageGenerationJobs
-> write content + build utilities/tasks + compose UI + graph pages
-> compile -> validate -> repair -> preview -> emit -> measure
```

The user is not expected to hand-author the manifest, page matrix, prototypes, semantic modules, generation jobs, or renderer plans.

`site-manifest.yaml` is the single declarative compiled-project and corpus authority. Request Mirror, UI fixtures, geometry fixtures, agent-generated pages, and future field pages are profiles inside it and compile through the same path.

## Core invariants

1. Project inputs, source/evidence/asset ledgers, namespace, symbol version, dimensions, axes, independent context cases, and page prototypes are established before content, links, UI, runtime artifacts, or HTML.
2. Changing namespace or symbol version must change actual role/filler symbols.
3. Every declared prototype must survive geometry, `SiteSource`, `PageIR`, packed IR, agent context, generation jobs, UI inputs, and authoritative retrieval.
4. HTML, Markdown, sitemaps, packed vectors, UI plans, prompts, and task manifests are emissions, never canonical source truth.
5. The coding agent writes and builds pages from accepted vector-derived `PageGenerationJob` objects.
6. HRR/HDC/vector math constructs, scores, selects, and validates page concepts; the agent executes research, writing, coding, utility, SEO, graph, and UI generation.
7. Agents do not directly publish arbitrary HTML, routes, claims, or indexable pages.
8. Every proposal enters `noindex` at `research` and requires independently sourced weighted context cases.
9. Proposal admission requires computed positive marginal coverage against the current corpus; prose rationale is not evidence.
10. CSI is a batch/split comparison arm, not a single-page novelty oracle.
11. Claims cannot exceed evidence level, applicability, or freshness.
12. Synthetic dimensions, expected IDs, scale fixtures, and forced zero-match cases are test plumbing, not SEO proof.
13. Hyper-targeting means coherent prospect situations, not protected-trait, fingerprinted, private-history, or named-person targeting.
14. Occupation, property status, household/life-stage constraints, pets, interests, location, schedule, software, task, risk, and outcome may be context axes only when they materially change useful content and pass vertical-specific policy review.
15. Crawlers and people receive the same primary topic, facts, price, limitations, proof, links, and utility.
16. Resolver error, low confidence, version mismatch, timeout, or policy failure returns the complete canonical baseline.
17. HRR, graph scoring, learned embeddings, ANN, Zig/Wasm, generated UI, and agent harnesses must beat simpler baselines before adoption.
18. Classical HRR/VSA is not quantum computing.
19. Synthetic 2,000-page compilation must never be described as reviewed, deployed, indexed, or revenue-producing pages.
20. Page count is not an objective. Marginal useful context coverage, distinct utility, maintainability, and field value are objectives.
21. A generic chatbot or noun-swapped page is not a distinct public AI Employee utility.
22. Every feature, workflow step, algorithm, developer experience, user experience, UI system, runtime, and publication stage requires explicit validation/pass/fail vectors under `22`.

## Canonical lifecycle

```text
user ProjectInput
-> source/evidence/asset ledgers
-> independent context and demand corpus
-> governed ontology + namespace/version symbols
-> candidate prospect-context × intent × offer/service/topic coordinates
-> typed eligibility + lexical/semantic/graph prefilter
-> multi-prototype scoring + duplicate checks
-> facility-location/CSI corpus controls
-> reviewed finite page set
-> PageGenerationJobs
-> specialized research/content/utility/SEO/UI/critic passes
-> evidence-bounded semantic/content/UI/task state
-> SiteSource + PageIR + packed vectors/CSR
-> deterministic static/UI/agent/task emissions
-> gated field publication and measured topology updates
```

## Expected framework workflow

The system must be operable through the familiar framework lifecycle:

```text
init -> inspect/doctor -> research -> plan -> generate -> dev/preview
-> validate -> build -> publish -> measure
```

These phases may be agent skills, CLI commands, scripts, or a combination, but their typed state transitions must be equivalent. A user must always be able to see:

- current phase and project state;
- inputs and assumptions;
- proposed, accepted, and rejected page coordinates;
- evidence gaps and policy risks;
- generation jobs and affected pages;
- preview and validation results;
- explicit publication scope and rollback path.

Do not hide project state in conversation history or require manual edits to compiler internals.

## Vector-to-generation jobs

Read `21-vector-to-generation-job-compiler.md` before changing agent orchestration.

A `PageGenerationJob` binds:

- one or more prospect-context prototypes;
- canonical question and intent;
- service, offer, topic, problem, workflow, integration, and outcome IDs;
- independent context support;
- information/utility objects;
- evidence and allowed/prohibited claims;
- graph/path requirements and cannibalization exclusions;
- brand pack, asset references, design capabilities, and conversion path;
- generation passes and validation gates.

The coding agent may execute one job through several skills or delegate bounded passes for research, concept planning, content, utility/task construction, SEO/graph work, UI metaprogramming, criticism, and compiler repair.

The complete joint context must influence useful content. Do not merely substitute demographic nouns, city names, job titles, interests, pets, or household labels into generic templates.

## Agent-generated project and page work

Before proposing content, the agent must construct or load:

- normalized business/offer/workflow/integration facts;
- brand/design/asset contracts;
- source and evidence ledger;
- existing URL/content inventory;
- independent context corpus;
- ontology and synonym/exclusion rules;
- performance, browser, deployment, and publication constraints.

Use `buildHyperAwareAgentContext()` only after those authorities exist. It must expose all prototypes, vector identity/hash, nearby pages, information objects, design capabilities, generation rules, coverage policy, and publication boundary.

A page candidate must include:

- independently sourced weighted context cases;
- target prototype set and explicit primary semantics before field publication;
- canonical question;
- distinct information or executable utility object;
- evidence and claims;
- semantic modules;
- graph/path rationale;
- design capabilities;
- generation provenance.

A generated page must additionally originate from an accepted `PageGenerationJob` and visibly use the joint prospect-context vector in its examples, objections, vocabulary, utility, proof, module plan, interaction, and conversion path.

Insert proposals only through `applyAgentPageProposal()` and recompile the affected project. Passing computed coverage is necessary, not sufficient: external relevance, utility, evidence, path, generation specificity, UI, crawl, and human-review gates remain.

## Wasm and native vector kernel

Use a shared math-kernel source with these controls:

```text
TypeScript typed-array oracle
Zig native scalar/SIMD
Zig Wasm scalar/SIMD
```

Appropriate kernel work:

- binding, superposition, normalization, dot products;
- multi-prototype scoring and top-k;
- duplicate/cannibalization matrices;
- facility-location and CSI marginals;
- clustering, validation sweeps, and packed-vector parity.

Do not move LLM calls, network I/O, YAML/JSON orchestration, source parsing, claim policy, prose generation, HTML/CSS rendering, repository writes, or static delivery into Wasm without measured justification.

Native Zig may be faster for local agent builds. Wasm is valuable for portable, sandboxed, deterministic execution across agent environments, CI, browser diagnostics, and compatible edge runtimes. Retain it only after realistic end-to-end speed, memory, startup, and copying benchmarks.

Canonical HTML must not require Wasm.

## UI metaprogramming

The UI pass consumes semantic modules, page matrix, prototypes, generation job, capabilities, browser policy, publication state, and the supplied design system. The renderer may derive a clean professional superset but cannot alter:

- prototypes or vector identity;
- canonical questions and semantic content;
- claims, evidence, and information objects;
- approved graph edges;
- required layout roles/capabilities;
- profile membership, indexability, or publication state;
- metadata, schema, instruction projections, accessibility, or JS-disabled completeness.

## Public AI Employee interaction

Static pages and public employee execution are separate compiled outputs but may originate from the same `PageGenerationJob`. Do not represent generic chat, R3F, or an instruction pointer as completed employee work.

A public task surface must follow:

- `../../mvp-build/docs/public-interaction-standard.md`;
- `../../mvp-build/docs/ux/05-generative-ui-frontier.md`;
- complete static explanation and fallback;
- secure deterministic controls for secrets/risky inputs;
- explicit session streaming;
- typed artifact state;
- approval, proof, fallback, and recovery.

Each page claiming unique utility must have a distinct task contract, input/output shape, examples, evidence, workflow, or decision value.

## Build-time cohort pages versus runtime adaptation

The core search-distribution system emits stable canonical pages for reviewable prospect-context archetypes at build time.

Optional visitor-time adaptation is separately governed. It may select finite noncanonical presentation variants or explicit task-session behavior using known, consented, low-risk context. It may not change canonical intent, primary truth, evidence, pricing, limitations, or publication state.

## Memory protocol

`memory/` is append-only narrative state.

- `memory/MEMORY.md` is the cumulative TOON-style index and current-state map.
- Every substantial session creates `YYYY-MM-DD-HHMM-<slug>.md`.
- Never overwrite, repurpose, compress away, or refresh an earlier timestamped handoff.
- Add the new handoff newest-first and reconcile current facts in `MEMORY.md`.
- Use file-reference-heavy, token-efficient entries; do not duplicate source or validation reports.
- Record exact branch, commit, CI run, artifacts, status, risks, and next move.

## Field publication

A page may enter a field cohort only after relevance, information gain, evidence, distinctness, generation specificity, task/utility, path, UI, accessibility, browser, crawl, canonical, lifecycle-cost, and publication gates pass.

Google-specific policies are constraints, not the design objective. Still, pages generated mainly to manipulate ranking, pages for every possible query/context variation, doorway pages, and low-value scaled content are hard failures.

Use predeclared observation windows and record crawl, index, query, citation, lead, task completion, revenue, gross-profit, maintenance, and lifecycle-return evidence.

## Validation reporting

Every substantive implementation records:

- exact commands, CI runs, commits, fixtures, versions, hashes, profiles, and project inputs;
- correctness, relevance, performance, SEO, accessibility, privacy, and security findings;
- lexical, learned semantic, facets, graph, HRR, hybrid, static, and neutral-renderer controls;
- TypeScript, Zig native, Wasm scalar/SIMD execution comparisons;
- facility-location and CSI assumptions;
- page coordinates and generation jobs proposed, accepted, rejected, and reasons;
- user/developer workflow validation under `22`;
- failures, fallbacks, and validation not run.

Phase status never advances from documentation, synthetic scale, raw compiler speed, or generated page count alone.