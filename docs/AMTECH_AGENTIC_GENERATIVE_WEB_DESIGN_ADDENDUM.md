# AMTECH Agentic and Generative Web Design Addendum

Status: canonical design-extension guidance
Updated: 2026-07-17
Authority: extends `AMTECH_WEB_DESIGN_SYSTEM.md`; does not replace it

## Purpose

Define how the AMTECH visual system, public website narrative, adaptive experience compiler, agentic interaction research, and generative UI work together.

The website should feel simple enough for an owner who wants one useful task completed now, while containing enough technical depth for a power user evaluating models, runtime architecture, orchestration, and control.

## Design thesis

AMTECH is not selling access to more AI controls. It is selling software infrastructure that behaves like an employee.

The visual and interaction system should communicate:

```text
plain request
-> work begins
-> useful artifact appears
-> owner decides where required
-> action completes
-> proof remains
```

Complexity may exist underneath. The interface reveals it only when it helps the user understand, decide, trust, or act.

## Canonical visual system

Retain:

- light white/canvas surfaces;
- black/ink typography;
- AMTECH red for brand and primary action;
- blue for system/information;
- green for verified/success;
- strong editorial hierarchy;
- generous space and an 8px rhythm;
- restrained glass, gradient, shadow, border, and motion;
- direct operational copy;
- visible proof and approval state.

Avoid:

- generic purple AI gradients;
- sci-fi spectacle without explanatory value;
- floating dashboards of invented metrics;
- excessive pills and labels;
- decorative agent avatars as a substitute for work;
- hidden state or vague “magic” transitions;
- technical diagrams on the default path when a concrete result communicates better.

## Page architecture

Every primary landing page should answer, in order:

1. What does this employee do for someone like me?
2. What real work can I ask it to do first?
3. What happens without me at the keyboard?
4. What does it ask me to approve?
5. What proof exists?
6. What is free, what is managed, and what does it cost?
7. What happens after I click?

Recommended module grammar:

```text
hero: situation + category + immediate action
first-work demo: request -> work -> result
workflow: event/schedule/request -> employee loop
proof: artifact, timeline, status, source, limitation
control: approvals, credentials, isolation, recovery
fit: role/industry/use-case modules
offer: Start Free / Managed from $400 / Workforce
CTA: Build my AI Employee
```

## Adaptive page axes

The framework may vary only approved axes:

- role or industry;
- job-to-be-done;
- owner versus technical proof depth;
- first-work example;
- module order;
- density;
- CTA mode;
- interaction pattern;
- approved visual treatment;
- coarse locale/device constraints.

It must not vary product truth, price, evidence status, privacy terms, owner-control rules, or legal limitations.

## Graphic designer handoff contract

For each component family, the designer supplies:

- intent and emotional role;
- visual variants;
- token usage;
- responsive behavior;
- content-density range;
- media/art direction;
- motion and reduced-motion fallback;
- component states;
- forbidden combinations;
- screenshot or rendered golden references.

The engineer/compiler supplies:

- typed props;
- eligibility rules;
- evidence and provenance requirements;
- reserved layout dimensions;
- accessibility assertions;
- performance budget;
- fallback component;
- fixture matrix;
- deterministic version ID.

A component is not framework-ready until both sides are complete.

## Agentic interaction patterns

### Work card

Shows:

- request or triggering event;
- current state;
- employee work summary;
- artifact/output;
- source/provenance;
- approval requirement;
- next action;
- retry/recovery state.

### Approval card

Shows:

- exact proposed action;
- affected customer/money/reputation/system;
- important inputs;
- reversible/irreversible status;
- approve, edit, reject;
- expiration and audit record.

### Proof timeline

Shows:

- noticed/requested;
- prepared;
- reviewed;
- acted;
- delivered/failed;
- resulting evidence.

### Progressive technical disclosure

Default view explains outcome and control. A technical reveal may show:

- model/provider selection;
- isolated runtime;
- connector/tool calls;
- retries and idempotency;
- event/schedule source;
- latency/cost;
- evidence level;
- architecture diagram.

### Generative interface

Use a generated or streamed component when a static page or chat response would make a task slower or less legible. Output must conform to registered schemas and components.

Good candidates:

- structured onboarding;
- workflow configuration;
- comparison;
- estimate/proposal review;
- integration setup;
- experiment inspection;
- proof and incident investigation.

Bad candidates:

- changing prices or claims;
- arbitrary promotional layouts;
- irreversible approval interfaces;
- unreviewed HTML or scripts;
- content that should be canonical and indexable.

## A/Z design system

A/Z experiments may compare:

- module order;
- proof depth;
- interaction versus static explanation;
- concrete example;
- density;
- CTA framing;
- visual treatment within approved grammar.

The design system must expose experiment IDs and preserve screenshot regression fixtures. Every arm shares identical product facts, evidence ceilings, accessibility requirements, and owner-control rules.

## Page-family examples

### Contractor owner

Lead with estimates, follow-up, evening administration, and one plain-text first task. Use concrete work cards and minimal architecture.

### Bookkeeper or professional office

Lead with document intake, client chasing, preparation, deadlines, confidentiality, and review gates.

### Software founder or power user

Lead with infrastructure-level capability, model portability, durable workflows, code/research/deployment loops, observable actions, and optional technical controls. Preserve no-key managed activation as a differentiator.

### Agency or multi-client operator

Lead with governed repeatability, client separation, campaign/content generation, approvals, proof, and managed operations.

## Accessibility and performance

- Complete initial HTML.
- Full keyboard operation.
- Semantic headings and landmarks.
- Visible labels and focus.
- Reflow at 400% zoom.
- Reduced-motion support.
- No critical information encoded by color alone.
- Reserved dimensions for materialized modules.
- No contradictory-content flash.
- No heavy animation or 3D on the critical path.
- Technical visualizations degrade to text/tables.

## Research grounding

This addendum is consistent with:

- adaptive-hypermedia research that tests whether task-aware presentation reduces actions and information overload;
- W3C WAI-Adapt’s user-centered adaptation direction;
- generative-interface research emphasizing structured task-specific interfaces rather than chat-only interaction;
- current AI SDK/MCP Apps patterns for tool-driven interactive UI, approvals, typed output, and sandboxed resources;
- current AMTECH work-surface research centered on work, proof, approvals, and connected capabilities.

These directions require AMTECH-specific usability, accessibility, conversion, and trust validation. They are not automatic proof of quality.

## Enforcement

Every new AMTECH public page or generated page family must reference:

- its canonical offer and evidence sources;
- its component/design contracts;
- its variant axes;
- its baseline and fallback;
- its accessibility/performance checks;
- its A/Z role if any;
- validation not run.
