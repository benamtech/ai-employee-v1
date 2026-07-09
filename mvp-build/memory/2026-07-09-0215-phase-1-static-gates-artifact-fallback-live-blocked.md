# Phase 1 Static Gates + Artifact Fallback; Live Gate Blocked

Date: 2026-07-09 02:15

Status: Phase 1 partial — source-stabilized/static-green; local live gate blocked

Scope: Preserved the interrupted tool-enabled employee work, wired generic structured artifact fallback, ran required static gates, and attempted the local live stack.

## What changed

- Preserved prior dirty-tree Phase 1 fixes:
  - Manager MCP `tools/list` strips model-fillable `account_id` / `employee_id`.
  - Manager MCP `tools/call` injects bound identity from `X-AMTECH-Account-Id` / `X-AMTECH-Employee-Id` before validation/dispatch.
  - Docker employee profile rendering rewrites host loopback Manager origins to `host.docker.internal` unless `DOCKER_MANAGER_API_ORIGIN` is set.
  - Local profile rendering preserves normal loopback.
  - Hermes `terminal.backend` defaults to in-container `local` while Manager runtime isolation remains `docker`.
  - The local model bridge still preserves offered tools and the `tool_calls` protocol for the temporary local testing path.
  - Employee persona remains broad/default-helpful, with money/customer-facing/dangerous work still approval-gated.
- Wired `apps/manager/src/lib/artifact-view.ts`:
  - `apps/manager/src/server.ts` now returns escaped `text/html` for authorized payload-only artifacts with no `storage_ref`.
  - Stored-file artifacts still return Supabase signed URLs.
  - Empty/non-renderable artifacts still return `artifact_not_found`.
  - Artifact access auditing remains on successful access only.
- Updated `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts`:
  - redirects stored artifacts as before;
  - renders Manager-provided safe HTML fallback with `Content-Type: text/html` and `X-Content-Type-Options: nosniff`.
- Added tests:
  - `tests/unit/artifacts.test.ts` covers HTML escaping/table rendering/null payload behavior.
  - `tests/unit/artifact-resolve.test.ts` covers authorized payload-only fallback, signed URL preservation, and unauthorized denial.
- Updated `mvp-build/CODEGRAPH.md` for the artifact fallback source map.

## Why

Phase 1 must preserve the employee-to-Manager tool path before web/SMS refactors. The structured artifact fallback is small and directly supports the second-half materialization direction: every tool/output needs a deterministic owner-safe view even before a PDF or bespoke renderer exists.

## Current status

- Static/source gate: `source-wired` and green.
- Local live gate: `blocked` for this session.
- No new account id, employee id, runtime endpoint id/port, Hermes session/run/message id, audit row id, or artifact id was captured in this session.
- No provider acceptance was claimed.
- No runtime acceptance was claimed beyond the prior dated 2026-07-06 local proof already in memory.

## Files / seams touched

- `apps/manager/src/server.ts`
- `apps/manager/src/lib/artifact-view.ts`
- `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts`
- `tests/unit/artifacts.test.ts`
- `tests/unit/artifact-resolve.test.ts`
- `mvp-build/CODEGRAPH.md`
- prior dirty-tree Phase 1 MCP/profile/persona/model-bridge files remain preserved.

## Carry-forward / next

- Re-run the live gate when a model path is available:
  - either the temporary local bridge can route to the local Claude Code account again;
  - or preferably the employee is configured with paid OpenRouter/Nous/OpenAI/Anthropic capacity so the bridge is no longer needed for testing.
- Then run:
  - `npm run live:up`
  - `npm run live:status`
  - `npm run live:list`
  - `npm run live:reprovision -- <sourceEmployeeId>`
  - verify `/health`, `/v1/capabilities`, `/v1/toolsets`;
  - verify MCP tool registration;
  - drive one Manager-tool owner request;
  - verify `audit_log actor=employee`;
  - record artifact id and Work Surface resource snapshot proof.
- If the sandbox blocks port binding again, rerun live stack startup outside the sandbox.

## Verification

Static gates from `mvp-build/`:

- `npm run typecheck` — pass.
- `npm run test:unit -- tests/unit/artifacts.test.ts tests/unit/artifact-resolve.test.ts` — pass, 2 files / 9 tests.
- `npm run test:unit` — pass, 52 files / 309 tests.
- `npm run lint` — pass.
- `npm run build` — pass.

Live gate attempt:

- `npm run live:up` — failed in the sandbox:
  - bridge failed to bind `0.0.0.0:8091` with `listen EPERM`;
  - Manager logged `listening on :8080 (45 tools registered)` but then `tsx` failed on `/tmp/tsx-1000/230.pipe` with `listen EPERM`;
  - web failed to bind `0.0.0.0:3000` with `listen EPERM`.
- Retried `npm run live:up` with escalation, but the user intentionally interrupted and clarified the temporary local bridge cannot complete right now because the Claude subscription/account is at its limit.
- Final `npm run live:status`:
  - `bridge:8091=000000`
  - `worker=0xHaiku`
  - `manager:8080=000000`
  - `web:3000=000000`
  - no employee containers.

Local bridge note: the bridge is temporary local test plumbing only; it routes through the local Claude Code account/session because no paid model provider is currently configured. It is not production architecture.
