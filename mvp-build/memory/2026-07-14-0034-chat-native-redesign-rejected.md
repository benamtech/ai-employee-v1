# Chat-native redesign rejected

Date: 2026-07-14 00:34  
Status: rejected design direction  
Scope: Owner UI redesign feedback and next-session reset

## What changed

The second-pass chat-native agent desktop implementation was rejected by the founder after visual review.

The rejected implementation is the current dirty source state around:

- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `apps/web/app/agent/[employeeId]/fixtures.ts`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/review/page.tsx`
- `infra/scripts/ui/fixture-browser.mjs`
- `tests/unit/work-surface-model.test.ts`
- `memory/2026-07-14-2359-chat-native-agent-desktop-redesign.md`

It preserved backend contracts and gates, but failed as product design.

## Founder feedback

The design is not acceptable. Specific critiques:

- Too busy.
- Too many badges and status pills.
- Landing-page style hero text is disliked.
- Too many columns visible at once.
- Does not follow modern UI conventions.
- No meaningful brand expression.
- Overuses IBM Plex Mono and makes the product feel harsh/operational.
- Does not feel LLM-first despite being described that way.
- Looks like ugly SaaS rather than a new category of software.
- Does not appear to apply the UX research or the intended product insight.
- Needs to be far simpler, more inspirational, and more behavior-shaping.
- Desired visual reference: simpler, next-generation, with some influence from Mac OS X Aqua circa 2003-2006, not literal skeuomorphic cloning.

The founder still wants the same backend/data relationships/scaffolding preserved, but wants the visible product and design docs rebuilt from first principles again.

## Why

The core failure is that the implementation tried to prove too many concepts at once on one screen: chat, stream rail, metrics, badges, proof, canvas, modes, and status labels. That made the product feel like a dense operator dashboard instead of a calm, powerful, AI-native interface.

The next design pass must start from human behavior and AI interaction research, not from rearranging current components. The product should feel like a new kind of software where an LLM is the primary interface to business capability, but the user is not overwhelmed by every internal state at once.

## Current status

- Current source remains `source-wired` and technically green, but the design direction is rejected.
- Do not continue polishing the current chat-native desktop shell.
- Do not treat the current screenshots as design targets.
- Backend contracts, approval gates, signed links, read models, fixtures scaffold, and tests remain useful constraints.
- The next step should be docs/research/design, not immediate implementation.

## Files / seams to preserve

Preserve these source contracts and relationships:

- `ResourcePayload`
- `WorkResource`
- `WorkAction`
- `SurfaceEnvelope`
- `ConnectionSurface`
- `CapabilityGraphNode`
- `ResurfaceItem`
- `WorkEventDescriptor`
- signed review and artifact link safety rules
- approval gates for customer-facing sends, money movement, publishing, protected sharing, and durable external writes

Reuse the existing Next app routes and Manager/Web API scaffolding unless a concrete field gap is proven.

## Carry-forward / next

The next session should write a totally new design-doc packet before coding. It should:

- deeply research modern human-computer interaction, behavior change, AI-native UX, conversational interfaces, mixed-initiative systems, calm technology, and next-generation personal software from roughly the last five years;
- study older inspiration such as Mac OS X Aqua for warmth, affordance, delight, depth, and simplicity without copying it literally;
- decide a new UX concept that is simpler than both prior passes;
- create a new design system with brand, color, typography, motion/depth, interaction, information architecture, and mobile behavior;
- explicitly document what not to carry forward from the rejected UI;
- write implementation translation only after the design direction is coherent.

## Verification

No new code verification was run for this handoff. This is a design-failure memory note and next-session orientation artifact.
