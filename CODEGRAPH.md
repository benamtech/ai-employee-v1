# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-19  
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`; `main` is not an integration shortcut

## Cold-session read order

1. [`identity.md`](identity.md)
2. [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
3. this file
4. [`mvp-build/AGENTS.md`](mvp-build/AGENTS.md) or [`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)
5. [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md)
6. ratified [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
7. [`mvp-build/second-half-plan/README.md`](mvp-build/second-half-plan/README.md) and its one active program
8. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then the newest relevant handoff
9. [`mvp-build/docs/architecture/README.md`](mvp-build/docs/architecture/README.md)
10. relevant source, migrations, scripts, tests, workflows, proof, release records, and current diff

Authority order: deployed release-bound proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests and acceptance → ratified Standard/active program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Repository boundary

This repository contains the AMTECH company/product brain and implementation home for the AI Employee product.

- `mvp-build/` — product code, contracts, migrations, Hermes integration, Manager, Web, connectors, security, tests, deployment, proof, Standard, and active production program.
- `wiki/` — strategy, rationale, research, and historical implementation records; it is not current implementation authority.
- `docs/` — supporting company/product/design/operating documents.
- `local-prod/` and `scripts/local-prod/` — exact-SHA local-production evidence orchestration.
- `.github/workflows/` — lane, product, archaeology, and release CI gates.

The former Hyper Site workspace moved to `benamtech/hyper-site`. Hyper Site source, plans, tests, and release state are not AI Employee authority.

## Canonical product truth

AMTECH installs persistent AI Employees for owner-operated businesses. Manager is the labor control plane; Hermes is the reasoning/runtime substrate.

The moat is a reusable governed-labor protocol spanning identity, assignments, capability and connector manifests, work objects, approval, durable effects, provider receipts, recovery, commercial attribution, and protocol/channel adapters.

MCP core, MCP Apps, AG-UI, OAuth providers, models, runtimes, and SaaS systems are replaceable mechanisms. Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.

## Canonical offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, role, grant, policy, entitlement, and authority version
→ stable durable intent, command, event, or work object
→ Hermes reasoning or deterministic processing
→ bounded capability selection and runtime validation
→ approval when required
→ one reserved idempotent external effect
→ accepted | failed | ambiguous durable receipt
→ deterministic replay, reconciliation, or repair
→ role-safe channel/protocol projection
→ audit, metering, commercial attribution, revocation, recovery, and release proof
```

## Current integration headline

- Branch: `employee-production-tuesday`
- Base: `research`
- Draft PR: `#23`
- Migration head: `0072`
- Standard: `mvp-build/STANDARD.md` v0.2, ratified and effective
- Evolution vector: `mvp-build/validation/standard-v0.2-evolution-vector.json`
- Active production program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`
- Canonical deployment authority: `mvp-build/infra/scripts/production-topology.mjs` → `mvp-build/infra/deploy/docker-compose.production.yml`
- Exact current head and final workflow matrix: PR `#23` plus the newest indexed handoff after branch movement stops
- Product status: source-wired and predecessor exact-head CI accepted; not launch-cleared

Current source includes:

- relationships, principals, assignments, grants, policies, and authority versions;
- durable command/effect, ambiguity, approvals, and repair;
- generic connector registry, managed setup manifest, and risk-derived custody;
- Manager MCP, explicitly safe direct MCP, runtime-native capability evidence, and task mapping;
- OAuth and provider-hosted onboarding through Manager custody;
- commercial payer/beneficiary/price attribution and Model Gateway receipts;
- artifact revision/validation/publication grammar through migration `0072`;
- desired-resource reconciliation, Host Provisioner, profile checksums, employee networks, and Caddy routing;
- strict owner/employee/context reads;
- typed operating surface, generated views, sandboxed action routing, and compiled Web tests;
- exact-head archaeology and release-evidence machinery.

## Connector and protocol authority

- `mvp-build/packages/shared/src/connector-registry.ts` owns connector identity, risk axes, and custody derivation.
- `mvp-build/packages/shared/src/connector-setup.ts` owns native managed setup protocols, exact tool ownership, scopes/permissions, allowed hosts, continuation, readiness evidence, and owner copy.
- Unknown and underspecified connectors are representable but fail closed.
- Direct MCP requires every risk axis to be explicitly declared false.
- Broad categories such as `accounting` or `communication` never select a provider.
- MCP Apps is the official negotiated interactive MCP extension target; current MCP-UI-shaped code is compatibility groundwork until the named conformance matrix passes.
- AG-UI is an optional event/state adapter over durable AMTECH state, not authority or a generated-UI schema.

## Database evidence policy

Routine database development uses production-shaped local/CI PostgreSQL:

- complete migration-from-blank;
- constraints, grants, RLS, functions, concurrency, races, and negative isolation;
- seed/backfill/existing-row compatibility;
- deterministic, repeatable TDD.

Disposable managed Supabase is required only when platform-specific Auth, Realtime, Storage, Data API, advisors, or release-candidate behavior is material. Production is never the routine test target.

## Source-of-truth routing

| Question | Authority |
|---|---|
| What is the repository/product boundary? | this file and root agent instructions |
| What is actually implemented? | `mvp-build/CODEGRAPH.md`, source, migrations, tests, proof |
| What is the production standard? | ratified `mvp-build/STANDARD.md` |
| How did the Standard change? | `mvp-build/validation/standard-v0.2-evolution-vector.json` |
| What is the active dependency order? | `mvp-build/second-half-plan/README.md` and its active program |
| What is the architecture/research disposition? | `mvp-build/docs/architecture/README.md` and document 16 |
| What is the newest handoff? | `mvp-build/memory/MEMORY.md` |
| What is historical factual evidence? | `wiki/MVP/implementation-records/` |
| How does normal employee deployment work? | scoped CODEGRAPH and production runbook, verified against canonical topology source |
| What is canonical UX doctrine? | `mvp-build/docs/ux/` |
| Where does Hyper Site live? | `benamtech/hyper-site` |

## Evidence boundary

Current source/CI state does **not** by itself establish:

- disposable managed-Supabase platform/release acceptance;
- target-host Caddy/Docker/Unix-socket/two-employee acceptance;
- live identity and connector authorization/revocation;
- official MCP Apps or full AG-UI conformance;
- fixture-free provider-backed generated work through effect and receipt;
- cumulative Model Gateway budget and replica-safe rate enforcement;
- full compensation/crash repair and rollback;
- fixture-free Web, SMS, and signed Review;
- real commercial reconciliation;
- shared/fractional live policy;
- 100–700 employee capacity/fairness;
- signed SBOM/provenance/deployment manifest;
- production readiness.

## Repository-wide release invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Unauthorized access or action count is zero.
3. One stable intent cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success without a matching durable accepted receipt is zero.
5. Revocation propagates across sessions, connectors, signed resources, approvals, runtime credentials, and queued work.
6. Billable work identifies assignment, payer, beneficiary, price version, provider receipt, and accounting receipt.
7. Hermes remains the execution substrate; Manager owns authority, effect, custody, repair, and proof.
8. Provider master credentials never enter employee profiles or runtimes.
9. Capability discovery is broad; execution custody is conservative and evidence-backed.
10. Generated UI and interoperability adapters cannot invent actions, authority, or durable resources.
11. Capacity, recovery, rollback, migration, provider, browser/channel, commercial, and release proof bind to the exact deployed SHA.
12. Unsupported production or marketing claims are forbidden.
13. `main` is never used as a shortcut around integration and release gates.
