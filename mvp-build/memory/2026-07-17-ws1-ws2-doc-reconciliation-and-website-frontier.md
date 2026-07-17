# WS1/WS2 documentation reconciliation and website frontier

Date: 2026-07-17
Branch: `research`
Status: documentation reconciled; source-wired only; no build, migration, runtime, or provider acceptance run

## Session result

- Rebased `research` onto latest `main` through GitHub rebase merge PR #14. `main` was not modified.
- Reconciled root, build-home, runbook, security, GTM, wiki, implementation-record, and memory orientation docs against source, migrations, scripts, and the WS1/WS2 handoff.
- Preserved one canonical normal-employee path: public DNS/Cloudflare Tunnel -> Caddy -> Web/Manager -> real `/create-ai-employee` -> Twilio Verify -> account creation -> Start Employee -> owner web client -> provider-backed reply.
- Marked the public estimator as outdated and non-canonical for product UX, pricing, and launch acceptance.
- Staged the next major product direction in `docs/amtech-website-rewrite-brief.md` and `GTM-RESEARCH/WEBSITE/README.md`.

## Current production boundary truth

- WS1 model gateway custody is source-wired. Runtime profiles receive a host-private gateway URL, employee-scoped token, model alias, credential version, and non-secret policy. Provider master keys remain outside employee profiles.
- WS2 durable provisioning foundations are source-wired: resource graph, state transitions, resource evidence, leases, retry classification, commands, drift operations, credential rotation, and compensation vocabulary.
- WS3 has schema groundwork only. Existing Twilio, Gmail, Stripe, and other provider ingress is not yet fully inbox-first through `ambient_event_inbox` workers.
- The host-private provisioner, runtime profile integrity, model gateway, and production Compose seams still require live hostile/runtime proof.
- The product is not provider-accepted, runtime-accepted, or release-eligible from this session.

## Static review findings carried forward

1. Migrations `0032` and `0033` are additive to `0031`, enable RLS, revoke anon/authenticated grants, and narrow operation-key uniqueness to non-terminal provisioning jobs. They still require disposable-DB application and compatibility proof.
2. The current provisioning path remains inline. A true DB-backed reconciler worker that claims jobs/commands and runs inspect-decide-apply-verify-persist is not yet present.
3. Host-provisioner filesystem idempotency markers can leave an operation in `idempotency_in_progress` after a failed execution unless a fresh operation key is used or cleanup/retry semantics are added.
4. The compensated-job retry path requires validation because the tool only generates a fresh idempotency key for `failed`, while it treats `compensated` as retryable.
5. Model-gateway rate limiting is process-local and the spend limit is policy-checked but not decremented transactionally from accumulated usage.
6. Gateway credential rotation rewrites the profile token/checksum, but live runtime reload/restart behavior and old-credential revocation sequencing still need proof.
7. Twilio/provider binding and welcome delivery must remain after runtime and route acceptance; no proof should be inferred from source ordering alone.

## Validation not run

Per session instruction, no full build, typecheck, unit suite, migration application, production Compose run, browser onboarding, provider call, hostile runtime probe, or live proof artifact generation was performed.

## Next move

Close the P0 now-to-live checklist in the production runbook and CODEGRAPH. In parallel, use the website rewrite brief to implement a first-principles public AMTECH site that explains the category through concrete work, proof, owner approval gates, and the free + $400 managed offer.