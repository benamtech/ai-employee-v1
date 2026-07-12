# CE-2/CE-3 Production Planning Handoff Prompt

Use this prompt to start a fresh planning session. The deliverable is a production-level implementation
plan for CE-2 through CE-3, plus any CE-1 loose ends. Do not implement during this planning pass unless
the user explicitly redirects you.

---

You are taking over AMTECH's Hermes context-engineering workstream after CE-1 was merged.

Your job is to produce a production-level implementation plan for:

- CE-2: context compression policy, hooks/tool-output hygiene, and moving background/trivial work off the
  owner turn.
- CE-3: session rotation before compaction, with a deterministic handoff-oriented carryover.
- CE-1 loose ends: documentation, runtime proof, migration/provisioning proof, and any correctness or
  security gaps discovered in the merged source.

Do not assume backwards compatibility is required. This software has not launched.

## Start With Local Ground Truth

Before researching or planning, read the basics and recent memory:

1. `../identity.md`
2. `CODEGRAPH.md`
3. `mvp-build/CODEGRAPH.md`
4. `mvp-build/memory/MEMORY.md`
5. The two most recent handoffs in `mvp-build/memory/`, especially:
   - `mvp-build/memory/2026-07-12-2219-ce1-profile-context-native-memory-source-wired.md`
   - the next newest context-engineering or local-runtime handoff
6. Context-engineering plan docs:
   - `mvp-build/second-half-plan/context-engineering/README.md`
   - `mvp-build/second-half-plan/context-engineering/phase-ce-01-agent-brain-and-native-memory.md`
   - `mvp-build/second-half-plan/context-engineering/phase-ce-02-compression-hooks-and-turn-concurrency.md`
   - `mvp-build/second-half-plan/context-engineering/phase-ce-03-session-rotation-and-handoff.md`
7. Hermes substrate record:
   - `mvp-build/docs/hermes-agent-authoritative-record.md`
8. Source seams from CE-1:
   - `mvp-build/apps/manager/src/lib/profile-context.ts`
   - `mvp-build/apps/manager/src/lib/memory-seed.ts`
   - `mvp-build/apps/manager/src/lib/agent-context.ts`
   - `mvp-build/apps/manager/src/lib/business-brain.ts`
   - `mvp-build/apps/manager/src/lib/mcp-server.ts`
   - `mvp-build/apps/manager/src/server.ts`
   - `mvp-build/apps/manager/src/tools/estimate.stub.ts`
   - `mvp-build/packages/shared/src/tool-schemas.ts`
   - `mvp-build/packages/agent-template/config.yaml`
   - `mvp-build/packages/agent-template/hooks/pre-session-context.mjs`
   - `mvp-build/packages/agent-template/memories/MEMORY.md`
   - `mvp-build/packages/agent-template/memories/USER.md`
9. Source seams for CE-2/CE-3:
   - `mvp-build/apps/manager/src/events/ingress.ts`
   - `mvp-build/apps/manager/src/lib/employee-stream.ts`
   - `mvp-build/apps/manager/src/lib/runtime.ts`
   - `mvp-build/apps/manager/src/lib/turn-queue.ts`
   - `mvp-build/apps/manager/src/lib/hermes-client.ts`
   - `mvp-build/apps/manager/src/lib/turn-drain.ts`
   - scheduler/job/delegation seams if present

## Mandatory Research

After grounding locally, do current web research. Use primary sources wherever possible and cite links in
the plan. This is required because model and Hermes behavior changes over time.

Research at both surface and deep levels:

- Current Hermes docs and issues for:
  - `pre_llm_call`
  - `transform_tool_result`
  - `transform_terminal_output`
  - `pre_tool_call`, if considered
  - `compression:`
  - session IDs and `X-Hermes-Session-Key`
  - `session_search`
  - delegation/subagents
  - Jobs/cron/background work, if supported by the running version
  - MCP servers and resources
- Current best-practice context engineering for long-running agents from primary sources:
  - Anthropic engineering/docs for context engineering, long-running agents, tool-result clearing,
    prompt caching, subagents, and handoffs.
  - OpenAI official docs for GPT-5.5-style long-context agent prompting, tool-result management, memory,
    and context hygiene.
  - GLM/Zhipu official docs for GLM 5.2-style long-context/tool-use behavior.
  - Any relevant official docs for Opus 4.5 and Sonnet 5 behavior.
- If a claimed model version, context window, prompt-cache behavior, hook behavior, or API feature is not
  verifiable from a primary/current source, mark it as an assumption or pending proof.

## Corrections To Preserve

These are design constraints, not suggestions:

- The business brain is the whole integrated system: Hermes + multi-connector event ingress + turns +
  Manager + onboarding + learned state. It is not a facts table and not `get_business_brain`.
- `get_business_brain` should remain an index/resource map. Facts are one explicit resource inside the
  broader brain.
- Never inject a per-turn digest. Prime with references once per session, and again only when rotating.
- CE-1's live-state primer cap is 2k estimated tokens.
- The overall session target is 400k tokens or less.
- Do not implement per-model tuning. Design model-agnostic context engineering that works across Opus 4.5,
  Sonnet 5, GLM 5.2, and GPT-5.5. If model metadata is necessary, use it only as a capability/context-window
  input, not as bespoke behavior branches.
- Keep Hermes compression enabled only as a safety net. Production should rotate before lossy compaction.
- Money/customer-facing connector actions must stay Manager-mediated. Direct MCP access can bypass the
  approval gate and egress controls.
- Hook scripts are delivery and hygiene tools, not the security boundary.
- Manager owns once-per-session/rotation priming gates. Hook-local markers are only optimizations.

## Required Plan Shape

Write the plan as a concrete implementation document. Include:

1. **Current state audit**
   - What CE-1 actually merged.
   - Which docs are stale or misleading.
   - Which runtime proofs remain pending.
   - Whether migration `0029_ce1_agent_context_primer_sessions.sql` is applied in local/prod flows.
   - Whether provisioning renders profile context, MEMORY.md, USER.md, hook config, and scoped hook
     credentials correctly.
   - Whether `business-brain` and `business-facts` resources have correct semantics.

2. **CE-1 loose ends**
   - Update stale CE docs that still mention a 500-token primer, facts-as-brain, missing hook wiring, or
     planned-only CE-1 status.
   - Add/strengthen source tests only where the audit finds gaps.
   - Define live proof gates for Hermes memory injection, pre-session primer injection, and once-per-session
     behavior.

3. **CE-2 design**
   - A generic compression policy that keeps compression enabled but sets the rotation path to happen first.
   - A hooks design for `transform_tool_result` and `transform_terminal_output` that deterministically strips
     bulk while preserving IDs, counts, errors, owner-visible fields, approval context, and resource pointers.
   - Any use of `pre_tool_call` as defense-in-depth only, never as the approval boundary.
   - Hook transport/auth/failure behavior, including fail-open vs fail-closed decisions by hook type.
   - Turn routing rules: `deliver_only` vs `wake_employee`, with examples from current event types.
   - Background work plan using Hermes delegation/subagents and/or Jobs only if the running capability is
     verified. Background work should return bounded summaries and Manager events, not occupy owner turns.
   - How CE-2 preserves owner-facing ordering and no-double-delivery.

4. **CE-3 design**
   - How to capture and persist context occupancy from Hermes usage data.
   - Rotation threshold policy below compression threshold and within the <=400k target.
   - Session table/schema changes, if needed.
   - How to mint a fresh session while preserving `X-Hermes-Session-Key`.
   - How to build carryover from Manager state, not transcript summaries.
   - Carryover shape: active work, open approvals, in-flight customer threads, last decision, next action,
     and resource pointers only.
   - How to avoid duplicating MEMORY.md/USER.md, transcript payloads, raw provider payloads, secrets, or full
     connector objects.
   - No-double-delivery and per-employee serialization tests through rotation.

5. **Files to touch**
   - List exact files and likely new files/migrations.
   - Separate code, tests, docs, and runtime/provisioning changes.

6. **Acceptance gates**
   - Local unit/type/build/lint gates.
   - Integration gates that may skip cleanly.
   - Live Hermes gates that must remain `pending` until proven with a real runtime.
   - Security gates for credentials, hooks, MCP resources, approvals, and egress.

7. **Rollout order**
   - Stepwise sequence that ties up CE-1 first, then CE-2, then CE-3.
   - Explicit rollback/fail-open behavior for hooks and rotation.
   - What should be marked `source-wired`, `runtime-accepted`, or `pending`.

8. **Open questions**
   - Only questions that materially affect implementation and cannot be resolved from repo inspection or
     current primary-source research.

## Output Requirements

Produce the plan as a repo-ready Markdown document, ideally:

`mvp-build/second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md`

Also propose updates to:

- `mvp-build/second-half-plan/context-engineering/README.md`
- `mvp-build/CODEGRAPH.md`
- `mvp-build/memory/MEMORY.md`
- a new timestamped handoff in `mvp-build/memory/`

Keep claims precise. Do not claim live Hermes/provider/runtime acceptance without a real proof run. Use
the Realness Rule vocabulary already in the repo.
