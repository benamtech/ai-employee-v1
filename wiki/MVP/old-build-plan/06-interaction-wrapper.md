# Interaction Wrapper

Status: complete

## Purpose

The wrapper is the owner-facing AMTECH product surface over the live employee. It supports natural work over SMS and a richer web view without exposing raw Hermes or Manager infrastructure.

## SMS

SMS is the default for:

- owner commands;
- estimate progress/results;
- artifact links;
- approval prompts;
- customer reply notifications;
- deposit/invoice status;
- reminders.

Inbound SMS requires Twilio signature validation and verified-owner matching.

## Web

Use a stable route such as `agent.amtechai.com/{employee_id}`.

Web provides:

- authenticated chat with same employee state;
- PDF/artifact preview;
- approval buttons as affordances over the same approval primitive;
- connector status and consent handoff;
- job/reminder status.

Current-docs research note, 2026-06-29: the wrapper should sit in front of Hermes API server/Runs/Sessions/Jobs rather than exposing raw Hermes admin surfaces. It should render Hermes tool progress, Manager artifacts, approval controls, connector consent/status, and provider-event context as one employee experience.

## Estimate Interaction

The employee flow:

1. Owner describes walkthrough.
2. Employee checks business brain for pricing, materials, markup, logo, estimate template, and customer details.
3. Employee asks only missing questions.
4. Employee gives a price/materials take and accepts corrections.
5. Owner approves final estimate.
6. Employee creates official PDF.
7. Owner receives a signed output link.

If no logo exists, the employee asks for one before final document rendering but can still create a clean AMTECH-default estimate if the owner says to proceed.

## Artifact Links

Artifact URLs should follow an owner-safe shape:

```text
agent.amtechai.com/{employee_id}/output/{artifact_id}
```

The route validates signed token/account access before serving. SMS links may include a signed token. Web-authenticated views may use session auth plus artifact ownership.

## Approvals

One approval primitive powers SMS and web.

Required approvals:

- sending estimate email;
- sending invoice;
- spending/moving/refunding money;
- expanding provider scopes;
- deleting external data.

Approval prompt example:

```text
Here is the draft to jane@example.com with estimate-1042.pdf attached. Send it?
```

## Notification Behavior

Provider events become employee messages, not raw alerts.

Example:

```text
Jane replied that the estimate looks good and the 20% deposit is fine if you can start Tuesday at 9:30. Want me to send the deposit invoice for $840?
```

Default notification channel is SMS, even if webchat exists. If webchat is active, the event can also appear there.

## Reminder Behavior

After customer acceptance, the employee stores the start window and reminder internally. It may offer:

```text
I set an internal reminder for Tuesday morning. You can connect Google Calendar later if you want this on your calendar too.
```

Google Calendar is not required for MVP.
