# Phase 3 Planning-Session Handoff

Status: active · Date: 2026-06-29

Purpose: paste the prompt below into a fresh session to **write the Phase 3 implementation plan** (Plan Mode). Companion to the implementation-session handoff at [`phase-3-implementation-session-handoff.md`](phase-3-implementation-session-handoff.md) — this one produces the *plan*; that one executes it.

## Copy-Ready Prompt

```text
You are the lead manager of AMTECH AI. First read identity.md and embody it, then CODEGRAPH.md, wiki/MVP/prompting-guide.md, wiki/MVP/phase-3-generative-ui-reframe.md, and wiki/MVP/phase-3-implementation-session-handoff.md.

Task: write the Phase 3 implementation plan (use Plan Mode; one phase per plan). Scope:

1. Tie up all Phase 0-2 loose ends (per wiki/MVP/implementation-records/2026-06-29-phase-0-2-record.md): executable RLS cross-account denial test, Phase 2 artifact/approval state-transition tests, executable golden path, and honest pending-env proof notes.
2. Phase 3 (Gmail + event mesh) in full: OAuth + token custody by reference, connector test, approved MIME send with PDF/signed-link, users.watch/Pub-Sub (authenticated JWT) + history.list sync + dedupe, reply normalization -> employee notify/question over SMS.
3. Phase 4 (Stripe) groundwork + wiring only where it makes real seams without faking acceptance (contracts, Stripe-Signature verify + test-mode guardrails, idempotency, approval-gated invoice, links to estimate/customer/account).

Governing research (read before designing):
- wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md - tool/efficiency mechanics (call-shape selection, wake-the-big-model triage, MCP resources-vs-tools, idempotency, the event->meaning pipeline).
- wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md - the interaction vision; build the Hermes->Work translation adapter in Phase 3 (first time a real external event must become human-meaningful, owner-facing conversation).
- wiki/MVP/phase-3-generative-ui-reframe.md - implementation reframe: provider/tool events become typed work-event descriptors and deliverable-driven UI; generative UI is conformance-first, using pre-approved components and tests rather than arbitrary model-generated markup.

Non-negotiables: real provider proof (no injected/mocked acceptance); approval gate before any send/money; secrets by reference (never log raw tokens/bodies); owner talks only to the employee (Manager is backend); keep onboarding model OpenAI-compatible. Do not rewrite the original 00-13 build-plan packet; put implementation facts in records + CODEGRAPH. Build home: mvp-build/. Run typecheck/test:unit/build/lint after meaningful changes; report pending provider proof with exact env vars.

Use GPT-5.5-class high/deep reasoning for the plan; assume Claude Opus 4.8 high/xhigh for the later implementation handoff. Produce a decision-complete plan with pass/fail criteria per capability, named later-phase seams, and wiki/codegraph update points.
```
