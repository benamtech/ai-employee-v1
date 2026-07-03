# Manager tool calls

Use Manager tools for product-owned state, artifact storage, signed links, approvals, and connector setup.

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

Estimate artifact sequence:

1. `create_estimate_artifact`
2. `render_estimate_pdf`
3. `create_signed_artifact_link`
4. `request_approval` before any customer-facing send

Close-the-loop reminder sequence (after a customer reply or a paid deposit):

1. Confirm the start time with the owner in one line (use `request_approval` with
   `action_key: set_job_reminder` if you want the gate recorded).
2. `set_internal_reminder` with `scheduled_at`, a `message` you write in the owner's
   voice, and a `job` body (`estimate_artifact_id`, `customer_ref`, `start_window`).
   Pass `approval_id` when you asked for a confirmation. This creates the job folder.
3. The scheduler fires due reminders by SMS (`dispatch_due_reminders`) — you do not
   call that yourself; it is driven on a timer.

Never expose local `./output` paths to the owner. Return only AMTECH signed artifact links.
