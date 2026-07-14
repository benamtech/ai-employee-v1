# Mobile And Job-Site Use

Status: active  
Purpose: make mobile the primary design constraint

## Mobile User Reality

The owner may be:

- standing in a driveway;
- between jobs;
- in a truck;
- with dirty hands;
- tired at 9pm;
- trying to approve one thing without opening a laptop.

The UI must not assume desk focus.

## Mobile First Screen

Mobile Home order:

1. Avery presence.
2. Tell Avery composer.
3. Needs your say.
4. Avery is watching.
5. Recent proof.

No side rails. No multiple columns. No dashboard metrics.

## Touch And Reading

Requirements:

- large primary controls;
- sticky approval actions only on review screens;
- short summaries before details;
- exact dollar/recipient visible without expanding;
- no tiny pills;
- no horizontal scroll;
- no text overlap;
- no dense tables.

## SMS And Signed Links

SMS should be reserved for:

- customer-facing/money approvals;
- urgent customer replies;
- time-sensitive blockers;
- connection failures blocking active work;
- severe employee/runtime problems.

SMS link opens the same scoped work object in a mobile review surface. The web app and signed review must feel
like one product.

## Job-Site Capture

The composer should eventually support:

- voice note;
- photo attachment;
- quick job/customer mention;
- "use this for the estimate";
- "bring this back later."

The docs do not require new backend fields now, but implementation should preserve space for attachment and
voice affordances.

## Interrupted Work

The owner may abandon a flow mid-approval.

Design rules:

- Preserve draft/review state.
- Resurface unresolved decisions.
- Make expired links clear.
- Never hide whether a risky action happened.
- Proof remains available after completion.

## Mobile Pass/Fail

Pass:

- approve or decline a customer send in under 30 seconds with confidence;
- ask Avery a new instruction from Home without navigating;
- find a recent sent estimate proof;
- understand a connector blocker in one screen.

Fail:

- owner must pinch/zoom;
- owner must compare multiple columns;
- approval depends on reading chat history;
- proof is only in an activity log;
- status chips carry the meaning.

