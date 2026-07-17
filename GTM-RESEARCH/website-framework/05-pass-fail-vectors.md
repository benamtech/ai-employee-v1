# 05 — Pass/Fail Vectors

Status: release gates

These thresholds are initial engineering gates. They are intentionally falsifiable and may be tightened after baseline measurement. A failed critical gate blocks production materialization even if other metrics look strong.

## Gate classes

- **P0 critical:** failure blocks deployment or forces baseline-only mode.
- **P1 required:** failure blocks experiment graduation.
- **P2 optimization:** failure creates follow-up work but may not block a controlled shadow run.

## Algebra correctness

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-HRR-01 | P0 | Same seed/version/symbol produces byte-identical f32 fixture output in repeated TypeScript builds. | Any nondeterminism. |
| PF-HRR-02 | P0 | Zig/WASM and TypeScript vectors/scores agree within `1e-5` absolute or documented ULP tolerance for golden fixtures. | Ranking or value exceeds tolerance. |
| PF-HRR-03 | P0 | `norm(normalize(x))` is `1 ± 1e-5`; zero/NaN/inf input returns explicit error. | Silent NaN/inf or invalid memory. |
| PF-HRR-04 | P1 | Median absolute cosine among 10,000 random distinct symbols <= `0.04` at selected D; p99 <= `0.12`. | Orthogonality threshold exceeded. |
| PF-HRR-05 | P1 | Single role/filler unbind ranks target top-1 in a 10,000-item cleanup dictionary >= `99.5%`. | Below threshold. |
| PF-HRR-06 | P1 | For declared maximum bundle size, target Recall@1 >= `95%` and Recall@5 >= `99%` on held-out synthetic fixtures. | Below either threshold. |
| PF-HRR-07 | P0 | Pre-bound and request-bound implementations produce identical top-k ordering in >= `99.99%` of golden scenarios and cosine >= `0.9999` between shapes. | Lower agreement. |

The bundle-size limit is set by experiment; do not hide capacity failure by removing hard examples.

## Retrieval quality

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-REL-01 | P1 | At least 200 blinded labeled scenarios with reviewer agreement statistics recorded. | Tiny/self-labeled evaluation. |
| PF-REL-02 | P1 | Selected resolver NDCG@5 >= `0.80`. | Below `0.80`. |
| PF-REL-03 | P1 | Selected resolver improves NDCG@5 by >= `0.05` absolute over deterministic-rules baseline and does not lose to dense-embedding baseline beyond `0.01`. | No meaningful improvement. |
| PF-REL-04 | P1 | Top-1 reviewer acceptability >= `85%`; baseline >= measured separately. | Below `85%`. |
| PF-REL-05 | P1 | Under 20% random noncritical feature dropout, top-3 acceptable candidate retention >= `95%`. | Lower robustness. |
| PF-REL-06 | P0 | Prohibited/ineligible candidate selection rate = `0` across exhaustive policy fixtures. | Any violation. |
| PF-REL-07 | P1 | Confidence gate precision >= `95%` on selected variants; uncertain cases fall back. | Resolver acts confidently on low-quality matches. |

## Dimension/representation choice

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-DIM-01 | P1 | Chosen D is on measured quality/latency/memory Pareto frontier. | Chosen by aesthetic preference. |
| PF-DIM-02 | P1 | Quantized representation changes top-1 on <= `0.5%` and NDCG@5 by <= `0.01` versus f32. | Larger quality loss. |
| PF-DIM-03 | P2 | Total bundled hot vector/manifest payload <= `2 MB` compressed for initial corpus, or chunking proves equal latency. | Unbounded artifact growth. |

## Edge performance

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-PERF-01 | P0 | Resolver compute p95 <= `10 ms`, p99 <= `20 ms` on target edge runtime after module initialization. | Above threshold. |
| PF-PERF-02 | P0 | Total resolver-added latency p95 <= `80 ms`, p99 <= `150 ms`, measured in at least 3 target regions. | Above threshold. |
| PF-PERF-03 | P0 | Default hot path performs zero remote database/vector-store calls. | Network dependency in default match. |
| PF-PERF-04 | P1 | Cold-start p95 and first-request overhead do not increase origin TTFB by > `100 ms`; exact platform budget documented. | Excess cold penalty. |
| PF-PERF-05 | P1 | WASM variant improves resolver p95 by >= `20%` or reduces CPU cost by >= `30%` versus optimized JS without hurting cold start. | Complexity has no material benefit; keep JS. |
| PF-PERF-06 | P0 | Any resolver timeout/error returns baseline within the overall latency budget. | Error delays or breaks page. |
| PF-PERF-07 | P1 | No memory growth > `5%` over a 30-minute sustained-load run after warmup. | Leak/unbounded cache. |

## Web performance

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-WEB-01 | P0 | Field p75 LCP <= `2.5 s`; launch target <= `1.8 s`. | Hard gate exceeded. |
| PF-WEB-02 | P0 | Field p75 INP <= `200 ms`; launch target <= `100 ms`. | Hard gate exceeded. |
| PF-WEB-03 | P0 | Field p75 CLS <= `0.1`; launch target <= `0.05`. | Hard gate exceeded. |
| PF-WEB-04 | P1 | Cached mobile lab LCP <= `1.0 s` on defined test profile for primary landing pages. | Target missed without documented network/platform cause. |
| PF-WEB-05 | P1 | Homepage initial JS <= `80 KB` gzip; noninteractive canonical pages <= `25 KB` gzip or zero. | Budget exceeded. |
| PF-WEB-06 | P1 | Initial CSS <= `35 KB` gzip. | Budget exceeded. |
| PF-WEB-07 | P0 | Variant selection causes no visible contradictory-content flash and no layout shift > `0.01`. | Flicker/shift. |
| PF-WEB-08 | P0 | Canonical answer, nav, internal links, evidence labels, price, and CTA work with JS disabled. | Missing essential experience. |

## SEO/indexing

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-SEO-01 | P0 | Every indexable URL returns `200`, self-canonical, unique title/H1, and meaningful initial HTML. | Any broken canonical page. |
| PF-SEO-02 | P0 | Ephemeral variant/session/query URLs in sitemap = `0`. | Any included. |
| PF-SEO-03 | P0 | Crawler/human parity test finds zero crawler-only text/links/claims and zero evidence upgrades. | Any cloaking-like difference. |
| PF-SEO-04 | P0 | Baseline and all variants preserve 100% of canonical product facts, offer truth, trust boundary, and limitations. | Any contradiction/omission that misleads. |
| PF-SEO-05 | P1 | Every proposed specialized page passes distinct-intent + original-information review; thin/doorway pages published = `0`. | Any thin page. |
| PF-SEO-06 | P0 | Structured data validation has zero critical errors and matches visible content/evidence. | Error or misleading schema. |
| PF-SEO-07 | P1 | Internal graph has zero orphan indexable pages and no redirect/canonical cycles. | Any orphan/cycle. |
| PF-SEO-08 | P1 | Pairwise near-duplicate detector flags are manually resolved; no neighboring page exceeds chosen similarity threshold without documented reason. | Unresolved duplication. |
| PF-SEO-09 | P1 | Search Console URL inspection confirms rendered/indexable canonical content on launch routes. | Google sees missing/blocked/different content. |

## Privacy

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-PRIV-01 | P0 | Browser fingerprint APIs used = `0`. | Any fingerprint collection. |
| PF-PRIV-02 | P0 | Raw IP persisted in resolver, shape store, or analytics = `0`. | Any persistence. |
| PF-PRIV-03 | P0 | Sensitive/protected-trait features or proxies in ontology = `0`. | Any prohibited feature. |
| PF-PRIV-04 | P0 | Baseline is complete with no consent and privacy-reduced signals. | Degraded/coercive baseline. |
| PF-PRIV-05 | P0 | No cross-session shape correlation without explicit informed consent. | Hidden continuity. |
| PF-PRIV-06 | P1 | Anonymous/consented session state TTL <= `24 h` default and deletion/withdrawal test passes. | Stale undeletable state. |
| PF-PRIV-07 | P1 | Cache keys are bounded variant/cohort keys, never unique shape/fingerprint hashes. | Cache becomes tracking store. |
| PF-PRIV-08 | P0 | Privacy/security review documents every feature source, purpose, entropy, retention, and consent rule. | Undocumented feature. |

## Security

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-SEC-01 | P0 | Forged external variant header accepted = `0`; signed internal header required and revalidated against manifest. | Header injection. |
| PF-SEC-02 | P0 | Fuzzing finds zero out-of-bounds WASM reads/writes, panics escaping boundary, or unsafe NaN/size handling. | Any memory-safety/bounds failure. |
| PF-SEC-03 | P0 | Query/campaign input cannot create symbols, component IDs, markup, URLs, or code outside allowlist. | Injection/dynamic minting. |
| PF-SEC-04 | P1 | Artifact checksums/version mismatch always returns baseline and alerts. | Stale/corrupt artifact used. |
| PF-SEC-05 | P1 | Resolver/config control actions require authenticated audited deployment path. | Public/unaudited mutation. |
| PF-SEC-06 | P1 | Load/abuse test does not cause cache explosion or unbounded cardinality. | Resource amplification. |

## Experimentation/causality

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-EXP-01 | P0 | A holdout assignment is randomized and stable for declared session, with bot exclusion and no identity stitching. | Biased assignment. |
| PF-EXP-02 | P1 | Primary metric, guardrails, sample plan, and analysis method are registered before data review. | Post-hoc winner selection. |
| PF-EXP-03 | P1 | Z beats A on primary metric with declared credible/confidence threshold and minimum practical effect. | No reliable useful lift. |
| PF-EXP-04 | P0 | No statistically/practically meaningful regression in LCP, INP, error rate, consent, trust/security engagement, or qualified conversion quality. | Guardrail regression. |
| PF-EXP-05 | P1 | Prior updates run offline, use shrinkage/minimum samples, and are versioned/rollbackable. | Per-request uncontrolled learning. |
| PF-EXP-06 | P1 | Segment findings are labeled exploratory unless individually powered. | False precision. |

## Product-truth/evidence

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-TRUTH-01 | P0 | Every variant preserves “AI Employee, not chatbot/estimator,” Start Free, Managed from $400, owner gates, and public-estimator non-canonical status. | Any contradiction. |
| PF-TRUTH-02 | P0 | Evidence label missing or upgraded beyond source record = `0`. | Any unlabeled/inflated proof. |
| PF-TRUTH-03 | P0 | Unsupported customer/provider/runtime claims = `0`. | Any fabricated or stale acceptance. |
| PF-TRUTH-04 | P0 | CTA destination is the real canonical employee-building path or an explicitly approved managed-interest path. | Fake/dead CTA. |

## Operations

| ID | Priority | Pass | Fail |
|---|---|---|---|
| PF-OPS-01 | P0 | Global resolver kill switch restores baseline within 5 minutes without code rollback. | Cannot stop materialization quickly. |
| PF-OPS-02 | P1 | Content/vector/graph/experiment versions are present in every exposure and diagnostic event. | Untraceable output. |
| PF-OPS-03 | P1 | Fallback-rate, variant-skew, latency, artifact mismatch, and conversion guardrail alerts are live. | Silent drift/failure. |
| PF-OPS-04 | P1 | Previous known-good artifact and experiment config can be restored in one deployment/config action. | Irreversible release. |
| PF-OPS-05 | P0 | Baseline path remains independent of Redis, pgvector, WASM, and experimentation services. | Core page coupled to experimental infra. |

## Graduation stages

### Stage 0 — specification

Pass: schemas, fixtures, baselines, and test harness designed.

### Stage 1 — local reference

Pass: HRR algebra, deterministic artifacts, relevance benchmark, canonical Next pages.

### Stage 2 — edge shadow

Pass: resolver scores requests but always serves baseline; performance/privacy/security gates pass.

### Stage 3 — internal materialization

Pass: finite variants enabled for internal/test traffic; SEO parity and no-flicker gates pass.

### Stage 4 — public A/Z experiment

Pass: small randomized Z traffic, kill switch, causal plan, all P0 gates green.

### Stage 5 — production default

Pass: reliable practical conversion lift, no guardrail regression, operational history, and all P0/P1 gates green.

No stage may be skipped by declaring the design “production-ready.”