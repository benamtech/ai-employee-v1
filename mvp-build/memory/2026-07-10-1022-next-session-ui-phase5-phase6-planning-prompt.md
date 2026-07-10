# Next-session UI/product-operation review + Phase 5/6 planning prompt

Date: 2026-07-10 10:22
Status: active handoff prompt
Scope: next session for deep UI/product-operation review, Phase 4 closure planning, production Phase 5 implementation planning, and reasonable Phase 6 groundwork

Use this prompt to start the next session.

```text
You are Codex working in `/home/georgej/AMTECH/GTM-RESEARCH`.

Goal: plan a deep review of the owner UI and end-to-end product operation against AMTECH's tool-agnostic materialization principles, then produce a decision-complete plan to tie up Phase 4 production loose ends, implement second-half Phase 5 at production level, and lay reasonable groundwork for Phase 6 without overloading the run.

Default stance:

- Start in review/orientation. Do not assume every finding must become code immediately.
- The likely deliverable is a plan first: what to review, what to fix, what to build for Phase 5, what to defer to Phase 6.
- If the user explicitly asks to implement, keep changes tightly scoped and verification-driven.
- Treat the current dirty tree as previous-agent/user work. Do not revert it.

Session initiation protocol:

1. Read `identity.md`.
2. Read root `CODEGRAPH.md`.
3. Read `mvp-build/CODEGRAPH.md`.
4. Read `mvp-build/CLAUDE.md` and `mvp-build/AGENTS.md`.
5. Read `mvp-build/memory/MEMORY.md`.
6. Read the latest security/Phase 4 handoffs:
   - `mvp-build/memory/2026-07-10-0116-agent-trust-boundary-hardening.md`
   - `mvp-build/memory/2026-07-10-0045-phase-4-source-wired-materialization.md`
   - `mvp-build/memory/2026-07-10-0012-phase-4-hardening-closure-and-next-session.md`
7. Read the junior-dev codebase guide for a journey-oriented source map:
   - `wiki/MVP/codebase-reading-guide-3-hour.md`
8. Read the current planning/research docs for this task:
   - `mvp-build/second-half-plan/README.md`
   - `mvp-build/second-half-plan/phase-04-tool-agnostic-capability-and-renderer-layer.md`
   - `mvp-build/second-half-plan/phase-05-trial-operations-admin-billing.md`
   - `mvp-build/second-half-plan/phase-06-free-trial-and-paid-pilot-readiness.md`
   - `wiki/MVP/second-half-current-and-future-state.md`
   - `wiki/MVP/event-driven-office-and-generative-ui.md`
   - `wiki/principle-graph-materialization.md`
   - `wiki/principle-deliverable-driven-surfaces.md`
   - `mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`
9. Inspect the dirty tree with `git status --short`.
10. Use `rg`/targeted file reads before forming recommendations. Avoid broad rewrites.

Important current context:

- Phase 3 SMS signed previews/actions are source-wired, not live provider/tool-loop accepted.
- Phase 4 capability/materialization is source-wired, not provider/runtime accepted.
- Pre-tenant agent trust-boundary hardening is source-wired: scoped per-employee MCP credentials, no shared `MANAGER_INTERNAL_TOKEN` in rendered employee env/config, employee self-resolution blocked for high-risk approvals, Docker launch hardening added.
- Live DB migration/advisor proof is still pending for `0022` and `0023`.
- Old rendered employee profiles may still contain legacy config until reprovisioned.
- The real live gate remains: a model/provider path that executes Hermes/MCP tool calls, not tool-call JSON emitted as plain text.
- Egress control is still a pre-tenant requirement and was not solved by Docker hardening.

Review target: UI and product operation against tool-agnostic principles

Evaluate whether the product actually behaves like one business work graph materialized across surfaces:

1. Owner Work Surface
   - Inspect `apps/web/app/agent/[employeeId]/AgentClient.tsx` and component/lib files under that route.
   - Does the UI organize work by owner needs: Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings?
   - Are outputs/actions surfaced as business work, not raw tools/MCP/API internals?
   - Are errors owner-readable and non-technical?
   - Does the surface make approval/reject/respond/edit flows obvious and trustworthy?
   - Does it degrade cleanly under SSE reconnect/poll fallback?

2. SMS and signed previews
   - Inspect `apps/web/app/agent/[employeeId]/review/*`, preview action route, `preview-links.ts`, `preview-render.ts`, SMS rendering in `work-events.ts` and `employee-events.ts`.
   - Does SMS act as an ambient inbox, not a second product?
   - Do preview links render the same `WorkResource` semantics as web?
   - Are token scope, expiry, single-use, and actor attribution preserved?

3. Capability/materialization layer
   - Inspect `packages/shared/src/materialization.ts`, `apps/manager/src/lib/materialization.ts`, `apps/manager/src/lib/capability-registry.ts`, `employee-stream.ts`, `mcp-server.ts`.
   - Does `SurfaceEnvelope` separate source facts, proof, safety, and rendering?
   - Do generic resources/actions preserve gates for money, outbound messages, connector credentials, destructive/external actions?
   - Does capability registry avoid claiming unavailable live capabilities?
   - Are proof IDs and safety states useful to owner/admin surfaces without exposing secrets?

4. Tool-agnostic principle audit
   - For every UI/rendering path, ask: would this also work for a Gmail draft, Stripe invoice, estimate PDF, connector setup, reminder, generated media, external system action, and future tool result?
   - Where native cards are required, are they required because of trust/safety/UX, not one-off implementation habit?
   - Where generic rendering is used, does it avoid flattening important business context?

Phase 4 loose ends to plan or implement if safely scoped:

- Apply/migrate `0022_phase4_materialization.sql` and `0023_agent_boundary_hardening.sql` live when env/approval allows; run Supabase advisors/privilege checks.
- Add or tighten tests proving owner/browser-safe materialized payloads do not expose secret refs, raw provider payloads, raw MCP internals, stack traces, or global IDs where not needed.
- Ensure MCP resources remain read-only, identity-bound, and redacted.
- Reprovision a fresh employee profile to prove scoped MCP auth path is used live.
- Add a live/proof checklist for Phase 4: capability discovery, MCP resources, materialized WorkResources, signed previews, and SSE updates.

Phase 5 production-level planning target:

The likely Phase 5 scope is trial operations/admin/billing readiness, but keep it product-first and lean. Build or plan only the minimum production-grade seams that make a pilot operable.

Recommended Phase 5 areas:

1. Operator/admin diagnostics
   - A Manager-only/admin-ready view over employee state, materialization diagnostics, runtime health, connector status, recent events, pending approvals, repair hints, and proof IDs.
   - Keep it internal/operator-facing; owner should still only see the employee.

2. Trial operations controls
   - Account/employee lifecycle basics: list/search employees, inspect account, suspend/resume/disable employee, rotate/revoke scoped MCP credential, reprovision or mark needs reprovision.
   - Number/provider status visibility for Twilio/Gmail/Stripe.

3. Billing/admin groundwork
   - Do not overbuild paywalls unless user asks.
   - Existing MVP policy is default-allow; Phase 5 should add visibility and scaffolding, not block product use.
   - If touching billing, preserve approval gates and test-mode Stripe policy.

4. Safety/ops visibility
   - Surface stuck turns, failed wakes, failed webhooks, repair queue items, expiring links/watches, runtime health, and recent audit outcomes.
   - No secrets/raw provider payloads in admin responses unless explicitly justified and protected.

5. Acceptance/proof
   - Every new admin/ops endpoint should have unit tests for auth, redaction, cross-account denial, and failure shape.
   - Do not claim provider/runtime acceptance without real proof IDs.

Phase 6 groundwork if reasonable:

- Only lay seams that naturally fall out of Phase 5 work.
- Possible groundwork:
  - trial readiness checklist endpoint/report;
  - budget/cost visibility hooks over existing metering ledgers;
  - feature/trial state fields that remain default-allow;
  - preflight warnings for missing egress control, old legacy rendered profiles, missing live migrations, missing provider proofs;
  - onboarding-to-pilot runbook output.
- Do not implement a full billing system, full auth productization, KMS rotation, egress proxy, DLQ worker, observability dashboard, or multi-host orchestration unless the user explicitly expands scope.

Important constraints:

- Do not edit old build-plan docs unless explicitly asked. Current forward work is in `mvp-build/second-half-plan/` and current factual source state is in `mvp-build/CODEGRAPH.md` + `mvp-build/memory/`.
- Owner-facing surfaces must not expose MCP/API/toolset/raw JSON/stack traces.
- Manager/admin diagnostics may expose technical proof IDs, but never secrets or raw provider payloads.
- Keep public API/interface changes explicit and tested.
- If touching Supabase/RLS/migrations, use the Supabase skill instructions first and verify with advisors if live env is available.
- If touching UI, verify mobile and desktop behavior through fixture mode and `npm run ui:test`.

Recommended local verification from `mvp-build/`:

- `npm run typecheck`
- `npm run test:unit`
- `npm run lint`
- `npm run build`
- `npm run ui:test` for UI/surface changes
- `npm run test:integration` if env allows; env-gated skips are acceptable but must be reported honestly

Expected output if the user asks for planning:

- Produce a decision-complete plan, not a vague roadmap.
- Structure:
  1. Review findings / product-operation gaps
  2. Phase 4 closure items
  3. Phase 5 production implementation
  4. Reasonable Phase 6 groundwork
  5. Test and acceptance plan
  6. Assumptions and explicit deferrals
- Include exact files/modules to inspect or change when necessary, but keep the plan behavior-level where possible.

If implementation happens:

- Work in narrow vertical slices.
- Add tests with every nontrivial behavior change.
- Preserve existing dirty-tree work.
- Update `mvp-build/memory/` after substantial architectural or phase work.
- Update `mvp-build/CODEGRAPH.md` and root `CODEGRAPH.md` only if source layout/status/orientation changed materially.
```
