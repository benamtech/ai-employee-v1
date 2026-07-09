# Phase 5 - Trial Operations, Admin, Billing

Status: planned

Goal: make the AI Employee factory operable for free trials and early paid pilots without direct database surgery.

## Summary

AMTECH may run dozens or hundreds of Hermes employee instances. The operator needs an internal system to provision, monitor, repair, meter, bill, and support those employees. The owner-facing product stays simple; the operator admin is internal.

The Hermes GUI research applies here through the factory lens: internal admin is the operator's version of the employee desk. It should show the same materialized state as the owner surface, plus raw provenance, health evidence, repair controls, cost, and support audit.

## Key Changes

- Implement production owner login/session flow; remove reliance on dev owner-login for normal use.
- Add account states:
  - trial;
  - active;
  - needs_payment;
  - suspended;
  - cancelled.
- Add minimum operator admin:
  - account list/detail;
  - employee list/detail;
  - provisioning jobs;
  - runtime health;
  - connector health;
  - repair queue;
  - events/messages/approvals;
  - metering/cost;
  - audit log.
- Add a surface/materialization inspector:
  - latest envelopes/resources/actions for an employee;
  - raw Hermes run/session ids and Manager tool/audit ids behind them;
  - SMS/web/link delivery receipts;
  - preview rendering failures;
  - owner-visible copy vs internal proof.
- Add account-safe support actions:
  - resend claim link;
  - regenerate owner session;
  - retry provisioning stage;
  - restart/pause employee runtime;
  - force connector reauth;
  - replay event;
  - redeliver SMS/work card;
  - suppress noisy source;
  - export diagnostic bundle.
- Add AMTECH billing scaffold separate from owner Stripe Connect:
  - plan;
  - trial start/end;
  - setup fee;
  - subscription state;
  - invoice/payment state;
  - credits/overrides;
  - suspension policy.
- Add budget/cost visibility from `work_runs`, `meter_events`, and `tool_invocations`.

## Admin Security Rules

- Platform operators are not normal customer account members.
- Support access requires role, reason, audit row, and least privilege.
- No raw provider tokens, raw email bodies, raw webhook payloads, or secrets in browser/admin payloads.
- Billing rail for AMTECH subscription is separate from customer money movement through Stripe Connect.
- Dangerous support actions require confirmation and audit.

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

- Admin route auth tests.
- RLS/authorization tests for owner vs platform operator data.
- Unit tests for account health summary.
- Unit tests for billing state transitions.
- Unit tests for support action audit requirements.
- Browser smoke for operator dashboard and account detail.

Acceptance:

- A single operator can answer: who is live, who is broken, who needs payment, who is costing too much, which connector failed, which runtime is unreachable, and what repair action is available.
- A free trial can be suspended/cancelled without deleting proof/history.
- Paid pilot billing status can be tracked without touching customer Stripe Connect funds.

## Assumptions

- MVP billing can be scaffolded before full automated Stripe subscription collection, but the data model and admin surface must make paid conversion operationally real.
- Existing metering ledgers are the source for cost views, even if some costs are initially estimated or unknown.
- Operator admin can be plain and dense; it should prioritize correctness over polish.
