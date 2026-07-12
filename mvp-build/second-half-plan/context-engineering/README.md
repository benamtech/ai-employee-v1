# AMTECH Context-Engineering Workstream

Status: active (planning) · Date: 2026-07-12

This is the forward plan for **Hermes context engineering** — the layer that makes each AMTECH
employee a real *business brain* that is **as capable as Hermes by default**, knows the state of the
business the moment it wakes, and never degrades work quality by mid-session compaction. It extends the
[second-half plan](../README.md); it does not replace it. We are mid-stream on production
networking/DNS/infra — this workstream is authored now and implemented after/alongside that, and does
**not** reopen the infra slice except to read dependencies.

Companion research (Hermes surfaces): [surface-research-hermes-gui-and-materialization](../surface-research-hermes-gui-and-materialization.md).
Substrate ground truth: [`../../docs/hermes-agent-authoritative-record.md`](../../docs/hermes-agent-authoritative-record.md).

## What "the business brain" actually is

The brain is **not** a facts table or the `get_business_brain` stub. The brain **is the whole integrated
employee system** — Hermes + the multi-connector event ingress (a stream of events from none/any/many
connectors: Stripe, email, Jobber, ServiceTitan, Housecall Pro, QuickBooks, any MCP tool) + turns + the
Manager + everything captured at onboarding + everything learned over time. Most of that state is already
assembled in [`apps/manager/src/lib/employee-stream.ts`](../../apps/manager/src/lib/employee-stream.ts)
`buildEmployeeSnapshot` and materialized into capabilities / `ConnectionSurface` / `ResurfaceItem`.

The context-engineering job: **curate a compact, reference-shaped view of that living system for the
agent — efficiently, session-scoped, without stuffing or compacting.**

## Design doctrine (do not violate)

1. **References over payloads.** Prime with compact *pointers* to where knowledge lives (native memory,
   MCP `resources/read`, brain files, open work) — not pasted content. The agent pulls detail on demand.
   Anthropic's own guidance: keep "the smallest possible set of high-signal tokens"; maintain
   "lightweight identifiers ... and use these references to dynamically load data into context at runtime."
2. **Session-scoped, not per-turn.** Prime once per session (and on rotation). Never re-inject a digest
   every turn — that looks fine in week one and rots by month three ("context rot": recall degrades as
   tokens grow, *before* the hard limit).
3. **Rotate, don't compact, in production.** Start a fresh session with an ultra-compact handoff *before*
   Hermes's compression threshold. Keep `compression.enabled: true` tuned high as a safety net so context
   never grows unbounded, but we rarely reach it. (Anthropic, Amp, and Hermes issue #499 all favor
   handoff-oriented context transfer over lossy in-place compaction.)
4. **As powerful as Hermes.** The AMTECH layer adds situational awareness + the confirmation gate; it
   never nerfs the agent or restricts its toolset, and it must not let constant trivial turns hold up a
   Hermes-class agent.
5. **AMTECH decides the context; hooks deliver what Manager can't reach.** Priming/carryover is
   Manager-owned. Hooks handle in-loop concerns Manager can't see: tool-output token hygiene, guardrails.

## The key realization: Hermes already has the native brain-for-the-agent

Deep research (2026-07-12) established that Hermes's own prompt-assembly + memory system *is* the
efficient substrate for the agent-side brain. AMTECH should map onto it, not reinvent it:

| Brain need | Hermes-native home | AMTECH action |
|---|---|---|
| Durable curated business facts (pricing, suppliers, standing "way of working") | **`~/.hermes/memories/MEMORY.md`** — ~2200 chars (~800 tokens), auto-injected into the cached system prompt every session; `memory` tool add/replace/remove (no read — it's already injected); adding past the limit errors, which **structurally enforces curation** | Seed from onboarding at provision; wire the employee's learning to it so the brain compounds |
| Owner identity / preferences / communication style | **`~/.hermes/memories/USER.md`** — ~1375 chars (~500 tokens), same injection | Seed owner name/phone/register/standing prefs from onboarding |
| Operating policy | **Project context** (section 9 of the system prompt: `AGENTS.md`) | Already used; keep it the policy home |
| Dynamic session state (connected sources, recent cross-connector events, open approvals/jobs, resurfacing) | **`pre_llm_call`** hook / first-turn — appended to the *current user message*, **not** the cached prefix, so it is **cache-safe** | Build `buildAgentContext` and inject it reference-shaped, session-scoped |
| Historical recall ("did we discuss X?") | **`session_search`** — FTS5 over `~/.hermes/state.db`, ~20ms, no token cost | Rely on it; don't duplicate |
| Structured brain pull on demand | **MCP `resources/read`** (Manager-as-MCP, already source-wired) | Point the agent at it from the primer |
| Procedural memory ("gets better") | **Skills** (`SKILL.md`, `skill_manage`, external skills dir) | Ship vertical skills + let the employee self-author |

Prompt-assembly + cache tiers matter for token efficiency: sections 1–9 (SOUL.md → memory/user snapshots
→ skills index → `AGENTS.md`) are the **stable cached prefix**, rebuilt only at session start /
compression. Baking dynamic state into that prefix busts cache; `pre_llm_call` (user-message append) does
not. This is why dynamic priming goes through the hook path, and durable facts go into MEMORY.md/USER.md.

## Deep study: what a "turn" is in this software

Two turn worlds meet:

- **Hermes's agent loop** (`developer-guide/agent-loop`): append user msg → build/reuse **cached** system
  prompt → preflight compress if >threshold → build provider messages → **inject ephemeral prompt layers**
  (`ephemeral_system_prompt`, prefill, `pre_llm_call` context) → provider call → parse → if tool calls,
  execute + loop → persist session + flush memory. Strict role alternation; Runs/Sessions turn-atomic.
- **Manager's turn lane** ([`lib/turn-queue.ts`](../../apps/manager/src/lib/turn-queue.ts) →
  `runEmployeeTurn`): a DB-backed **per-employee serialized lease**. Owner web/SMS chat (`runtime.ts`),
  event wake (`wake.ts`), and straggler drain (`turn-drain.ts`) all pass through it, wrapped with
  metering. Events arrive via the **two-door model** ([`events/ingress.ts`](../../apps/manager/src/events/ingress.ts):
  external → `ingestEvent` → adapter verify/normalize → `deliver_only` vs `wake_employee`; internal →
  `deliverEmployeeEvent`).

**Why turns held up the agent, and the fix (CE-2, now source-wired).** Everything funnels through one
serialized lane. The routing decision is now a **data-driven policy table** (`routeForEventType`,
`packages/shared/src/event-types.ts`): the serialized lane carries **owner-facing ordering only**;
informational/trivial events stay `deliver_only` (no wake); only owner-actionable / customer-reply events
wake. For heavy multi-step sub-work the employee uses Hermes **`delegate_task`** (config `delegation:`
block rendered per employee) — an isolated child context whose only the bounded summary re-enters the
parent, matching Anthropic's sub-agent pattern. Note `delegate_task` is synchronous (in-turn context
isolation); moving *recurring* work off the lane entirely stays with the AMTECH scheduler. This is the
"don't let constant trivial tasks nerf a Hermes-class agent" answer.

## Phase index

| Phase | File | Status | Outcome |
|---|---|---|---|
| CE-1 | [Agent brain + native memory seed](phase-ce-01-agent-brain-and-native-memory.md) | `source-wired` (loose ends closed) | The employee wakes knowing its business (MEMORY.md/USER.md seeded from onboarding) and its live state (reference-shaped `buildAgentContext` injected cache-safely once per session, 2k-token cap). Primer claim-failure vs already-primed distinguished; gate keys on the transcript session id. |
| CE-2 | [Compression policy + hooks + turn concurrency](phase-ce-02-compression-hooks-and-turn-concurrency.md) | `source-wired` | Compression rendered as a safety net (CE-3 rotates first); a deterministic Hermes **plugin** (`amtech-hygiene`) redacts secrets + trims only pathological tool/terminal bulk (never normal results); data-driven `deliver_only` vs `wake_employee` routing table; `delegate_task` enabled for in-turn context isolation. |
| CE-3 | [Session rotation + handoff](phase-ce-03-session-rotation-and-handoff.md) | `source-wired` | Manager rotates to a fresh transcript **before** compaction (pre-turn check, occupancy recorded post-turn), preserving `X-Hermes-Session-Key` memory scope; carryover reuses `buildAgentContext` + next-action; the new transcript re-primes automatically. |
| CE-4 | [Connector-agnostic capabilities + operator modes](phase-ce-04-connector-agnostic-and-operator-modes.md) | `source-wired` | Connector metadata now drives capability projection and custody: read-only direct MCP is allowed, write/money/customer-facing connectors stay Manager-mediated; per-business-type + operator-mode context policy seam exists without roles. |

Production build plan (the implemented spec): [CE-2/CE-3 production implementation plan](phase-ce-02-03-production-implementation-plan.md).
Planning handoff that produced it: [CE-2/CE-3 production planning handoff prompt](ce-02-03-production-planning-handoff-prompt.md).

## Dependency graph

```
CE-1 (brain + native memory, cache-safe priming)
  -> CE-2 (compression tuning + tool-output hooks + turn concurrency)
       -> CE-3 (rotation + handoff; reuses CE-1 primer + CE-2 thresholds)
CE-4 (connector-agnostic + operator modes) : source-wired on CE-1..3; live direct-MCP connector proof
      remains pending.
```

## Status vocabulary (shared with the build plan)

`source-wired` / `provider-accepted` / `runtime-accepted` / `planned` / `pending`. Live Hermes
hook/compression/rotation/memory behavior stays a `pending` runtime gate until proven against a real
Hermes v0.18.x instance (Realness Rule). Current state: **CE-1/CE-2/CE-3/CE-4 are `source-wired`** (see
the phase index) with migrations `0029`/`0030` **applied live**; live-Hermes
hook/compression/rotation behavior, live employee reprovision, and live direct-MCP connector proof remain
`pending`.

## Primary sources (verified 2026-07-12)

- Hermes prompt assembly: <https://hermes-agent.nousresearch.com/docs/developer-guide/prompt-assembly>
- Hermes persistent memory: <https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/>
- Hermes event hooks: <https://hermes-agent.nousresearch.com/docs/user-guide/features/hooks>
- Hermes context compression: <https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching>
- Hermes subagent delegation: <https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation>
- Hermes skills: <https://hermes-agent.nousresearch.com/docs/user-guide/features/skills>
- Hermes MCP: <https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp>
- Anthropic, effective context engineering for agents: <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents>
- Anthropic, effective harnesses for long-running agents: <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>
