# Production State After c83c23b

Status: active handoff  
Updated: 2026-07-23  
Branch: `task/new-task-20260723`  
Exact candidate: `c83c23be7d9bc5c36c164579ff47c16c45bb97a0`

## Read first

Use this as the current narrative handoff, then verify against source, retained proofs, workflows, the decision transaction, and `../CODEGRAPH.md`. This memory is not normative and does not promote local mirror evidence to production acceptance.

## What changed

The current branch is pushed with three production-runtime commits after the Trace014/Trace015 strategy baseline:

- `193c9bd Fix production Caddy upstream env prep`
- `1342f1c Poll production compose health in deploy smoke`
- `c83c23b Fix production topology compose test env`

Those commits repaired the fresh-pull Hermes/production command path enough for the repo-owned production-like bring-up, deploy smoke, env proof, database status, and full repository verification to run against the exact candidate.

## Retained proof

Retained local mirror P3 proof files:

- `../infra/proofs/prod-like-normal-up-2026-07-23T20-52-56-118Z.json`
- `../infra/proofs/production-normal-up-local-tunnel-2026-07-23T20-52-56-150Z.json`
- `../infra/proofs/deploy-smoke-2026-07-23T20-53-29-125Z.json`
- `../infra/proofs/prod-env-proof-2026-07-23T20-53-34-573Z.json`

Observed running stack on 2026-07-23:

- `amtech-manager`
- `amtech-model-gateway`
- `amtech-web`
- `amtech-host-provisioner`
- `amtech-caddy`
- `amtech-tunnel`

The app images are tagged with `c83c23be7d9bc5c36c164579ff47c16c45bb97a0`. The local mirror was healthy after bring-up and deploy smoke.

## Production env and database

`../infra/deploy/.env.production` exists, is gitignored, and must not be printed. Use it for production builds and live tests.

Production Supabase status was checked with the production env loaded. All migrations through `0082_atomic_sms_decision_focus.sql` were applied.

Production preflight was 6/9 runnable:

- runnable: Supabase, Manager, Model Gateway, Host Provisioner, Twilio Employee, Twilio Test;
- blocked: Gmail callback/PubSub/audience/service-account envvars, Stripe Connect client id, and QBO callback/webhook verifier envvars.

Do not treat placeholder or missing-provider checks as external acceptance.

## Decision transaction caveat

Trace016 produced useful source and proof evidence, but repoctl `evaluate`/`finish` rejected the transaction because changed paths exceeded the original impact analysis. Do not describe Trace016 as a completed/finished transaction.

Trace017 is the current authority-document reconciliation transaction. It exists to align `CODEGRAPH.md`, `authority-map.json`, the production-readiness program, the resolution ledger, and memory with the exact production mirror state.

## UI Lab boundary

Current UI Lab and `apps/web/ui-variants` are historical/fixture-bearing source artifacts. They are not authoritative for the next UI development effort.

After this branch is merged and the exact `main` merge commit is verified:

1. create a fresh UI development branch;
2. run `repoctl start` before non-mechanical UI edits;
3. redesign UI Lab from the current product authority and production owner/channel needs;
4. keep production env values secret and loaded only through scripts.

## Still open

- verify the exact `main` merge commit after merge;
- provider env completion for Gmail, Stripe Connect, and QBO;
- managed database advisors/security, backup, restore, and rollback proof;
- target host secrets, managed DNS/tunnel, two-employee isolation, and destructive recovery;
- trusted signing and registry retention;
- fixture-free Web/SMS/signed Review convergence;
- provider-backed Website, Contractor Office, and Bookkeeping golden journeys;
- manual accessibility, supported browsers, representative capacity, pilot packet, deployment, and production.
