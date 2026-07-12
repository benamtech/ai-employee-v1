# Phase CE-1 — Agent brain + native memory seed

Status: source-wired (loose ends closed 2026-07-12; migration `0029` applied live) · live Hermes
hook/runtime proof `pending`

> Implemented. `MEMORY.md`/`USER.md` are seeded from onboarding, `buildAgentContext` is a reference-shaped
> once-per-session primer (2000-token cap, not 500), the `pre_llm_call` hook path is wired, and
> `business-brain`/`business-facts` semantics are index-vs-facts. Loose ends from the merge audit are
> closed: the primer claim now distinguishes `claim_failed` (unapplied gate / transient) from
> `already_primed` (so an employee can't silently never-prime), and the gate keys on the **transcript**
> session id (`transcript_session_id`, renamed from `session_key`) so a CE-3 rotation re-primes. The
> historical "render drops" and "hook plumbing deferred to CE-2" notes below describe pre-CE-1 state and
> are retained only as the original problem statement. Full spec:
> [CE-2/CE-3 production implementation plan](phase-ce-02-03-production-implementation-plan.md) §1–2.

Goal: the employee wakes **knowing its business** (durable facts) and **its live state** (open work,
connected sources, recent events) — delivered the Hermes-native, token-efficient, cache-safe way.

## Why

Today an owner turn sends `{input: body}` only ([`runtime.ts:38`](../../apps/manager/src/lib/runtime.ts)).
The assembled brain (`buildEmployeeSnapshot`) feeds only owner surfaces, never the agent. Worse, the
factory drops onboarding richness: `profile-renderer.ts:105-106` hardcodes `PRICING_NOTES`/`BRANDING_NOTES`
to `"_(learned as we go)_"`, and `TOP_WORKFLOWS`/`TOOLS_MENTIONED`/`SEED_SKILLS` are computed but consumed
by no template file. `get_business_brain` returns only a `fact_count`. So the employee boots blind to a
business we already interviewed. This is the foundation phase: without it, nothing else matters.

## Scope

### 1. Seed Hermes-native durable memory from onboarding (the real "business brain" for the agent)

Render two new files into the profile at provision time, from the onboarding manifest + `business_brain_facts`:

- **`~/.hermes/memories/MEMORY.md`** — curated durable business facts (business identity, trade, top
  workflows, tools already in use, pricing/branding facts, standing preferences). Auto-injected into the
  cached system prompt every session; bounded ~2200 chars (adding past the limit errors — this
  **structurally enforces** the references-over-payloads doctrine). Seed **compact**, not a data dump.
- **`~/.hermes/memories/USER.md`** — owner identity/preferences/communication style (name, register,
  authorized phone, "busy, on a job site" context). Bounded ~1375 chars.

Wire the employee's ongoing learning to native memory so the brain compounds across sessions (keep
`save_business_brain_fact` for the Manager-owned product record, but reflect durable facts into MEMORY.md
so they are auto-injected — do not rely on the agent remembering to call a read tool). Keep `AGENTS.md`
as the operating-policy project-context file (already system-prompt section 9).

### 2. `buildAgentContext(snapshot)` — the live-state projection (references, not payloads)

New `apps/manager/src/lib/agent-context.ts`. Reuse `buildEmployeeSnapshot` + `materializeEmployeeSnapshot`
+ `deriveResurfaceItems` to produce a **bounded, reference-shaped** situational block:

- connected sources + state (works for 0/any/many connectors via `ConnectionSurface`);
- recent cross-connector events (from `inbound_events`), as headlines;
- open approvals / jobs / reminders (counts + one-line headlines);
- resurfacing attention items;
- pointers: "read detail via MCP `resources/read`; look up history via `session_search`."

Hard token budget (implemented cap: **2000 estimated tokens**, `MAX_ESTIMATED_TOKENS` in
`agent-context.ts`; the earlier ≤500 target was superseded). Must degrade gracefully: an employee with **no connectors**
gets a clean "no systems connected yet; here's how to connect email/payments/accounting" block, not empty
or noisy output.

### 3. Inject it cache-safely, once per session

Deliver `buildAgentContext` via the **`pre_llm_call` hook path** (appended to the current user message,
which the prompt-assembly docs confirm does **not** bust the stable cached prefix), gated to **session
start** (self-gate via a per-session marker so it primes once, not every turn). Manager owns the content;
the hook is the transport. Alternative acceptable transport: first-turn `system_message` via `createRun`
(`hermes-client.ts:270-298`) when Manager detects a fresh `session_id` — but prefer the cache-safe hook
path. Never inject a full digest every turn.

### 4. Fix the render/data drops

- Populate `PRICING_NOTES`/`BRANDING_NOTES` (or fold into MEMORY.md) from onboarding facts.
- Consume `TOP_WORKFLOWS`/`TOOLS_MENTIONED` (into MEMORY.md and/or `AGENTS.md` context) so the owner's
  stated work + existing software actually reach the agent.
- Fix `get_business_brain` (`estimate.stub.ts:58-86`) to return the facts, not just a count (it is a
  legitimate on-demand pointer target).

## Files / seams

- New: `apps/manager/src/lib/agent-context.ts`; a memory-seed renderer (in `profile-renderer.ts` or a new
  `lib/memory-seed.ts`); `packages/agent-template/memories/{MEMORY.md,USER.md}` templates.
- Touch: `apps/manager/src/lib/profile-renderer.ts` (token map + memory-file render), `runtime.ts`
  (fresh-session detection if using first-turn transport), `packages/agent-template/hooks/pre-session-context`
  (the `pre_llm_call` shell hook + `hooks:` wiring — see CE-2 for the hook plumbing), `estimate.stub.ts`.
- Reuse: `lib/employee-stream.ts`, `lib/materialization.ts`, `lib/capability-registry.ts`.

## Acceptance gates

- A newly provisioned profile contains seeded MEMORY.md + USER.md within char limits, carrying the real
  onboarding facts (pricing/branding/workflows/tools).
- `buildAgentContext` output is reference-shaped and within the token budget for **0, 1, and several**
  connectors; contains no raw provider payload; no per-turn digest.
- The primer is injected once per session via the cache-safe path (proven by test: second turn in the same
  session does not re-inject).
- `get_business_brain` returns facts.
- Local gates green (typecheck/unit/build/lint). Live Hermes injection proof stays `pending`.

## Tests

- Profile generation: MEMORY.md/USER.md seeded from a fixture manifest, within limits; onboarding
  facts present; `hooks:` block references the pre-session-context hook.
- `buildAgentContext`: token-budget bound; correct for 0/1/many connectors; pointer-shaped; account-scoped.
- Injection: once-per-session self-gate; cache-safe transport (user-message append, not system prompt).
- `get_business_brain`: returns facts.

## Carry-forward

- CE-2 wires the `hooks:` plumbing this phase's `pre_llm_call` hook depends on, plus the compression block
  and tool-output transform hooks, and moves background/trivial work off the owner turn.
- CE-3 reuses `buildAgentContext` for the rotation carryover; MEMORY.md/USER.md carry across rotation for
  free (they are re-injected every session).
