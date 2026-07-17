# CODEGRAPH.md — AMTECH workspace map

Status: active
Updated: 2026-07-17
Active implementation branch: `research`, rebased onto latest `main`

## Read first

1. `identity.md`
2. this file
3. `mvp-build/CODEGRAPH.md`
4. `mvp-build/memory/MEMORY.md` and newest relevant handoff
5. `mvp-build/CLAUDE.md` or `mvp-build/AGENTS.md`
6. source, migrations, scripts, proofs, and current plan/wiki documents

When documentation conflicts, source + migrations + scripts + proof artifacts + newest memory win.

## What this repository is

This repository is the AMTECH company brain and the implementation home for the flagship AI Employee.

- `mvp-build/`: product code, runtime, provisioning, owner surfaces, connectors, security, tests, runbooks, and active forward plans.
- `wiki/`: durable product, market, architecture, research, and implementation-record context.
- `docs/`: root-level product/design strategy, including the public website rewrite brief.
- `GTM-RESEARCH/website-framework/`: research, validation, and implementation authority for the holographic hyper-targeting website framework and its v0.1 Request Mirror Lab.

## Canonical product truth

AMTECH installs always-on intelligent software workers for owner-operated American small businesses. The first beachhead is painting, landscaping, and adjacent service contractors.

The employee notices work, remembers business facts, prepares estimates and communication, follows up, organizes proof, and asks before actions that touch customers, money, or reputation. The owner texts or talks to one employee. Manager is invisible infrastructure.

AMTECH is not primarily an estimator, chatbot, CRM, automation builder, or collection of AI tools.

## Canonical offer

- **Start free:** one useful employee with bounded usage and no enterprise rollout.
- **Managed AI Employee:** from **$400/month** for managed connections, recovery, scheduled/event-driven work, higher capacity, and support.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

Older $750 setup + $1,000/$1,500 monthly ladder language is superseded where it conflicts with the free + $400 managed strategy.

## Canonical normal-employee path

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> Twilio Verify
-> account creation
-> Start Employee
-> isolated employee runtime
-> owner web client
-> provider-backed reply
-> useful connected-tool proof
```

Authority: `mvp-build/docs/production-normal-employee-live-deploy-runbook.md`.

The public estimator is outdated and non-canonical. It may remain as an acquisition/regression harness, but it is not product UX, pricing, profile, or launch acceptance. Fixture mode, dev login, local `live:*`, and manually injected provider results are not launch proof.

## Current implementation state

**Overall: source-wired, not live-accepted after the WS1/WS2 production-boundary pass.**

- Owner product: Home / Talk / Proof / Connected, persisted conversation, approvals, signed review resources, owner-safe materialization, and connected-capability surfaces are source-wired.
- WS1: model-gateway credential custody and rendered-profile integrity are source-wired.
- WS2: durable provisioning resource graph, transitions, leases, commands, retry/drift/rotation/compensation foundations are source-wired; the true reconciler worker remains pending.
- WS3: `ambient_event_inbox` schema exists; provider ingress migration is not complete.
- Production runtime boundary: host-private provisioner and per-employee isolation exist in source, but hostile/runtime proof is pending.
- Live provider/runtime acceptance: requires fresh production credentials, real provider IDs, runtime proof artifacts, and a normal-employee run through the canonical path.

Detailed status: `mvp-build/CODEGRAPH.md`.

## Source-of-truth map

| Question | Authority |
|---|---|
| What are we building? | `identity.md`, this file, `docs/amtech-website-rewrite-brief.md` |
| What is actually wired? | `mvp-build/CODEGRAPH.md`, source, migrations, implementation records |
| What is the current handoff? | `mvp-build/memory/MEMORY.md` |
| How is a normal employee launched? | `mvp-build/docs/production-normal-employee-live-deploy-runbook.md` |
| What are the security/runtime boundaries? | `mvp-build/docs/security/host-private-runtime-hardening-plan.md` |
| What is the GTM/pricing strategy? | `mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md` |
| What remains now-to-live? | `mvp-build/CODEGRAPH.md`, runbook, wiki current/future state |
| What is the public website product/copy brief? | `docs/amtech-website-rewrite-brief.md` |
| How is the holographic website framework researched and validated? | `GTM-RESEARCH/website-framework/README.md` and its numbered specification files |
| What is v0.1? | `GTM-RESEARCH/website-framework/07-v0.1-request-mirror-lab.md` |

## Non-negotiable invariants

1. Read `identity.md` before acting.
2. Do not claim provider/runtime acceptance without real proof IDs/artifacts.
3. The owner experiences one employee; Manager remains invisible.
4. Provider master credentials never enter employee profiles/runtimes.
5. Customer-, money-, and reputation-affecting actions cross an owner approval gate.
6. The public estimator is non-canonical.
7. `mvp-build/second-half-plan/` is the active forward-plan family; older plan packets are historical context unless explicitly revived.
8. Every major session updates durable memory and keeps current docs contradiction-free.
9. Engineering docs stay factual; public copy leads with owner pain, work, proof, control, and value rather than architecture or generic AI language.
10. Holographic website materialization is research until the explicit algebra, relevance, performance, SEO, privacy, security, experiment, and truth gates pass.
11. The website framework may use ephemeral request/session context, but it must not silently become a named customer profile, covert fingerprint, or sensitive-trait inference engine.

## Next major product frontier

The public AMTECH website should ultimately be rewritten from first principles around the category:

> Your business gets an employee that lives in the software.

The product/copy brief is `docs/amtech-website-rewrite-brief.md`.

Before applying the holographic resolver to that site, implement the plain Web-1 Request Mirror Lab in `GTM-RESEARCH/website-framework/`. It should display direct, explicit, and safely inferred request/browser facts with provenance, construct a temporary HRR context shape, score finite page slices, expose latency and fallback, and remain `noindex`/private/no-store. Google indexing is a later, separate canonical-shell validation—not the first resolver test.

## Validation state for this reconciliation

The branch was rebased through GitHub rebase PR #14. Documentation and research specifications were updated through GitHub. No full build, typecheck, test suite, migration application, production Compose run, Cloudflare deployment, Next.js build, Zig/WASM compile, browser matrix, Google URL Inspection, provider call, or hostile-runtime proof was run.