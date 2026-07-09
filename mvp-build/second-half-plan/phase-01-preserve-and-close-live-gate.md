# Phase 1 - Preserve And Close Live Gate

Status: planned

Goal: stabilize the interrupted tool-enabled employee work, prove the live local Hermes path again, and establish a clean baseline before UI and product-surface refactors.

## Summary

Do not begin the Work Surface redesign on an unstable tree. First preserve the current uncommitted fixes that made the employee able to reach Manager tools from inside Docker, hide internal ids from the model, and let the local model bridge emit tool calls. Then rerun local gates and capture a runtime proof that a provisioned employee can call Manager tools, create an artifact, and surface it.

The Hermes GUI research does not change Phase 1 into a UI phase. It changes what Phase 1 must protect: the same employee state must later feed web, SMS, signed previews, admin, and optional desktop/Deno surfaces. Phase 1 should therefore preserve evidence and APIs in a way that the later materialization layer can consume.

## Key Changes

- Review and keep the dirty-tree fixes in:
  - `apps/manager/src/lib/profile-renderer.ts`
  - `apps/manager/src/lib/mcp-server.ts`
  - `apps/manager/src/server.ts`
  - `infra/scripts/local/model-bridge-lib.mjs`
  - `packages/agent-template/config.yaml`
  - `packages/agent-template/SOUL.md`
  - `packages/agent-template/workspace/AGENTS.md`
  - `packages/agent-template/workspace/manager-tools.md`
  - matching tests.
- Wire or explicitly defer `apps/manager/src/lib/artifact-view.ts`; if deferred, document the reason and keep the file.
- Add a short implementation memory note if the existing untracked `2026-07-06-0130...` note is not current enough.
- Ensure Manager MCP identity injection is the only path for employee identity in MCP tool calls.
- Ensure Docker employee profile rendering uses a container-reachable Manager origin.
- Ensure Hermes terminal backend defaults to in-container `local` while Manager runtime isolation remains `docker`.
- Ensure model bridge preserves offered tools and `tool_choice`.

## Acceptance Proof

Run from `mvp-build/`:

- `npm run typecheck`
- `npm run test:unit`
- `npm run lint`
- `npm run build`

Then run the local live gate:

- `npm run live:up`
- reprovision an employee using the live-test toolkit;
- verify the provisioned employee registers Manager tools;
- drive one owner request that requires a Manager tool;
- verify at least one Manager tool call in `audit_log` with `actor=employee`;
- verify one created artifact id;
- verify Work Surface can load the employee resource snapshot;
- verify `/health`, `/v1/capabilities`, and `/v1/toolsets` for the runtime.

Record a proof note under `mvp-build/memory/` or `mvp-build/infra/acceptance/reports/` with:

- account id;
- employee id;
- runtime endpoint id and port;
- Hermes health/capabilities response timestamp;
- tool count or MCP registration evidence;
- audit row ids;
- artifact id;
- commands run;
- failures and repairs.

Also record enough raw ids to let Phase 2/4 replay the result into future `SurfaceEnvelope`/`WorkResource` tests: owner message id, employee message/run/session id if present, Manager tool/audit rows, artifact payload/file ids, and approval ids if any.

## Tests To Add Or Confirm

- MCP tools/list strips `account_id` and `employee_id`.
- MCP tools/call injects bound identity before validation.
- Docker profile rendering rewrites Manager loopback to `host.docker.internal`.
- Local profile rendering preserves loopback.
- `TERMINAL_BACKEND` defaults to `local`.
- Model bridge lists tools and serializes prior tool calls.
- Live gate test fails clearly if employee has zero Manager tools.

## Assumptions

- It is acceptable to commit documentation and stabilization before broad UI work.
- Current dirty changes are directionally correct and should be preserved unless tests reveal a concrete regression.
- Local live gate can use the model bridge when a funded production model key is unavailable, but provider/runtime acceptance still requires honest proof labeling.
