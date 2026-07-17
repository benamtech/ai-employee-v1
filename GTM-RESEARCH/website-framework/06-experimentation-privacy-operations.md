# 06 — A/Z Experimentation, Privacy, and Operations

Status: operating model

## A/Z definition

- **A:** complete canonical baseline; no algorithmic materialization.
- **Z:** bounded materialization selected from the same reviewed content/evidence corpus.

Z is continuous only in the ranking/selection space. It does not generate arbitrary claims or copy per request.

## Experiment sequence

### Shadow

Resolver scores requests but always serves A. Collect latency, predicted match, fallback, and human relevance labels. Do not infer conversion lift from shadow predictions.

### Internal materialization

Enable Z for authenticated/internal test traffic. Validate source parity, no flicker, edge timing, content eligibility, and diagnostics.

### Small public A/Z

Randomly assign a small share to Z with a persistent first-party experiment token scoped only to the experiment/session. Keep an adequate A holdout and a global kill switch.

### Graduation

Z becomes default only after practical causal lift and every P0/P1 performance, SEO, privacy, security, truth, and operations gate passes.

## Assignment rules

- cryptographically random assignment, never derived from IP or device shape;
- no cross-site or named identity join;
- cookie-disabled users receive A unless a separately valid request-randomized design is approved;
- known crawlers and monitors receive A;
- experiment arm, variant ID, resolver version, and content build version travel together;
- assignment expires with the declared experiment scope.

## Metrics

Choose one primary metric in advance:

- qualified onboarding start;
- completed onboarding;
- qualified managed-interest submission;
- proof/security-to-onboarding progression.

Secondary:

- relevant CTA engagement;
- proof/security engagement;
- route depth;
- comprehension survey;
- return within the declared anonymous session.

Guardrails:

- LCP, INP, CLS, TTFB;
- resolver latency/fallback/error;
- low-quality onboarding;
- consent withdrawal/complaints;
- trust/security avoidance;
- claim/evidence incidents;
- crawl/index anomalies.

## Analysis rules

- predeclare effect size, sample plan, stopping method, and exclusions;
- retain bot/internal/spam exclusions as code/versioned rules;
- do not auto-promote on raw click rate;
- require practical effect, not only statistical probability;
- segment findings are exploratory unless powered;
- record all experiments, including null/negative results.

## Bayesian prior updates

Allowed only offline from cleaned randomized evidence.

- use hierarchical shrinkage for low-volume route/context groups;
- cap weight movement per release;
- update finite route/component priors, never an individual visitor model;
- produce immutable input/output artifacts and review report;
- deploy with version and rollback;
- keep a static business-prior floor/ceiling so noisy outcomes cannot dominate truth or policy.

## Privacy tiers

### Tier 0 — request only

- canonical experience complete;
- low-entropy request context exists only in memory;
- no persistent shape;
- no active browser collection;
- safe baseline or conservative semantically equivalent slice only.

### Tier 1 — explicit lab reveal / functional session

- user clicks to reveal bounded browser signals;
- opaque first-party session may retain selected features/variant for <= 24 hours;
- no fingerprinting or named identity;
- clear and delete controls.

### Tier 2 — consented experimental interactions

- in-session page/category interactions may update the temporary shape;
- transparent feature list and explanation;
- immediate withdrawal and expiry;
- still no cross-site or sensitive-trait inference.

Jurisdiction-specific legal review remains necessary. HRR transformation does not erase obligations attached to source data.

## Data inventory contract

Every context feature must be registered:

```ts
interface ContextFeatureDefinition {
  id: string;
  source: "request" | "cloudflare" | "browser_opt_in" | "explicit_input" | "session_opt_in";
  directOrInferred: "direct" | "inferred";
  entropy: "low" | "medium" | "high";
  sensitive: false;
  consentTier: 0 | 1 | 2;
  ttlSeconds: number;
  weightRange: [number, number];
  allowedRoutes: string[];
  affects: Array<"ranking" | "ordering" | "example" | "cta" | "analytics_only">;
  explanation: string;
  owner: string;
  reviewedAt: string;
}
```

The compiler fails on an unregistered feature.

## Retention

Default:

- raw request shape: not stored;
- raw IP: not stored in resolver/experiment payload;
- precise Cloudflare location: displayed only on explicit lab request and not stored;
- request diagnostics: sampled, coarse, <= 7 days for the lab;
- anonymous session feature state: <= 24 hours;
- experiment exposure/outcome: minimized buckets under documented analytics retention;
- research artifacts: aggregate or synthetic fixtures, not raw identifying requests.

## Transparency UI

The lab must show:

- what was observed;
- what was explicitly supplied;
- what was inferred;
- what entered the shape;
- weights and match result;
- storage/TTL;
- controls to remove optional signals and clear session.

Later production pages should provide a concise “Why this example?” explanation without exposing exploitable internals.

## Operational versions

Every response/exposure identifies:

- application commit;
- resolver version;
- vector basis version;
- content build version;
- graph version;
- experiment version;
- JS/WASM engine;
- variant ID or baseline/fallback reason.

## Observability

Use privacy-bounded events:

```text
resolver_request
resolver_match
resolver_fallback
variant_exposure
cta_outcome
consent_change
artifact_mismatch
truth_guard_failure
```

Required fields are bounded enums/IDs/timings. Prohibit URL query values, full referrer, user-agent string, raw IP, cookies, request bodies, or browser fingerprint components in analytics.

## Alerts

- resolver p95/p99 latency;
- fallback/error spike;
- variant distribution skew;
- artifact checksum/version mismatch;
- evidence record withdrawn while variant references it;
- canonical/variant parity failure;
- search index/crawl anomaly;
- consent or privacy incident;
- experiment primary/guardrail anomaly.

## Kill switches

- global resolver off;
- WASM off;
- route-level materialization off;
- experiment off;
- variant/component/proof ID disabled;
- browser-signal collection off;
- precise Cloudflare field display off.

Every switch returns to a complete baseline without waiting for a site rebuild where operationally feasible.

## Incident posture

On privacy, evidence, or cloaking concern:

1. disable materialization;
2. preserve canonical baseline;
3. stop optional collection;
4. invalidate affected session data;
5. snapshot versions and redacted diagnostics;
6. record incident and affected claims/features;
7. repair and rerun relevant pass/fail vectors before re-enable.

## Research integrity

- never discard a null/negative experiment from the log;
- do not change labels after observing resolver outputs without tracking revision;
- compare against simple baselines;
- publish internal benchmark configuration and uncertainty;
- distinguish peer-reviewed evidence, preprints, package claims, and AMTECH experiments;
- do not call the framework production-ready before graduation gates pass.