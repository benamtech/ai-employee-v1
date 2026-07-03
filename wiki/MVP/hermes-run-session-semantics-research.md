# Hermes Run, Session, Job, and Profile Semantics — Research Note

Status: in-progress

Date: 2026-06-30

Purpose: answer the substrate question that constrains AMTECH's event, messaging, Jobs, Manager, and
Channel/Session/Presence architecture. This is not a full Hermes source audit yet; it is the production-planning
answer from current public NousResearch docs plus targeted GitHub/community issue search.

## Bottom line

Hermes is not just a wrapper target, but AMTECH must still own the office-grade coordination layer.

1. **HTTP Runs are turn-atomic.** The documented Runs API starts a run, polls status, streams lifecycle/tool/token
   events, stops a run, and resolves approvals. It does not expose an HTTP "inject another user message into this
   already-running turn" endpoint. Source: NousResearch Hermes API Server docs,
   `https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server`.
2. **REST Sessions are also one-turn calls.** `/api/sessions/{id}/chat` is documented as one synchronous agent turn;
   `/api/sessions/{id}/chat/stream` is an SSE wrapper over that single turn. Session history/branching exists, but it
   is not a background queue.
3. **The TUI gateway has richer live controls, but it is process-local orchestration, not the MVP substrate.** The
   programmatic integration doc lists `prompt.submit`, `prompt.background`, `session.steer`, `session.interrupt`, and
   maps `follow_up` to "queued after current turn." That confirms queuing/turn-boundary behavior rather than true
   mid-run multi-input semantics. Source:
   `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/website/docs/developer-guide/programmatic-integration.md`.
4. **Jobs/cron are fresh isolated agent sessions.** The cron docs say the gateway starts a fresh `AIAgent` session for
   each due job, delivers the final response, and can optionally mirror the delivery into an origin conversation for
   continuation. Jobs with a `workdir` are serialized because the scheduler applies workdir through process-global
   terminal state. Source: `https://hermes-agent.nousresearch.com/docs/user-guide/features/cron`.
5. **Profiles are real Hermes state boundaries, not OS sandboxes.** A profile has its own config, `.env`, `SOUL.md`,
   memory, sessions, skills, cron jobs, state database, and gateway state. On the local terminal backend it still has
   the same filesystem access as the OS user unless Docker/SSH/VM-style containment and `terminal.home_mode: profile`
   are used. Source: `https://hermes-agent.nousresearch.com/docs/user-guide/profiles`.
6. **Same-worktree concurrent sessions are a known risk.** Community issue search surfaced
   `NousResearch/hermes-agent#46303`, summarized as concurrent sessions cross-contaminating through shared memory
   injection and shared git worktree/resource contention. Treat this as a design constraint until a source-level audit
   proves a newer isolation mechanism is sufficient.
7. **Current `delegate_task` is better for MVP UX than the earlier note assumed.** The source describes top-level
   delegation as background by default: `delegate_task` returns immediately, the user can keep working, and each
   subagent result re-enters the conversation as a new message. It is not durable if the parent session closes or the
   process exits, but for bounded in-session work it is exactly the pleasant low-latency path AMTECH should exploit.
   Source: `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/tools/delegate_tool.py`.

## Architecture consequence for AMTECH

Use Hermes profiles/sessions/delegation/jobs as execution substrates, but make AMTECH's Manager the coordination owner
only where the native session substrate is insufficient:

- **One canonical employee brain per employee**: one primary Hermes profile and one canonical owner conversation
  thread.
- **Use native in-session delegation first for bounded work**: if subagents let the owner keep messaging and results
  re-enter the same conversation, prefer that for the MVP.
- **One serialized AMTECH inbox per brain for non-session events**: provider events, clock events, durable Job
  completions, and worker results that cannot safely enter the live session land here.
- **One active canonical owner thread**: the Manager avoids racing multiple same-brain sessions against shared state;
  it does not prevent Hermes from running background subagents under the active session.
- **Worker lanes are allowed but scoped**: a second Hermes session/profile can do bounded or isolated work, but durable
  state changes and owner delivery still report through the canonical thread/inbox.

## Session/profile policy

Do **not** model every job as a separate external queue item. Also do **not** let arbitrary sessions race against the
same business brain.

Recommended MVP-first shape:

- **Primary conductor lane**: canonical profile + session/thread; fast turns; dispatches background subagents or Jobs;
  emits channel-agnostic intents.
- **Native subagent lane**: bounded, non-durable work inside the active Hermes session; result re-enters the same
  conversation.
- **Durable Job worker lane**: Hermes Job/cron or worker profile/session for long/restart-sensitive work;
  least-privilege tools; writes artifacts and a completion event.
- **Public/intake profile lane**: separate thin profile for untrusted customer-facing intake; minimal tools; can write
  leads/events only.
- **No direct cross-lane owner delivery for durable workers**: durable worker outputs become inbox/session messages;
  the presence-aware router chooses the surface when the owner is not already in the active session.

## Still to audit

- Source-level behavior for `session.steer` and `prompt.background` in the TUI gateway.
- Runtime proof that Hermes gateway/API deployments preserve the source-level `delegate_task` behavior under AMTECH's
  chosen profile/tool configuration.
- Current issue status and fix status for `NousResearch/hermes-agent#46303`; treat any same-profile, same-worktree
  parallelism as unsafe until proven otherwise.
- Whether the API Server's `/api/sessions/{id}/fork` gives enough lineage metadata for AMTECH worker-lane auditing.

## Sources checked

- Hermes API Server docs: `https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server`
- Hermes programmatic integration docs:
  `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/website/docs/developer-guide/programmatic-integration.md`
- Hermes cron docs: `https://hermes-agent.nousresearch.com/docs/user-guide/features/cron`
- Hermes profiles docs: `https://hermes-agent.nousresearch.com/docs/user-guide/profiles`
- Hermes architecture/agent-loop docs:
  `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/website/docs/developer-guide/architecture.md`
  and `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/website/docs/developer-guide/agent-loop.md`
- Hermes delegate_task source:
  `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/tools/delegate_tool.py`
- GitHub/community search pass: `NousResearch/hermes-agent` plus related `openclaw/openclaw` issue history around
  sessions, cron, isolated jobs, and subagent wake behavior. Use as cautionary signal only; primary docs above are the
  planning authority.
- Concurrency caution: `https://github.com/NousResearch/hermes-agent/issues/46303`.
