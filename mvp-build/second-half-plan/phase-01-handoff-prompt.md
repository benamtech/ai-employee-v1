# Phase 1 Handoff Prompt - Preserve And Close Live Gate

Status: active handoff prompt

Date: 2026-07-09

Use this prompt to start an implementation session whose only job is to complete Phase 1 of the new second-half plan.

```text
You are Codex working in `/home/georgej/AMTECH/GTM-RESEARCH`.

Goal: complete `mvp-build/second-half-plan/phase-01-preserve-and-close-live-gate.md` end to end.

Read first, in this order:

1. `CODEGRAPH.md`
2. `mvp-build/CODEGRAPH.md`
3. `mvp-build/CLAUDE.md` and `mvp-build/AGENTS.md`
4. `mvp-build/memory/MEMORY.md`, then the newest dated memory handoffs
5. `mvp-build/second-half-plan/README.md`
6. `mvp-build/second-half-plan/phase-00-current-state-handoff.md`
7. `mvp-build/second-half-plan/phase-01-preserve-and-close-live-gate.md`
8. `mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`
9. `mvp-build/infra/local/RUNBOOK.md`
10. `mvp-build/infra/hermes/RUNBOOK.md`

Context:

AMTECH packages Nous Research Hermes Agent into a small-business AI employee. The backend has meaningful seams: Manager control plane, Hermes profile rendering, Manager-as-MCP, schema-first Manager tools, artifacts, approvals, events, runtime health, scheduler lanes, metering, and local live-test scripts. The product is not ready because owner web/SMS surfaces are underbuilt. The second-half plan fixes that, but Phase 1 must first stabilize and prove the interrupted live employee/tool path.

Important product direction:

- The owner only talks to their employee; Manager stays invisible.
- Preserve broad employee behavior. Do not narrow it back to estimates only.
- Preserve Manager-as-MCP and tool-native employee work.
- The later phases will materialize employee state into web, SMS, signed previews, admin, and optional desktop/Deno clients using `SurfaceEnvelope`, `WorkResource`, `WorkAction`, and `EmployeeEventStream`. Phase 1 does not need to implement those contracts, but it must preserve enough ids/proof to support them.
- Use "capability" normally. Hermes `/v1/capabilities`, `/v1/skills`, `/v1/toolsets`, Manager tools, rendered profile data, connector status, and policy all inform the future capability model. Do not overcorrect by treating the Hermes endpoint as the whole graph or as useless.

Start by inspecting the dirty tree. Do not revert user/previous-agent work. Preserve or integrate the interrupted fixes called out in Phase 0:

- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/server.ts`
- `infra/scripts/local/model-bridge-lib.mjs`
- `packages/agent-template/config.yaml`
- `packages/agent-template/SOUL.md`
- `packages/agent-template/workspace/AGENTS.md`
- `packages/agent-template/workspace/manager-tools.md`
- `apps/manager/src/lib/artifact-view.ts`
- matching tests

Specific technical outcomes:

1. Manager MCP identity injection is the only path for `account_id`/`employee_id` in employee MCP tool calls.
   - MCP `tools/list` must not expose owner/account/employee ids as model-fillable inputs.
   - MCP `tools/call` must inject bound identity server-side before validation/dispatch.

2. Dockerized employee profiles must reach Manager.
   - Rendered Manager origins for docker-backend employees must rewrite host loopback (`localhost` / `127.0.0.1`) to `host.docker.internal` or use the explicit docker Manager origin override.
   - Local/non-docker rendering should preserve normal loopback behavior.

3. Hermes terminal backend must run in-container.
   - Manager runtime isolation may be `docker`, but rendered Hermes `terminal.backend` should default to `local` inside the employee container unless there is a concrete reason otherwise.

4. The local model bridge must preserve tool availability.
   - It must pass/describe offered tools to the worker.
   - It must support the `tool_calls` JSON protocol and preserve prior tool turns well enough for live local testing.

5. The employee persona must stay broad.
   - Keep approval gates for money/customer-facing/dangerous work.
   - Do not reintroduce language that trains the employee to refuse broad small-business work or behave as only an estimate bot.

6. Decide what to do with `apps/manager/src/lib/artifact-view.ts`.
   - Prefer wiring it as the safe structured artifact fallback if scoped and tests are reasonable.
   - If deferring, keep the file and document exactly why in the Phase 1 memory note.

Required local checks from `mvp-build/`:

- `npm run typecheck`
- `npm run test:unit`
- `npm run lint`
- `npm run build`

Required targeted tests to add or confirm:

- MCP tools/list strips `account_id` and `employee_id`.
- MCP tools/call injects bound identity before validation.
- Docker profile rendering rewrites Manager loopback to `host.docker.internal`.
- Local profile rendering preserves loopback.
- `TERMINAL_BACKEND` defaults to `local`.
- Model bridge lists tools and serializes prior tool calls.
- Live gate script or helper fails clearly if an employee has zero Manager tools.

Then run the local live gate if the environment can support it:

- `npm run live:up`
- reprovision an employee using the live-test toolkit
- verify `/health`, `/v1/capabilities`, `/v1/toolsets`
- verify Manager MCP tool registration
- drive one owner request requiring a Manager tool
- verify at least one `audit_log` row with `actor=employee`
- verify one created artifact id
- verify the Work Surface can load the employee resource snapshot

If a command fails because Docker/model/provider/env is unavailable, do not fake proof. Record the blocker, exact missing env/host/dependency, and which acceptance item remains pending.

Proof note requirements:

Write a dated memory handoff under `mvp-build/memory/` and update `mvp-build/memory/MEMORY.md`. Include:

- account id
- employee id
- runtime endpoint id and port
- Hermes health/capabilities/toolsets response timestamp or failure
- tool count / MCP registration evidence
- owner message id if present
- Hermes session/run/message id if present
- audit row ids
- artifact id and artifact payload/file ids
- approval ids if any
- commands run and results
- failures and repairs
- whether Phase 1 is complete, partially complete, or blocked

Also update:

- `mvp-build/CODEGRAPH.md` if source layout/status changes materially
- root `CODEGRAPH.md` if wiki/build-plan orientation changes materially
- relevant wiki implementation record only if you create factual implementation state worth recording there

Definition of done:

- Interrupted tool-enabled employee changes are preserved and tested.
- Local static gates pass, or any failures are concrete and documented.
- A local live proof exists, or the live blocker is explicitly documented without overclaiming.
- Phase 1 memory handoff exists and is indexed.
- No unrelated dirty-tree work is reverted.
```
