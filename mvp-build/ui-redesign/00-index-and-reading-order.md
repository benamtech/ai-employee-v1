# Index And Reading Order

Status: active design direction; owner MVP implementation source-wired 2026-07-14  
Audience: implementation agents and product reviewers  
Scope: owner MVP UI/UX docs plus implementation translation notes

## Purpose

This packet defines a fresh UI/UX direction for the AMTECH MVP from first principles. The target is a
new kind of software: an AI employee where the LLM is the primary interface between an owner and the
business computer.

The user should understand within seconds:

- Avery can be talked to like a person.
- Avery independently watches and prepares work.
- Avery stops for exact permission at the right moments.
- Proof is saved without making the owner manage a ledger.
- The product is powerful, calm, warm, and emotionally trustworthy.

## What This Replaces

Supersede the prior UI directions:

- the red/black office dashboard;
- the chat-native agent desktop;
- multi-column operator shells;
- stream-heavy work rails;
- badge/status-pill overload;
- mono-heavy visual systems;
- landing-page hero copy inside the app;
- generic SaaS navigation around tabs like tasks, outputs, activity, and settings as the main mental model.

Do not polish those directions. Do not treat their screenshots as targets.

## Reading Order

1. `00-index-and-reading-order.md` - this boundary and read order.
2. `01-research-synthesis.md` - research findings and how they changed AMTECH decisions.
3. `02-product-principles.md` - the product laws for an AI employee interface.
4. `03-ai-native-interaction-model.md` - how conversation, initiative, work, and correction operate.
5. `04-information-architecture.md` - first screen, navigation, disclosure, and route model.
6. `05-visual-system.md` - brand, warmth, depth, typography, motion, color, and layout rules.
7. `06-core-surfaces.md` - the concrete screens and states.
8. `07-approvals-proof-and-trust.md` - permission moments, safety, receipts, and refinding.
9. `08-mobile-and-job-site-use.md` - mobile-first behavior for contractors and service owners.
10. `09-implementation-translation.md` - how to translate this into current code/contracts.
11. `10-acceptance-and-rejection-criteria.md` - pass/fail gates for future implementation.

## Source Contracts To Preserve

Use the existing backend/data scaffolding. Do not invent a parallel UI model unless implementation
proves a concrete field gap:

- `ResourcePayload` - current web read model.
- `WorkResource` / `WorkAction` - owner-safe review/action resource.
- `SurfaceEnvelope` - surface-agnostic materialization wrapper.
- `ConnectionSurface` - connected-account capability surface.
- `CapabilityGraphNode` - ability/readiness graph.
- `ResurfaceItem` - attention/resurfacing item.
- `WorkEventDescriptor` - typed move/event grammar.
- signed review and artifact link safety.
- exact approval gates for customer sends, money, publishing, protected sharing, and durable external writes.
- existing web/manager route and API shape unless a real field gap is proven.

## Design North Star

The first screen is not "the dashboard." It is **Avery at work**:

- a warm, centered way to talk to Avery;
- a small permission area when Avery needs the owner's say;
- a quiet line of business awareness;
- a proof trail that stays available without becoming the main interface.

The interface should feel closer to a trusted employee at the kitchen table than to a software console.

## Implementation Status

The owner web route and signed mobile Review have now been source-wired against this packet. The built
shape is Avery-first Home / Talk / Proof / Connected, with Tell Avery, inline Needs your say, quiet
Watching, Recent proof, and a shared exact review surface. Screenshots and verification commands live in
[`README.md`](README.md).

This implementation status does not upgrade any live provider/runtime gate. It proves only local fixture
UI behavior and source compatibility with the existing contracts.

## Owner Vocabulary Rules

Owner UI must not expose implementation vocabulary:

- Do not show: MCP, tool call, payload, webhook, run, API, schema, bearer token, stack trace, provider event,
  materialization, cursor, envelope, descriptor, runtime, token, RLS.
- Say instead: connected account, ability, work, draft, proof, receipt, waiting on you, needs a connection,
  could not reach, sent, approved, scheduled, file, record, check.

Admin/operator UI may expose diagnostics only behind role, support reason, audit, and redaction.
