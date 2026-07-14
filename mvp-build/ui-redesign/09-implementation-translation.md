# Implementation Translation

Status: implementation-ready guidance  
Purpose: translate the design direction into current source without inventing backend changes

## Scope

Future implementation should rebuild UI behavior and presentation around this packet while preserving existing
Manager/Web APIs and shared contracts unless a concrete field gap is proven.

No backend contract change is required by this design packet.

## Current Contracts

Use:

- `ResourcePayload` as the owner snapshot.
- `resurface_items` for Needs your say.
- `messages` for Talk.
- `surface_envelopes` and `WorkResource` for work/review objects.
- `connection_surfaces` for Connected.
- `capabilities` / `CapabilityGraphNode` for contextual readiness.
- `work_events` for proof/recent history.
- `WorkAction` for owner-safe actions.

Do not expose contract names in the UI.

## Likely Owner Components

Target component responsibilities:

- `AveryHome` - first screen composition.
- `AveryComposer` - primary command surface.
- `NeedsYourSay` - compact resurfacing/approval list.
- `WatchingSummary` - quiet current awareness.
- `WorkReviewSheet` - exact permission surface.
- `WorkObjectView` - one active `WorkResource` / `SurfaceEnvelope` detail.
- `TalkView` - conversation and repair.
- `ProofView` - recent receipts and refinding.
- `ConnectedView` - plain-language capability readiness.
- `SignedReviewView` - scoped mobile review using the same object renderer.

Names are suggestions; behavior is the requirement.

## Source Areas

Likely implementation areas:

- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `apps/web/app/agent/[employeeId]/fixtures.ts`
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/review/ReviewClient.tsx`
- artifact/output route under `apps/web/app/agent/[employeeId]/output/`

Keep admin separate.

## What To Discard From Current UI Direction

Discard:

- default multi-column shell;
- stream rails as a primary interface;
- dashboard metric strips;
- persistent mode badges;
- heavy status pills;
- mono-heavy typography;
- red/black severity styling;
- "office" and "agent desktop" metaphors as visible product frames;
- landing-page hero copy in the app;
- raw tabs for tasks/outputs/activity as the main IA.

Keep as raw material:

- fixture coverage ideas;
- shared work object renderer concept;
- signed review alignment;
- owner-safe vocabulary scans;
- approval action handling;
- surface-model helper patterns where useful.

## Fixture Requirements

Fixtures should prove:

- first-run/no-work employee;
- active contractor estimate;
- customer reply needing judgment;
- deposit/money approval;
- connector blocker;
- completed proof receipt;
- bookkeeper missing-doc workflow;
- future website/marketing draft;
- generated table/schedule/diff/form.

But fixtures must render through the new simple IA, not a dense demo of everything at once.

## Test Plan

Unit/component:

- Needs your say derives from `ResurfaceItem` and unresolved gates.
- Work object view renders `WorkResource` safely.
- Approval actions remain gated and scoped.
- Connected copy maps states to owner-safe language.
- Proof rows do not expose internals.
- Empty/first-run state remains non-dashboard.

Browser/UI:

- mobile Home -> approval -> proof;
- desktop Home -> selected work review;
- signed review approve/decline/reply;
- Connected blocker from Home;
- Talk composer sends owner message;
- artifact/output opens protected owner-safe view.

Screenshots:

- mobile Home;
- mobile approval;
- signed review;
- desktop Home;
- desktop work object;
- Proof;
- Connected.

## Contract Change Policy

Only add fields if implementation proves the current shape cannot express:

- notification delivery lifecycle;
- structured confidence/assumptions;
- job/customer grouping;
- owner notification preferences;
- recurring work readiness.

If a field gap is found, document it first and keep the UI fallback owner-safe.

