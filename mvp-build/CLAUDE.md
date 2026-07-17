# CLAUDE.md — AI Employee MVP build home

> Tool-agnostic mirror: `AGENTS.md`. Keep both files identical except for this heading note.

This is `mvp-build/`, the implementation home for AMTECH's AI Employee. The owner talks to one employee; Manager is invisible backend infrastructure.

## Read order

1. `../identity.md`
2. `CODEGRAPH.md`
3. `memory/MEMORY.md`, then the newest relevant handoff
4. this file / `AGENTS.md`
5. `docs/production-normal-employee-live-deploy-runbook.md` for live/deploy work
6. `../wiki/MVP/second-half-current-and-future-state.md`
7. `../wiki/MVP/implementation-records/README.md`
8. relevant source, migrations, scripts, and proofs

Source, migrations, scripts, proof artifacts, and newest memory outrank stale docs.

## Current status

- Branch: `research`, rebased onto latest `main` through GitHub rebase PR #14.
- Overall: `source-wired_not_accepted` after WS1/WS2.
- WS1 model gateway custody + profile integrity: source-wired.
- WS2 resource graph/state-machine/retry/drift/rotation/compensation foundations: source-wired; true reconciler worker pending.
- WS3 ambient inbox: schema groundwork only; provider ingress migration pending.
- Owner surfaces and existing product systems: source-wired; current live acceptance must be established by fresh proof, not inferred from code or historical runs.

## Canonical launch path

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

Use `docs/production-normal-employee-live-deploy-runbook.md`.

The public estimator, `prod-like:public-estimator:*`, fixtures, `/api/dev/login`, host `live:*`, and manually injected provider events are diagnostics/regression aids only. They are not normal-employee launch proof.

## Acceptance vocabulary

- `source-wired`: code/schema/config exists; name the static/local checks actually run.
- `provider-accepted`: real provider IDs exist.
- `runtime-accepted`: real host/runtime proof artifacts exist.
- `planned`: designed, not implemented.
- `pending`: blocked, unattempted, or missing proof.

Never upgrade status from architecture, mocks, fixtures, old containers, or confidence.

## Non-negotiables

1. No faked proof. Real acceptance needs real IDs/artifacts.
2. Provider master credentials never enter employee profiles or containers. Employee runtimes receive only scoped Manager MCP and Model Gateway credentials.
3. Customer-, money-, and reputation-affecting actions cross owner approval policy.
4. Webhooks verify provider authenticity before durable insertion; asynchronous workers own processing/retry/dead-letter behavior.
5. Manager public/API authority and host Docker authority remain separated by the signed Unix-socket provisioner boundary.
6. Every employee runtime is isolated; peer/control-service access is denied except explicitly scoped routes.
7. Rendered profiles fail closed on forbidden secret slots/values, unresolved tokens, unsafe permissions, and checksum drift.
8. Twilio/provider bindings and welcome effects happen only after runtime and route acceptance.
9. No new browser-readable Supabase table/view without reviewing Data API exposure, RLS, and grants.
10. The public estimator remains non-canonical.

## Working rules

- Inspect source before editing docs that describe it.
- Prefer docs-only changes for reconciliation sessions. Make source changes only for an obvious, bounded defect in scope.
- Do not run the full build/test suite unless requested. Use targeted static inspection and state exactly what was not run.
- For code sessions, the normal baseline remains:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # env-gated
```

Do not repeat old pass counts as current proof unless rerun.

## Active now-to-live priorities

- Apply/review migrations `0031`–`0033` on a disposable production-shaped DB.
- Typecheck shared exports, Hono gateway entry, Supabase row shapes, and provisioner result contracts.
- Prove host-private model-gateway reachability from employee containers and non-reachability from public ingress.
- Prove profile integrity and credential rotation/revocation.
- Implement the DB-backed reconciler worker and fleet drift repair.
- Move provider ingress to `ambient_event_inbox` leased workers.
- Route admin lifecycle actions through `provisioning_commands` + reconciler.
- Run a fresh canonical public onboarding with real provider/runtime/tool proof IDs.

## Memory protocol

After substantial multi-file work, phase completion, production incident, or architectural/product-direction change:

1. create/update a dated handoff in `memory/`;
2. update `memory/MEMORY.md` newest-first;
3. record exact validation run or explicitly not run;
4. keep factual code/proof state in `../wiki/MVP/implementation-records/`.

## Git

Work only on the explicitly requested branch. Preserve `main`. Do not silently merge or push to another branch. End with exact changed files, unresolved risks, and validation not run.