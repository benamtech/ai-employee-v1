# UX system, Aqua research, and fixture guard

Date: 2026-07-14  
Status: docs + small guard source-wired  
Scope: master UX documentation system, Aqua HIG research translation, implementation coverage audit, generative UI frontier, fixture-vs-production guard

## What changed

- Added `docs/ux/` as the master UX organization layer for AMTECH UI work.
- Captured the Aqua Human Interface Guidelines 2002 principles as AMTECH-specific AI employee rules:
  metaphor, see-and-point, direct manipulation, user control, feedback, consistency, WYSIWYG, forgiveness,
  perceived stability, aesthetic integrity, and modelessness.
- Added a current UX system map, research source ledger, implementation coverage audit, generative UI frontier,
  fixture/production policy, and post-release UI roadmap.
- Updated `CODEGRAPH.md`, `mvp-build/CODEGRAPH.md`, `mvp-build/README.md`, `mvp-build/ui-redesign/README.md`,
  and wiki current-state/index docs to point future UI agents at `docs/ux/`.
- Added `apps/web/app/_lib/ui-fixtures.ts` and threaded fixture-mode decisions from server components/routes into
  owner/admin clients. Fixture mode now fails closed in production-like or pod-like environments.
- Updated `prod-env:proof` to report fixture mode as a production-like failure.

## Product truth

The current UI and UI tests must use the same route/component implementation. Fixture mode is only a local data
source/action simulation for UI development and screenshots. Pod-like environments must use real Manager data and no
fake fixtures.

Generative UI remains the highest-upside frontier. It is source-wired through typed work views, Manager-compiled
MCP-UI `ui://` resources, and a sandboxed renderer, but it is not accepted until a funded provider-backed Hermes
tool loop generates and acts on a real work surface with proof ids.

## Verification to carry forward

- `npm run test:unit -- --run tests/unit/ui-fixture-mode.test.ts tests/unit/prod-env-proof.test.ts` passed: 2 files / 6 tests.
- `npm run typecheck --workspace @amtech/web` passed.
- `npm run ui:test` passed and wrote local screenshots under `infra/.local/ui-fixtures/`.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `git diff --check` passed.

Do not upgrade live provider/runtime acceptance from these docs or fixture checks.
