# Golden path — Step 5: Close the Loop — Job Reminder (Phase 5 acceptance)

Source: `wiki/MVP/old-build-plan/12-tests-demo-acceptance.md` §6 (M5 "Job Commitment and Reminder"),
`04-manager-tools.md` (Event & Reminder), `06-interaction-wrapper.md`.
This is the final MVP step: a real outside event becomes a confirmed internal job commitment with a
reminder that actually fires by SMS. Google Calendar stays an offer/fast-follow, not required.

## Env required
- Owner notify / reminder firing: `TWILIO_*` + (`EMPLOYEE_SMS_FROM` or `TWILIO_MESSAGING_SERVICE_SID`)
- Scheduler driver: a running Manager + `MANAGER_INTERNAL_TOKEN` (and `MANAGER_BASE_URL` for the tick script)

## Flow
1. A customer reply (`gmail.reply_received`, Step 3) or a paid deposit (`stripe.invoice_paid`, Step 4) lands
   as a work event whose `suggested_next_action` is "Confirm the job start with the customer and set a reminder."
2. The employee proposes a start window to the owner as a question/review move (e.g. "Set a reminder for
   Tuesday 9:30am?").
3. Owner confirms (`request_approval` `action_key: set_job_reminder` → `resolve_approval` approved; or a direct
   web confirm).
4. Employee calls `set_internal_reminder` with the `approval_id` and a `job` body (estimate ref, customer ref,
   start window) → creates a `job_commitments` row + a `scheduled` `reminders` row (idempotent per
   employee + scheduled time).
5. The scheduler (Hermes cron in prod; `npm run scheduler:tick` for dev) calls
   `dispatch_due_reminders`; when `scheduled_at <= now()` the reminder fires an SMS via `deliverEmployeeEvent`
   and transitions `scheduled → sent` (idempotent — only acts on `scheduled`).
6. `get_reminders` lists the reminder; the Work Surface shows it grouped under the job folder
   (estimate → email → deposit → reminder).

## Pass criteria
- [ ] Confirmed event creates exactly one `job_commitments` row and one `scheduled` `reminders` row.
- [ ] Re-confirming the same start time is idempotent (no duplicate reminder).
- [ ] `set_internal_reminder` with an `approval_id` requires that approval to be resolved/approved.
- [ ] A due reminder fires an SMS with a real Twilio `MessageSid` and flips to `sent`.
- [ ] A not-yet-due reminder is left untouched by `dispatch_due_reminders`.
- [ ] Running the scheduler tick twice does not double-send (reminder already `sent`).
- [ ] The owner receives the reminder through AMTECH even with no Google Calendar connected.
- [ ] The reminder/job folder renders on the Work Surface; nothing customer-facing is sent without approval.

## Proof ids to capture
- Reminder: `reminder_id`, `scheduled_at`, status (`scheduled` → `sent`)
- Job: `job_commitment` id, linked `estimate_artifact_id` / `customer_ref`
- Fire: Twilio `MessageSid` of the sent reminder, delivering `inbound_events` / `employee_messages` ids
