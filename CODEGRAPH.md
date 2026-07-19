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
6. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then the newest relevant handoff
7. [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
8. [`mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`](mvp-build/second-half-plan/phase-2-standard-remediation-execution.md)
9. [`mvp-build/docs/architecture/README.md`](mvp-build/docs/architecture/README.md)
10. [`mvp-build/docs/architecture/11-agent-orientation-and-role-map.md`](mvp-build/docs/architecture/11-agent-orientation-and-role-map.md)
11. [`mvp-build/docs/architecture/14-infrastructure-deployment-and-test-coverage-audit.md`](mvp-build/docs/architecture/14-infrastructure-deployment-and-test-coverage-audit.md)
12. relevant UX, deployment, source, migrations, scripts, tests, workflows, proof, release records, and current diff

Source, applied migrations, executable proof, and newest scoped memory outrank older documentation.

## Repository boundary

This repository contains the AMTECH company/product brain and the implementation home for the AI Employee product.

- `mvp-build/` — product code, contracts, database migrations, Hermes integration, Manager, Web, connectors, security, tests, deployment, proof, and active production remediation.
- `wiki/` — strategy, market/product evidence, historical plans, research, and factual implementation records.
- `docs/` — supporting company/product/design/operating documents.
- `local-prod/` and `scripts/local-prod/` — exact-SHA local-production evidence orchestration.
- `.github/workflows/` — lane, product, repository-archaeology, and release CI gates.

The former `GTM-RESEARCH/website-framework/` workspace moved to `benamtech/hyper-site`. Hyper Site source, plans, tests, and release state are not AI Employee authority.

## Canonical product truth

AMTECH installs persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed Web, SMS, signed Review, and connected-system events.

Manager is the invisible control plane. Hermes is the managed agent/runtime substrate.

Hermes remains responsible for reasoning/execution, sessions/runs, transcript continuity, streaming, memory, recovery, rotation, and employee-local runtime behavior. Manager supplies identity/assignment authority, business context/resources, tool schemas, connector/credential custody, approval, command/effect, commercial provenance, revocation, repair, and release proof.

AMTECH is not primarily an estimator, chatbot, CRM, automation builder, model marketplace, website framework, or collection of disconnected AI tools.

## Canonical offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month** for managed connections, recovery, scheduled/event-driven work, higher capacity, and support.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical. Older pricing ladders are superseded where they conflict with this offer.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, role, grant, policy, and authority version
→ stable durable intent
→ immutable command and atomic claim
→ Hermes or deterministic work
→ approval when required
→ one reserved bounded external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic replay or repair
→ role-safe Web, SMS, signed-Review, or connected-system surface
→ audit, metering, commercial attribution, revocation propagation, and release proof
```

For the production-shaped normal-employee path, use `mvp-build/docs/production-normal-employee-live-deploy-runbook.md`. Fixtures, `/api/dev/login`, local `live:*`, public-estimator scripts, manually injected provider results, and trajectory scores are diagnostics/review aids only.

## Current integration headline

- Branch: `employee-production-tuesday`
- Base: `research`
- Draft PR: `#23`
- Migration head: `0069`
- Complete green code/test evidence anchor: `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`
- Canonical current handoff: `mvp-build/memory/2026-07-19-final-document-authority-infra-test-production-handoff.md`
- Branch status: source/CI remediation accepted on the named anchor; later documentation commits do not imply full workflow rerun; not real-Supabase accepted, not target-runtime accepted, not provider/channel/commercial accepted, not deployed, not launch-cleared

Current branch source includes:

- relationships, principals, assignments, grants, policies, and authority versions;
- durable C3 command/effect, ambiguity, and repair;
- connector custody and ambient inbox;
- commercial payer/beneficiary/price attribution and Model Gateway receipts;
- approval authority and platform support authority;
- onboarding identity and activation through migration `0069`;
- scoped owner sessions, previews, artifacts, and Manager MCP credentials;
- desired resource reconciliation, Host Provisioner, profile checksums, employee networks, and Caddy routing;
- strict owner/employee/context reads;
- task-agnostic operating surface, typed generated UI, sandboxed action routing, and compiled production Web tests;
- exact-head repository archaeology and documentation/effect/relationship ledgers.

## Critical production warning

The canonical deployment topology is `mvp-build/infra/deploy/docker-compose.production.yml`, but the normal production, production-like, smoke, and rollback helpers still select or default to the legacy `docker-compose.yml` family. The legacy stack mounts Docker socket into Manager, lacks the separate Model Gateway/Host Provisioner shape, and uses bridge-network Caddy. Close this deploy fork with red source tests before running production commands.

## Source-of-truth routing

| Question | Authority |
|---|---|
| What is the repository/product boundary? | this file and root agent instructions |
| What is actually implemented now? | `mvp-build/CODEGRAPH.md`, source, migrations, tests, proof |
| What is the production standard? | `mvp-build/STANDARD.md` |
| What is the active dependency order? | active second-half remediation execution program and vector registry |
| What is the current cross-system architecture? | `mvp-build/docs/architecture/README.md` |
| What are current P0/P1/P2 gaps? | architecture risk register and infrastructure/test audit |
| How should coding agents orient and select roles? | architecture agent role map |
| How are CODEGRAPH, memory, plans, records, and Markdown organized? | architecture document-control map |
| What is the newest handoff? | `mvp-build/memory/MEMORY.md` and newest relevant entry |
| What records historical factual implementation? | `wiki/MVP/implementation-records/` |
| How is the normal employee intended to deploy? | normal-employee live deploy runbook plus canonical production Compose; entry scripts require reconciliation |
| What is canonical UX doctrine? | `mvp-build/docs/ux/` |
| What is the offer? | this file and current GTM strategy docs |
| Where does Hyper Site live? | `benamtech/hyper-site`; not authority here |

## Document-family rules

- Root CODEGRAPH owns repository-level purpose, current integration headline, and routing.
- `mvp-build/CODEGRAPH.md` owns executable topology, migration head, current proof boundary, and next gates.
- `mvp-build/memory/MEMORY.md` is the sole handoff index.
- `wiki/MVP/implementation-records/README.md` indexes historical factual records.
- Architecture and UX documents explain current source; they do not override it or establish live acceptance.
- Trajectory artifacts require at least two source-backed dimensions, explicit state/assumptions, a control intervention, blockers, and an executable acceptance predicate. They never promote current state.
- Historical Markdown stays in place unless every inbound reference is rewritten and an archive/index path is retained.

## Evidence boundary

Current source/CI state does **not** by itself claim:

- convergence of all deploy/smoke/rollback entrypoints on the canonical production Compose;
- application of migrations `0032–0069` to the approved real Supabase target;
- managed production secret custody and rotation acceptance;
- target-host Caddy/Docker/employee-network acceptance;
- live identity-provider and canonical activation packets;
- live provider-backed generated work object and external receipt;
- cumulative Model Gateway budget and replica-safe shared rate enforcement;
- full compensation/deterministic repair and crash-point acceptance;
- fixture-free owner Web, SMS, and signed Review proof;
- commercial reconciliation against real provider costs/invoices;
- shared/fractional employee policy or complete role perspectives;
- 100–700 employee fleet capacity/fairness;
- rollback, SBOM/attestation, signed deployment manifest, or production readiness.

## Repository-wide release invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Unauthorized access or action count is zero.
3. One stable intent cannot create conflicting commands or duplicate irreversible effects.
4. Consequential success without a matching durable accepted receipt is zero.
5. Session, connector, signed-resource, assignment, and runtime credential revocation propagate within the declared bound.
6. Billable work identifies assignment, payer, beneficiary, price version, provider receipt, and accounting receipt.
7. Hermes remains the execution substrate; Manager does not duplicate runtime/session machinery without a verified gap.
8. Provider master credentials never enter employee profiles/runtimes.
9. Generated UI is typed presentation and cannot invent actions or durable resources.
10. Public workloads remain isolated and within accepted capacity limits.
11. Capacity, recovery, rollback, migration, provider, browser/channel, commercial, and release proof bind to the exact deployed SHA.
12. Unsupported production or marketing claims are forbidden.
13. `main` is not used as a shortcut around integration and release gates.
