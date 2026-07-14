# Phase CE-2 — Compression policy + hooks + turn concurrency

Status: source-wired (2026-07-12) · live Hermes plugin/compression proof `pending`

> Implemented per the [CE-2/CE-3 production implementation plan](phase-ce-02-03-production-implementation-plan.md) §3
> (the authoritative spec). This sketch is retained as the original design rationale. What shipped:
> `{{COMPRESSION_CONFIG}}` (safety net; CE-3 rotates first), a deterministic Hermes **plugin**
> `packages/agent-template/plugins/amtech-hygiene` for `transform_tool_result`/`transform_terminal_output`
> (secret redaction always; size-trim only pathological bulk — never normal results), a data-driven
> `routeForEventType` policy table, and the `delegation:` block enabling `delegate_task` for in-turn
> context isolation.

> **Implementation lives in the production plan:**
> [`phase-ce-02-03-production-implementation-plan.md`](phase-ce-02-03-production-implementation-plan.md).
> That doc is the authoritative build plan (source-grounded audit, model-agnostic compression policy,
> deterministic hygiene transforms, routing table, background-work seam, files/gates/rollout). This file is
> the earlier design sketch; where they differ, the production plan wins.

Goal: stop the default mid-session compaction, keep noisy tool output out of context, wire the AMTECH hook
plumbing (which CE-1's primer rides), and move background/trivial work off the owner turn so a Hermes-class
agent is never held up by trivial tasks.

## Why

Every employee currently renders no `compression:` block, so it runs Hermes's default auto-compaction at
50% of the context window — exactly what we don't want in production (compaction is lossy; we prefer
rotation, CE-3). There are no hooks at all, so we can't inject the CE-1 primer, add guardrails, or trim
oversized tool output. And all work funnels through one serialized per-employee turn lane with no use of
Hermes-native background delegation/Jobs.

## Scope

### 1. Render a per-profile `compression:` block

New `{{COMPRESSION_CONFIG}}` token in `config.yaml`. `enabled: true` (safety net — never disable, which
would grow context unbounded to the hard limit and fail), tuned `threshold` well above the 0.50 default
(computed per model context length so we rarely reach it before CE-3 rotates us), a sensible
`protect_last_n` (protect the working tail), and a `codex_app_server_auto` policy. Defaults keyed by
profile package + model via a small model→context-length map in `packages/shared/src`.

### 2. Wire the AMTECH `hooks:` plumbing + first shell hooks

- Add the `hooks:` block to the rendered `config.yaml` and ship hook scripts under
  `packages/agent-template/hooks/`. Enable headless consent (`hooks_auto_accept: true` /
  `HERMES_ACCEPT_HOOKS=1`) so provisioned employees don't block on an interactive allowlist prompt.
- **`pre_llm_call`** (`pre-session-context`): the transport for CE-1's `buildAgentContext` primer
  (self-gated to once per session). Returns `{"context": "..."}` appended to the user message.
- **`transform_tool_result`** + **`transform_terminal_output`**: trim/summarize oversized tool dumps
  (large QBO queries/reports, web fetches, terminal output) before they enter context, preserving
  owner-relevant fields. This is Anthropic's "tool result clearing" — the lightest, safest compaction:
  once a tool has executed, don't carry its raw bulk.
- Optional **`pre_tool_call`** guardrail (defense-in-depth only): the real money/customer-facing boundary
  stays the Manager approval gate + verified webhooks; a hook must never be treated as the boundary.

### 3. Turn concurrency: keep trivial/background work off the owner turn

- Confirm trivial events stay `deliver_only` (no wake) in `events/ingress.ts` `classifyRoute`; document
  the rule that only judgment-requiring events wake the employee.
- Establish the seam for **background work via subagent delegation** (`delegate_task`; async/background
  variant when the running Hermes advertises it — gate on `/v1/capabilities`) and/or **Hermes Jobs**, so
  long/uncorrelated work returns a condensed summary as a new turn instead of occupying the owner-facing
  serialized lane. (Full delegation/Jobs orchestration can grow into CE-4 if needed; this phase lands the
  routing decision + seam, not a large build.)

## Files / seams

- `apps/manager/src/lib/profile-renderer.ts` (compression + hooks tokens), `packages/agent-template/config.yaml`,
  `packages/agent-template/hooks/*`, `packages/shared/src` (model→context-length map),
  `apps/manager/src/events/ingress.ts` (routing docs/guards), `apps/manager/src/lib/hermes-client.ts`
  (capability gate for background delegation).

## Acceptance gates

- Rendered `compression:` block is correct per model (threshold derived from context length; enabled true;
  protect_last_n sane).
- `hooks:` block renders; headless consent auto-accepted; `pre_llm_call` primer fires once per session.
- `transform_tool_result`/`transform_terminal_output` deterministically trim an oversized fixture while
  preserving owner-relevant fields.
- A trivial event proves `deliver_only` (no wake); an owner turn is still ordered.
- Local gates green. Live hook/compression behavior stays `pending`.

## Tests

- Compression render per model; disabling guard (never `enabled: false`).
- Hook config render + headless consent; transform hook trims oversized fixture; `pre_tool_call` blocks a
  fixture.
- Ingress routing: trivial event no-wake; judgment event wakes.
- Capability gate: background delegation only attempted when advertised.

## Carry-forward

- CE-3 sets its rotation threshold **below** this phase's compression threshold, so we rotate before
  Hermes ever compacts.
- CE-4 may promote the delegation/Jobs seam into a full background-work orchestration and per-operator-mode
  routing.
