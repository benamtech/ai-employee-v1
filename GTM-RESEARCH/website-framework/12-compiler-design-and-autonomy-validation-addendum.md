# 12 — Compiler, Design, and Autonomy Validation Addendum

Status: required Phase 2 validation extension
Updated: 2026-07-17

This addendum extends `04-feature-validation-vectors.md` and `05-pass-fail-vectors.md` for the newly defined software category, landing-page compiler, distributed content fabric, generative UI, commitment elasticity, and autonomous operating-loop claims.

## V25 — Content compiler determinism

Inputs:

- identical source registry, schema, compiler version, and configuration;
- changed claim, evidence, token, route, or component dependency;
- shuffled source-file order;
- missing or circular dependencies.

Validate:

- identical inputs produce byte-identical canonical/manifest outputs;
- source order does not change semantics;
- intended changes invalidate only affected artifacts where possible;
- cycles, missing references, duplicate IDs, and evidence contradictions fail the build;
- every output records source/compiler versions and checksums.

## V26 — Multi-channel truth propagation

Change one offer, price, limitation, proof state, CTA, or entity fact.

Validate across:

- canonical pages;
- landing variants;
- structured data;
- ad-message matrices;
- email/social/sales exports;
- agent/MCP resources.

Pass only when stale conflicting output count is zero.

## V27 — Design grammar fidelity

For every generated page family:

- validate token usage, typography, hierarchy, semantic colors, spacing, contrast, responsive rules, media roles, motion, reduced-motion, and component eligibility;
- compare generated output with designer-approved visual fixtures;
- detect prohibited combinations and brand drift;
- record performance cost by variant.

Failure behavior: reject the generated variant and serve the approved baseline.

## V28 — Generative UI task fit

Compare chat-only, static authored UI, finite materialized UI, and schema-constrained generated UI on representative tasks.

Measure:

- task completion;
- time/actions to completion;
- error and abandonment;
- comprehension of state, approval, and proof;
- accessibility;
- subjective trust and preference;
- generated-schema rejection/fallback rate.

A generated interface must improve a declared task dimension without reducing control or truth.

## V29 — Commitment elasticity

Scenarios:

- visitor wants one immediate plain-text task;
- visitor wants a reusable skill;
- visitor wants managed connected work;
- visitor wants technical architecture and model/runtime controls;
- visitor wants multi-employee operations.

Validate:

- each can begin without completing unrelated technical setup;
- default path requires no API key, CLI, local runtime, or marketplace selection;
- technical controls remain discoverable without dominating the default experience;
- CTA and onboarding match the selected commitment level;
- product facts and evidence remain identical.

## V30 — Operator-effort and offline autonomy

For each advertised workflow, record:

- owner setup minutes;
- required keys/accounts/connectors;
- active keyboard minutes per run;
- manual recovery steps;
- work completed while owner is offline;
- approval interruptions;
- failure detection and proof;
- total useful output.

Do not claim “runs a company” from agent activity alone. The measured unit is accepted useful work under defined authority and recovery boundaries.

## V31 — Landing-page family quality

For each generated page:

- distinct owner question and audience job;
- unique information-gain object or proof arrangement;
- canonical relationship and indexing policy;
- correct offer/evidence/CTA;
- no thin swap-only copy;
- no duplicate title/H1/canonical;
- useful baseline with JS disabled;
- explicit variant axes and fixtures.

Output: publish, noindex campaign-only, merge, or reject.

## V32 — Candidate coverage and replication

Model candidate clusters as mapping schemas.

For each corpus size and cluster strategy measure:

- maximum and average candidate group size;
- feature/candidate replication rate;
- percentage of labeled eligible outputs covered;
- false-negative retrieval rate;
- exact-score operations per request;
- artifact size and duplicated bytes;
- cache and initialization cost;
- latency distribution.

Compare:

- flat exact scan;
- route partitioning;
- facet inverted index;
- centroid clusters;
- graph partitions;
- ANN only when justified.

Select a point on the measured coverage/replication/latency frontier. Coverage of policy-eligible labeled outputs must be complete before optimizing communication.

## V33 — Broad-user and accessibility resilience

Test:

- keyboard-only;
- screen reader;
- zoom/reflow;
- reduced motion;
- high contrast;
- slow device/network;
- no JavaScript;
- privacy-reduced browser;
- low technical literacy;
- expert/power-user mode.

The universal baseline must pass. Adaptation may reduce effort but cannot be required for comprehension or conversion.

## V34 — Human/agent manipulation resistance

Evaluate pages and generated interfaces with humans, browser/GUI agents, and human-agent teams against:

- hidden costs;
- preselected consent;
- urgency manipulation;
- misleading hierarchy;
- obstructed cancellation;
- forged proof;
- ambiguous approval buttons;
- prompt injection in content or tool resources.

Agents may prioritize task completion over protective action, so the compiler must enforce explicit policy rather than relying on model judgment.

## Pass/fail gates

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-COMP-01 | P0 | Identical compiler inputs produce byte-identical outputs and checksums. | Any unexplained nondeterminism. |
| PF-COMP-02 | P0 | Broken references, cycles, claim/evidence conflicts, or invalid CTAs fail the build. | Invalid artifact emitted. |
| PF-DIST-01 | P0 | Changed canonical fact propagates to every affected channel; stale contradiction count = 0. | Any stale conflicting output. |
| PF-DESIGN-01 | P0 | Generated pages use only approved tokens/components/combinations and pass contrast/responsive checks. | Brand/accessibility violation. |
| PF-DESIGN-02 | P1 | Designer regression review accepts >= 95% of generated fixtures; all rejects are blocked before release. | Unreviewed drift ships. |
| PF-GUI-01 | P1 | Materialized/generated UI improves declared task completion or reduces median actions by >= 15% versus the best simpler interface, without trust/accessibility regression. | No useful improvement or guardrail loss. |
| PF-COMMIT-01 | P0 | Low-commitment path completes without user-provided API keys, CLI, local runtime, or agent selection. | Technical setup is mandatory. |
| PF-COMMIT-02 | P1 | Technical proof depth is reachable in <= 2 actions from relevant pages without burdening baseline users. | Hidden or dominant technical path. |
| PF-AUTO-01 | P0 | Every autonomy claim maps to a replayable workflow proof with inputs, authority, outputs, approvals, failure handling, and owner-effort measurement. | Vague multi-agent activity presented as autonomous operation. |
| PF-AUTO-02 | P1 | Selected workflows reduce active owner time by >= 50% versus measured baseline while preserving accepted output quality. | Less reduction or quality loss. |
| PF-LP-01 | P0 | Every indexable generated page passes distinct-intent/original-information/canonical review. | Thin or doorway page ships. |
| PF-COVER-01 | P0 | Eligible labeled output coverage = 100%; policy-ineligible selection = 0. | Any uncovered eligible case or policy violation. |
| PF-COVER-02 | P1 | Chosen clustering is on measured coverage/replication/latency frontier and beats flat scan at target corpus size. | Complexity without measured benefit. |
| PF-ACCESS-01 | P0 | Canonical baseline passes WCAG-oriented keyboard, screen-reader, zoom/reflow, contrast, and reduced-motion tests. | Essential task inaccessible. |
| PF-MANIP-01 | P0 | Automated and manual tests find zero forbidden dark-pattern, forged-proof, hidden-consent, or ambiguous-approval constructions. | Any violation. |

## Phase 2 acceptance rule

Phase 2 may claim a working local reference only after:

- the synthetic benchmark generator runs and validates exactly 100 entries;
- deterministic compiler/HRR fixtures pass;
- at least two real AMTECH landing-page families compile from shared source objects;
- design grammar and canonical truth gates pass;
- rules/facets/HRR and flat/cluster baselines are compared;
- all failures and unrun tests are recorded.

It still may not claim public conversion lift, Cloudflare performance, Google indexing, autonomous-company operation, or production readiness.
