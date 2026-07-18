# 2026-07-18 — CI-green production plan digest

Branch: `employee-production-tuesday`
PR: `#23` -> `research`
Head: `54f926865a1d3f1fddcd7e4961defbfffb460b83`
Status: `ci-accepted_source-and-postgres_not-live-accepted_not-launch-cleared`

## Proof observed

Current-head Actions on `54f926865a1d3f1fddcd7e4961defbfffb460b83`:

- Phase 2 Remediation Plan Integrity `29644130772`: success
- Lane 1 Relationships and Authorization `29644130768`: success
- Lane 10 Integrated CI and Release Evidence `29644130794`: success
- Employee Work Production Boundary `29644130784`: success

This records CI/source/PostgreSQL acceptance only. It does not claim real Supabase, provider, runtime, browser/SMS, commercial, capacity/recovery, rollback, deployment, or production acceptance.

## Canonical anchors

- `identity.md`: AMTECH operating identity; pro-human, speed-to-trust, leave nothing stale.
- `CODEGRAPH.md`: root/master repository authority, canonical product truth, launch boundary, offer, hard invariants, and repository folder order.
- `mvp-build/CODEGRAPH.md`: implementation map, current lane status, source maps, launch blockers, and now-to-live checklist.
- `mvp-build/packages/shared/src/authorization-scope-registry.ts`: Lane 1 executable consequential-surface registry.
- `mvp-build/packages/db/migrations/0042_assignment_scope_and_release_evidence_spine.sql`: durable assignment-scope registry, assignment_id columns, and release-evidence tables.
- `mvp-build/packages/shared/src/release-evidence.ts`: Lane 10 release-evidence contract.
- `mvp-build/infra/scripts/acceptance/release-evidence-spine.mjs`: release-evidence manifest generator.
- `.github/workflows/lane10-integrated-ci-release-evidence.yml`: integrated source/DB/evidence CI.
- `.github/workflows/lane-relationships-auth.yml`: Lane 1 relationship/authorization CI.

## 16-step production path

### S1 — CI-green evidence spine

State: done for current PR head.

`L1 + L10 + employee-boundary + plan-integrity == green @ 54f9268`

Acceptance now proven:

```text
registry/source tests
+ migration 0042 blank-PG apply
+ relationship matrix
+ command/effect matrix
+ release-evidence manifest generation
+ production-boundary regression
= CI/source/PostgreSQL accepted
```

Still false:

```text
real Supabase accepted
provider accepted
runtime accepted
browser/SMS accepted
commercial accepted
capacity/recovery accepted
rollback accepted
production deployed
```

### S2 — Owner web route assignment enforcement

Target surfaces:

```text
apps/web/**
apps/manager/src/server.ts
apps/manager/src/lib/employee-stream.ts
packages/shared/src/materialization.ts
packages/shared/src/work-stream.ts
packages/shared/src/preview-links.ts
```

Required auth chain:

```text
owner_session
-> human_principal
-> current assignment_principal
-> assignment_id
-> resource/action grant
-> command/effect kernel when consequential
```

Deny shortcuts:

```text
account_id-only
employees.account_id-only
caller-selected employee/account
bearer-only
mutable-header identity
```

Acceptance matrix:

```text
wrong account: deny
wrong employee: deny
wrong role: deny
revoked assignment/session: deny <= declared bound
resource stream crosses employee: zero
message/send/action without assignment_id: zero
```

### S3 — Signed resources + owner sessions become durable assignment-bound

Target surfaces:

```text
artifact_links
preview_links
claim_tokens
owner_web_sessions
employee_sessions
resources/materialization
```

Rule:

```text
signature/token authenticates intent only;
durable row + resource lookup + current assignment grant authorizes action.
```

Required behavior:

```text
expired token: deny
replayed terminal action: deny/idempotent terminal
wrong resource: deny
wrong assignment: deny
session alone cannot escalate across employees
artifact/preview rows carry or resolve assignment_id
```

### S4 — SMS/channel resolver assignment enforcement

Target surfaces:

```text
apps/manager/src/webhooks/twilio.ts
SMS signed preview action
channel continuity envelope
owner turn ingestion
```

Required ingress chain:

```text
Twilio signature
-> phone/channel binding
-> human principal
-> current assignment
-> allowed action
-> durable intent/command when consequential
```

Acceptance:

```text
phone-only authorization impossible
wrong phone/employee deny
revoked channel deny <= declared bound
SMS and web resolve same assignment semantics
signed SMS action cannot bypass durable resource lookup
```

## Remaining steps

`S5 connector custody`: provider verify -> connector_binding -> assignment/resource grant -> dedupe -> command/effect.

`S6 commercial rows`: meter_events/usage_rollups/budget/invoice -> assignment_id + payer + beneficiary + price_version + receipt.

`S7 approvals`: immutable approval snapshot + no employee self-approval + concurrent resolve single claim.

`S8 admin/support authority`: platform principal + support lease + reason + audit; no mutable-header identity.

`S9 owner/session revocation`: session token -> principal only; role/assignment/session revocation propagates within bound.

`S10 onboarding identity saga`: Auth/DB/session partial-failure compensation and deterministic repair.

`S11 provisioning/runtime consumers`: provisioning/reconciler/runtime credentials consume assignment + command/effect kernels.

`S12 worker recovery/fairness`: crash/restart/lease reclaim/backlog drain across 100-700 agents.

`S13 gateway budgets/receipts`: provider call -> budget check -> usage receipt -> accepted/failed/ambiguous receipt.

`S14 role-safe materialization`: SurfaceEnvelope/WorkResource/WorkAction without raw provider/secrets/internal leakage.

`S15 real packets`: real Supabase + browser + SMS + provider + commercial + capacity + rollback proof, one SHA.

`S16 production promotion`: freeze SHA -> deploy exact proven SHA -> redacted proof ledger -> claim reconciliation.

## Next concrete move

Start `S2`: implement shared assignment resolver consumption across owner web/message/resource/stream paths before Lane 2 approvals/admin/onboarding work. The scope registry is no longer the blocker; runtime consumers are.
