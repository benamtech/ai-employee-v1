# 22 — Agent-Operated Framework Workflow and Validation Matrix

Status: canonical cross-cutting validation authority; orchestration implementation pending
Updated: 2026-07-17
Scope: product use, agent workflow, corpus math, generation, UI, runtime, developer experience, publication, and measurement

## Purpose

This document makes the framework understandable as a product and falsifiable as an engineering system.

The framework is used through a repository-aware coding agent. The user provides business and brand truth; the agent performs intake, research, vector-space construction, page planning, page generation, UI generation, compilation, validation, repair, emission, and measurement.

The framework must therefore validate more than algorithms. It must validate:

- whether a normal user can start and control a project;
- whether an agent can operate the system without hand-editing compiler internals;
- whether page coordinates are worth materializing;
- whether generation jobs produce genuinely context-specific content and utilities;
- whether the emitted site is coherent, fast, accessible, crawlable, maintainable, and commercially useful;
- whether advanced math and runtime machinery outperform simpler controls.

Read with:

- `04-feature-validation-vectors.md`
- `05-pass-fail-vectors.md`
- `12-compiler-design-and-autonomy-validation-addendum.md`
- `13-academic-and-normative-basis-for-validation-vectors.md`
- `15-hyper-targeted-search-distribution-workstreams.md`
- `16-unified-hypervector-manifest-agent-harness.md`
- `17-agentic-ui-metaprogramming-standard.md`
- `18-vector-node-path-web-framework-model.md`
- `19-vector-native-corrections-and-csi-validation.md`
- `20-agent-operated-vector-site-generation-and-wasm.md`
- `21-vector-to-generation-job-compiler.md`

This document is the operational matrix tying those authorities together.

## Research and framework-use basis

### Context-document compatibility

Kong et al., “Personalized Search Via Neural Contextual Semantic Relevance Ranking,” arXiv:2309.05113:

https://arxiv.org/abs/2309.05113

Use:

- separate ordinary query/document relevance from explicit context/document compatibility;
- preserve graded judgments such as Perfect, Good, Fair, and Bad;
- require context ablation and held-out/out-of-domain evaluation.

Boundary:

- does not establish HRR, automatic corpus construction, SEO lift, or page-generation quality.

### HDC/VSA and HRR

Kleyko et al., “A Survey on Hyperdimensional Computing aka Vector Symbolic Architectures, Part II,” arXiv:2112.15424:

https://arxiv.org/abs/2112.15424

Use:

- structured distributed representations;
- role/filler composition;
- associative retrieval and deterministic hardware-oriented execution.

Boundary:

- does not establish search, writing, UI, or commercial superiority.

### Complement-aware selection

“Complement Submodular Information,” arXiv:2605.24779:

https://arxiv.org/abs/2605.24779

Use:

- batch and dataset-split comparison arm for preserving coherent head/tail structure while suppressing isolated outliers.

Boundary:

- new preprint;
- assumptions and curvature conditions require diagnosis;
- not a single-page admission oracle.

### Expected framework ergonomics

Modern frameworks establish a familiar lifecycle:

```text
scaffold/init -> configure -> develop/preview -> test -> build -> deploy
```

Official examples:

- Vite: `npm create vite`, `vite dev`, `vite build` — https://vite.dev/guide/
- Next.js: `create-next-app`, `next dev`, `next build` — https://nextjs.org/docs/app/getting-started/installation
- Astro: `create astro`, `astro dev`, `astro build` — https://docs.astro.build/en/install-and-setup/
- Playwright: user-facing, isolated, multi-browser tests — https://playwright.dev/docs/best-practices

The framework may be more complex internally, but the operator experience must be at least as legible:

```text
init -> inspect -> plan -> generate -> preview -> validate -> build -> publish -> measure
```

The coding agent may execute these phases conversationally or through commands, but state, artifacts, failures, and next actions must remain explicit.

### Search-distribution boundary

Google’s current guidance permits useful AI-assisted work but warns against generating many pages without additional user value and against content for every possible query variation when the purpose is ranking manipulation:

- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/essentials/spam-policies

These are constraints and field sensors, not the framework’s intellectual objective. They reinforce the need for unique information, utility, evidence, and user value.

### Wasm and interactive UI boundaries

- WebAssembly provides portable low-level execution and 128-bit SIMD vector instructions: https://www.w3.org/TR/wasm-core/
- Cloudflare Workers supports Wasm SIMD but executes each Worker in one thread: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- React Three Fiber recommends demand rendering and resource reuse for scalable scenes: https://r3f.docs.pmnd.rs/advanced/scaling-performance

These justify implementation arms, not automatic adoption.

## Product contract

### What the user supplies

```text
business purpose
services and offers
customer/prospect knowledge
locations and operating boundaries
workflows and integrations
proof, pricing, constraints, and limitations
brand system, assets, examples, and style rules
existing repository/site and technical stack
deployment target, browser targets, and performance budgets
success criteria and publication risk tolerance
```

### What the agent does

```text
inspect repository and inputs
-> identify missing or contradictory truth
-> normalize ProjectInput and ledgers
-> research context/demand independently
-> construct ontology and vector space
-> propose candidate page coordinates
-> select a finite corpus
-> compile PageGenerationJobs
-> execute research/content/utility/SEO/UI/critic passes
-> compile and preview the site
-> repair failures
-> request review at explicit checkpoints
-> build and publish approved pages
-> measure and update topology
```

### What the framework does

```text
typed contracts
+ vector and graph computation
+ evidence and policy enforcement
+ corpus optimization
+ deterministic compilation
+ machine-readable validation
+ renderer/runtime adapters
+ publication and measurement controls
```

### What the user should not have to do

- hand-author HRR vectors;
- manually build the page matrix;
- manually write `site-manifest.yaml` from scratch;
- understand packed offsets or CSR internals;
- design every page independently;
- interpret raw compiler stack traces;
- manually synchronize metadata, schema, links, UI, and content;
- trust a silent black-box generation run.

## Expected operator workflow

### Phase O1 — Initialize or adopt

New project:

```text
agent: initialize framework in repository
user: provide business/brand/assets/goals
framework: create project state, source ledger, browser/deployment profile, and research plan
```

Existing project:

```text
agent: inspect repository and current public surface
framework: inventory routes, content, assets, stack, browser policy, build/deploy behavior, and conflicts
```

Required output:

- human-readable project brief;
- machine-readable `ProjectInput`;
- missing-information and contradiction report;
- source/evidence/asset inventory;
- proposed workflow and checkpoints.

### Phase O2 — Research and model

The agent builds an independently reviewable context corpus, ontology, exclusions, and opportunity model before writing pages.

Required output:

- context/demand cases with provenance and weights;
- train/validation/test split identity;
- proposed dimensions and governed values;
- prohibited or risky axes/combinations;
- existing-page coverage map;
- candidate coordinate count before and after pruning.

### Phase O3 — Plan the corpus

The agent presents a comprehensible corpus plan rather than silently emitting hundreds of pages.

Required output:

- proposed page families;
- accepted/rejected candidate counts and reasons;
- split/consolidate decisions;
- expected unique information/utility per page;
- evidence gaps;
- graph topology preview;
- estimated generation, review, and maintenance cost;
- publication stages.

### Phase O4 — Generate jobs and pages

Accepted coordinates compile into `PageGenerationJob` objects. Specialized agent passes write and build the site.

Required output per page:

- target prototype set and canonical question;
- generation job and provenance;
- content modules;
- utility/task contract when applicable;
- evidence and claims;
- graph edges;
- UI plan;
- metadata/schema;
- rejection or repair history;
- noindex preview route.

### Phase O5 — Preview and review

The user and agent review the generated site as a website, not only as JSON or test output.

Required surfaces:

- local dev/preview server;
- corpus dashboard or report;
- page-family navigation;
- source/evidence inspection;
- vector/prototype explanation in human terms;
- duplicate/cannibalization report;
- browser/accessibility results;
- changed-page diff after repairs.

### Phase O6 — Validate and repair

The framework emits machine-readable failures. The agent repairs source, model, generation job, module, graph, UI, or runtime state and reruns only the affected dependency closure.

No hard failure may be “fixed” by suppressing the test or editing generated HTML.

### Phase O7 — Build and publish

The framework produces complete static canonical artifacts and optional bounded interaction/task assets.

Publication is a separate action from generation. Research pages remain noindex until approved.

### Phase O8 — Measure and update

The agent imports crawl, search, citation, task, lead, revenue, gross-profit, maintenance, and quality evidence. The framework recommends retain, improve, consolidate, redirect, or remove actions.

Canonical truth changes only through reviewed source updates and recompilation.

## Cross-cutting validation model

Every feature or workflow step is evaluated as a three-shape object:

```text
validation vector: what is measured and compared
pass vector: observable acceptance conditions
fail vector: hard rejection or regression conditions
```

Each feature also records:

```text
purpose/effect
user-visible contract
developer/agent contract
simpler baseline
current implementation state
proof artifact
```

## Feature and workflow matrix

### V01 — Agent as primary interface

Purpose/effect:

- hide compiler complexity without hiding decisions;
- make project operation possible through Codex, Claude Code, Pi, or equivalent agents.

Validation vector:

- successful new-project and existing-project runs;
- user intervention count;
- unresolved ambiguity count;
- percentage of state changes represented as typed artifacts;
- reproducibility across supported agents;
- ability to resume from repository/memory state.

Pass vector:

- agent can reach a preview from supplied project inputs without manual manifest editing;
- agent exposes assumptions, missing truth, proposed scope, costs, and checkpoints;
- another supported agent can resume using repository authority and memory;
- failures produce actionable repair instructions.

Fail vector:

- success depends on hidden conversation history;
- agent invents business facts or silently edits generated files;
- users must understand packed vector internals;
- different agents produce incompatible project state from identical frozen inputs without explanation.

Current state: conceptual/documented; orchestration not implemented.

References: `20`, `21`, `AGENTS.md`, `memory/MEMORY.md`.

### V02 — ProjectInput and source/evidence/asset intake

Purpose/effect:

- transform messy user materials into governed compiler inputs.

Validation vector:

- source coverage;
- contradiction detection;
- provenance completeness;
- asset integrity;
- freshness/applicability metadata;
- required-field burden on user.

Pass vector:

- every claim, brand rule, asset, offer, and limitation has stable identity and provenance;
- unresolved contradictions block affected generation only;
- agent asks only high-value questions and can proceed with clearly marked unknowns.

Fail vector:

- scraped or user-supplied facts lose provenance;
- one global confidence value replaces applicability/freshness;
- missing information is silently fabricated;
- intake requires users to encode internal compiler schemas manually.

Current state: planned.

### V03 — Independent context and demand corpus

Purpose/effect:

- provide external opportunity and relevance ground truth instead of self-confirming generation.

Validation vector:

- source diversity;
- assessor independence;
- Perfect/Good/Fair/Bad agreement;
- head/tail representation;
- train/validation/test leakage;
- out-of-domain performance.

Pass vector:

- frozen splits exist before page generation;
- at least two assessors grade critical validation/test cases;
- disagreements are retained and analyzed;
- context cases are not authored solely by the page-generation pass.

Fail vector:

- generator writes the page and its validating contexts;
- test cases contain page IDs or expected outputs by construction;
- hidden-tail slices disappear from validation;
- sensitive/private context becomes a targeting dimension.

Current state: P0 missing.

Research: Kong et al.; CSI as split comparison arm.

### V04 — Ontology and prospect-context dimensions

Purpose/effect:

- define which combinations the system may represent and how concepts map into the vector space.

Validation vector:

- axis/value provenance;
- synonym and exclusion consistency;
- ontology coverage;
- merge/split stability;
- protected/sensitive-axis review;
- unsupported-combination rejection.

Pass vector:

- axes have governed meaning and allowed values;
- each context attribute must plausibly alter useful content, utility, proof, workflow, or conversion;
- vertical-specific policy prohibits unsafe demographic use;
- ontology revisions are versioned and migration-tested.

Fail vector:

- arbitrary personal traits are added because they create more combinations;
- stereotypes replace evidence;
- values drift without migration;
- unrestricted strings fragment the space.

Current state: research-grade manifest axes; governance incomplete.

### V05 — Namespaced/versioned vector identity

Purpose/effect:

- produce deterministic, migratable role/filler symbols.

Validation vector:

- namespace rotation;
- symbol-version rotation;
- compiler/policy-version identity;
- byte parity;
- cross-runtime parity;
- capacity and numerical stability.

Pass vector:

- identical identity and inputs produce identical vectors;
- namespace/version change produces a different space;
- emitted artifacts declare complete vector identity;
- TypeScript/native/Wasm implementations preserve accepted ordering and tolerance.

Fail vector:

- version metadata changes without changing symbols;
- two projects accidentally share symbol space;
- runtime implementations drift;
- NaN/Inf or capacity failure is ignored.

Current state: namespace/symbol version corrected; compiler/weight-policy migration identity remains.

Research: HRR/VSA authorities in `13` and `19`.

### V06 — Multi-prototype page/context representation

Purpose/effect:

- represent several coherent entry regions without flattening a page into one averaged vector.

Validation vector:

- prototype preservation;
- explicit primary semantics;
- packed parity;
- max/aggregate scoring behavior;
- split/consolidate decisions;
- source-order invariance.

Pass vector:

- all prototypes survive every authoritative compiler layer;
- primary prototype is explicit or no authoritative primary alias exists;
- scoring uses all relevant prototypes;
- prototype changes trigger bounded invalidation.

Fail vector:

- secondary prototypes disappear after planning;
- array order changes canonical meaning;
- incompatible contexts are averaged into a misleading centroid.

Current state: all-prototype preservation passes; primary semantics P0 open.

### V07 — Candidate page-coordinate generation

Purpose/effect:

- create plausible prospect-context × intent × offer/service/topic/utility combinations for evaluation.

Validation vector:

- candidate-source diversity;
- eligibility pruning ratio;
- coherent conjunction rate;
- unsupported/stereotyped candidate rate;
- opportunity recall on held-out cases;
- raw candidate cost.

Pass vector:

- candidates trace to independent contexts, business capabilities, or original utilities;
- the system can explain why each dimension matters jointly;
- most theoretical Cartesian products are rejected early;
- held-out valuable opportunities are not systematically missed.

Fail vector:

- candidate volume is treated as progress;
- every combination becomes a page;
- demographic attributes appear without changing useful output;
- sensitive or regulated targeting is emitted without review.

Current state: target architecture documented; automated candidate compiler missing.

### V08 — Hybrid relevance and compatibility ranking

Purpose/effect:

- determine whether a page concept fits both the task/query and explicit context.

Validation vector:

- BM25/lexical;
- learned semantic baseline;
- facets/eligibility;
- graph features;
- HRR structural score;
- hybrid score;
- NDCG, top-one fit, bad-fit rate, calibration, ablation, out-of-domain.

Pass vector:

- selected hybrid beats or materially complements strongest simple baseline;
- context ablation demonstrates real contextual value;
- calibrated score has interpretable reliability;
- hard eligibility overrides similarity.

Fail vector:

- random-symbol HRR is treated as language understanding;
- shifted cosine assigns substantial relevance to orthogonal vectors without calibration;
- thresholds are selected on the test set;
- one model is adopted without ablations.

Current state: synthetic arms exist; independent benchmark and calibration missing.

Research: Kong et al.; NDCG/calibration authorities in `13`.

### V09 — Corpus selection: facility location

Purpose/effect:

- choose a finite page set maximizing weighted context coverage under cost.

Validation vector:

- exact small controls;
- greedy/lazy parity;
- marginal gain;
- gain per lifecycle cost;
- head/tail coverage;
- duplicate rejection;
- selection stability.

Pass vector:

- optimized set matches exact optimum on bounded controls or expected approximation behavior;
- redundant pages receive near-zero marginal gain;
- every selected page has positive leave-one-out value;
- lifecycle cost is included.

Fail vector:

- selection is based on page count;
- zero-gain pages survive;
- similarity matrix is invalid or uncalibrated but treated as truth;
- optimizer behavior changes nondeterministically.

Current state: research controls implemented; real calibrated input missing.

### V10 — Corpus/split selection: CSI

Purpose/effect:

- compare complement-aware balance across coherent head/tail slices while suppressing isolated outliers.

Validation vector:

- random, stratified, facility, diversity, and CSI comparisons;
- curvature/approximate-monotonicity diagnostics;
- hidden-slice balance;
- outlier selection rate;
- scale and runtime.

Pass vector:

- CSI improves predeclared head/tail and outlier metrics on validation data;
- assumptions and failure cases are reported;
- CSI is limited to batch/split roles where it adds value.

Fail vector:

- CSI is used as a universal novelty score;
- singleton diagnostic determines page admission;
- preprint claims are treated as production proof;
- no simpler baselines are run.

Current state: bounded Facility Location Complement Information fixture only.

### V11 — PageGenerationJob compiler

Purpose/effect:

- convert accepted vector coordinates into deterministic bounded instructions for page-writing/building agents.

Validation vector:

- complete coordinate traceability;
- evidence/claim binding;
- module/task/UI/graph requirements;
- generation reproducibility;
- missing-context detection;
- job diff stability.

Pass vector:

- every generated page has exactly one accepted job identity;
- the job contains prototypes, intent, service/offer/topic, utility, evidence, graph, brand, UI, CTA, and validation state;
- job can be executed by another supported agent;
- job changes when authoritative inputs change.

Fail vector:

- page generation starts from a free-form generic prompt;
- agent cannot explain why page exists;
- job omits exclusions or cannibalization boundaries;
- generated HTML becomes the source of truth.

Current state: canonical contract documented in `21`; implementation missing.

### V12 — Specialized agent generation passes

Purpose/effect:

- use specialized research, concept, content, utility, SEO, UI, critic, and repair passes to produce a complete page.

Validation vector:

- pass-level inputs/outputs;
- provenance;
- inter-pass contradiction rate;
- repair count;
- token/time/cost;
- deterministic versus creative degrees of freedom;
- cross-agent reproducibility.

Pass vector:

- each pass consumes typed bounded state;
- research and critic passes can reject the page;
- content generation visibly reflects the joint context;
- repairs modify authorities/jobs/modules rather than generated HTML;
- agent/model/version/prompt/tool records are retained.

Fail vector:

- one monolithic prompt generates everything without checks;
- agent fabricates research or evidence;
- demographic nouns are substituted into generic copy;
- later passes silently contradict earlier evidence or policy.

Current state: agent context/proposal scaffold exists; generation pipeline missing.

### V13 — Content specificity and information gain

Purpose/effect:

- ensure each page delivers materially distinct value for its joint prospect context.

Validation vector:

- human blind distinguishability;
- semantic/structural duplication;
- distinct information-object count;
- context-attribute utilization;
- fact/example/utility specificity;
- reviewer usefulness score.

Pass vector:

- reviewers can distinguish neighboring pages without titles;
- context changes examples, objections, workflow, proof, utility, or CTA;
- every page contains a distinct information or executable utility object;
- unsupported stereotypes are absent.

Fail vector:

- page differs only by title, city, occupation, pet, or marital label;
- generic AI copy dominates;
- page exists only for a query variation;
- unique value cannot be named.

Current state: validation requirement; real cohort not generated.

### V14 — Evidence, claims, and canonical truth

Purpose/effect:

- prevent mass generation from multiplying unsupported claims.

Validation vector:

- source coverage;
- claim/evidence applicability;
- freshness;
- contradiction detection;
- visible-content/schema parity;
- affected-page invalidation.

Pass vector:

- claims cannot exceed evidence;
- evidence applicability and expiry are explicit;
- one source change deterministically finds all affected pages;
- static content, schema, task behavior, and CTA remain consistent.

Fail vector:

- agent cites a source that does not support the claim;
- one outdated fact persists across page families;
- schema contains invisible or stronger claims;
- facts vary by visitor/crawler variant.

Current state: typed but coarse; applicability/freshness governance incomplete.

### V15 — Typed graph and node paths

Purpose/effect:

- connect pages into useful prospect and agent journeys rather than raw similarity clusters.

Validation vector:

- edge type and rationale;
- provenance;
- eligibility;
- orphan rate;
- path task completion;
- human usefulness;
- graph stability;
- internal-link diversity.

Pass vector:

- every automatic edge has a semantic type and reason;
- path moves user to a plausible next question, workflow, proof, comparison, utility, or offer;
- no orphan canonical pages;
- graph is reproducible and reviewable.

Fail vector:

- raw cosine is the sole link reason;
- circular or spammy links are emitted;
- pages link only because attributes overlap;
- graph changes unpredictably after unrelated edits.

Current state: P0 missing; raw neighbor IDs only.

### V16 — Public AI Employee utility/task surface

Purpose/effect:

- turn high-value pages into working bounded solutions, not only content.

Validation vector:

- distinct task contract;
- input/output schemas;
- secure controls;
- streaming states;
- artifact correctness;
- approval/proof/fallback/recovery;
- task completion and conversion.

Pass vector:

- static explanation and fallback are complete;
- page-specific task solves the stated problem;
- risky inputs/actions use deterministic controls;
- result is typed, editable, and reviewable;
- utility remains distinct across page families.

Fail vector:

- generic chatbot is labeled a unique AI Employee;
- model directly handles secrets or irreversible actions without controls;
- page is useless when runtime fails;
- streamed output contradicts canonical claims.

Current state: product standards exist; website IR contract missing.

References: `mvp-build/docs/public-interaction-standard.md`, `mvp-build/docs/ux/05-generative-ui-frontier.md`.

### V17 — UI metaprogramming and design-system adaptation

Purpose/effect:

- let agents generate polished coherent sites without hand-designing every page.

Validation vector:

- semantic constructor coverage;
- archetype suitability;
- brand-token adherence;
- hierarchy and density;
- responsive behavior;
- accessibility;
- visual-regression stability;
- cross-page cohesion and controlled variation.

Pass vector:

- every semantic module has a valid renderer path;
- supplied design system is represented as tokens, constraints, constructors, and fixtures;
- layout visibly responds to page role and content, not arbitrary prompt taste;
- output is professional, coherent, and complete without JavaScript.

Fail vector:

- renderer changes canonical meaning;
- every page uses one template regardless of geometry;
- design rules are decorative prose rather than executable constraints;
- generated layout breaks accessibility, hierarchy, or mobile use.

Current state: source scaffold and two-page fixture pass; visual/browser acceptance pending.

References: `17`, UI handoff, CSS feature policy.

### V18 — Browser-targeted CSS and accessibility

Purpose/effect:

- generate modern CSS that is correct for declared users and robust across browsers.

Validation vector:

- browser-config detection;
- tier mapping;
- 57-feature decision report;
- Chromium/Firefox/WebKit;
- keyboard, screen-reader tree, 400% zoom, contrast, reduced motion;
- JS-disabled behavior.

Pass vector:

- browser targets are read before CSS generation;
- unsupported features receive guard/fallback or are skipped;
- user-facing tests operate across declared browsers;
- complete hierarchy and action remain without JS.

Fail vector:

- agent assumes browser support;
- CSS uses unsupported features without fallback;
- tests assert implementation details rather than user behavior;
- core content or actions require hydration.

Current state: source policy pass; Playwright/browser/accessibility run missing.

### V19 — Optional R3F/Three.js visualization

Purpose/effect:

- provide useful high-level visual explanations where 3D/graph interaction adds comprehension.

Validation vector:

- justification per scene;
- poster fallback;
- demand-render behavior;
- resource reuse/instancing;
- mobile GPU and memory;
- reduced-motion behavior;
- semantic equivalence.

Pass vector:

- scene is optional, lazy, poster-first, and `frameloop="demand"`;
- no canonical information is trapped in WebGL;
- scene improves a measured comprehension or interaction goal;
- budgets pass on target devices.

Fail vector:

- decorative continuous animation;
- separate WebGL context per component;
- no fallback;
- scene delays or obscures content;
- R3F exists only to look advanced.

Current state: source adapter build passes; device and value validation missing.

### V20 — TypeScript/native/Wasm math kernel

Purpose/effect:

- accelerate repeated vector, duplicate, optimizer, and validation workloads across agent loops.

Validation vector:

- TypeScript array and typed-array controls;
- Zig native scalar/SIMD;
- Zig Wasm scalar/SIMD;
- parity;
- initialization/copying/serialization;
- full-loop wall time;
- memory and binary size;
- local, CI, browser, and edge runtimes.

Pass vector:

- all implementations preserve accepted numeric/ranking behavior;
- selected implementation materially improves complete realistic workloads;
- native may win local builds while Wasm provides portable deterministic execution;
- canonical pages do not depend on Wasm.

Fail vector:

- only dot-product microbenchmarks are reported;
- startup or memory copying erases compute gains;
- Wasm memory growth invalidates views;
- Worker limits or single-thread behavior are ignored;
- Wasm is retained because vectors “sound like Wasm.”

Current state: TS adapter and Zig/Wasm scaffold; live parity/performance missing.

### V21 — Deterministic compiler, dependency closure, and emissions

Purpose/effect:

- turn project state into reproducible static and interactive artifacts at scale.

Validation vector:

- byte-identical builds;
- source-order invariance;
- dependency-bounded rebuild;
- page/prototype/module counts;
- artifact hashes;
- memory and time at 200/500/1,000/2,000 pages;
- broken-link/schema/claim checks.

Pass vector:

- same frozen inputs produce identical artifacts;
- only affected dependency closure rebuilds;
- all prototypes and job identities are traceable;
- canonical HTML is complete, static, and disposable;
- scale remains within declared resource budget.

Fail vector:

- generated HTML is hand-edited;
- small source changes rebuild or mutate unrelated pages unpredictably;
- build success hides broken claims, routes, links, schema, or accessibility;
- synthetic scale is described as production success.

Current state: deterministic synthetic compiler pass; generation-job and real-project integration missing.

### V22 — Developer experience: init, plan, dev, validate, build, publish

Purpose/effect:

- make the complex system operate like a comprehensible framework.

Target command/conversation model:

```text
framework init       # create/adopt project with agent
framework doctor     # inspect truth, config, dependencies, browsers, deployment
framework research   # construct/update independent context corpus
framework plan       # preview vector space, candidate funnel, corpus plan
framework generate   # compile and execute PageGenerationJobs into noindex pages
framework dev        # local preview plus corpus/source/validation views
framework validate   # run selected or full validation vectors
framework build      # deterministic production artifacts
framework publish    # explicit gated publication
framework measure    # import field evidence and recommend topology changes
```

These may be implemented as CLI commands, agent skills, scripts, or a combination. Their state transitions must be equivalent.

Validation vector:

- time to first preview;
- number of manual internal-file edits;
- failure-actionability;
- resumability;
- incremental-run speed;
- command/state consistency;
- documentation findability;
- supported-stack portability.

Pass vector:

- a developer understands current phase, inputs, outputs, failures, and next action;
- commands are idempotent or explicitly destructive;
- preview and validation are local before publication;
- generated/internal files are clearly separated;
- existing Vite/Next/Astro projects can be adopted through adapters.

Fail vector:

- framework requires memorizing undocumented scripts;
- phase/state is hidden in conversation history;
- init overwrites existing project state;
- build and publish are conflated;
- errors expose low-level stack traces without affected page/job/source context.

Current state: target contract only; current package exposes research scripts.

### V23 — User experience and review control

Purpose/effect:

- give a non-specialist project owner meaningful control without forcing compiler expertise.

Validation vector:

- clarity of project brief and corpus plan;
- approval checkpoint usefulness;
- assumption visibility;
- ability to reject page families or attributes;
- preview comprehension;
- revision latency;
- perceived trust and workload.

Pass vector:

- user can understand why page families exist and what value each adds;
- user can correct facts, remove risky axes, approve design direction, and stage publication;
- agent summarizes tradeoffs and costs;
- no surprise mass publication occurs.

Fail vector:

- user sees only a final generated site;
- consent is inferred from initial prompt;
- agent hides rejected candidates, evidence gaps, or policy risks;
- user must inspect YAML to control scope.

Current state: target contract only.

### V24 — Preview, browser, and visual review surface

Purpose/effect:

- make the generated corpus inspectable as a coherent site before publication.

Validation vector:

- page-family navigation;
- source/evidence trace;
- vector explanation;
- responsive/visual fixtures;
- content and graph diffs;
- preview performance;
- noindex enforcement.

Pass vector:

- every generated page is reachable in preview;
- reviewers can filter by family/context/offer/status;
- page explains target situation without exposing sensitive profiling;
- changes are diffable at semantic and rendered levels;
- preview cannot accidentally become indexable.

Fail vector:

- review is a folder of HTML files;
- no corpus-level overview exists;
- source/evidence cannot be inspected;
- preview URL leaks indexable content.

Current state: basic emitted fixtures; full review surface missing.

### V25 — Publication and search-distribution gate

Purpose/effect:

- convert reviewed noindex nodes into stable canonical public pages without doorway/scaled-content failure.

Validation vector:

- indexability/canonical/sitemap consistency;
- crawl parity;
- unique value;
- internal links;
- rendered content;
- publication cohort identity;
- rollback/redirect plan;
- Search Console/Bing observations.

Pass vector:

- publication is explicit and cohort-scoped;
- every page passes information, utility, evidence, distinctness, graph, UI, accessibility, and lifecycle gates;
- crawler and human primary truth match;
- canonical, sitemap, links, and schema agree.

Fail vector:

- all generated pages publish automatically;
- pages target every query/context variation without value;
- crawler-specific content or hidden links are used;
- page family lacks consolidation/removal strategy.

Current state: noindex only; field gate missing.

### V26 — Measurement and topology learning

Purpose/effect:

- determine whether page families deserve maintenance and how the corpus should evolve.

Validation vector:

- indexing and crawl;
- compatible nonbranded discovery;
- citations;
- task completion;
- qualified starts;
- managed interest;
- closed-won revenue and gross profit;
- maintenance/lifecycle cost;
- matched control arms and observation windows.

Pass vector:

- observations are bound to experiment/version/window/page;
- field results drive retain/improve/consolidate/remove recommendations;
- business value is evaluated with search and user utility;
- topology updates require reviewed recompilation.

Fail vector:

- rankings alone define success;
- events from other experiments/windows leak into metrics;
- page count or impressions conceal zero qualified value;
- field feedback silently rewrites canonical truth.

Current state: distribution scaffold exists; correctness P1 open.

### V27 — Memory, resumability, and multi-agent handoff

Purpose/effect:

- let long-running agent work survive sessions and agent changes.

Validation vector:

- authority consistency;
- immutable handoff coverage;
- file-reference precision;
- stale-state detection;
- resume success by another agent;
- token efficiency.

Pass vector:

- one `memory/MEMORY.md` provides current state;
- timestamped handoffs remain immutable;
- newest authority controls interpretation without deleting history;
- another agent can resume without hidden chat context.

Fail vector:

- old handoffs are rewritten;
- memory contradicts source/CI;
- state depends on conversational recollection;
- memory duplicates entire documents rather than referencing them.

Current state: protocol implemented; requires ongoing discipline.

## Whole-system acceptance vector

A project is ready for first noindex corpus generation only when:

```text
agent interface contract exists
+ ProjectInput/source/evidence/asset intake exists
+ independent context corpus exists
+ governed ontology exists
+ explicit primary-prototype semantics pass
+ calibrated hybrid compatibility evaluation passes
+ candidate funnel and corpus optimizer are integrated
+ PageGenerationJob compiler exists
+ typed graph/path schema exists
+ generation/critic/repair passes are traceable
+ preview/review surface exists
```

A project is ready for field publication only when the above also includes:

```text
content/utility/evidence distinctness
+ UI/browser/accessibility acceptance
+ canonical/crawl/schema/link parity
+ public task-surface safety when applicable
+ deterministic production build
+ cohort experiment manifest
+ rollback/consolidation plan
+ explicit reviewer approval
```

## Whole-system pass

- a user can start with business and brand materials rather than compiler internals;
- the agent constructs the model and generates the site through typed, reviewable stages;
- high-dimensional context directly affects page concepts, writing, utility, graph, conversion, and UI;
- the optimizer rejects most mathematically possible combinations;
- each published page has distinct value and a traceable reason to exist;
- advanced math/runtime arms beat or complement simpler controls;
- outputs remain static, fast, accessible, and deterministic;
- field evidence updates the corpus through reviewed recompilation.

## Whole-system fail

- the framework is merely a research library plus a hand-authored YAML file;
- the agent appears only after humans define the page matrix;
- the vector space is metadata rather than generation authority;
- generation is a noun-swapping prompt loop;
- user/developer workflow is undocumented or opaque;
- advanced algorithms are retained without end-to-end wins;
- hundreds or thousands of pages are emitted because combinations exist;
- sensitive demographics or stereotypes drive targeting;
- canonical content depends on runtime personalization;
- no clear preview, review, publication, or removal boundary exists.

## Current repository verdict

The repository currently proves portions of V05, V06, V09, V17, V18 source policy, V21 synthetic compilation, and V27 memory discipline.

It does not yet prove the actual product workflow V01–V04, V07–V08, V11–V16, V20 performance, V22–V26, or whole-system acceptance.

The next implementation should therefore begin with the orchestration spine, not more page fixtures:

```text
ProjectInput and ledgers
-> independent ContextCorpus contract
-> explicit primary prototype and typed edges
-> candidate coordinate compiler
-> PageGenerationJob compiler
-> agent pass runner/checkpoints
-> preview and validation UX
```

Only then should the framework generate its first real 20–40-page noindex cohort.