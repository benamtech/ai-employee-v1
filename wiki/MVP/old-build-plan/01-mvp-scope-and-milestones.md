# MVP Scope And Milestones

Status: complete

## MVP Definition

The MVP is the smallest complete office-work loop:

```text
signup -> real employee -> estimate PDF -> approved Gmail send
       -> real Gmail customer reply -> employee SMS notification
       -> approved Stripe deposit invoice -> internal job reminder
```

The implementation can be built and tested component by component, but the MVP is not complete until every element in that loop works against real provider rails.

## Milestone 1 - Account, Onboarding, Employee Claim

Deliver:

- Web front door at `amtechai.com/create-ai-employee`.
- Compatibility entry at `amtechai.com/claim`.
- SMS front door on an AMTECH-owned Twilio number.
- Onboarding agent that can chat before account creation but cannot provision until phone and account setup are complete.
- Phone verification, email/password account creation, employee claim, consent capture.

Acceptance:

- A landscaper, painter, florist, or similar test business can onboard conversationally.
- The raw conversation and structured business summary seed the employee brain.
- The owner receives a real employee reachable over SMS and web.

## Milestone 2 - Estimate Brain And PDF Artifact

Deliver:

- Employee behavior for walkthrough-to-estimate conversation.
- Business brain lookup before asking questions.
- Pricing discovery when rates/materials/markup are missing.
- Logo/template request when no branding exists.
- Estimate artifact with line items, assumptions, low-confidence flags, terms, customer info, and deposit terms.
- PDF generation and signed output link.

Acceptance:

- If onboarding already supplied pricing, the employee does not ask duplicate questions.
- If pricing is missing, the employee asks tight questions and stores durable answers.
- Owner can approve/correct the estimate and view the PDF from a signed link.

## Milestone 3 - Gmail Send And Reply Listener

Deliver:

- Gmail OAuth connector.
- Gmail connector test.
- Email draft with estimate PDF attachment.
- Approval gate before send.
- Real Gmail API send.
- Gmail watch/Pub/Sub setup with `historyId` storage.
- Reply processing from real mailbox changes.

Acceptance:

- The estimate email is sent from the connected Gmail account.
- A real reply from the customer is detected without manual payload injection.
- The employee texts the owner with the customer response, context, and proposed next action.

## Milestone 4 - Stripe Connect Deposit Invoice

Deliver:

- Stripe Connect setup in test mode.
- Account link onboarding for owners without Stripe connected.
- Existing Stripe account connection path where applicable.
- Deposit invoice calculation from approved estimate terms.
- Stripe customer/invoice/invoice item creation.
- Invoice send/payment URL.
- Stripe webhook verification and event trace.

Acceptance:

- Owner can approve a 20 percent deposit invoice.
- Stripe setup happens through real Stripe Connect in test mode.
- Customer receives a real Stripe invoice/payment link.
- Stripe webhook events update the employee/account state.

## Milestone 5 - Job Commitment And Reminder

Deliver:

- Employee extracts job start constraints from customer reply.
- Owner confirms job start/reminder.
- Internal reminder/job commitment record.
- SMS reminder policy.
- Google Calendar connection offer, not required for MVP.

Acceptance:

- Employee records the agreed start window and reminder.
- Owner gets the reminder through AMTECH even without Google Calendar.

## Milestone 6 - Pilot Hardening

Deliver:

- Runtime containment path for first pilots.
- Provider webhook signature checks.
- OAuth state checks.
- Provider token custody.
- Repair commands for Gmail watch, Stripe onboarding, invoice send, artifact links, and provisioning.
- Operator runbook.

Acceptance:

- A broken Gmail watch can be renewed.
- A failed Stripe onboarding link can be regenerated.
- A failed webhook can be replayed from provider event id.
- No customer secrets appear in normal logs.
