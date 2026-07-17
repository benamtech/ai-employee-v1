# 11 — Hyper-Distributed Content, Generative UI, and Design Collaboration

Status: design/content operating model
Updated: 2026-07-17

## Definition

**Hyper-distributed content** means that company knowledge is stored once as typed, evidence-bound objects and compiled into many useful online forms without creating uncontrolled copies.

The same approved source may produce:

- canonical web pages;
- context-resolved landing modules;
- paid-search landing pages and ad-message matrices;
- email and lifecycle sequences;
- social and video briefs;
- sales enablement and proposals;
- structured data and entity feeds;
- documentation and onboarding;
- AI-agent answers and tool descriptions;
- MCP/ChatGPT app resources;
- internal QA and experiment fixtures.

Distribution is broad. Truth, provenance, and design policy remain centralized.

## Content as a typed program

### Source objects

```text
entity
claim
proof
owner question
use case
workflow
objection
offer
price
limitation
approval gate
CTA
visual asset
interaction pattern
```

Each object declares:

- stable ID and version;
- owner and review date;
- evidence level and source;
- permitted audiences/routes/channels;
- prohibited claims or combinations;
- dependencies and replacement rules;
- localization policy;
- design and interaction affordances.

### Intermediate representation

The compiler converts source objects into an experience AST/IR.

```text
Route
  -> Narrative
      -> Module
          -> ClaimRef
          -> EvidenceRef
          -> VisualTreatmentRef
          -> InteractionRef
          -> CTARef
          -> Eligibility
          -> Fallback
```

This IR enables static validation before deployment:

- claim lacks evidence;
- price conflicts across routes;
- CTA points to an invalid path;
- design variant violates contrast or layout rules;
- generated page duplicates another route;
- channel output exceeds its evidence or length policy;
- personalization rule relies on a prohibited feature.

## Compiler outputs

One versioned build can emit:

```text
canonical HTML/RSC/MDX
variant manifests
component props
content and entity graph
HRR/facet vectors
eligibility bitsets
metadata and JSON-LD
internal-link plans
sitemaps and feeds
ad-message matrices
email/social/sales payloads
agent/MCP resources
experiment fixtures
checksums and provenance reports
```

Generated artifacts carry source versions and are not hand-edited.

## Graphic designer collaboration model

The framework does not replace the graphic designer. It makes the designer’s judgment executable and scalable.

### The designer defines

- brand principles and visual tension;
- typography, scale, rhythm, composition, and whitespace;
- semantic color roles;
- image/art direction;
- component families and expressive ranges;
- layout archetypes;
- motion behavior;
- emotional tone;
- permitted and forbidden combinations;
- when a page must remain deliberately static.

### The compiler defines

- typed design tokens;
- component prop schemas;
- responsive and accessibility constraints;
- reserved dimensions and no-flicker rules;
- evidence/provenance rendering;
- eligibility by route, audience, device, and proof level;
- deterministic selection and fallback;
- preview matrices and regression fixtures;
- performance budgets;
- experiment IDs and telemetry.

### Shared artifact

Each component family should have a machine-readable contract resembling:

```ts
interface DesignVariant {
  id: string;
  componentType: string;
  intentFacets: string[];
  density: "quiet" | "standard" | "technical";
  proofDepth: "concept" | "demo" | "source_wired" | "live";
  allowedBackgrounds: string[];
  allowedMediaRoles: string[];
  motionPolicy: "none" | "subtle";
  minViewportWidth?: number;
  reducedMotionFallback: string;
  accessibilityChecks: string[];
  performanceCostClass: "zero" | "low" | "bounded";
}
```

The resolver selects within this grammar. It does not generate a new brand per request.

## AMTECH visual and narrative grammar

The canonical site remains light, operational, direct, and evidence-aware.

Core visual roles:

- white/canvas for primary surfaces;
- ink for high-contrast text;
- AMTECH red for brand and primary action;
- blue for system/information;
- green for verified/success;
- restrained glass, gradients, borders, shadow, and motion;
- no generic purple-AI spectacle, fake dashboards, or ornamental complexity.

Core narrative transformation:

```text
owner situation
-> work performed
-> concrete result
-> approval/control
-> proof
-> next action
```

A technical slice may show architecture, models, runtime boundaries, or benchmark evidence. A low-commitment slice may show one plain-text task and immediate useful work. Both preserve the same offer and truth.

## Agentic interaction research synthesis

A useful AI-native interface should not force every task into a linear chat transcript.

Generative-interface research and current AI application frameworks support structured, interactive components when the task is information-dense, multi-step, or action-oriented. The framework therefore treats conversation as one control surface and uses task-specific UI for:

- choosing or refining a goal;
- reviewing generated work;
- providing missing structured information;
- approving a consequential action;
- comparing alternatives;
- inspecting proof and provenance;
- monitoring progress or recovery;
- invoking a bounded tool.

Every agentic component exposes:

```text
goal
state
inputs used
work/action
owner decision if required
result/proof
next step
error/recovery
```

The interface should progressively disclose complexity. A user can begin with plain language and reveal technical controls only when useful.

## Generative UI boundary

Three levels are permitted:

### Level 0 — static authored UI

Canonical pages and critical conversion/approval paths. No runtime generation.

### Level 1 — finite materialized UI

Resolver chooses approved component, layout, order, proof depth, and interaction variant IDs.

### Level 2 — schema-constrained generated UI

A model may fill a typed interface schema or choose from registered components. Output is validated, sanitized, evidence-bounded, and reversible.

### Prohibited default — arbitrary generated DOM/copy

No unconstrained persuasion, pricing, claim, evidence, URL, script, or component generation at the edge.

## Designing for broad user diversity

The framework cannot know every possible user. It can support a wide range through layered design:

1. **Universal baseline:** accessible, fast, complete, clear, no consent required.
2. **Explicit adaptation:** user selects role, goal, industry, proof depth, or preferred interaction.
3. **Low-risk context adaptation:** route, campaign, locale, device class, and coarse request context change ordering or examples.
4. **Session learning:** consented interaction adjusts within a short-lived session.
5. **Technical depth:** architecture, APIs, models, benchmarks, and self-hosting appear for power users without burdening everyone else.

No layer silently guesses protected, financial, family, pet, or lifestyle traits.

## Landing-page family model

A landing-page family shares one canonical offer and evidence graph while varying bounded axes:

- audience/role;
- problem and job stage;
- proof depth;
- technical commitment;
- industry examples;
- CTA mode;
- module order;
- density and visual treatment;
- interactive versus static explanation.

Example AMTECH family:

```text
canonical offer: Managed AI Employee from $400

page A: contractor owner, evening estimate/follow-up pain, low technical burden
page B: software founder, multi-agent operating system, technical proof and controls
page C: bookkeeper, document intake and client follow-up, trust/compliance proof
page D: agency/operator, managed multi-client workforce and campaign operations
```

The pages are distinct only when they answer meaningfully different questions. They may share source objects and components without becoming thin duplicate SEO pages.

## Multi-channel orchestration

The compiler should generate a channel plan rather than blindly copying page text.

For each channel, define:

- objective and audience;
- allowed claims and evidence;
- format and length;
- CTA and destination;
- visual/media requirements;
- experiment ID;
- canonical source references;
- expiry/review date.

A paid-search ad and landing page must share the same offer and intent. An AI-agent answer may summarize a page but must retain evidence and limitations. A social post may tease a result but cannot upgrade a source-wired demonstration into live proof.

## Research references informing this model

- Adaptive hypermedia research shows that presentation can be adapted to an information-seeking task and can reduce user actions, but also demonstrates that system choices influence users and therefore require evaluation and control.
- W3C WAI-Adapt frames personalization as user-controlled adaptation to needs and preferences, reinforcing the explicit-control and accessibility layers.
- Generative-interface research evaluates structured, task-specific interfaces as an alternative to chat-only interaction.
- Current Vercel AI SDK and MCP Apps patterns demonstrate type-safe structured output, tool-driven UI, approvals, streaming components, and sandboxed interactive resources.
- Current OpenAI Apps SDK direction likewise treats AI applications as combined logic and interface rather than text responses alone.

These sources support the interaction and implementation direction. They do not validate AMTECH conversion lift or the HRR resolver.

## Definition of success

The content system succeeds when a company can change one approved fact, offer, component rule, or proof record and reliably regenerate every affected experience and channel artifact, while the A/Z suite can explain which bounded presentation works better and why.
