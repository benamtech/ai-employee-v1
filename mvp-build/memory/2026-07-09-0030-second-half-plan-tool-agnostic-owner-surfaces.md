# Second-half plan packet: tool-agnostic Hermes employee + serious owner surfaces

Date: 2026-07-09 00:30

Status: plan packet written

Scope: `mvp-build/second-half-plan/`

## What changed

Created a fresh forward plan packet in `mvp-build/second-half-plan/`:

- `README.md`
- `phase-00-current-state-handoff.md`
- `phase-01-preserve-and-close-live-gate.md`
- `phase-02-owner-work-surface-redesign.md`
- `phase-03-sms-ambient-inbox-and-link-previews.md`
- `phase-04-tool-agnostic-capability-and-renderer-layer.md`
- `phase-05-trial-operations-admin-billing.md`
- `phase-06-free-trial-and-paid-pilot-readiness.md`

The packet is self-contained and does not require the old plan docs for Phases 1-6.

## Why

The current backend has meaningful Hermes/MCP/Manager/tool/artifact/event/runtime/metering seams, but the owner product is not trial-ready. The actual web client files show skeletal onboarding, placeholder login, local-only chat state, narrow single-column Work Surface cards, limited progress rendering, and no full small-business employee desk. SMS also lacks the signed preview/action surface required to stand alone.

The new plan realigns the build around AMTECH as the small-business interface and operations layer over Nous Research's Hermes Agent, with broad tool-agnostic capability and innovative owner surfaces.

## Current status

- Plan packet: written.
- Code changes: none in this step.
- Existing dirty tree: preserved; the new plan explicitly calls out the interrupted MCP/networking/model-bridge/persona/artifact renderer work.
- Acceptance status: unchanged. Runtime/provider gates still need real proof ids.

## Files / seams touched

- Added `mvp-build/second-half-plan/`.
- Updated this memory index.

## Carry-forward / next

Start with `second-half-plan/phase-01-preserve-and-close-live-gate.md`:

- preserve and test the dirty-tree live-gate fixes;
- wire or deliberately defer `artifact-view.ts`;
- rerun local gates;
- reprovision and prove employee tool calls against Manager;
- capture runtime proof before web UI redesign.

Then proceed to `phase-02-owner-work-surface-redesign.md`; the plan treats the web UI as the largest product gap.

## Verification

- Listed the created plan files.
- Searched the new plan packet for phase/status references and obvious placeholder issues.
- Did not run code tests because this change only adds documentation and memory.
