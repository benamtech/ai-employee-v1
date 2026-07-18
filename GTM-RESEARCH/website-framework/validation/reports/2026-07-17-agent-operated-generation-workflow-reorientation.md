# Agent-Operated Generation Workflow Reorientation — Validation Report

Date: 2026-07-17
Branch: `agent/ui-metaprogramming-pass-1`
Status: architecture/validation authority updated; orchestration and generation-job implementation pending

## Scope

Correct the framework’s product model so the coding agent is first-class:

1. at project intake and vector/corpus formation; and
2. during actual page writing, utility construction, SEO/graph generation, UI rendering, criticism, and repair.

Map the complex internal system to an understandable framework workflow and define validation/pass/fail vectors across algorithms, features, user experience, developer experience, generation, UI, runtime, publication, and measurement.

## Core correction

Prior wording could be interpreted as though the vector compiler planned pages while a separate, incidental agent later wrote copy.

The controlling model is now:

```text
user business + brand + assets + goals
-> coding agent creates ProjectInput, ledgers, context corpus, ontology, vectors,
   candidate coordinates, and selected corpus
-> accepted coordinates compile into PageGenerationJobs
-> coding agent executes specialized research/content/utility/SEO/graph/UI/critic passes
-> current deterministic manifest/SiteSource/PageIR compiler emits the site
```

HRR/HDC/vector math does not independently author prose, but it is first-class generation authority because it determines and validates the page concepts and supplies the bounded state the agent uses to write/build every page.

## Files added

- `21-vector-to-generation-job-compiler.md`
  - defines the missing bridge from accepted prospect-context coordinates to executable agent jobs;
  - defines joint context, page coordinate, generation job shape, specialized passes, specificity requirements, and build-time versus runtime boundaries.

- `22-agent-operated-framework-workflow-validation-matrix.md`
  - defines expected framework ergonomics;
  - maps `init -> inspect -> research -> plan -> generate -> preview -> validate -> build -> publish -> measure`;
  - defines validation/pass/fail vectors for 27 cross-cutting features and workflow stages;
  - connects research, math, generation, UI, Wasm, publication, UX, DX, and field measurement.

## Files updated

- `AGENTS.md`
  - coding agent now explicitly writes/builds pages from `PageGenerationJob` objects;
  - read order includes `21` and `22`;
  - every feature/workflow must carry validation/pass/fail authority;
  - prospect-context axes and safety constraints clarified.

- `README.md`
  - makes agent-at-intake and agent-at-generation explicit;
  - adds the vector-to-generation pipeline;
  - distinguishes current late-stage compiler from missing orchestration spine;
  - documents target operator lifecycle/commands.

- `CODEGRAPH.md`
  - inserts `SelectedCorpusPlan -> PageGenerationJob compiler -> specialized agent passes` before the current manifest/compiler;
  - maps expected framework operation and validation authority graph;
  - lists missing orchestration, candidate, job, agent-runner, and review layers.

## Research integration

### Existing internal research

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

`22` does not replace these. It is the operational matrix tying their scientific and normative gates to the framework user/developer lifecycle.

### External research and platform references

- context-document compatibility and graded relevance: https://arxiv.org/abs/2309.05113
- HDC/VSA compositional representations: https://arxiv.org/abs/2112.15424
- CSI batch/split selection: https://arxiv.org/abs/2605.24779
- WebAssembly SIMD and portable execution: https://www.w3.org/TR/wasm-core/
- Cloudflare Wasm runtime constraints: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- R3F demand rendering: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Vite scaffold/dev/build lifecycle: https://vite.dev/guide/
- Next.js scaffold/dev/build lifecycle: https://nextjs.org/docs/app/getting-started/installation
- Astro scaffold/dev/build lifecycle: https://docs.astro.build/en/install-and-setup/
- Playwright user-facing multi-browser testing: https://playwright.dev/docs/best-practices
- AI-generated/scaled-content constraints: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content and https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

## Expected framework contract

A user should be able to operate the system without hand-authoring vector internals:

```text
framework init
framework doctor
framework research
framework plan
framework generate
framework dev
framework validate
framework build
framework publish
framework measure
```

These are target semantic operations. They may be implemented as CLI commands, agent skills, scripts, or combinations, but must have equivalent typed state transitions and artifacts.

## Validation vector result

### Pass — architecture authority

- agent is integral at project formation and page generation;
- page vectors compile into explicit generation jobs rather than generic prompts;
- joint prospect context is required to affect content, utility, proof, graph, CTA, and UI;
- the expected user/developer framework lifecycle is explicit;
- every major algorithm/feature/workflow now has a validation/pass/fail slot in `22`;
- current implementation gaps are preserved rather than presented as complete.

### Fail prevented

- framing the system as only a vector planner plus incidental content writer;
- expecting users to manually author the manifest/page matrix;
- allowing generation from a free-form noun-swapping prompt;
- validating only algorithms while ignoring user/dev operation;
- equating generated page count with framework success;
- hiding project state in conversational memory;
- treating sensitive or irrelevant personal attributes as page-worthy by default.

### Not implemented or validated

- `ProjectInput` and ledger schemas;
- independent ContextCorpus workflow;
- candidate coordinate compiler;
- `SelectedCorpusPlan`;
- `PageGenerationJob` source types/compiler;
- specialized agent pass runner and checkpoints;
- preview/corpus-review UI;
- target framework CLI/skills;
- real end-to-end generation of a business site;
- Wasm/native full-loop performance;
- independently judged page quality/search/commercial outcomes.

## Current verdict

The repository now has a coherent product and validation model, but its executable package still begins near the end of the desired lifecycle.

The next implementation must build the orchestration spine:

```text
ProjectInput + ledgers
-> independent ContextCorpus
-> candidate coordinate compiler
-> SelectedCorpusPlan
-> PageGenerationJob compiler
-> specialized agent runner/checkpoints
-> preview/validation experience
-> current deterministic compiler
```

Do not generate the first real page cohort before these contracts and the existing P0 relevance/primary/path gates are implemented.