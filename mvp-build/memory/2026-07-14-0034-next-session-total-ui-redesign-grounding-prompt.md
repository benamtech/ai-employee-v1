# Next-session grounding prompt: total UI redesign docs reset

Use this prompt in a fresh session.

---

You are working in `/home/georgej/AMTECH/GTM-RESEARCH`, ideally in worktree `worktrees/ui-redesign-docs-packet` on branch `agent/ui-redesign-docs-packet`.

Start by reading:

1. `identity.md`
2. `CODEGRAPH.md`
3. `mvp-build/CODEGRAPH.md`
4. `mvp-build/CLAUDE.md`
5. `mvp-build/AGENTS.md`
6. `mvp-build/memory/MEMORY.md`
7. `mvp-build/memory/2026-07-14-0034-chat-native-redesign-rejected.md`
8. `mvp-build/memory/2026-07-14-2359-chat-native-agent-desktop-redesign.md`
9. The existing `mvp-build/ui-redesign/` packet only as historical context, not as law.

## Mission

Write a totally new set of UI/UX design docs for the MVP. Do not implement code in this session unless explicitly asked later. The goal is a fresh design direction from first principles.

The previous redesigns are rejected as product design. They were too busy, too badge-heavy, too column-heavy, too SaaS-like, too visually harsh, too operational, too dependent on IBM Plex Mono, too text/hero-driven, and not meaningfully LLM-first. Do not polish them. Do not treat their screenshots as targets.

Still preserve the backend/data/product scaffolding:

- `ResourcePayload`
- `WorkResource` / `WorkAction`
- `SurfaceEnvelope`
- `ConnectionSurface`
- `CapabilityGraphNode`
- `ResurfaceItem`
- `WorkEventDescriptor`
- signed review / artifact safety
- exact approval gates for customer sends, money, publishing, protected sharing, and durable external writes
- existing web/manager route and API shape unless a real field gap is proven

## Product Direction

This is a new kind of software: an AI employee where the LLM is the primary interface between the business owner and the software/computer. It should not feel like a normal dashboard, admin console, CRM, inbox, task manager, or SaaS tab layout.

The owner should instantly understand:

- Avery can be talked to like a person.
- Avery can independently watch and prepare work across the business.
- Avery stops for exact permission at the right moments.
- Proof is saved without making the owner manage a ledger.
- The software is powerful but calm, simple, and emotionally trustworthy.

The founder wants something much simpler and more inspiring. Visual inspiration can include Mac OS X Aqua from roughly 2003-2006: depth, softness, translucency, delightful affordances, warmth, clear hierarchy, and obvious interactivity. Do not clone Aqua literally; translate its emotional and interaction lessons into a modern AI-native business product.

## Required Research

Before writing the new docs, do a deep research pass. Use primary or credible sources where possible. Research should cover:

- Human behavior and cognitive load in interface design.
- Behavior change and habit formation in professional tools.
- Trust, control, and transparency in AI systems.
- Mixed-initiative interaction and human-AI collaboration.
- Conversational interfaces and LLM-first workflows from the last five years.
- Calm technology, progressive disclosure, and ambient awareness.
- Modern personal software and AI workspaces.
- Visual design systems that reduce anxiety and increase perceived capability.
- Why early-2000s Aqua-like affordance, dimensionality, and delight worked psychologically, and what parts still apply today.

The docs must show evidence that this research changed the design decisions. Avoid generic UX slogans.

## Deliverables

Create a new design-doc packet, replacing or superseding the current `mvp-build/ui-redesign/` direction. Suggested docs:

1. `00-index-and-reading-order.md`
2. `01-research-synthesis.md`
3. `02-product-principles.md`
4. `03-ai-native-interaction-model.md`
5. `04-information-architecture.md`
6. `05-visual-system.md`
7. `06-core-surfaces.md`
8. `07-approvals-proof-and-trust.md`
9. `08-mobile-and-job-site-use.md`
10. `09-implementation-translation.md`
11. `10-acceptance-and-rejection-criteria.md`

If you choose different names, keep the packet easy for a future implementation agent to read in order.

## Design Constraints

The new design must be:

- radically simpler than the rejected UI;
- LLM-first without becoming a giant chat transcript;
- calm, warm, branded, and emotionally distinctive;
- low column count, with progressive disclosure;
- minimal badges/status pills;
- typography-led but not mono-heavy;
- clear about Avery's independent capability without showing every internal state;
- strong on approvals and proof without making them feel like compliance dashboards;
- usable on mobile first;
- suitable for contractors, bookkeepers, service businesses, and future website/marketing work;
- compatible with generated work surfaces and signed review links.

Avoid:

- generic SaaS dashboard patterns;
- dense operator consoles;
- visible implementation vocabulary;
- three-column overload as the default;
- landing-page hero copy inside the application;
- badge soup;
- excessive IBM Plex Mono;
- red-dominant styling;
- fake AI gradients or purple haze;
- copying Claude, ChatGPT, Aqua, or Hermes literally.

## Expected Outcome

End the session with design docs that an implementation agent can follow without guessing the UX direction. The docs should make hard decisions about:

- what the first screen is;
- where chat lives;
- how Avery's independent work is perceived without clutter;
- how streams of business data appear simply;
- how approvals interrupt without stress;
- how proof is found later;
- how connected accounts communicate capability;
- how mobile behaves;
- what the visual system is;
- what existing UI/code should be discarded.

Do not ask whether to proceed at the end. Produce the docs and a memory handoff summarizing the new design direction and research.
