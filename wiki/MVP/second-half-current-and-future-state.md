# AI Employee Second-Half Current and Future State

Status: active wiki companion
Updated: 2026-07-17
Authority: source/migrations/scripts/proofs -> `mvp-build/CODEGRAPH.md` -> newest memory -> this summary

## Executive state

AMTECH is building an always-on AI Employee for owner-operated small businesses, beginning with painters, landscapers, and adjacent service contractors. The owner talks to one employee through web, SMS, and review surfaces. Manager, Hermes, connected tools, provider custody, events, and runtime lifecycle remain invisible infrastructure.

The product is materially source-wired, but it is **not newly live-accepted after the WS1/WS2 production-boundary pass**. The new gateway, credential, profile-integrity, reconciler, and ambient-inbox seams require migration, compile, hostile-runtime, recovery, and provider proof.

Historical proof artifacts remain useful evidence for the earlier stack. They do not automatically accept the new boundary implementation.

## Canonical normal-employee path

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> Twilio Verify
-> account creation
-> Start Employee
-> isolated Hermes runtime
-> owner web client
-> provider-backed reply
-> useful connected-tool proof
```

Authority: `../../mvp-build/docs/production-normal-employee-live-deploy-runbook.md`.

The public estimator is outdated and non-canonical for product UX, pricing, profile design, and launch acceptance. Fixture mode, dev login, host `live:*`, and manually injected events are not normal-employee proof.

## What is source-wired now

### Owner product

- Home / Talk / Proof / Connected information architecture;
- Tell Avery owner command surface;
- Needs your say approval/review flow;
- quiet watching/progress and proof views;
- persisted conversation with SSE/poll fallback;
- typed `WorkResource` / `WorkAction` materialization;
- owner-safe connected-capability and work-event projections;
- signed mobile review/action links.

### Manager and business systems

- onboarding/account/session and owner messaging;
- schema-first tools and scoped Manager MCP credentials;
- artifacts, approvals, scheduler, reminders, event delivery, metering, admin, and repair seams;
- Gmail, Stripe test-mode, QuickBooks, and other connector source paths;
- Hermes Sessions/Runs/Jobs and per-employee runtime records;
- private employee runtime/network and Caddy activation foundations.

Source presence is not current provider/runtime acceptance.

## WS1 — model gateway and credential custody

Status: `source-wired`; live proof pending.

Implemented:

- employee-scoped Model Gateway contracts and credentials;
- HMAC claim validation plus DB-backed expiry, revocation, version, identity, and token-hash checks;
- host-private OpenAI-compatible gateway server;
- provider routing, timeout, bounded retry, usage/cost audit, and redacted errors;
- production profile rendering through gateway URL + scoped token + model alias + credential version + non-secret policy;
- removal of provider master-key slots from the employee template;
- rendered-profile checks for forbidden secret names/values, unresolved tokens, unsafe permissions, checksum, and read-only state;
- loopback production Compose service and employee host-gateway route;
- profile token/checksum rotation operation.

Still owed:

- live employee-to-gateway and public non-reachability proof;
- cross-employee, expired, and revoked credential negative proof;
- rotation/reload/revocation sequencing proof;
- multi-instance rate limits and transactional accumulated-spend enforcement;
- production provider/outage behavior and proof IDs.

## WS2 — provisioning reconciler foundation

Status: `source-wired foundation`; production worker pending.

Implemented:

- canonical desired resource graph;
- transition evidence and compare-and-swap helper;
- lease/retry/drift fields and retry classification;
- resource-state persistence;
- provisioning command table and vocabulary;
- drift inspect/repair, rotate, suspend, remove, replace, and restore host operations;
- compensation vocabulary/order;
- active-only operation-key uniqueness through migration `0033`;
- Manager-only RLS/grant posture on new tables.

Still owed:

- a continuously running DB-backed reconciler that claims jobs/commands and performs inspect -> decide -> apply -> verify -> persist;
- deterministic transition-by-transition resume/timeout/compensation;
- unified admin lifecycle commands;
- fleet drift scans for orphan containers/networks, stale Caddy, missing profile/checksum, expired credentials, and stuck jobs;
- reboot reconstruction proof;
- retry/idempotency repair for failed host operations and compensated jobs.

## WS3 — ambient event inbox

Status: `groundwork only`.

Migration `0032` adds the canonical `ambient_event_inbox` envelope with provider identity, tenant binding, schema version, dedupe/ordering/correlation fields, verification metadata, leases, retries, dead-letter state, and timestamps.

Twilio, Gmail, Stripe, and other provider ingress are not yet fully migrated to inbox-first acknowledgement and leased-worker processing. The existing provider-specific paths must move source-by-source without breaking the two-door invariant between external/untrusted events and internal Manager-authored delivery.

## Runtime/security boundary

Status: `source-wired_pending_live_proof`.

The target boundary now separates:

- public Web/Manager/Caddy;
- signed Unix-socket host provisioner with Docker authority;
- loopback host-private Model Gateway with provider master keys;
- private employee bridges, loopback Hermes ports, immutable profiles, scoped credentials, writable workspace, and bounded ephemeral state.

The required hostile tests are not optional: employee peer/control-service reachability, Docker/metadata/database access, public gateway/provisioner exposure, secret scanning, profile mutation, token substitution, and recovery/reconciliation all require proof artifacts.

## Current GTM state

Canonical offer:

- Start free with one useful, bounded AI Employee.
- Managed AI Employee from $400/month.
- Multi-role/location/high-volume workforce is custom.

The flagship product is the maintained employee relationship, not the estimate skill or a SaaS feature matrix. The estimate remains a strong first proof object for contractors.

Authority: `../../mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md`.

## Now-to-live

### P0

1. Keep `research` rebased on latest `main`. **Complete for this session through GitHub rebase PR #14.**
2. Apply and review migrations `0031`–`0033` on a disposable production-shaped DB.
3. Run TypeScript/type/API drift review, including shared exports, Hono gateway entry, Supabase row shapes, and provisioner results.
4. Prove the host-private Model Gateway route and public isolation.
5. Prove profile integrity and credential rotation/revocation.
6. Implement the DB-backed provisioning reconciler worker.
7. Implement fleet drift scan/repair and reboot reconstruction.
8. Ensure Twilio/provider binding and welcome/customer effects occur only after runtime + route acceptance.

### P1

1. Migrate provider webhooks to `ambient_event_inbox` workers.
2. Route admin lifecycle operations through `provisioning_commands` + reconciler.
3. Run a fresh canonical public onboarding and capture real provider/runtime/tool proof IDs.

## Static risks recorded in the reconciliation

- A failed host-provisioner execution can leave a filesystem idempotency marker without a cached result, causing same-key replay to remain in progress.
- Compensated provisioning jobs need explicit fresh-key retry validation.
- Model-gateway rate limiting is process-local and spend policy is not yet decremented transactionally from accumulated usage.
- Migrations, generated DB types, production image entrypoints, and runtime reload behavior have not been validated in this session.

## Next strategic product frontier — public website

The next major public product work is a first-principles AMTECH website rewrite using the emerging light AMTECH design system and the owner-product's living-worker patterns.

The site must teach the category through concrete work:

```text
owner asks
-> employee works
-> proof appears
-> owner approves
-> customer/provider action occurs
```

It should make an owner conclude:

- this is not generic AI;
- this does the office work I hate;
- I can text it like an employee;
- it asks before risky actions;
- I can start without a platform rollout;
- this could return evenings or help win another job.

Implementation brief: `../../docs/amtech-website-rewrite-brief.md`.

## Status vocabulary and proof rule

- `source-wired`: code/schema/config exists; state the checks actually run.
- `provider-accepted`: real provider IDs exist.
- `runtime-accepted`: real host/runtime proof artifacts exist.
- `planned`: designed, not implemented.
- `pending`: unattempted, blocked, or missing proof.

Do not publish or record provider/runtime acceptance based on source shape, mocks, fixtures, old containers, manually injected events, or marketing demonstrations.

## Validation state

The branch rebase and documentation edits were performed through GitHub. No full build, typecheck, unit/integration suite, migration application, Compose run, browser onboarding, provider call, hostile-runtime test, or proof artifact generation was run during this reconciliation.