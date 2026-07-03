# Next Agent Handoff

Status: active

Use this prompt for the next implementation or planning agent.

## Prompt

You are the implementation agent for the AMTECH AI Employee MVP at `/home/georgej/AMTECH/GTM-RESEARCH`.

Read first:

1. `identity.md`
2. `CODEGRAPH.md`
3. `wiki/MVP/build-plan-current/README.md`
4. `wiki/MVP/build-plan-current/phases/` (the forward phase plan — start here) and the rest of `wiki/MVP/build-plan-current/`
5. `wiki/MVP/implementation-records/README.md`
6. `mvp-build/CLAUDE.md` (or `mvp-build/AGENTS.md`) — the build-home agent guide
7. `mvp-build/memory/` — in-repo durable dev handoffs + the memory writing protocol (read the newest handoff)
8. `mvp-build/README.md`
9. the relevant source files in `mvp-build/` before changing code

Do not rewrite `wiki/MVP/old-build-plan/*`. That is the original packet. Current implementation planning belongs in `wiki/MVP/build-plan-current/`, implementation records, and `mvp-build/docs/` as appropriate.

## Objective

Implement the next era of development as the **modular phase plan in `wiki/MVP/build-plan-current/phases/`** (Phase 0 baseline + Phases 1-13). Work the phases in dependency order; each phase has its own acceptance gate, so finish and accept one module before the next:

1. live provider/runtime acceptance (Phase 1);
2. runtime/scheduler productionization (Phase 2);
3. event bus and Work Surface completion (Phases 3-5: ingress/routing, live wake path, triage/batching/live stream);
4. metering foundation, instrumentation, rollups/budgets (Phases 6-8);
5. admin foundations and operations surfaces (Phases 9-10);
6. AMTECH billing scaffold (Phase 11);
7. LLM provider registry (Phase 12);
8. 1000-user operations (Phase 13).

Phases 2, 3, 6, and 9 are independent foundations that can run in parallel once Phase 1's live environment is standing — see the dependency graph in `phases/README.md`.

If live provider credentials are absent, do not fake acceptance. Implement source-level changes that can be verified locally, then record exact missing env vars and proof ids.

## Non-Negotiables

- The owner only talks to one employee.
- Manager remains the backend control plane.
- Secrets are by reference only.
- No raw secrets, tokens, signatures, prompts, provider bodies, or email bodies in logs/admin payloads.
- Provider acceptance requires real proof ids.
- Stripe test mode is allowed; manually injected Stripe results are not.
- Admin and metering are first-class requirements for paid pilots.
- AMTECH billing and owner Stripe Connect payments are separate rails.
- Supabase RLS and Data API exposure must be reviewed for every new browser-readable table/view.

## Baseline Checks

From `mvp-build/`:

```text
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration
```

Expected current local state:

- typecheck passes;
- unit tests pass, 25 files / 124 tests;
- build passes;
- lint passes;
- integration skips cleanly without live Supabase creds.

## Required Record Updates

After meaningful implementation:

- add or update an implementation record in `wiki/MVP/implementation-records/`;
- write/update an in-repo durable memory handoff in `mvp-build/memory/` per its protocol (`mvp-build/memory/MEMORY.md`) — mid-session after substantial/architectural work, after a full phase, or after an architectural decision;
- update `mvp-build/README.md` current status;
- update `CODEGRAPH.md` node registry/canonical facts if status changes;
- update this folder only if the build plan itself changes.

## Acceptance Language

Use these exact states:

- `source-wired`: code exists and local tests pass.
- `provider-accepted`: live provider proof ids captured.
- `runtime-accepted`: live Hermes/runtime/job proof captured.
- `planned`: designed but not implemented.
- `pending`: blocked by missing env/credential/host or not yet attempted.

Do not call anything complete unless the relevant acceptance state is true.
