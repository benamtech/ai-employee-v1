# AI-native UI redesign docs packet

Date: 2026-07-14 00:46 EDT  
Status: active design direction  
Scope: Docs-only replacement of `mvp-build/ui-redesign/` after prior UI directions were rejected

## What changed

Replaced the old `mvp-build/ui-redesign/` packet with a new docs-only design direction:

- `README.md`
- `00-index-and-reading-order.md`
- `01-research-synthesis.md`
- `02-product-principles.md`
- `03-ai-native-interaction-model.md`
- `04-information-architecture.md`
- `05-visual-system.md`
- `06-core-surfaces.md`
- `07-approvals-proof-and-trust.md`
- `08-mobile-and-job-site-use.md`
- `09-implementation-translation.md`
- `10-acceptance-and-rejection-criteria.md`

The packet explicitly supersedes the rejected office/dashboard and chat-native agent desktop directions.

## Why

The founder rejected the previous UI as too busy, badge-heavy, column-heavy, SaaS-like, harsh, mono-heavy,
text/hero-driven, and not meaningfully LLM-first. The new docs reset the product model around Avery as the
primary interface: a calm AI employee relationship where the owner talks naturally, Avery prepares work, Avery
stops for exact permission, and proof is saved quietly.

The research synthesis ties design choices to concrete sources: Microsoft HAX, Google PAIR, NN/g progressive
disclosure, cognitive load research, Fogg Behavior Model, mixed-initiative interaction, LLM human-agent systems,
calm technology, and Aqua-era affordance/depth lessons.

## Current status

- `mvp-build/ui-redesign/` is now the active docs packet.
- No app/source behavior changed.
- No provider/runtime acceptance claimed.
- Existing backend contracts and safety gates remain preserved:
  - `ResourcePayload`
  - `WorkResource` / `WorkAction`
  - `SurfaceEnvelope`
  - `ConnectionSurface`
  - `CapabilityGraphNode`
  - `ResurfaceItem`
  - `WorkEventDescriptor`
  - signed review/artifact safety
  - exact approval gates for customer sends, money, publishing, protected sharing, and durable external writes

## Carry-forward / next

Future UI implementation should read the new packet first and discard the rejected visual/IA direction:

- no default three-column shell;
- no stream rails as the main interface;
- no badge/status-pill information system;
- no mono-heavy operational look;
- no landing-page hero copy inside the app;
- no generic dashboard/CRM/inbox/task-manager frame.

The implementation should make mobile Home the source of truth: Avery presence, Tell Avery composer, Needs your
say, quiet Watching, and recent Proof. Work objects, Connected, Talk, and Proof are secondary disclosure surfaces
over the existing contracts.

## Verification

Docs-only change. No code tests were required or run.

