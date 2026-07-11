# Pod Alpha runtime proof work and launch blockers

Date: 2026-07-11 16:50 EDT
Status: runtime/deploy proof work `source-wired`; local proof partially successful; live host/provider proof still `pending`
Scope: Pod Alpha runtime readiness, scoped-MCP reprovision, deploy/Caddy proof, operator runbooks, launch blockers, and local proof loops

## What changed

- Added a Pod Alpha operator proof layer in `mvp-build/infra/scripts/` and `package.json`:
  - `deploy:smoke` now emits JSON proof and checks Manager/Web/Caddy health plus Caddy validation and Docker DNS.
  - `ops:caddy-proof` runs a real temporary Caddy container and proves valid snippet, invalid snippet rejection, rollback validation, and old-route liveness.
  - `ops:reprovision-scoped-mcp` mints scoped MCP credentials, rerenders the employee profile, restarts the employee container, proves MCP `tools/list`, and verifies the rendered profile no longer contains `MANAGER_INTERNAL_TOKEN`.
  - `capacity:pod-alpha`, `ops:backup`, `ops:restore`, `ops:red-health`, and `ops:egress-policy` were added as proof-oriented launch/ops scripts.
- Hardened the employee launcher in `infra/scripts/local/start-hermes-container.sh`:
  - still drops capabilities / no-new-privileges / resource limits / restart policy;
  - now uses a default capability allowlist for Hermes bootstrap (`CHOWN`, `SETUID`, `SETGID`, `FOWNER`, `DAC_OVERRIDE`);
  - only adds `--network-alias` on user-defined networks, which fixed the default `bridge` reprovision failure.
- Fixed replay/reprovision correctness in the profile renderer and DB migrations:
  - `apps/manager/src/lib/profile-renderer.ts` now clears the generated Hermes profile directory before copying the package, so stale removed files do not survive rerenders.
  - `packages/db/migrations/0027_turn_claim_return_qualification.sql` and `0028_turn_claim_conflict_constraint.sql` fixed the turn-claim RPC ambiguity so queued owner turns can be claimed on the local proof database.
  - `packages/db/migrations/0024_turn_claim_lock_race_fix.sql` was qualified to match the same function shape.
- Added `docs/pod-alpha-runtime-runbook.md` and updated `mvp-build/README.md` and `mvp-build/CODEGRAPH.md` to reflect the proof scripts, runbook, and the fact that runtime/deploy is now partly source-wired but still not accepted.
- Added focused regression coverage for the new deploy/runtime scripts and renderer behavior:
  - `tests/unit/ops-proof-scripts.test.ts`
  - `tests/unit/caddy-activation.test.ts`
  - `tests/unit/employee-lifecycle.test.ts`
  - `tests/unit/hermes-container-script.test.ts`
  - `tests/unit/profile-renderer-security.test.ts`

## Why

The product surfaces were already ahead of the operational layer, so this session concentrated on making the VPS and operator path measurable instead of aspirational. The goal was to get concrete proof hooks for deploy, reprovision, recovery, and capacity before any further admin/billing work.

The local proof work now stands on its own and should not be blocked on credits/provider work.

## Current status

- `ops:caddy-proof` passed with a real Caddy container and wrote proof JSON.
- `ops:reprovision-scoped-mcp` passed for the local-state employee after the launcher and migration fixes, and wrote proof JSON with a concrete credential id.
- `local:tool-loop-proof` still failed. The local queue now drains correctly, but the warmed worker path timed out on the prompt size / runtime loop before producing the required employee tool audit, artifact, and approval rows.
- The local proof database now has the needed migrations through `0028`, and the live local employee container is up again after reprovisioning.

## Files / seams touched

- `infra/scripts/deploy-smoke.mjs`
- `infra/scripts/caddy-proof.mjs`
- `infra/scripts/reprovision-scoped-mcp.mjs`
- `infra/scripts/capacity-pod-alpha.mjs`
- `infra/scripts/backup-restore.mjs`
- `infra/scripts/red-health.mjs`
- `infra/scripts/egress-policy.mjs`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/lib/profile-renderer.ts`
- `packages/db/migrations/0024_turn_claim_lock_race_fix.sql`
- `packages/db/migrations/0027_turn_claim_return_qualification.sql`
- `packages/db/migrations/0028_turn_claim_conflict_constraint.sql`
- `tests/unit/ops-proof-scripts.test.ts`
- `tests/unit/profile-renderer-security.test.ts`

## Carry-forward / next

- Re-run `npm run local:tool-loop-proof` only after deciding whether the remaining local worker path should be shrunk further or replaced with a provider-backed proof path.
- Execute the new Pod Alpha proof scripts on the real VPS and capture the resulting `infra/proofs/*.json` files before upgrading any runtime status.
- Keep the employee config scoped-token only; never reintroduce `MANAGER_INTERNAL_TOKEN` into rendered employee configs.

## Verification

- Passed:
  - `npm run test:unit -- tests/unit/ops-proof-scripts.test.ts tests/unit/caddy-activation.test.ts tests/unit/employee-lifecycle.test.ts tests/unit/hermes-container-script.test.ts tests/unit/profile-renderer-security.test.ts`
  - `node --check` on the new deploy/proof scripts
  - `npm run ops:caddy-proof`
  - `npm run ops:reprovision-scoped-mcp -- emp_vhz8kw3bhvh67zu292ukgl`
  - `npm run db:migrate` after sourcing `.env`
- Failed or incomplete:
  - `npm run local:tool-loop-proof` still failed after the drain-lane and RPC fixes
  - the local worker path hit prompt/runtime limits and did not produce the required proof rows
