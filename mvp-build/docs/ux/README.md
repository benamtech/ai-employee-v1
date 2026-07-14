# AMTECH UX System

Status: active  
Created: 2026-07-14  
Audience: UI/product agents working on AMTECH after the Avery-first owner MVP reset

This folder is the master UX organization layer for AMTECH. It does not replace the active
implementation packet in `mvp-build/ui-redesign/`; it explains how that packet fits into the larger
product, research, code, testing, and post-release UI roadmap.

## Source Order

1. Current source and contracts in `mvp-build/apps`, `mvp-build/packages`, and `mvp-build/infra`.
2. This folder for cross-surface UX system, research ledger, coverage audit, and roadmap.
3. `mvp-build/ui-redesign/` for the active owner MVP direction and screenshots.
4. `mvp-build/docs/state-of-progress-2026-07-14.md` for whole-product progress.
5. `wiki/MVP/` for product strategy, historical implementation records, and older research.

## Reading Order

1. `01-aqua-ai-interface-principles.md`
2. `02-current-ux-system-map.md`
3. `03-research-source-ledger.md`
4. `04-implementation-coverage-audit.md`
5. `05-generative-ui-frontier.md`
6. `06-fixture-production-ui-policy.md`
7. `07-post-release-ui-roadmap.md`

## Current UX Thesis

AMTECH is building an AI employee interface, not a SaaS dashboard. Avery is the primary interface:
the owner tells Avery what happened, Avery watches and prepares work, Avery stops for exact approval
when risk crosses a gate, and proof comes back without making the owner manage a ledger.

The active owner UI is source-wired as Home / Talk / Proof / Connected. That is the present product
target. Generative UI is the highest-upside frontier: source-wired through typed descriptors,
`SurfaceEnvelope`, `WorkResource`, and MCP-UI resources, but not live-proven until a funded provider
can drive Hermes through real tool loops.

## Non-Negotiables

- Production and pod-like environments must use the same UI routes and components as fixture tests.
- Fixture mode may only replace data and simulate local actions; it must not be enabled in pod-like
  or production-like environments.
- Owner UI must not show implementation vocabulary such as MCP, tool call, payload, schema,
  envelope, runtime, RLS, bearer token, or webhook.
- Customer-facing, money, publishing, protected sharing, and durable external writes require exact
  approval moments.
- Screenshots prove fixture behavior only. Live acceptance needs provider/runtime proof ids.
