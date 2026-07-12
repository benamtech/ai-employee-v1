# CE-1 profile context + native Hermes memory source-wired

Date: 2026-07-12 22:19 EDT
Status: source-wired; no live Hermes hook/runtime/provider proof claimed
Scope: implemented CE-1 profile-driven context generation, native Hermes memory seeding, once-per-session primer, and business-brain index semantics

## What changed

- Added profile-driven context contracts in `packages/shared/src/profile-package.ts`; `ProfileBuildParams.profile_context` is required because the product has not launched and there is no compatibility burden.
- Added `apps/manager/src/lib/profile-context.ts` to normalize onboarding manifests into generic slots. `contractor_estimator` is the first package-aware mapping; unknown packages use the same generic slot model rather than new platform-specific types.
- Added `apps/manager/src/lib/memory-seed.ts` and rendered `packages/agent-template/memories/MEMORY.md` / `USER.md` plus `workspace/brain/business-brain.md` from the same slot context. Source snippets are intentionally not rendered into profile files.
- Updated provisioning in `apps/manager/src/tools/provisioning.stub.ts` so manifest-derived context is created before calling the provisioner.
- Added CE-1 hook transport: `packages/agent-template/hooks/pre-session-context.mjs`, `config.yaml` `pre_llm_call`, `.env.tpl` `HERMES_ACCEPT_HOOKS=1` and scoped `MANAGER_MCP_TOKEN`.
- Added `apps/manager/src/lib/agent-context.ts` and `/manager/agent-context`: scoped MCP auth, Manager-owned once-per-session gate, reference-shaped primer capped at ~2k estimated tokens, with a 400k session target note. Migration `0029_ce1_agent_context_primer_sessions.sql` stores the gate.
- Added `apps/manager/src/lib/business-brain.ts`. `get_business_brain` and `amtech://manager/business-brain` now return an index/resource map; explicit facts are available separately at `amtech://manager/business-facts`.
- Fixed `save_business_brain_fact` schema to match the handler's `{ fact: { key, value, ... } }` shape.

## Why

The corrected brain semantics are now reflected in code: the business brain is the integrated employee system, not the facts table. Facts are one resource. The profile generation path seeds Hermes's native brain (`MEMORY.md` / `USER.md`) from onboarding once, and dynamic live state is a once-per-session reference primer, not a per-turn digest.

## Current status

`source-wired`. Local proof is green. Live Hermes hook behavior, real runtime prompt assembly, and provider/model loop proof remain `pending`.

## Files / seams touched

Representative seams: `profile-renderer.ts`, `profile-context.ts`, `memory-seed.ts`, `agent-context.ts`, `business-brain.ts`, `mcp-server.ts`, `estimate.stub.ts`, `tool-schemas.ts`, `packages/agent-template/{distribution.yaml,config.yaml,.env.tpl,hooks/,memories/,workspace/brain/business-brain.md}`, and migration `0029`.

## Carry-forward / next

- Apply migration `0029` in live/local DB flows before using the hook path against a real Manager DB.
- Reprovision employees; existing rendered profiles predate required `profile_context`, native memory files, and hook wiring.
- Live proof still owed: a real Hermes runtime should load the rendered memories and call the `pre_llm_call` hook once for a session.
- CE-2 remains next: tuned `compression:`, transform hooks for tool-output hygiene, and moving trivial/background work off owner turns.

## Verification

- `npm run test:unit -- profile-context agent-context profile-renderer-security mcp-resources mcp-route-auth estimate-tools runtime-backend platform-toolsets caddy-activation` passed.
- `npm run typecheck` passed.
- `npm run test:unit` passed: 84 files / 518 tests.
- `npm run build` passed.
- `npm run lint` passed.
- `npm run test:integration` passed with 6 files / 11 tests skipped by env gates.

