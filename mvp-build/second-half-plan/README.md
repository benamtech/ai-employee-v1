# AMTECH AI Employee Second-Half Plan

Status: active standard-remediation execution

Date: 2026-07-18

The active execution authority is [Phase 2 Standard Remediation — Production Execution Program](phase-2-standard-remediation-execution.md), backed by `../validation/phase-2-remediation-vectors.json`, command-board issue `#25`, and draft integration PR `#23` on `employee-production-tuesday`.

## Current execution status

- Plan integrity passed on Actions run `29638985374`; all 29 findings have primary ownership, dependencies, measurable gates, and failure conditions.
- Lane 1 checkpoint merged into the integration branch at `b37d479a70983fcb3e88942b1f36481a07a97d17`.
- Lane 1 delivered C1/C2 contracts, relationship graph migrations `0039`/`0040`, deterministic compatibility backfill, assignment-aware authorization helpers/policies, and a green five-case PostgreSQL relationship/RLS matrix on run `29639593725` after one test-found policy-version correction.
- Lane 1 is not complete: full route/resource assignment scoping, helper privilege-model review, real Supabase, browser, signed-resource, SMS/channel, and production proof remain pending.
- The integrated branch passed plan-integrity run `29639654226` and production-boundary run `29639654276`.
- Lane 3 draft PR `#26` has a green durable command/effect contract and a pre-implementation red PostgreSQL boundary on run `29639915565`. No kernel migration exists yet. One effect-reservation assertion must be corrected so it does not assume scheduler order before the red harness is final.
- All other lanes remain unclaimed unless their branch/PR contains explicit evidence. Production Supabase still stops at `0031_public_estimator.sql`; no new live runtime/provider/browser/commercial acceptance is claimed.

The canonical normal-employee path and free + $400 managed-workforce offer remain unchanged. The public estimator remains non-canonical.

## Historical phase family

This folder began as the forward plan for taking the Hermes-backed AMTECH AI Employee from a source-wired prototype to free trials and paid pilots. The older phase documents remain useful subsystem history, but where they conflict with the approved standard remediation program, the remediation program, current source, migrations, proof artifacts, and newest memory win.

The core product thesis remains: AMTECH packages Hermes Agent by Nous Research into an AI employee for small-business owners. Hermes supplies the agent substrate; AMTECH supplies the business-safe product layer: relationships, authorization, provisioning, connector custody, approval gates, artifacts, SMS/web surfaces, operator controls, metering, billing, repair, and trust.

## Historical Phase Index

| Phase | File | Outcome |
|---|---|---|
| 0 | [Current State Handoff](phase-00-current-state-handoff.md) | A large handoff describing what exists, what is dirty, what is missing, and what the new plan inherits. |
| 1 | [Preserve And Close Live Gate](phase-01-preserve-and-close-live-gate.md) | Stabilize interrupted work, preserve the tool-enabled employee path, rerun local gates, and capture live runtime proof. |
| 2 | [Owner Work Surface Redesign](phase-02-owner-work-surface-redesign.md) | Replace the skeletal web UI with a real small-business employee desk inspired by Hermes Desktop/WebUI/Workspace. |
| 3 | [SMS Ambient Inbox And Link Previews](phase-03-sms-ambient-inbox-and-link-previews.md) | Make SMS a complete owner surface with signed previews, approvals, artifacts, and task state. |
| 4 | [Tool-Agnostic Capability And Renderer Layer](phase-04-tool-agnostic-capability-and-renderer-layer.md) | Generalize capabilities and rendering across Hermes skills/toolsets, Manager tools, MCP tools, artifacts, and deliverables. |
| 5 | [Trial Operations, Admin, Billing](phase-05-trial-operations-admin-billing.md) | Make the factory operable for many employee instances with admin, support, health, metering, and billing controls. |
| 6 | [Free Trial And Paid Pilot Readiness](phase-06-free-trial-and-paid-pilot-readiness.md) | Finish the proof, policy, UX, and ops gates needed to hand this to real owners and charge. |

Deep GUI/runtime research from Hermes Workspace, Hermes WebUI, Hermes Desktop, and Hermes Agent internals is captured in [Hermes Surface Research And Materialization Strategy](surface-research-hermes-gui-and-materialization.md). The [Context-Engineering workstream](context-engineering/README.md) remains the historical source for business-brain and session-continuity design, but active implementation must consume the current relationship, authorization, command/effect, protocol, provider, and proof contracts.

## Implementation Rules

- Do not rewrite Hermes. Package and surface it.
- Do not build one bespoke connector UI per service. Use capability discovery, MCP, JSON Schema, generic renderers, approval primitives, and connector status.
- Keep Manager invisible to owners. Owners talk to their employee.
- Keep developer vocabulary out of owner-facing surfaces: no MCP, API, token, JSON, config, stack trace, tool catalog, or raw tool log language.
- Treat SMS and web as two renderings of the same employee state.
- Treat estimates as the wedge, not the ceiling.
- Keep customer-facing sends, money movement, broad external changes, deletes, and credential changes behind assignment-aware approval gates.
- Never mark provider, runtime, browser/channel, commercial, or production acceptance without release-bound proof IDs.
- Never use account membership, bearer possession, caller-selected identity, or fixture evidence as complete authority or launch proof.

## External References Used

- Hermes Agent repo: https://github.com/nousresearch/hermes-agent
- Hermes API Server docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
- Hermes MCP docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- Hermes Skills docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- Hermes Tools docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/tools
- Hermes Desktop source: https://github.com/NousResearch/hermes-agent/tree/main/apps/desktop
- Hermes WebUI source: https://github.com/nesquena/hermes-webui
- Hermes Workspace source: https://github.com/outsourc-e/hermes-workspace