# 09 — Phase 1 Synthesis: Competitive and Systems Positioning

Status: Phase 1 research/specification complete
Updated: 2026-07-17

## Phase 1 result

Phase 1 produced a falsifiable architecture for a privacy-bounded, high-performance website resolver and clarified the product strategy it must express.

The framework is not yet implemented or production-validated. It is ready to enter Stage 1 local-reference work because the core terms, data boundaries, baselines, feature vectors, release gates, experiment model, and failure conditions are now explicit.

## Canonical terminology

Use these terms precisely:

- **Hyperdimensional state space:** the high-dimensional vector space containing approved context and content representations.
- **Context hypervector:** the bounded, ephemeral superposition of approved request/session features.
- **Content slice:** one finite, reviewed page or component variant eligible for selection.
- **Slice geometry:** the relative position, eligibility region, margin, and neighborhood of content slices in the state space.
- **Holographic materialization:** selecting or composing approved slices from a context hypervector.
- **A/Z suite:** the experiment and evaluation system comparing the canonical A baseline with the continuously resolved but finite Z arm.
- **Computing in superposition:** the accepted VSA/HDC description for bundling many structures into one high-dimensional representation.

Do not call the current system quantum computing. It is classical HRR/VSA. Emerging Quantum Hyperdimensional Computing research may become relevant to future hardware, but it does not validate or describe the present implementation. “Quantum-inspired” is acceptable only when tied to a specific mathematical analogy and accompanied by the classical-computation boundary.

## New scientific synthesis

### Order and role can live in the representation

Jones and Mewhort's 2007 composite holographic lexicon demonstrates that convolution and superposition can learn representations containing both word meaning and recoverable order information. The useful design implication is not that the website should become a language model. It is that structural distinctions can be carried by the representation rather than recreated through a growing tower of special-case routing rules.

For AMTECH this strengthens the rationale for role-bound features such as:

```text
ROLE_AUDIENCE ⊗ VALUE_CONTRACTOR
ROLE_INTENT ⊗ VALUE_ESTIMATE_FOLLOWUP
ROLE_OPERATING_MODE ⊗ VALUE_MANAGED
ROLE_PROOF_DEPTH ⊗ VALUE_TECHNICAL
```

The paper does not prove conversion lift, website personalization quality, or edge-runtime feasibility. Those remain experimental questions.

Reference: Michael N. Jones and Douglas J. K. Mewhort, “Representing Word Meaning and Order Information in a Composite Holographic Lexicon,” Psychological Review 114(1), 2007, DOI `10.1037/0033-295X.114.1.1`.

### Coverage versus replication is a first-class systems tradeoff

MapReduce mapping-schema theory gives the framework a useful complexity lens:

1. every selectable output must be covered by at least one bounded candidate group;
2. reducing candidate-group size increases the number of groups a feature/context may need to touch;
3. broader replication increases communication, memory pressure, and cache/artifact cost;
4. larger groups reduce replication but increase exact-scoring work and irrelevant-candidate exposure.

For the resolver:

- a **reducer** is analogous to a bounded candidate cluster;
- **reducer size** is the number of candidates exact-scored in that cluster;
- **replication rate** is the average number of clusters to which a feature, route, or candidate must be assigned;
- **coverage** means every eligible context-output relationship has a valid retrieval path;
- **communication** means artifact duplication, lookup work, cache footprint, and request-time scoring overhead.

The framework must measure this curve instead of choosing cluster size aesthetically. Flat exact scan remains the required baseline.

Reference: Foto N. Afrati, Anish Das Sarma, Semih Salihoglu, and Jeffrey D. Ullman, “Upper and Lower Bounds on the Cost of a Map-Reduce Computation,” and the associated reducer-size/replication-rate mapping-schema treatment.

## Orkas competitive teardown

Observed public positioning as of 2026-07-17:

- “Your AI team” led by a Commander agent;
- five featured agents, 25+ built-in agents, and a marketplace;
- external Claude Code, Codex, OpenClaw, OpenCode, Hermes, CLI, and MCP integrations;
- local-first files and project history;
- open-source/self-host and bring-your-own-model-key positioning;
- direct tasks, delegation, research, SEO/GEO, design, coding, app building, and media workflows;
- confirmation modes for sensitive operations.

This is a credible product for coders, indie hackers, and power users who spend many hours per day at a computer and are willing to manage models, keys, local state, agents, and operating context.

AMTECH should not imitate its marketplace or “more agents” framing. The strategic wedge is the infrastructure and service layer Orkas leaves to the user.

### AMTECH competitive thesis

```text
Orkas:
user becomes the operator of an AI team

AMTECH:
software infrastructure becomes an employee of the business
```

AMTECH should win on:

- plain-text activation in under two minutes;
- no API-key, CLI, local-runtime, or agent-marketplace requirement;
- managed model/provider/runtime custody;
- durable employee identity and business-specific context;
- event-driven and scheduled work without a human remaining at the keyboard;
- connected business tools and concrete work products;
- approval gates at customer, money, reputation, and destructive-action boundaries;
- proof of work, retries, state, and outcomes;
- a free self-serve layer plus a managed employee from $400;
- optional technical depth without imposing technical commitment.

The website must show this contrast without naming a competitor on every page. The default page should communicate low commitment and immediate usefulness. Technical or power-user slices may expose architecture, portability, model choices, observability, and deeper controls.

## Commitment elasticity

The central product and website principle is **capability without compulsory commitment**.

A visitor should be able to enter at any point on this gradient:

```text
one plain-text task
-> reusable skill
-> connected recurring workflow
-> managed AI Employee
-> coordinated multi-employee operating system
```

The infrastructure may be capable of running a large portion of a small software-development company, but the user should not need to configure or mentally operate that company-wide system on day one.

A credible future autonomous software-business loop could include:

```text
market and customer research
-> product backlog and specification
-> implementation and tests
-> deployment and monitoring
-> website/content materialization
-> paid-search experiment generation
-> lead qualification and sales follow-up
-> support and incident triage
-> measurement, proof, and approval
```

Model subscriptions, search-ad budget, connectors, and owner authority are resources inside the operating envelope. They are not proof that the full loop currently runs unattended. This remains a staged product hypothesis requiring explicit acceptance evidence.

## A/Z suite as infrastructure validation

The A/Z suite is not just a marketing experiment tool. It is a validation surface for the software infrastructure itself.

A remains the complete canonical experience. Z selects a finite slice from the approved state space. The suite should evaluate:

- operator-effort reduction;
- time to first useful work;
- API-key/setup burden;
- ability to continue while the owner is offline;
- correct selection of managed versus technical proof depth;
- onboarding completion;
- qualified managed-interest conversion;
- trust and approval understanding;
- resolver relevance, latency, privacy, and SEO parity;
- whether the autonomous operating loop produces useful work rather than merely more agent activity.

The Z arm must never infer net worth, family structure, pets, vehicle, or lifestyle from request/browser data. Those dimensions are synthetic benchmark labels or explicit inputs only.

## Synthetic 100-slice benchmark

The supplied example matrix was truncated during `SLICE-027`, so it could not be accepted as a complete machine-readable fixture.

Phase 1 replaces it with a deterministic generator:

- `scripts/generate-synthetic-persona-matrix.mjs`

It emits exactly 100 TOON entries satisfying:

- United States metro space;
- ages 30–60;
- synthetic net worth $550,000–$2,000,000;
- fewer than two homes;
- unique professional, operational, domestic, aesthetic, vehicle, hobby, and emotional-friction combinations;
- plain-text activation under two minutes;
- no API-key requirement.

These values are synthetic evaluation labels. They are prohibited as hidden runtime inference targets. The benchmark tests representation capacity, perturbation robustness, nearest-slice behavior, and policy filtering—not surveillance accuracy.

## Phase 1 validated insights

1. HRR/VSA is a plausible structured matcher, not a validated conversion engine.
2. Role binding and superposition can encode structure while keeping the higher-level resolver simpler.
3. Build-time pre-binding removes request-time FFT from the default hot path.
4. A finite reviewed slice catalog is safer and more reproducible than edge-generated copy.
5. Flat exact scan and deterministic rules are mandatory baselines.
6. Graph calculations belong offline; runtime graph pull must be bounded.
7. Candidate clustering must optimize the coverage/replication curve.
8. The default website promise is managed outcomes without technical burden.
9. Technical depth is a selectable proof mode, not a prerequisite.
10. A/Z must measure autonomy and operator effort, not just click-through rate.
11. Classical hyperdimensional superposition is the accurate present term; quantum language must remain explicitly bounded.
12. The website remains canonical and complete without personalization, JavaScript, consent, or experimental infrastructure.

## Phase 1 exit gate

Phase 1 is complete when this document and the accompanying scientific, architecture, feature, pass/fail, privacy, lab, implementation, manifest, and benchmark-generator artifacts are merged.

Phase 2 begins with code, not more speculative architecture:

1. generate and validate the 100-slice fixture;
2. implement deterministic TypeScript HRR primitives;
3. run rules/facet/HRR baseline comparisons;
4. quantify candidate-cluster coverage versus replication;
5. implement the noindex Worker Request Mirror baseline;
6. add shadow-only selection diagnostics;
7. begin Zig/WASM only after the TypeScript oracle passes.

No production, conversion, provider, runtime, Cloudflare, SEO, or autonomous-company acceptance is claimed at the Phase 1 exit.
