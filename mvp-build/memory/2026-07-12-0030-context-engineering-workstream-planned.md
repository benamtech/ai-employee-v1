# Context-Engineering workstream planned (CE-1..CE-4)

Date: 2026-07-12 00:30 EDT
Status: docs-only (planning); no code changed; no live gates upgraded
Scope: authored a new Hermes context-engineering workstream after deep substrate + best-practice research

## What changed

- Added `second-half-plan/context-engineering/`: `README.md` + `phase-ce-01..04-*.md`, a new parallel
  workstream to the second-half plan. Added a pointer section in `second-half-plan/README.md`.
- No `apps/`/`packages/`/`infra/` source touched. Production networking/DNS/infra slice untouched (read only).

## Why (founder direction, corrected twice mid-session)

Goal: make each employee a real *business brain*, as-powerful-as-Hermes by default, that knows the business
the moment it wakes and never degrades quality via mid-session compaction. Two founder corrections shaped it:

1. **Do not inject a full "business brain digest" every turn** — that is wrong reasoning; it looks fine
   early and rots after months. Prime with references/pointers, once per session.
2. **The "business brain" is NOT a facts table / `get_business_brain` stub.** It is the whole integrated
   employee system: Hermes + multi-connector event ingress (Stripe/email/Jobber/ServiceTitan/QBO/any MCP)
   + turns + Manager + onboarding + learned-over-time state — already assembled in `buildEmployeeSnapshot`.

## Key research findings (primary sources, verified 2026-07-12)

- **Hermes already has the native agent-side brain**: `~/.hermes/memories/MEMORY.md` (~2200 chars, curated
  durable facts, auto-injected into the CACHED system prompt every session; char limit structurally
  enforces curation) + `USER.md` (~1375 chars) + `session_search` (FTS5, free recall) + `memory` tool
  (add/replace/remove, no read). Map onto these; don't reinvent.
- **Prompt assembly + caching**: system prompt sections 1-9 (SOUL.md -> memory/user snapshots -> skills
  index -> AGENTS.md) are the stable cached prefix. `pre_llm_call` context is appended to the CURRENT USER
  MESSAGE (cache-safe), not the system prompt. So dynamic priming goes through the hook path; durable facts
  go into MEMORY.md/USER.md.
- **Hooks**: config.yaml `hooks:` block, subprocess JSON stdin/stdout. `pre_llm_call` injects context;
  `pre_tool_call` blocks; `transform_tool_result`/`transform_terminal_output` shrink tool output;
  `on_session_*` observers. Headless consent via `hooks_auto_accept`/`HERMES_ACCEPT_HOOKS=1`.
- **Compression**: config.yaml `compression:` (`enabled` true, `threshold` 0.50, `protect_last_n` 20,
  `codex_app_server_auto`). Disabling grows unbounded -> failures. AMTECH tunes threshold high + rotates.
- **Delegation**: `delegate_task` sync blocks the parent turn; async/background subagents shipped via
  PR #40946 / news June 2026 but current main docs describe sync only -> gate on `/v1/capabilities`.
  Subagents = isolated child, condensed 1-2k-token summary back (Anthropic sub-agent pattern).
- **MCP connectors**: `mcp_servers` block (stdio/HTTP, tools.include/exclude, resources, prompts) auto-
  discovers + registers external tools; `notifications/tools/list_changed` for runtime updates. Jobber
  (96-tool GraphQL MCP), Housecall Pro (20+), ServiceTitan exist. Security nuance: a direct-MCP connector
  bypasses the Manager approval gate + egress -> money/customer-facing connectors must stay Manager-mediated.
- **Best practice (Anthropic/Amp/Hermes issue #499)**: context rot is real; prefer references over
  payloads, "tool result clearing" as lightest compaction, and handoff-oriented transfer over lossy
  in-place compaction.

## Current-state gaps this workstream targets (grounded)

- Owner turns send `{input: body}` only (`runtime.ts:38`); assembled brain feeds owners, never the agent.
- `profile-renderer.ts:105-106` hardcodes PRICING/BRANDING notes; `TOP_WORKFLOWS`/`TOOLS_MENTIONED`/
  `SEED_SKILLS` computed but consumed by no template file; `get_business_brain` returns only a count.
- No `hooks:`/`compression:` blocks rendered; `turn.usage` captured then discarded; all work through one
  serialized turn lane; Hermes delegation/Jobs unused.

## The four phases

- **CE-1** agent brain + native memory seed: seed MEMORY.md/USER.md from onboarding; `buildAgentContext`
  reference-shaped live-state primer injected cache-safely once per session; fix the render/data drops.
- **CE-2** compression policy + hooks + turn concurrency: render tuned `compression:`; wire `hooks:` +
  transform hooks; move background/trivial work off the owner turn (deliver_only + delegation/Jobs seam).
- **CE-3** session rotation + handoff: track `usage.prompt_tokens`; rotate below the compression threshold;
  ultra-compact handoff carryover from Manager state; keep `X-Hermes-Session-Key` (MEMORY.md/USER.md carry
  free).
- **CE-4** (deferred) connector-agnostic capabilities (any MCP connector, Manager-mediated for write/money)
  + operator-mode/business-type context policy.

## Files / seams named for the build

`lib/employee-stream.ts` (`buildEmployeeSnapshot`), `lib/materialization.ts`, `lib/capability-registry.ts`,
`runtime.ts`, `turn-queue.ts`, `hermes-client.ts` (`usage`), `events/ingress.ts`, `profile-renderer.ts`,
`packages/agent-template/{config.yaml,memories/,hooks/,workspace/AGENTS.md}`, `estimate.stub.ts`
(`get_business_brain`). New: `lib/agent-context.ts`, `lib/session-rotation.ts`, a session/occupancy migration.

## Carry-forward / next

- Implement CE-1 first (see the copy-ready prompt in the workstream README / the session plan). Do not
  claim runtime acceptance without real Hermes proof. Keep production infra slice as-is.
- Related decisions: [[2026-07-11-1752-production-networking-admin-infra-source-wired]] (infra mid-stream).
- User-memory doctrine recorded separately: business-brain-is-the-whole-system; context-engineering-doctrine.

## Verification

Docs-only. Confirmed no source changed (only `second-half-plan/context-engineering/**` +
`second-half-plan/README.md` pointer). No tests run; no gates claimed.
