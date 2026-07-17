# 05 — Pass/Fail Vectors

Status: release gates; academically reviewed 2026-07-17

These gates combine four evidence classes:

- **T — mathematical/theoretical:** derived from algebra, probability, numerical analysis, or information-retrieval definitions.
- **A — academic empirical:** supported by peer-reviewed research, but not necessarily with the exact AMTECH threshold.
- **N — normative/platform:** required by web standards, Google Search documentation/policies, or target-runtime contracts.
- **E — AMTECH engineering:** a falsifiable product/risk budget chosen for this system. It must be tuned from data and must never be described as a published scientific constant.

The source IDs are defined in `13-academic-and-normative-basis-for-validation-vectors.md`. A source can justify the metric or failure mode without justifying the exact numeric threshold.

## Gate classes

- **P0 critical:** failure blocks deployment or forces baseline-only mode.
- **P1 required:** failure blocks experiment graduation.
- **P2 optimization:** failure creates follow-up work but may not block a controlled shadow run.

## Algebra correctness

| ID | Priority | Basis | Pass | Fail |
|---|---|---|---|---|
| PF-HRR-01 | P0 | T/A/E: HRR-PLATE, HDC-KANERVA, VSA-SURVEY | Deterministic symbol generation is byte-identical for the same pinned seed/version/namespace/symbol. A pinned reference build emits identical artifact checksums on repeat. Floating-point algebra across different engines is tolerance-tested rather than assumed byte-identical. | Any symbol nondeterminism or unexplained checksum drift in the pinned build. |
| PF-HRR-02 | P0 | T/A/E: HRR-PLATE, HRR-STABILITY | TypeScript and Zig/WASM produce identical candidate ordering on all golden fixtures and values within `1e-5` absolute **or** a documented operation-specific ULP tolerance. Near-ties within tolerance are labeled ties and resolved deterministically. | Ranking changes outside the tie policy or values exceed tolerance. |
| PF-HRR-03 | P0 | T/E | `norm(normalize(x)) = 1 ± 1e-5` for valid nonzero inputs. Zero, NaN, infinity, overflow, invalid length, and out-of-bounds input return explicit errors and baseline fallback. | Silent NaN/inf, invalid memory access, or normalization of invalid input. |
| PF-HRR-04 | P1 | T/A: HDC-KANERVA, VSA-SURVEY, JL-ACHLIOPTAS | For random unit symbols at dimension `D`, the empirical absolute-cosine distribution is consistent with the random-vector reference: median `<= 1.25 * sqrt(2/(πD))` and p99 `<= 1.25 * 2.576/sqrt(D)`, with confidence intervals and seed count reported. | Distribution materially exceeds either dimension-aware bound or shows systematic correlation. |
| PF-HRR-05 | P1 | A/E: HRR-PLATE, VSA-SURVEY | For a single clean role/filler binding across the declared production cleanup-dictionary sizes, top-1 retrieval is `>= 99.5%`, and the Wilson 95% lower bound is `>= 99.0%`. Report failure by role, value frequency, and D. | Point estimate or lower bound misses threshold. |
| PF-HRR-06 | P1 | T/A/E: SUPERPOSITION-CAPACITY, VSA-SURVEY | The declared maximum bundle size is the largest tested size whose held-out Wilson 95% lower bounds meet Recall@1 `>= 95%` and Recall@5 `>= 99%`, under declared noise/dropout. Capacity curves are published; hard cases are retained. | Claimed bundle size exceeds measured capacity or misses either lower-bound threshold. |
| PF-HRR-07 | P0 | T/E | Pre-bound and request-bound implementations have cosine `>= 0.9999` and identical top-k ordering on every golden fixture; on at least 100,000 randomized scenarios, agreement is `>= 99.99%` after excluding declared numerical ties. | Any golden mismatch or randomized agreement below threshold. |

The literature establishes compositional binding, noisy cleanup, high-dimensional near-orthogonality, and interference-limited capacity. It does **not** prescribe AMTECH's `99.5%`, `95%`, `99%`, or tolerance budgets; those are risk-based engineering gates.

## Retrieval quality

| ID | Priority | Basis | Pass | Fail |
|---|---|---|---|---|
| PF-REL-01 | P1 | A/E: REL-VOORHEES, NDCG-JARVELIN | At least `200` blinded scenarios, at least `3` independent assessors per scenario where feasible, graded relevance labels, assessor-agreement statistics, adjudication rules, and a documented sample/power rationale. Report system rankings under each assessor set as a stability check. | Tiny/self-labeled evaluation, no disagreement record, or no sampling rationale. |
| PF-REL-02 | P1 | A/E: NDCG-JARVELIN | Report NDCG@5 with paired bootstrap 95% confidence intervals. Initial graduation target: point estimate `>= 0.80` and lower bound `>= 0.75`; if label density or task structure makes this inappropriate, preregister a different absolute floor before test-set review. | Misses the preregistered absolute floor. |
| PF-REL-03 | P1 | A/E: NDCG-JARVELIN, REL-VOORHEES | Against deterministic rules, bag-of-facets, dense embeddings, and hybrid-no-HRR baselines, selected resolver improves NDCG@5 by `>= 0.05` absolute over deterministic rules with a paired 95% CI excluding zero, and does not trail the best simpler baseline by more than `0.01`. | No practically meaningful supported improvement, or a simpler baseline wins beyond tolerance. |
| PF-REL-04 | P1 | A/E: REL-VOORHEES | Top-1 reviewer acceptability point estimate `>= 85%` with Wilson 95% lower bound `>= 80%`. Baseline acceptability and disagreement are reported separately. | Point estimate or lower bound misses threshold. |
| PF-REL-05 | P1 | A/E: SUPERPOSITION-CAPACITY | Under preregistered `20%` random noncritical feature dropout and structured missing-feature tests, acceptable candidate retention in top 3 is `>= 95%` with 95% CI; prohibited features are never substituted. | Robustness below threshold or hidden feature substitution. |
| PF-REL-06 | P0 | N/E | Prohibited or hard-ineligible candidate selection rate is exactly `0` across exhaustive generated policy fixtures and fuzzed combinations. | Any violation. |
| PF-REL-07 | P1 | A/E: CALIBRATION-GUO | The confidence gate is evaluated as a selective prediction system: selected-variant precision `>= 95%`, Wilson lower bound `>= 92%`, expected calibration error `<= 0.05`, Brier score and coverage reported, and uncertain cases fall back. | Overconfident low-quality selection, unreported coverage, or calibration threshold missed. |

NDCG is appropriate because labels are graded and rank position matters. Absolute score floors are AMTECH targets; comparative paired evaluation and uncertainty reporting are the academically grounded requirements.

## Dimension/representation choice

| ID | Priority | Basis | Pass | Fail |
|---|---|---|---|---|
| PF-DIM-01 | P1 | T/A/E: JL-ACHLIOPTAS, VSA-SURVEY, SUPERPOSITION-CAPACITY | Chosen D lies on the measured relevance/robustness/latency/memory Pareto frontier across at least `512, 1024, 2048, 4096`, and no lower D satisfies every P0/P1 quality gate with materially better cost. | D selected by convention, aesthetics, or a single metric. |
| PF-DIM-02 | P1 | A/E: PQ-JEGOU | Versus f32, any f16/i8/PQ representation changes top-1 on `<= 0.5%`, reduces NDCG@5 by `<= 0.01`, preserves PF-REL-06, and reports per-query ranking inversions and confidence intervals. | Larger quality loss, policy inversion, or unmeasured quantization error. |
| PF-DIM-03 | P2 | E | Initial compressed hot vector/manifest payload target is `<= 2 MB`. A larger payload passes only if measured chunking/cache behavior meets cold-start and total-latency gates on every target runtime. | Unbounded artifact growth or platform-cost regression without a measured alternative. |

The Johnson–Lindenstrauss literature supports dimension as a distortion/cost tradeoff, and product-quantization research supports explicit accuracy-versus-compression measurement. Neither establishes `2 MB`, `0.5%`, or `0.01` as universal constants.

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

| ID | Priority | Basis | Pass | Fail |
|---|---|---|---|---|
| PF-SEO-01 | P0 | N: GOOGLE-CANONICAL, GOOGLE-INDEXING | Every indexable URL returns `200`, is crawlable/indexable, emits a valid self-canonical, has a unique useful title and H1, and contains the meaningful primary answer in initial HTML. Validate redirect and soft-404 behavior separately. | Any broken, blocked, contradictory, noncanonical, or content-empty launch URL. |
| PF-SEO-02 | P0 | N: GOOGLE-SITEMAPS, GOOGLE-NOINDEX | Ephemeral variant, session, experiment, fixture, preview, and query-derived URLs in XML/RSS/text sitemaps = `0`. Sitemaps contain only absolute preferred canonical URLs. | Any ephemeral or noncanonical URL included. |
| PF-SEO-03 | P0 | N/A: GOOGLE-SPAM, CLOAKING-INVERNIZZI | Repeated crawler/human parity captures find zero crawler-only text, links, claims, schema, redirects, or evidence upgrades. Expected device/locale layout differences are documented and preserve equivalent primary content. | Any deceptive split view or unexplained material difference. |
| PF-SEO-04 | P0 | N/E | Baseline and every variant preserve `100%` of canonical product facts, current offer/pricing, evidence level, approval/trust boundaries, privacy limitations, and material caveats. | Any misleading contradiction or omission. |
| PF-SEO-05 | P1 | N/E: GOOGLE-SPAM | Every specialized indexable page has a distinct owner question/intent, original information-gain object, independent internal-link role, and human editorial sign-off. Thin or doorway pages published = `0`. | Any thin, funnel-only, scaled low-value, or swap-only page. |
| PF-SEO-06 | P0 | N: GOOGLE-STRUCTURED | Structured data parses with zero critical errors, uses eligible types/properties, matches visible content and evidence exactly, and passes build-time graph/reference checks plus sampled Rich Results/URL Inspection after deployment. | Invalid, invisible, fabricated, or evidence-upgraded schema. |
| PF-SEO-07 | P1 | N/A: GOOGLE-SITEMAPS, ORPHAN-ARORA | Every indexable page has at least one contextual crawlable inbound link from an indexable page or approved hub; graph analysis finds zero orphan pages and zero redirect/canonical cycles. | Any orphan, dead end that violates policy, or cycle. |
| PF-SEO-08 | P1 | A/E: DUP-BRODER, SIMHASH-CHARIKAR | Near-duplicate detection uses at least two complementary signals (for example shingle MinHash/containment plus semantic or SimHash similarity). Thresholds are calibrated on labeled duplicate/nonduplicate pairs. Seeded duplicate recall `>= 95%`, precision `>= 80%`, and every flagged neighboring page is manually resolved or documented. | Uncalibrated universal threshold, seeded duplicates missed beyond tolerance, or unresolved flag. |
| PF-SEO-09 | P1 | N: GOOGLE-INSPECTION | Search Console URL Inspection confirms rendered/indexable canonical content on launch routes after deployment; sitemap and canonical selections match the build. | Google sees missing, blocked, different, or unexpected canonical content. |

Google's current documentation is normative for Google-specific behavior. Academic web-spam, near-duplicate, and orphan-content research supports the detection methods and failure modes; it cannot guarantee indexing or ranking.

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

Pass: schemas, fixtures, baselines, evidence map, and test harness designed.

### Stage 1 — local reference

Pass: HRR algebra, deterministic artifacts, academically grounded relevance benchmark, canonical pages, and compiler checks.

### Stage 2 — edge shadow

Pass: resolver scores requests but always serves baseline; performance/privacy/security gates pass.

### Stage 3 — internal materialization

Pass: finite variants enabled for internal/test traffic; SEO parity, accessibility, and no-flicker gates pass.

### Stage 4 — public A/Z experiment

Pass: small randomized Z traffic, kill switch, causal plan, all P0 gates green.

### Stage 5 — production default

Pass: reliable practical lift, no guardrail regression, operational history, and all P0/P1 gates green.

No stage may be skipped by declaring the design “production-ready.”
