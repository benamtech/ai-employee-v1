# Phase 3 - SMS Ambient Inbox And Link Previews

Status: planned

Goal: make SMS a complete owner surface, not a notification afterthought.

## Summary

For the target owner, SMS may be the primary UI. Every task, artifact, connector action, approval, and result must be inspectable and actionable from a phone. The web app should enrich SMS, not replace it.

Use the Hermes GUI research principle here: SMS is not a lesser backend. It is a compact renderer for the same `SurfaceEnvelope`, `WorkResource`, and `WorkAction` objects that the web desk renders richly.

## SMS Grammar

Use one grammar for all employee messages:

- Notify: result or status, no action required.
- Question: one clear question, one expected reply.
- Review: inspect this, then approve/reject/respond.
- Failure: what broke, what the employee can do next.
- Receipt: what happened, when, and proof if useful.

Examples:

- "Estimate is ready for Jane's kitchen, $4,200. Review it here: <signed link>"
- "Jane asked if Tuesday at 9:30 works. Want me to lock that in?"
- "Deposit invoice is drafted for $1,250. Review before I send: <signed link>"
- "Email disconnected. Reconnect it here and I will test it: <signed link>"

## Key Changes

- Add signed mobile preview routes for:
  - work event;
  - approval;
  - artifact/output;
  - connector consent/status;
  - task/run status;
  - job folder.
- Add a universal link payload format that maps signed tokens to account, employee, resource type, resource id, expiry, and allowed actions.
- Render mobile previews from the same WorkEventDescriptor/artifact/task data used by web.
- Move toward rendering from `SurfaceEnvelope`/`WorkResource`/`WorkAction` once Phase 4 introduces them, keeping `WorkEventDescriptor` as the bridge from the current code.
- Add sticky mobile action controls for approve, reject, reply, edit/tweak, acknowledge.
- Route SMS replies into the same owner-turn pipeline as web replies.
- Add SMS copy rendering tests for every move type and deliverable type.
- Add Twilio delivery status handling and repair visibility.

Required SMS affordances from the Hermes WebUI/Desktop research translation:

- owner can reply while a run is busy and have that message queued or turned into a mid-run steering note where supported;
- owner can send "stop" and see a truthful result;
- every approval link has a short text fallback (`SEND`, `EDIT`, `NO`, numbered choices);
- links unfurl with title, amount/recipient/risk where applicable;
- every receipt links to proof without exposing raw provider payloads.

## Link Preview Rules

- Links are signed, scoped, expiring, and auditable.
- A link may allow read-only preview or specific actions only.
- A money/customer action preview must show the exact payload before approval.
- A preview must work without exposing service-role credentials or raw provider payloads.
- Expired links should offer a safe reissue path, not a stack trace.

## SMS-Only Acceptance Scenarios

- Owner receives an estimate preview link, opens it, approves send, and gets a sent receipt.
- Owner receives a customer-reply question, replies by SMS, and the answer appears in web history.
- Owner receives a deposit invoice review link, opens it, rejects with an edit note, and employee receives that note.
- Owner receives a connector reconnect link, completes consent on mobile, and receives a test-passed receipt.
- Owner receives a reminder/job-start question and confirms the reminder from SMS.

## Tests

- Unit tests for SMS rendering by move/deliverable.
- Unit tests for signed preview token verify/expiry/action scope.
- Route tests for each preview type.
- Playwright mobile tests for approval and reply previews.
- Golden-path SMS-only manual script.

## Assumptions

- SMS remains Manager-owned even though Hermes has messaging surfaces.
- Owner web session and signed-link auth can coexist; signed links are scoped to a resource and action, not a full account session.
- Twilio trial restrictions may limit live proof recipients, but local and provider-accepted paths must be labeled honestly.
