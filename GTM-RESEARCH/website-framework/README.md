# Hyperperformant Holographic Website Framework

Status: Phase 1 research/specification complete; Phase 2 local reference implementation pending
Created: 2026-07-17
Implementation root: `GTM-RESEARCH/website-framework/`

## Software category

This is an **adaptive experience compiler and edge decisioning runtime**, commercially describable as an **Experience Materialization Platform**.

It compiles a company’s approved knowledge, offers, proof, design grammar, routes, and experiment policy into:

- a complete canonical website;
- finite context-resolved landing experiences;
- structured data and agent-readable resources;
- channel-specific campaign artifacts;
- explainable A/Z experiments;
- safe agentic and generative UI surfaces.

It is not a covert customer-profile system, fingerprinting product, arbitrary AI page generator, doorway-page factory, or replacement for human brand judgment.

## Mission

Build a hyperperformant, hyper-specialized, agentic-search-ready public website whose static knowledge graph is indexable and whose presentation can be resolved into the most relevant bounded content slice for the current request/session context.

The matching input is an ephemeral, non-identifying **context hypervector** assembled from allowlisted request, route, campaign, language, coarse region, device class, explicit choices, and consented in-session interaction features.

The framework applies Holographic Reduced Representations / Vector Symbolic Architectures to:

- encode compositional intent and content structures in fixed-width vectors;
- retrieve resonant content and component candidates;
- augment similarity with a precomputed topic/entity graph and bounded priors;
- materialize finite policy-safe variants without sacrificing the canonical SEO shell;
- compare a stable baseline against continuous finite resolution through an A/Z suite.

The mathematics is classical HRR/VSA, not quantum computing. The framework remains experimental until scientific, relevance, compiler, latency, privacy, security, accessibility, SEO, autonomy, operator-effort, and conversion gates pass.

## Read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `CODEGRAPH.md`
5. `AGENTS.md`
6. `../../mvp-build/CODEGRAPH.md`
7. `../../mvp-build/memory/MEMORY.md`
8. `../../docs/AMTECH_WEB_DESIGN_SYSTEM.md`
9. `../../docs/AMTECH_AGENTIC_GENERATIVE_WEB_DESIGN_ADDENDUM.md`
10. `../../docs/amtech-website-rewrite-brief.md`
11. `00-scientific-and-feasibility-validation.md`
12. `01-system-architecture.md`
13. `02-shape-model-and-hrr-core.md`
14. `03-agentic-seo-system.md`
15. `04-feature-validation-vectors.md`
16. `05-pass-fail-vectors.md`
17. `06-experimentation-privacy-operations.md`
18. `07-v0.1-request-mirror-lab.md`
19. `08-implementation-plan.md`
20. `09-phase-1-synthesis-competitive-and-systems-positioning.md`
21. `10-software-category-and-commercial-use-cases.md`
22. `11-hyper-distributed-content-generative-ui-and-design-collaboration.md`
23. `12-compiler-design-and-autonomy-validation-addendum.md`
24. `13-academic-and-normative-basis-for-validation-vectors.md`
25. `14-phase-2-experience-materialization-engine-plan.md`
26. `site-manifest.yaml`
27. `HANDOFF-LANDING-PAGES.md`

## Canonical stack hypothesis

- **Application:** Next.js 16+ App Router with Cache Components / Partial Prerendering.
- **Orchestration/compiler:** strict TypeScript with owned typed intermediate representations.
- **Math core:** TypeScript reference first; Zig compiled to pre-imported WebAssembly only after correctness and runtime performance gates pass.
- **Content:** typed source objects and MDX/components. Prefer an owned Zod-based compiler or a validated package; do not assume Contentlayer compatibility.
- **Edge resolver:** dedicated Cloudflare Worker or equivalent in front of the origin.
- **State/cache:** immutable build artifacts; Redis/Postgres/pgvector only where measured operational value justifies network cost.
- **Deployment:** Vercel and/or Cloudflare selected through real build and runtime validation.

## Fundamental architecture

```text
COMPANY SOURCE
knowledge + offer + evidence + entities + design grammar + route policy
-> typed content/design IR
-> canonical compiler + finite variant compiler
-> pages + structured data + vectors + graph priors + channel artifacts

REQUEST
allowlisted ephemeral context
-> coverage/candidate retrieval
-> exact HRR/facet score
-> graph/business prior
-> eligibility/evidence/privacy gate
-> finite variant ID or baseline

EXPERIMENT
A = complete canonical baseline
Z = algorithmically selected finite experience
-> relevance + effort + conversion + performance + accessibility + privacy + SEO
-> offline reviewed update
```

## Key performance and complexity insight

Do not perform circular convolution for every feature on every request.

At build time, precompute each allowed `role ⊗ value` vector. At request time, construct the context hypervector through weighted superposition, normalize it, retrieve a bounded candidate set, and run exact similarity.

Candidate clustering is a coverage/replication problem. Smaller candidate groups can increase feature/candidate replication and artifact communication; larger groups increase exact-scoring work. Flat exact scan is the required baseline, and every eligible output must remain covered.

## Content and design model

The website is a typed program:

```text
source objects
-> experience AST/IR
-> canonical pages
-> landing-page families
-> visual/interaction variants
-> channel outputs
-> validation and checksums
```

The graphic designer defines the expressive visual grammar. The compiler makes tokens, component states, responsive constraints, accessibility, evidence, performance, variant eligibility, and regression fixtures executable.

Generative UI is bounded:

- static authored UI for canonical and critical paths;
- finite materialized UI for default adaptation;
- schema-constrained generated UI only after task-specific validation;
- no arbitrary promotional DOM/copy generation at the edge.

## SEO invariants

1. Every indexable URL has stable, useful, server-rendered canonical content.
2. Crawlers and humans receive the same primary topic, claims, price, evidence, and limitations.
3. Ephemeral variants are not separately indexable URLs.
4. Long-tail pages exist only for distinct questions with original information.
5. Structured data describes visible content and never upgrades evidence.
6. No thin permutations, scaled-content abuse, cloaking, fake reviews/FAQ, or AI-answer manipulation.

## Privacy invariants

- no browser fingerprinting;
- no persistent identity inferred from device characteristics;
- no raw IP storage in resolver/analytics paths;
- coarse geography only where operationally necessary;
- no sensitive, financial, family, pet, vehicle, or lifestyle inference;
- no cross-session shape ID without explicit consent;
- short-lived allowlisted context only;
- complete baseline when personalization is disabled.

Synthetic persona matrices test representation and retrieval. They are not runtime inference targets.

Consented owner research may import user-controlled account exports only through the isolated, reviewable, deletable adapters defined in `14-phase-2-experience-materialization-engine-plan.md`. It does not authorize covert cross-site identity resolution, fingerprinting, OSINT enrichment of arbitrary visitors, or runtime ingestion of raw search/place/history data.

## Performance targets

Resolver:

- edge compute p95 <= 10 ms after initialization;
- total resolver overhead p95 <= 80 ms;
- zero remote database call on the default hot path;
- deterministic baseline fallback on timeout/error;
- Zig/WASM ships only with material end-to-end benefit.

Website:

- cached lab LCP <= 1.0 s on defined test profiles;
- field p75 LCP <= 1.8 s target and <= 2.5 s hard gate;
- field p75 INP <= 100 ms target and <= 200 ms hard gate;
- CLS <= 0.05 target and <= 0.1 hard gate;
- no contradictory-content flash;
- no third-party script on the critical rendering path.

## AMTECH product mission

> **Your business gets an employee that lives in the software.**

```text
owner asks or a business event arrives
-> AI Employee works
-> proof appears
-> owner approves when required
-> action happens
-> proof and memory remain
```

Primary CTA: **Build my AI Employee**

Offer: **Start free. Managed AI Employee from $400.**

The default experience requires no API keys, CLI, local runtime, or agent marketplace. Technical architecture, model, runtime, and orchestration depth remains available for power users without becoming mandatory.

The public estimator remains outdated and non-canonical.

## Phase state

Phase 1 completed:

- scientific and feasibility review;
- architecture and feature ontology;
- privacy/SEO/security boundaries;
- academically and normatively grounded validation/pass-fail gates;
- v0.1 Request Mirror definition;
- A/Z causal and operational model;
- Orkas competitive positioning and commitment-elasticity thesis;
- coverage/replication complexity model;
- deterministic synthetic 100-slice generator plus local execution/hash/constraint report;
- software category, multi-channel content, design, agentic/generative UI, and landing-page operating model.

Phase 2 first-pass authority:

- `14-phase-2-experience-materialization-engine-plan.md` makes the deterministic compiler/resolver and real landing-page materialization engine the first integrated priority;
- it defines exactly five two-part workstreams with explicit validation, pass, and fail vectors;
- it keeps flat exact scan, the canonical baseline, and consented context provenance as mandatory controls;
- it treats Zig/WASM and third-party experimentation platforms as optional measured optimizations.

Not completed:

- TypeScript HRR/compiler implementation;
- Worker/Next/Zig code;
- Cloudflare deployment;
- real landing-page compilation;
- browser/accessibility/load/SEO tests;
- conversion, autonomy, provider, or runtime acceptance.

## Production decision rule

No component graduates because it sounds mathematically elegant or visually advanced. It must pass the explicit validation vectors on the actual target runtime with an auditable baseline, reversible artifact, and safe fallback.
