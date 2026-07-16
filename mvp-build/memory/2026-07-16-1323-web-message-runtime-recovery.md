# 2026-07-16 13:23 EDT — Web message runtime recovery + owner chat path

Status: implemented and proven against the production-like stack.

## What happened

The owner web client showed a message failure even though the employee was still marked `live` in the database. The failed message reached Manager and was stored, but the `employee_turn_jobs` row failed with `runtime_unreachable`.

The actual cause was not the web client. The active employee runtime container for `emp_lzh98ecdp30jjfknz33j7j` had exited while the Manager database still pointed at `http://amtech-hermes-emp_lzh98ecdp30jjfknz33j7j:8975`. The core prod-like stack did not restart per-employee Hermes containers, so owner messages could hit a dead runtime.

## What changed

- Added a compact owner-turn context path in `apps/manager/src/lib/owner-turn-context.ts`.
  - Pulls the latest `employee_manifests` row.
  - Renders bounded profile/business context without the heavier full employee snapshot path.
  - Unit-covered with `tests/unit/owner-turn-context.test.ts`.
- Switched owner web/SMS turns to the Hermes streaming execution path.
  - `apps/manager/src/lib/runtime.ts`
  - `apps/manager/src/lib/turn-drain.ts`
- Added `work_progress` status events to the owner web client so the chat feels alive while Hermes is working.
  - `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- Improved the first-contact prompt layer and bounded business facts.
  - `apps/manager/src/lib/agent-context.ts`
  - `apps/manager/src/lib/business-brain.ts`
- Added request-path runtime recovery in `apps/manager/src/lib/runtime-recovery.ts`.
  - Reads the latest generated employee profile path.
  - Neutralizes stale `gateway_state.json` before restart.
  - Reuses the existing `HERMES_RUNTIME_COMMAND` / `runRuntimeStart()` path.
  - Waits for the recovered runtime `/health` before retrying the owner turn.
  - Writes recovery metadata into `runtime_endpoints.health`.

This is intentionally not an architectural change. It is a last-mile self-heal for the current production-like runtime path so a dead employee container does not make the owner chat fail immediately.

## Proof

Latest clean stack proof after rebuild:

- `infra/proofs/prod-like-normal-up-2026-07-16T17-19-45-472Z.json`

End-to-end recovery proof:

- Employee: `emp_lzh98ecdp30jjfknz33j7j`
- Test action: stopped `amtech-hermes-emp_lzh98ecdp30jjfknz33j7j`, then posted through the actual web API route.
- Web API result: success
- Turn job: `turn_cagyki9iomzbn24bi8fgxv`
- Work run: `run_i3eawwzrg3qudeej9kdre5`
- Hermes external run: `run_6eac7b2e32174fe9aa350e9a10871605`
- Reply: `Check work queue and approvals for pending items.`
- Runtime health metadata included:
  - `status: recovered`
  - `health_wait: health_wait:ok`
  - `gateway_state: gateway_state:neutralized`
  - `recovered_at: 2026-07-16T17:20:57.444Z`

Validation run:

- `npm run typecheck --workspace @amtech/manager`
- `npm run typecheck --workspace @amtech/web`
- `npm run test:unit -- tests/unit/owner-turn-context.test.ts tests/unit/run-id-chain.test.ts tests/unit/turn-drain.test.ts tests/unit/hermes-client.test.ts`

Final test result: 4 unit files, 36 tests passed.

## Current stack state

After the final proof, the production-like stack was up:

- `amtech-ai-employee-manager-1` healthy on `127.0.0.1:8080`
- `amtech-ai-employee-web-1` healthy on `127.0.0.1:3000`
- `amtech-ai-employee-caddy-1` healthy on `:80/:443`
- `amtech-tunnel` up
- `amtech-hermes-emp_lzh98ecdp30jjfknz33j7j` up on `127.0.0.1:8975`

## Carry-forward

The message failure/runtime-unreachable path is fixed and proven. The response quality is still too terse for the target Hermes owner experience. The next product/prompt pass should tune the first-chat default behavior so it feels like the employee knows the business and can guide the owner through useful next actions, without burying them in jargon.

Production ops follow-up: request-path recovery is a pragmatic self-heal, not the final supervision model. Long-term, employee runtime lifecycle reconciliation should happen outside the owner message request path.
