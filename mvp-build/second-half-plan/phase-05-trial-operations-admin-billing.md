# Phase 5 - Trial Operations, Admin, Billing

Status: source-wired; live operator proof pending

Goal: make the AI Employee factory operable for free trials and early paid pilots without direct database surgery.

## Summary

AMTECH may run dozens or hundreds of Hermes employee instances. The operator needs an internal system to provision, monitor, repair, meter, bill, and support those employees. The owner-facing product stays simple; the operator admin is internal.

The Hermes GUI research applies here through the factory lens: internal admin is the operator's version of the employee desk. It should show the same materialized state as the owner surface, plus raw provenance, health evidence, repair controls, cost, and support audit.

Source state as of 2026-07-10: the lean production-shaped Phase 5 slice is implemented in source. It includes shared admin contracts/routes, migration `0025_phase5_admin_ops.sql`, Manager platform-role/support-audit/admin-action tables, `/manager/admin/*` endpoints, a redacted internal `/admin` console with a production browser-token gate, employee lifecycle/MCP credential/event repair support actions, readiness reporting, and billing/trial state scaffolding. Billing remains default-allow/scaffolded; this phase does not add automated AMTECH subscription collection or a paywall.

Live proof remains pending: migrations `0022`-`0025` need live application/advisor checks, platform operator rows need seeding, a fresh employee needs reprovision proof for scoped MCP credentials, egress control remains unsolved, and the Hermes/model tool-loop gate is still blocked by the current bridge returning tool-call JSON as text.

## Key Changes

- Implement production owner login/session flow; remove reliance on dev owner-login for normal use. `Pending` for this slice; admin remained internal/operator-facing.
- Add account states. `Source-wired` as account fields in migration `0025`:
  - trial;
  - active;
  - needs_payment;
  - suspended;
  - cancelled.
- Add minimum operator admin. `Source-wired` through `apps/manager/src/lib/admin.ts`, `/manager/admin/*`, and `apps/web/app/admin/*`:
  - account list/detail;
  - employee list/detail;
  - provisioning jobs;
  - runtime health;
  - connector health;
  - repair queue;
  - events/messages/approvals;
  - metering/cost;
  - audit log.
- Add a surface/materialization inspector. `Source-wired` in the employee detail/readiness admin view:
  - latest envelopes/resources/actions for an employee;
  - raw Hermes run/session ids and Manager tool/audit ids behind them;
  - SMS/web/link delivery receipts;
  - preview rendering failures;
  - owner-visible copy vs internal proof.
- Add account-safe support actions. `Source-wired` for suspend, resume, disable with confirmation, mark needs reprovision, rotate/revoke scoped MCP credentials, rerun runtime health, redeliver event, and suppress noisy source. Still `pending`: resend claim link, regenerate owner session, retry provisioning stage, restart runtime, force connector reauth, and export diagnostic bundle.
- Add AMTECH billing scaffold separate from owner Stripe Connect. `Source-wired` as trial/plan/billing fields and admin display, not automated subscription collection:
  - plan;
  - trial start/end;
  - setup fee;
  - subscription state;
  - invoice/payment state;
  - credits/overrides;
  - suspension policy.
- Add budget/cost visibility from `work_runs`, `meter_events`, and `tool_invocations`. `Source-wired` as admin read-model panels over existing metering ledgers; rollups/budget policy enforcement remain later work.

## Admin Security Rules

- Platform operators are not normal customer account members. `Source-wired` through `platform_users` and `platform_user_roles`.
- Support access requires role, reason, audit row, and least privilege. `Source-wired` through DB role checks, support reason header, `support_access_sessions`, `admin_action_events`, and `audit_log`.
- No raw provider tokens, raw email bodies, raw webhook payloads, or secrets in browser/admin payloads. `Source-wired` by server-side admin redaction plus tests; continue to test every new endpoint.
- Billing rail for AMTECH subscription is separate from customer money movement through Stripe Connect.
- Dangerous support actions require confirmation and audit. `Source-wired` for disabling employees and admin action logging.

## Health Model

Every account/employee should have a health summary:

- Manager reachable;
- runtime reachable;
- Hermes capabilities/toolsets fresh;
- SMS sender assigned and recent proof exists;
- Gmail connected/watch valid if enabled;
- Stripe Connect status known if enabled;
- artifacts/signed links working;
- scheduler/Jobs recent;
- repair queue severity;
- cost/budget state;
- billing state.

Health states:

- green: owner work can proceed;
- yellow: degraded but owner-critical work can continue;
- red: blocked or trust-threatening;
- gray: no signal or not configured.

## Tests And Acceptance

- Admin route auth tests. `Done` in `tests/unit/admin-routes.test.ts`.
- RLS/authorization tests for owner vs platform operator data. `Partially done` via route/auth tests; live Supabase RLS/advisor proof for `0025` remains pending.
- Unit tests for account health summary. `Partially done` through dashboard/readiness tests.
- Unit tests for billing state transitions. `Pending`; billing is scaffold/display only.
- Unit tests for support action audit requirements. `Done` for support reason/audit and MCP rotation.
- Browser smoke for operator dashboard and account detail. `Partially done` through Next build and UI fixture smoke; dedicated admin browser smoke remains pending.

Acceptance:

- A single operator can answer: who is live, who is broken, who needs payment, who is costing too much, which connector failed, which runtime is unreachable, and what repair action is available.
- A free trial can be suspended/cancelled without deleting proof/history.
- Paid pilot billing status can be tracked without touching customer Stripe Connect funds.

Local verification on the source-wired slice: shared build, targeted admin/materialization tests, full `typecheck`, 68 files / 406 unit tests, `lint`, `build`, `ui:test`, and env-gated integration skips all passed. Live acceptance is not claimed.

## Assumptions

- MVP billing can be scaffolded before full automated Stripe subscription collection, but the data model and admin surface must make paid conversion operationally real.
- Existing metering ledgers are the source for cost views, even if some costs are initially estimated or unknown.
- Operator admin can be plain and dense; it should prioritize correctness over polish.
