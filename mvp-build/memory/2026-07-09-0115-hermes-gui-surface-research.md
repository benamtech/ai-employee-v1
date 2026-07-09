# Hermes GUI Surface Research For AMTECH Materialization

Date: 2026-07-09 01:15

Status: research addendum written

Scope: Deep research into Hermes Workspace, Hermes WebUI, Nous Hermes Desktop, Hermes Agent docs/runtime, and how AMTECH should surface employee state across web, SMS, desktop/Deno, links, email, admin, ingestion, and egress.

## What Changed

Added `mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`.

Updated `mvp-build/second-half-plan/README.md` to point at the research addendum.

Updated this memory index with the new handoff.

## Why

The user clarified that the current web client is far from ready and that AMTECH must win on usability, actionability, SMS, and future surfaces. The research confirms that Hermes already has a much richer substrate than the current AMTECH owner UI exposes: sessions, runs, toolsets, skills, MCP, gateway platforms, structured stream events, approvals, clarifications, cron, messaging, files, terminal, memory, and desktop JSON-RPC.

The product correction is to build AMTECH as a business-native materialization layer over Hermes, not a chat wrapper and not bespoke connector pages.

## Current Status

Research/documentation only. Status is `planned` for the implementation recommendations and `source-wired` only for the documentation changes.

No runtime/provider acceptance was claimed.

## Files / Seams Touched

- `mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`
- `mvp-build/second-half-plan/README.md`
- `mvp-build/memory/MEMORY.md`
- `mvp-build/memory/2026-07-09-0115-hermes-gui-surface-research.md`

Main proposed seams:

- `SurfaceEnvelope`
- `WorkResource`
- `WorkAction`
- `CapabilityGraph`
- `EmployeeEventStream`
- generic web/SMS/link/desktop/admin renderers

## Carry-Forward / Next

Implement the materialization layer before adding more bespoke UI:

1. Define shared `SurfaceEnvelope`, `WorkResource`, `WorkAction`, and renderer interfaces.
2. Materialize existing chat/tool/artifact/approval state into those objects.
3. Rebuild the web employee desk around left work navigation, center timeline, right preview rail, and serious composer.
4. Put SMS and signed preview links on top of the same objects/actions.
5. Build `CapabilityGraph` from Hermes capabilities/toolsets/skills/MCP plus Manager tools/connectors/policy.
6. Keep optional desktop/Deno as a consumer of Manager surface APIs, not as a new product backend.

## Verification

No code tests were run; this was a research/docs update.

Research was done from public GitHub pages plus local clones in `/tmp`:

- `/tmp/hermes-agent-research`
- `/tmp/hermes-workspace-research`
- `/tmp/hermes-webui-research`
