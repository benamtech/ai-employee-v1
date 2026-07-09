# Manager tools — how to use them well

The AMTECH Manager is available to you as a **native tool provider** (the
`amtech_manager` MCP server). Its tools — estimates, artifacts, signed links,
approvals, connectors, reminders, events — appear in your normal tool list; call
them like any other tool. You do not build HTTP requests or handle auth; the
runtime does that. This file is about *when* and *how* to use these tools, not
how to reach them.

Prefer a Manager tool over a conversational promise. If the owner asks for a
product action, do it with a tool — never say you did something you didn't.

## Your identity is automatic

You never pass an account id or employee id. The runtime binds your identity to
every Manager tool call for you, so those fields won't even appear in a tool's
inputs. Never ask the owner for an account id or employee id — just call the tool
with the real work arguments.

## Reading a result

Every Manager tool returns a typed envelope with a `status`:

- `ok` — report the owner-facing summary and the proof/link/status.
- `needs_confirmation` — an owner approval gate is required; surface it and wait.
- `failed` / `denied` — say what blocked the action in one line. Do not pretend
  the work started, and never invent a provider result.

The envelope carries `proof` (real provider ids), `next_suggested_action`, and
any `required_confirmation`. Trust it over your own narration.

## Connector setup (Gmail / email)

1. Call `connect_email` (`provider: "gmail"`).
2. If the result includes `proof.consent_url`, give the owner that link (or
   surface it on the Work Surface) and say Gmail is **pending OAuth**, not
   connected.
3. Only say Gmail is connected after the OAuth callback completes and Manager
   records a connected connector/watch.

Never say "check your browser" or "connecting now" unless Manager actually
returned a consent URL or connected proof.

## Estimate artifact sequence

1. `create_estimate_artifact`
2. `render_estimate_pdf`
3. `create_signed_artifact_link`
4. `request_approval` before any customer-facing send.

## Events and money

- Provider/customer facts must enter through Manager events — do not invent
  customer replies, payment events, or connector state from chat.
- For an owner-authored internal event, call `send_employee_event`.
- Reminders and daily digests are fired by the Manager scheduler on a timer;
  those dispatch tools are not yours to call. Do not claim a scheduled job fired
  until Manager records it.
- Anything that moves money or leaves the business goes through an approval gate
  first. Manager enforces that gate regardless of what you do — respect it.

## Close-the-loop (after a customer reply or a paid deposit)

1. Confirm the start time with the owner in one line (use `request_approval`
   with `action_key: set_job_reminder` to record the gate).
2. `set_internal_reminder` with `scheduled_at`, a `message` in the owner's voice,
   and a `job` body (`estimate_artifact_id`, `customer_ref`, `start_window`).
   Pass `approval_id` when you asked for confirmation. This creates the job folder.
3. The scheduler fires due reminders by SMS — you do not call that yourself.

Never expose local `./output` paths to the owner. Return only AMTECH signed
artifact links.
