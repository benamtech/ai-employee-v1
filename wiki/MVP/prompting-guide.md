# AMTECH AI Internal Prompting & Planning Guide

Status: complete

## Purpose

This is the operating guide for prompting agentic LLMs on the AMTECH AI Employee MVP. It is optimized for the models AMTECH currently uses most: **GPT-5.5** for planning, synthesis, prompt design, and cross-document reasoning, and **Claude Opus 4.8** for heavy implementation work when long-horizon coding, large-context file work, or autonomous debugging is the better fit.

The guide is deliberately model-aware but not model-dependent. Future agents should combine current provider guidance with AMTECH's local truth: the root `identity.md`, `CODEGRAPH.md`, `wiki/README.md`, the AI Employee product docs, the current reconciled plan under `wiki/MVP/build-plan-current/`, and the original mechanics packet under `wiki/MVP/old-build-plan/`.

Primary local sources:

- [`../../identity.md`](../../identity.md)
- [`../../CODEGRAPH.md`](../../CODEGRAPH.md)
- [`../README.md`](../README.md)
- [`build-plan-current/README.md`](build-plan-current/README.md)
- [`old-build-plan/README.md`](old-build-plan/README.md)
- [`implementation-plan-prompt-handoff.md`](implementation-plan-prompt-handoff.md)

## Model Routing

Use the strongest available frontier model for work that can change the product architecture, implementation plan, or codebase.

| Work type | Default model | Reasoning setting | Notes |
|---|---|---|---|
| Product/architecture planning | GPT-5.5 | high / deep reasoning | Best default for Plan Mode, tradeoff analysis, prompt generation, source synthesis, and wiki/codegraph updates. |
| Prompt-writing for other agents | GPT-5.5 | high / deep reasoning | Ask for a copy-ready prompt plus pass/fail criteria, not hidden chain-of-thought. |
| Heavy implementation | Claude Opus 4.8 | `xhigh` or at least `high`; adaptive thinking for hard tasks | Use for broad multi-file coding, long debugging runs, frontend buildouts, and implementation work that benefits from long-context autonomy. |
| Narrow edits and doc maintenance | Either | normal/high depending on risk | Still read files first and validate manifests/counts when structure changes. |
| Cheap/simple mechanical work | Lower tier only if no product risk | low/normal | Never use a low-tier model for architecture, provider integration decisions, security boundaries, or money-moving flows. |

AMTECH's current model floor remains the one in [`../principle-agent-leverage.md`](../principle-agent-leverage.md): GLM-5.2 / Opus 4.8 / GPT-5.5 class for real agent work, with the founder reserved for trust, taste, demos, and money gates.

## Provider Guidance Folded Into AMTECH Practice

OpenAI's current prompting guidance for GPT-5.5 emphasizes adapting prompts to product surface, tools, evals, and UX goals; using the smallest prompt that passes evals; and treating high-effort settings as appropriate for long, agentic, reasoning-heavy tasks. It also distinguishes reasoning models, which can handle higher-level goals, from GPT-style models that benefit from more explicit instructions.

Anthropic's Opus 4.8 guidance emphasizes `xhigh` effort for coding and agentic use cases, at least `high` effort for intelligence-sensitive work, adaptive thinking when useful, explicit tool-use instructions when the model should inspect or act, clear scope because the model follows instructions literally, and concrete prompting for subagent use and frontend defaults.

AMTECH rule: do not cargo-cult provider examples. Use these as levers, then validate against AMTECH's acceptance criteria, tests, and source memory.

## Standard Plan Mode Workflow

Use Plan Mode for any major implementation plan, phase plan, architecture decision, provider integration, or prompt that will direct another agent.

1. Read `identity.md` first and adopt the AMTECH operating identity.
2. Read `CODEGRAPH.md` for canonical facts and structural rules.
3. Read `wiki/README.md` and the relevant product/MVP docs.
4. Inspect the local repo enough to ground implementation reality.
5. Produce a decision-complete plan, not a vague roadmap.
6. Include pass/fail criteria for every capability in scope.
7. Name future-phase integration seams.
8. Include tests, security boundaries, observability, and wiki/codegraph update points.
9. Ask only high-impact questions after reading discoverable context.

Recommended implementation-plan structure:

```markdown
# Implementation Plan: [Phase X + Y]

## 1. Source Memory & Grounding
## 2. Phase Scope & Boundaries
## 3. Architecture Slice & Key Decisions
## 4. Execution Sequence
## 5. Pass/Fail Acceptance Criteria
## 6. Integration Seams for Later Phases
## 7. Test Strategy
## 8. Security, Ops & Observability
## 9. Risks, Assumptions & Mitigations
## 10. Wiki / Codegraph / Memory Updates
## 11. Carry-Forward Notes
## 12. High-Impact Clarifying Questions
```

## AMTECH MVP Non-Negotiables

Every prompt and plan must preserve the whole-product MVP bar:

- Signup/claim/SMS onboarding must create or claim a real employee.
- The employee must be reachable over SMS and web.
- The walkthrough-to-estimate flow must create a real estimate artifact and PDF.
- Output links must resolve to actual artifacts, not placeholder UI.
- Gmail send must be approved by the owner and use a real provider path.
- Gmail customer replies must arrive as real provider events, not manual simulations.
- Stripe Connect test mode is acceptable for MVP, but invoice/payment links and webhooks must be real provider objects/events.
- Internal reminders must be created from the job commitment.
- No payment gate before employee creation.
- No external send, invoice, money movement, or customer-visible action without approval.
- Raw Hermes dashboards are not the customer UI.

## Prompt Pattern For Phase Planning

Use this shape for agents writing implementation plans:

```xml
<role>
You are a senior systems architect and implementation planner for the AMTECH AI Employee MVP.
</role>

<model_context>
Use GPT-5.5-class high/deep reasoning for planning. If this plan is later handed to Claude Opus 4.8 for heavy implementation, assume xhigh/high effort and adaptive thinking are available.
</model_context>

<source_order>
Read identity.md, CODEGRAPH.md, wiki/README.md, wiki/MVP/prompting-guide.md, the relevant product docs, and wiki/MVP/build-plan-current/ before asking questions. Use wiki/MVP/old-build-plan/ only for original mechanics and research addenda.
</source_order>

<constraints>
- Plan only; do not implement.
- Treat repo/wiki facts as discoverable truth.
- Preserve the whole-product MVP bar even when planning a narrow phase.
- Include approval gates, provider proof, security boundaries, observability, and wiki/codegraph update points.
- Do not request hidden chain-of-thought in the final output; provide concise rationale, source memory, and self-checks.
</constraints>

<output_format>
Return a decision-complete implementation plan using the AMTECH plan structure.
</output_format>
```

## Prompt Pattern For Heavy Implementation

Use this shape when handing an approved phase plan to an implementation agent:

```xml
<role>
You are a senior implementation agent for AMTECH AI Employee.
</role>

<model_context>
Use Claude Opus 4.8-class high/xhigh effort for multi-file implementation and debugging. Use tools to inspect files before editing. Parallelize independent reads and tests when available.
</model_context>

<instructions>
Implement only the approved phase scope. Preserve later-phase seams. Do not introduce simulated provider success paths as MVP acceptance.
</instructions>

<validation>
Run the tests/checks named in the plan. Report anything not run. Update wiki/codegraph/memory files required by the plan.
</validation>
```

## Common Failure Modes

- Planning from memory instead of reading files.
- Producing a roadmap that leaves schemas, routes, tools, or ownership boundaries undecided.
- Treating provider simulation as acceptance for Gmail replies, Stripe invoices, or Stripe webhooks.
- Letting a Phase 0/1 implementation block later Gmail thread ownership, Stripe account ownership, artifact authorization, or event replay.
- Over-prompting with generic chain-of-thought scaffolding instead of setting the right model effort and asking for verifiable outputs.
- Using aggressive tool/subagent language where targeted instructions would do.
- Forgetting that AMTECH is person-minimal, not person-absent: the owner approves external actions and money movement.

## Quick Checklist

- [ ] Read `identity.md`.
- [ ] Read `CODEGRAPH.md`.
- [ ] Read `wiki/MVP/prompting-guide.md`.
- [ ] Read the relevant build-plan docs.
- [ ] Used GPT-5.5 high/deep reasoning for planning or Opus 4.8 high/xhigh for heavy implementation.
- [ ] Produced pass/fail criteria for every capability.
- [ ] Preserved real provider paths and approval gates.
- [ ] Named tests, observability, security boundaries, and future-phase seams.
- [ ] Named wiki/codegraph/memory updates.

This guide is living documentation. Update it when AMTECH's default models, provider guidance, or observed agent behavior changes.
