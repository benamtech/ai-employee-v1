# AMTECH AI Employee v1

AMTECH builds persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Manager is the invisible control plane; Hermes is the agent substrate.

This repository contains the AI Employee product implementation and its company/product brain. The Hyper Site framework is independent and lives in `benamtech/hyper-site`; it is not part of this repository.

## Start here

Read in this order:

1. `identity.md`
2. `AGENTS.md` or `CLAUDE.md`
3. `CODEGRAPH.md`
4. `mvp-build/CODEGRAPH.md`
5. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff
6. `mvp-build/STANDARD.md`
7. `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`
8. source, migrations, scripts, tests, proofs, and release records

Verified source, migrations, executable proof, and newest scoped memory outrank older documentation.

## Canonical offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is an outdated acquisition/regression surface. It is not canonical product UX, pricing, profile design, or launch proof.

## Current production boundary

Current governed launch surfaces:

- web;
- SMS;
- signed review;
- connected-system events.

Voice is a future extension, not a launch acceptance gate.

Canonical execution flow:

```text
trigger
-> authenticated principal
-> assignment and grant resolution
-> durable intent
-> atomic command claim
-> Hermes or deterministic work
-> approval when required
-> bounded external effect
-> durable accepted, failed, or ambiguous receipt
-> role-safe owner surface
-> audit, metering, repair, and release proof
```

The production-shaped normal-employee deployment path remains:

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> Twilio Verify
-> account creation
-> Start Employee
-> durable provisioning and isolated Hermes runtime
-> owner web/SMS interaction
-> governed provider-backed work
-> durable proof
```

Use `mvp-build/docs/production-normal-employee-live-deploy-runbook.md` for launch execution. Fixtures, `/api/dev/login`, local `live:*`, manually injected provider results, and estimator flows are not launch proof.

## Current state

Overall:

`standard-remediation_in-progress_source-and-ci-evidence_not-live-accepted_not-launch-cleared`

- Integration branch: `employee-production-tuesday`
- Base: `research`
- Integration PR: draft `#23`
- Lane 1 relationship/authorization checkpoint is integrated
- Lane 3 durable command/effect kernel is CI-green on draft PR `#26` and awaits integration
- Real Supabase, provider, browser/SMS, commercial, capacity, recovery, rollback, attestation, and production acceptance remain pending

Production-ready means every non-waivable gate in `mvp-build/STANDARD.md` passes on the exact deployed SHA. Tuesday is an engineering checkpoint, not permission to lower the bar.

## Repository layout

```text
.
├── identity.md
├── AGENTS.md
├── CLAUDE.md
├── CODEGRAPH.md
├── README.md
├── .github/workflows/
├── docs/
├── wiki/
└── mvp-build/
    ├── apps/
    ├── packages/
    ├── infra/
    ├── tests/
    ├── docs/
    ├── memory/
    ├── second-half-plan/
    ├── STANDARD.md
    └── CODEGRAPH.md
```

### `mvp-build/`

The implementation home for:

- Next.js owner and onboarding surfaces;
- Manager/Hono control plane;
- Hermes runtime provisioning and isolation;
- shared authority, protocol, work, approval, and materialization contracts;
- PostgreSQL/Supabase migrations;
- webhooks, ambient inbox, connectors, workers, repair, metering, and proof;
- deployment, acceptance, fault, capacity, and release machinery.

### `wiki/`

Product rationale, market evidence, strategy, historical plans, and implementation records. Use it for context and decisions, but verify implementation claims against `mvp-build/` source, migrations, tests, proofs, and newest memory.

### `docs/`

Supporting product, design, and operating documents. Documents that describe removed or independent systems are not product authority.

## Development

From `mvp-build/`:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # environment-gated
```

Use targeted lane workflows while implementation is in progress. Full release CI must eventually include migration blank/upgrade/rerun, RLS matrices, command concurrency, protocol compatibility, browser/SMS/provider proof, fault injection, capacity/load, container build, SBOM/attestation, proof manifest, and claim/doc consistency.

## Core invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are not complete authority.
3. Stable retries do not create conflicting commands or duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt.
5. Provider master credentials never enter employee profiles or employee runtimes.
6. Customer-, money-, reputation-, credential-, and destructive actions use governed approval.
7. Revocation, ambiguity, retries, crashes, and partial provider outages remain repairable and observable.
8. Public claims never exceed evidence bound to the exact release SHA.
