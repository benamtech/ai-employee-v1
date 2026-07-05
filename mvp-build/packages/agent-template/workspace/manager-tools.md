# Manager tool calls

Use Manager tools for product-owned state, artifact storage, signed links, approvals, and connector setup.
If the owner asks for any product action, prefer a Manager tool over a conversational promise.

Endpoint:

```text
POST ${MANAGER_API_ORIGIN}/manager/tools/{tool_name}
Authorization: Bearer ${MANAGER_INTERNAL_TOKEN}
Content-Type: application/json
```

Always include:

```json
{
  "account_id": "{{ACCOUNT_ID}}",
  "employee_id": "{{EMPLOYEE_ID}}"
}
```

Return discipline:

- If the Manager returns `status:"ok"`, report the user-facing summary and the proof/link/status.
- If the Manager returns `status:"failed"` or the HTTP call fails, say what blocked the action in one
  line. Do not pretend the work started.
- If you cannot call this endpoint from the current runtime, say: "I can't reach the Manager action
  interface from this runtime yet." Then ask the owner to use the Work Surface control.

Connector setup:

When the owner asks to connect Gmail/email:

1. Call `connect_email` with:

```json
{
  "account_id": "{{ACCOUNT_ID}}",
  "employee_id": "{{EMPLOYEE_ID}}",
  "provider": "gmail",
  "requested_scopes": []
}
```

2. If the response includes `proof.consent_url`, give that link to the owner or surface it through
   the Work Surface. Say that Gmail is **pending OAuth**, not connected.
3. Only say Gmail is connected after `complete_gmail_oauth` succeeds through the OAuth callback and
   Manager records a connected connector/watch.

Do not say "check your browser", "the auth window opened", or "connecting now" unless the Manager
returned a consent URL or connected proof.

Estimate artifact sequence:

1. `create_estimate_artifact`
2. `render_estimate_pdf`
3. `create_signed_artifact_link`
4. `request_approval` before any customer-facing send

Event surface:

- Provider/customer facts must enter through Manager events. Do not invent customer replies,
  payment events, or connector state from chat.
- For an owner-authored internal event, call `send_employee_event`.
- For due reminders and digests, let the Manager scheduler run them; do not claim a scheduled job
  fired until Manager records it.

Close-the-loop reminder sequence (after a customer reply or a paid deposit):

1. Confirm the start time with the owner in one line (use `request_approval` with
   `action_key: set_job_reminder` if you want the gate recorded).
2. `set_internal_reminder` with `scheduled_at`, a `message` you write in the owner's
   voice, and a `job` body (`estimate_artifact_id`, `customer_ref`, `start_window`).
   Pass `approval_id` when you asked for a confirmation. This creates the job folder.
3. The scheduler fires due reminders by SMS (`dispatch_due_reminders`) — you do not
   call that yourself; it is driven on a timer.

Never expose local `./output` paths to the owner. Return only AMTECH signed artifact links.
