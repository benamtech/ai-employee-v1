# Production networking/admin infra source-wired

Date: 2026-07-11 17:52 EDT
Status: source-wired; no public DNS/TLS/provider/runtime live gate upgraded
Scope: Cloudflare DNS desired state, Caddy wildcard DNS-01 build path, production-environment proof aggregation, read-only admin environment readiness, Phase 6 gates

## What changed

- Added `infra/scripts/cloudflare-dns.mjs` plus `dns:cloudflare:plan` / `dns:cloudflare:apply`:
  deterministic desired records for apex, `www`, `api`, `agent`, static `*.agents`; DNS-only default for
  `api` and wildcard; AAAA opt-in only; apply gated by `--apply` and `CLOUDFLARE_DNS_APPLY_CONFIRM`.
- Added plugin Caddy production path: `infra/deploy/caddy.Dockerfile` builds with `caddy-dns/cloudflare`,
  `infra/caddy/production.Caddyfile` uses DNS-01 for `*.agents.amtechai.com`, compose now mounts that config.
  Existing stock/local Caddy paths remain for local proof.
- Added `infra/scripts/caddy-wildcard-proof.mjs` and `ops:caddy-wildcard-proof` to validate production config
  and confirm `dns.providers.cloudflare` is present without ordering a certificate.
- Added `infra/scripts/prod-env-proof.mjs` and `prod-env:proof` to aggregate proof JSON under
  `infra/proofs/` with explicit proof tiers: `static`, `local_mirror`, `limited_live_infra`,
  `provider_runtime_live`.
- Added Manager proof reading (`apps/manager/src/lib/proof-reader.ts`) and read-only admin environment
  readiness in shared contracts, Manager `/manager/admin/environment/readiness`, dashboard/employee readiness,
  and the Web admin Environment view.
- Updated `.env.example`, `infra/deploy/.env.production.example`, `docs/pod-alpha-runtime-runbook.md`,
  `docs/production-networking-and-dns.md`, and Phase 6 release gates.

## Why

The prior two-way/DNS design was correct but not executable. This pass turns it into safe operator tooling and
admin-visible proof without allowing accidental Cloudflare mutation or overclaiming public DNS, ACME, provider
webhook, or LLM/runtime acceptance.

## Current status

- Cloudflare/DNS desired state: `source-wired`; live API plan/apply not run.
- Caddy wildcard DNS-01: build/config/proof scripts `source-wired`; plugin image not built in this session;
  no ACME order/certificate issued.
- Local mirror: existing compose/network proof remains the latest local proof; new aggregation can report it.
- Limited live infra: path exists; no credentials/zone mutation attempted here.
- Provider/runtime: unchanged `pending`.
- Roles/delegation: unchanged `planned/deferred`; no account-member role code touched.

## Files / seams touched

- Scripts/config: `infra/scripts/cloudflare-dns.mjs`, `caddy-wildcard-proof.mjs`, `prod-env-proof.mjs`,
  `infra/deploy/caddy.Dockerfile`, `infra/caddy/production.Caddyfile`, `infra/deploy/docker-compose.yml`.
- Admin: `packages/shared/src/admin.ts`, `apps/manager/src/lib/{admin,proof-reader}.ts`,
  `apps/manager/src/server.ts`, `apps/web/app/admin/AdminClient.tsx`.
- Tests: `tests/unit/cloudflare-dns.test.ts`, `caddy-wildcard-proof.test.ts`, `prod-env-proof.test.ts`,
  plus admin/proof-script regressions.
- Docs/env: `.env.example`, `infra/deploy/.env.production.example`, `docs/pod-alpha-runtime-runbook.md`,
  `docs/production-networking-and-dns.md`, `second-half-plan/phase-06-free-trial-and-paid-pilot-readiness.md`.

## Carry-forward / next

- Build the plugin Caddy image and run `npm run ops:caddy-wildcard-proof` on the host.
- Run `npm run dns:cloudflare:plan` with a scoped Cloudflare token. Apply only with
  `CLOUDFLARE_DNS_APPLY_CONFIRM=amtechai.com npm run dns:cloudflare:apply`.
- Run `npm run prod-env:proof` after deploy/Caddy/Cloudflare/backup/egress proofs so admin shows the current
  tier. Do not claim public DNS propagation or certificate issuance until those are actually proven.

## Verification

- `node --check infra/scripts/cloudflare-dns.mjs` — passed.
- `node --check infra/scripts/caddy-wildcard-proof.mjs` — passed.
- `node --check infra/scripts/prod-env-proof.mjs` — passed.
- Focused unit tests for DNS/Caddy/proof/admin routes — 5 files / 22 tests passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed, including Next production build.
- `npm run test:integration` — 6 files / 11 tests skipped cleanly (env-gated).
- `npm run local:check` — ran and reported Docker/buildx/Hermes image/Caddy/env file OK, but blocked because
  this shell was not sourced with Supabase service role, `DATABASE_URL`, runtime command, or runtime backend.
- Built plugin Caddy image: `docker build -f infra/deploy/caddy.Dockerfile -t amtech-caddy-cloudflare:local .`
  passed after switching to the Caddy 2.10 builder/runtime tags. Attempts against Caddy 2.8 failed because the
  current Cloudflare module dependency graph requires a newer compatible Caddy/Go toolchain.
- `npm run ops:caddy-wildcard-proof` — passed with escalated Docker access; proof:
  `infra/proofs/caddy-wildcard-proof-2026-07-12T00-36-19-138Z.json`.
- `AMTECH_PUBLIC_IPV4=203.0.113.10 npm run dns:cloudflare:plan -- --mock` — passed dry-run; proof:
  `infra/proofs/cloudflare-dns-2026-07-12T00-37-14-420Z.json`.
- `npm run deploy:smoke` — failed honestly because the current compose core is not running on this box
  (`container_not_found` for manager/web/caddy); proof:
  `infra/proofs/deploy-smoke-2026-07-12T00-42-40-531Z.json`.
- Final `npm run prod-env:proof` — exited nonzero because latest deploy-smoke failed, while Caddy wildcard,
  Cloudflare dry-run, prior capacity, and egress dry-run proofs were visible; proof:
  `infra/proofs/prod-env-proof-2026-07-12T00-42-56-840Z.json`.
