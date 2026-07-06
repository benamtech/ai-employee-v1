# mvp-build durable memory — index + writing protocol

Status: active

This folder is the **in-repo durable memory for agentic development of the AI Employee MVP**. It is
the narrative handoff layer between sessions/agents: what changed, why, current status, and what the
next agent inherits. It is **versioned with the code** (committed), so a fresh agent can orient from
the repo alone.

It is distinct from, and points to, the two other memory layers:
- **`../wiki/MVP/implementation-records/`** — the factual code-state ledger (what is wired, proof ids).
- **`../wiki/MVP/build-plan-current/`** — the forward plan (phases) and architecture.
Memory handoffs here are the **agentic-dev narrative + decisions + pointers**; they do not duplicate
the records — they link to them.

## Index (newest first)

- [2026-07-05 21:45 — Live headed test: model-bridge single-instance worker + owner-session/toolset gaps + live-test toolkit](2026-07-05-2145-live-test-model-bridge-single-instance-and-owner-session-gap.md) — **(updated)** Both blockers FIXED and the full loop verified (login→message→employee→bridge→Haiku→reply). Built a dev owner-login (`/manager/dev/mint-owner-session` + web `/api/dev/login`, gated by `DEV_OWNER_LOGIN`), fixed two provisioning regressions (`.env.tpl` `API_SERVER_HOST` 127.0.0.1→0.0.0.0 for Docker reachability; renderer `{{MODEL_CONFIG}}` now wires employees to the bridge via `HERMES_MODEL_PROVIDER` instead of hardcoded opus-4-8), recreated Ferraro as `emp_pnutiyn47n8g4rdagosl6u`, and shipped a **live-test toolkit** (`infra/scripts/local/test/`, `npm run live:up|status|reprovision|login|recover|down` + README + HANDOFF-PROMPT). Also shipped `6911400`: the no-key model bridge worker now holds ONE persistent warm Haiku stream-json session (not a fresh `claude -p` per parked request); helpers `toStreamJsonInput`/`resultTextFromEvent` + tests; verified end-to-end (one pid answered 3 turns incl. real onboarding JSON). **Run recipe under Node 26:** Manager must run with plain `npx tsx` (NOT `tsx watch` — v4.22.4 crashes on Node 26 resolving `@amtech/shared`); rebuild `@amtech/shared` dist first; ORCHESTRATOR→bridge is a launch override. Recovered the existing **Ferraro employee `emp_rz6k8puuv9xu1zzpiwygk0` ("Sage" / Ferraro Grounds & Gardens**, acct `acct_3t6yn02yc360oewyi2mvir`, port 8610) from a stale `gateway_state.json=running` dual-gateway crash (rm -f + mark stopped + `start-hermes-container.sh`). **Two blockers before tool testing:** (1) `owner_session_invalid` — `/login` is a stub, the httpOnly `amtech_owner_session` cookie is only set at onboarding; must mint a dev session (have account/user/SIGNING_SECRET). (2) Sage's rendered `config.yaml` predates the MCP-toolset fix (no `platform_toolsets.api_server`/`mcp_servers.amtech_manager`) so it has ZERO Manager tools — re-provision or patch its profile to test tools/connectors. Includes the full tool-display overview + which tools need no setup vs Gmail/Stripe.
- [2026-07-05 09:30 — Manager-as-MCP-server + Hermes toolset enablement + ToolActivityDescriptor spike](2026-07-05-0930-mcp-server-toolsets-tool-activity.md) — Fixed the verified toolset bug (rendered `config.yaml` had no `platform_toolsets.api_server`, so employees ran on `terminal/file/web` only): a safe-set policy (`packages/shared/platform-toolsets.ts`) tied to backend blast radius + provider-key availability, rendered via `{{PLATFORM_TOOLSETS}}`, plus `getToolsets()` + `npm run local:inspect` to prove the live surface. Made the tool surface **schema-first** (`tool-schemas.ts` zod = single source of truth; `runManagerTool()` shared dispatch validates + reuses handlers/gates). Built **Manager-as-MCP-server** (`mcp-server.ts`, `@modelcontextprotocol/sdk` web-standard streamable-http, `POST /manager/mcp`, `mcp_servers.amtech_manager` auto-attaches to api_server) — a transport over the proven registry, gates reused not reimplemented. Generalized the descriptor spine with `tool_activity` + `formViewFromJsonSchema()` so ANY tool materializes from schema with zero per-tool code (spike-proven on image_gen/session_search/a Manager tool); `ids.ts` made isomorphic so `@amtech/shared` is client-bundle-safe. 50 files / 283 tests, typecheck/lint/build green. **Live `/v1/toolsets` + MCP handshake + Hermes→Work live adapter pending** (funded model key + Docker host).
- [2026-07-04 19:12 — Local onboarding harness (bypass vs real-user) + live Twilio creds](2026-07-04-1912-local-onboarding-harness-and-twilio-creds.md) — Built the practical onboarding test harness from the `1840` handoff: varied contractor fixtures (`contractor-fixtures.mjs`), a REAL front-door path harness (`onboard.mjs`, `npm run local:onboard`) + Playwright form driver (`06-browser-onboard.mjs`), and a **gated dev phone-verify bypass** (`twilio.ts`/`identity.stub.ts`) that lets the real verify path run without SMS and **fails closed in production**. Bypass `bootstrap.mjs` now fixture-varied; RUNBOOK §6 separates BYPASS vs REAL-USER paths. Wired the founder's live Twilio trial creds (account/token/number/verify-service `VA…`/test-recipient/dev-bypass) into the gitignored `.env`; committed examples got placeholders only. 46 files / 263 tests, build, lint green. **One hard blocker remains for the full live loop: a funded orchestrator model key (`ORCHESTRATOR_API_KEY`/`XAI_API_KEY`/`OPENAI_API_KEY`) — same key gates onboarding conversation AND Phase 5 Hermes chat.** Next: add model key → capture `/v1/runs` transcript → Phase 5 `runtime-accepted` → Phase 7 metering instrumentation.
- [2026-07-04 14:40 — Phase 5: triage, batching, live stream, MCP-UI generative UI](2026-07-04-1440-phase-05-triage-batching-live-stream-mcp-ui.md) — Phase 5 built in full and `source-wired`: rules-first triage with priority + provider-burst batching → one `manager.digest` (migration `0016`, `flush_event_batches` lane); the polled snapshot replaced by a live Manager SSE stream (`employeeStream` + `employee-stream.ts`) woken by `progress-bus.ts` (in-process EventEmitter = the testable Realtime/NOTIFY stand-in) with cursor catch-up + poll fallback; Hermes `/v1/runs/{id}/events` streaming → owner-safe work-verbs (`work-verbs.ts`) as live progress; **generative UI adopted via MCP-UI** (founder call) — agent `view` → Manager-compiled `ui://` `rawHtml` `UIResource` (`ui-resources.ts`, `@mcp-ui/server`) rendered in a sandboxed iframe whose `postMessage` intents route through the approval gate (`McpUiResource.tsx`). 44 files / 254 tests, build, lint green. **Repo correction:** root `GTM-RESEARCH` is one git repo with GitHub remote `benamtech/ai-employee-v1` (not local-only). Live Hermes SSE + Supabase `0016` RLS proof pending.
- [2026-07-04 00:43 — Local no-SMS bootstrap restored](2026-07-04-0043-local-no-sms-bootstrap.md) — Recreated interrupted local infra work: `PROVISIONER_SKIP_SMS` guarded no-SMS provisioner path, local env examples prefilled for Supabase project `uxuruijrgghshfwnaagb`, real Manager-tool bootstrap, web-chat smoke script, per-employee Docker Hermes runtime wrapper, Docker-outside-of-Docker devcontainer, local acceptance scripts including browser Work Surface check, package scripts, and infra docs. Local gates green: typecheck, 38 unit files / 223 tests, lint, build, script syntax checks. Supabase shared-pooler `DATABASE_URL` works and migrations `0001`-`0015` are applied after fixing stale `0002` RLS table scoping. Blocked for live runtime run by this agent shell's stale Docker group; no live provider/runtime acceptance claimed.
- [2026-07-03 20:21 — Hermes capabilities/runs alignment implemented](2026-07-03-2021-hermes-capabilities-runs-alignment.md) — Implemented the Hermes alignment audit fixes: cached `/v1/capabilities` gate, Runs-first/Sessions-fallback execution, strict account+employee session key, external Hermes run id correlation on `work_runs`, queued owner-turn run closure in drain, live Hermes contract-test scaffold, and `0015` schema/doc updates. Local gates green: typecheck, 38 unit files / 223 tests, integration 10 skipped clean, lint, build.
- [2026-07-03 19:52 — Hermes integration alignment audit](2026-07-03-1952-hermes-integration-alignment-handoff.md) — Research-only checkpoint and prompt for the next session to audit current code against Hermes Agent v0.18.0's most efficient production surface: capabilities-first API Server integration, `/v1/runs` + SSE for Phase 5 live progress, Sessions chat as fallback, deliberate `X-Hermes-Session-Key`, Manager-owned product semantics, and profiles-not-sandbox caution. Adds `docs/hermes-agent-authoritative-record.md`; no source/code changes.
- [2026-07-03 19:25 — Phase 4 completion fixes + Phase 6 proof cleanup](2026-07-03-1925-phase-04-completion-and-phase-06-proof-cleanup.md) — Closed review findings after Phase 4/6 groundwork: ingress-owned and direct-owned `work_runs` now finish on success/repair/throw; drain lane now persists `to_owner` messages and preserves `run_id`; 0014 makes real turn-claim RPCs return `run_id`; Phase 6 status/RLS proof docs caught up. Local gates green: typecheck, 38 unit files / 216 tests, integration 9 skipped clean, lint, build.
- [2026-07-03 18:55 — Phase 4 hardening + Phase 6 metering foundation](2026-07-03-1855-phase-04-hardening-and-phase-06-metering.md) — TDD-hardened the Phase 3/3A/4-core spine before env (fake-supabase now enforces unique indexes + rpc; every new module + adapter contract tested; audit bugs fixed incl. a turn-queue orphan; drain lane added), then built Phase 6 metering (0013 ledgers + metering.ts best-effort + run_id threaded ingress→deliver→wake→turn→router→owner-turn). Two-door decision CONFIRMED (external→ingestEvent adapter; internal→deliverEmployeeEvent). 38 files / 214 tests; provider/runtime `pending`.
- [2026-07-03 17:47 — Phase 4/5/6 next course after live employee core](2026-07-03-1747-phase-04-05-06-next-course.md) — planning handoff after recent Phase 3/3A/4-core source wiring; recommends finishing Phase 4 proof/hardening, then Phase 5 stream/triage, with Phase 6 `run_id` metering foundation as the sensible parallel/next operating-layer move.
- [2026-07-03 13:32 — Phase 3 / 3A / 4-core source-wired](2026-07-03-1332-phase-03-03a-04-core-source-wired.md) — real Hermes Sessions client, DB-backed turn queue, generic ingress hot path, minimal channel router, and Gmail reply live wake core are source-wired; live runtime/provider proof pending.
- [2026-07-03 12:11 — Full architecture audit: Hermes boundary + three critical systems](2026-07-03-1211-architecture-audit-three-critical-systems.md) — verified readout: `runtime.ts` calls invented `/messages`+`/events/work` paths (native Hermes is `/api/sessions/{id}/chat`/Runs — adapter-vs-rewrite decision gates Phases 3A/4/5); event bus has real signatures+dedupe but no importance engine, Twilio inbound off-rail, dead registry, write-only batching; Work Surface rendering is descriptor-generic but all descriptors are Manager-hardcoded TS literals (wake path never invoked) and "SSE" is a one-shot snapshot; admin is planned-only (CLI+SQL today). Smallest moves to live-testable listed.
- [2026-06-30 10:30 — Agent-inbox + channel/session architecture (decision)](2026-06-30-1030-agent-inbox-and-channel-architecture.md) — source-of-truth doc `wiki/MVP/agent-inbox-and-channel-architecture.md`: universal "message to the agent" inbox (open source-adapter contract; source ≠ channel), conductor + Jobs + serialized inbox execution, presence-aware channel/session router, conversation-as-brain-artifact single thread, dedicated number per employee LOCKED. Reframes Phase 3 (universal ingress) / Phase 4 (brain reason-branch) + adds Channel/Session layer as a first-class concern. Open: verify Hermes mid-Run input semantics.
- [2026-06-30 09:45 — Commit split + Phase 3 ingress dedupe groundwork + seam assessment](2026-06-30-0945-commit-split-and-phase3-dedupe-groundwork.md) — split the mixed tree into 2 commits; added migration `0010` (unique `inbound_events.idempotency_key`) + `insertDedup` 23505 backstop; mapped 2/3/4/6 seams (Phase 2 source-complete; Phase 3 groundwork laid, registry-promotion is the build; named Phase 4 atomic-claim-before-wake + Phase 6 run_id-at-ingress seams).
- [2026-06-30 09:02 — Events/reminder mesh robustness hardening](2026-06-30-0902-events-mesh-robustness-hardening.md) — `events.stub.ts` taken happy-path → defensible: DB-fault helpers (`db.ts`), atomic reminder claim, migration `0009` idempotency index, scheduler actor guard, entitlement gating, tz-aware briefs. `source-wired`, **uncommitted** on branch `fix/events-and-systemic-robustness` (also still carrying uncommitted Phase 2).
- [2026-06-30 01:46 — Phase 2 runtime/scheduler source-wired](2026-06-30-0146-phase-2-runtime-scheduler.md) — Docker-default runtime backend, protected Manager scheduler runner, `hermes_job_runs` proof writes, `runtime_health_checks`; source-wired with live runtime gate pending.
- [2026-06-30 01:33 — Next session: tie up Phase 1, then build Phase 2 (production)](2026-06-30-0133-next-session-phase-1-loose-ends-and-phase-2.md) — forward orientation: finish/verify the Phase 1 acceptance system, then full production implementation of Phase 2 = **Runtime & Scheduler Productionization** (not the old artifacts phase).
- [2026-06-30 01:20 — Re-phasing + Phase 1 acceptance harness + local git repo](2026-06-30-0120-rephase-and-phase-1-acceptance.md) — forward plan re-authored as modular phases (1–13); Phase 1 live-acceptance system built + locally verified; `mvp-build` is now a local-only git repo.

---

## Durable memory writing protocol (when + how)

Write or update a durable memory handoff at these triggers. This is a **standing protocol** — follow
it without being asked.

### When to write

1. **Mid-session checkpoint — after substantial multi-feature or architectural work.**
   Before context grows long or a session ends, and any time you've completed a chunk that spans
   multiple files/features or changes a structure, write/update a dated handoff. Don't wait for the
   end; checkpoint so the next agent (or your future self) can resume cold.
2. **After a full phase implementation.**
   When a phase from [`../wiki/MVP/build-plan-current/phases/`](../wiki/MVP/build-plan-current/phases/)
   is implemented (even if its live gate is still pending), write a phase handoff: what was built,
   local proof, what's pending, what the next phase inherits — and cross-link the matching
   `implementation-records/` entry.
3. **After an architectural decision or a plan change.**
   Capture the decision, the rationale, and the seams it affects (e.g. the Workstreams→phases
   re-org). Decisions are easy to lose; record them here with the "why".

### How to write

- **File name:** `YYYY-MM-DD-HHMM-<kebab-slug>.md` — **date, 24-hour time, and a relevant title**
  (e.g. `2026-06-30-0120-rephase-and-phase-1-acceptance.md`). The time disambiguates multiple
  handoffs in a day and orders them; the title makes the file scannable without opening it.
- **Header:** title, `Date:` (with time), `Status:`, `Scope:` (one line each).
- **Body sections (in order):**
  - **What changed** — concrete, file-referenced.
  - **Why** — the reason/decision behind it.
  - **Current status** — use the acceptance vocabulary: `source-wired` / `provider-accepted` /
    `runtime-accepted` / `planned` / `pending`. Never claim a status without real proof.
  - **Files / seams touched** — representative paths; name the seams the next phase plugs into.
  - **Carry-forward / next** — what the next agent should do, blockers, open decisions.
  - **Verification** — exactly what was run and the result (commands + outcomes).
- **Update the index** above (one line, newest first) every time you add a file.

### Rules

- **Factual only.** Do not claim live external services were tested when they weren't (the Realness
  Rule). Local proof is local proof; the live gate is separate.
- **Living, not archive — with one exception.** Supersede/delete stale *decision/status* notes so the
  newest handoff reads as current truth. **Keep dated phase handoffs as history** (they are the
  development record), but make sure the index and the latest handoff reflect reality.
- **Link, don't duplicate.** Point to `implementation-records/`, `build-plan-current/phases/`, and
  `CODEGRAPH.md` rather than re-explaining them.
- **Keep it agentic-dev focused.** This is the handoff a cold agent reads to continue work — not a
  changelog, not a spec.
