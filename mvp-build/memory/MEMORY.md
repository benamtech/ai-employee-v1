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
