# S2–S9 authority/runtime implementation record — 2026-07-18

Record type: factual branch implementation/proof ledger
Branch: `employee-production-tuesday`
Base: `research`
PR: draft `#23`
Implementation proof SHA: `a9184be1af68ed6c5372d642928db46b51eb0506`

## Status

`branch-ci-postgres-image-accepted`

Not live accepted. Not launch cleared. Documentation-only commits after the implementation SHA do not change the proof anchor.

## Implemented systems

| Boundary | Canonical source | Durable schema/migrations | Proof |
|---|---|---|---|
| Relationship and assignment authority | `packages/shared/src/relationship-contract.ts`, `assignment-resolver.ts`, `session-enforcer.ts` | `0039`, `0040`, frozen `0042` | Lane 1 run `29662757194` |
| Durable command/effect | `packages/shared/src/command-effect.ts`, `apps/manager/src/lib/durable-command-runtime.ts` | `0041`, `0061` | Lane 10 run `29662757197`; S2/S7/S9 run `29662757252` |
| Owner session and request scope | `owner-session.ts`, `owner-assignment-authority.ts`, Manager/web assignment guards | `0053`, `0058_authority_*`, `0059_authority_*` | S2/S7/S9 run `29662757252` |
| Owner web turn C3 and repair | `owner-turn-command.ts`, `owner-turn-repair.ts` | `0061` | ambiguous-command reconciliation matrix in `29662757252` |
| Signed preview/artifact authority | `preview-links.ts`, `signed-links.ts` | `0050`–`0054`, `0060`, `0062`, `0063` | signed-resource matrix in `29662757252` |
| Connector custody | `connector-custody.ts`, ambient inbox, Gmail/QBO/Stripe/Twilio webhooks | `0043`–`0047` | connector/commercial matrix in `29662757197` |
| Commercial attribution | `commercial-attribution.ts`, Model Gateway HTTP/runtime | `0043`–`0047` | connector/commercial matrix in `29662757197` |
| Approval authority | shared/Manager approval authority, promotion, approved-action tools | `0048`–`0054` | approval matrix in `29662757197` and `29662757252` |
| Platform-admin authority | shared platform authority, `platform-admin-runtime.ts`, operator CLI | `0055`, `0056`, `0057`, platform `0058`/`0059` | source/type/migration coverage at implementation SHA; dedicated exact-SHA workflow remains separately dispatchable |
| Authority-version revocation | `authority-version.ts`, owner/MCP/preview consumers | `0057a`, authority `0058`/`0059`, `0060`–`0063` | revocation and signed-resource matrices in `29662757252` |
| Generated Manager server | `server.template.ts`, generator, production-admin block, minimal `server.ts` | none | generated Manager typecheck/build in `29662757197`, `29662757204`, `29662757252` |
| Local-production/SDRT | root orchestration, `local-prod/**`, `scripts/local-prod/**`, SDRT parser/MCP | none | source contracts and production boundary; live local exact-SHA packets remain pending |
| Manager image lifecycle | `infra/deploy/manager.Dockerfile`, `mvp-build/.dockerignore` | none | production image inclusion in `29662757204` |

## Exact CI records

- `29662757178` — Phase 2 Remediation Plan Integrity — success
- `29662757194` — Lane 1 Relationships and Authorization — success
- `29662757252` — S2 S7 S9 Production Boundary — success
- `29662757197` — Lane 10 Integrated CI and Release Evidence — success
- `29662757204` — Employee Work Production Boundary — success

## Observed proof scope

- generated Manager production source;
- shared/database/Manager typecheck and build;
- unit/source contract gates;
- complete forward migrations through `0063` on blank PostgreSQL 17;
- relationship/RLS, command/effect, connector/commercial, approval, revocation, signed-resource, and ambiguity-repair database matrices;
- worker migration/recovery regression;
- release-evidence manifest generation;
- successful production Manager image build/inclusion.

## Not proved by this record

- approved real Supabase target;
- live external providers;
- fixture-free browser/SMS/signed review;
- current-head dedicated Lane 8 dispatch;
- real commercial invoice reconciliation;
- remote runtime/reboot/recovery;
- 100–700-agent capacity/fairness;
- rollback, attestation, deployment, or production readiness.

## Runtime design constraint

Hermes remains the agent runtime substrate. Manager may authorize, version, constrain, account for, and repair Hermes work, but must not duplicate Hermes transcript/session, streaming, recovery, rotation, materialization, or memory machinery without a demonstrated gap and explicit architecture decision.
