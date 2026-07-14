# Approvals, Proof, And Trust

Status: active  
Purpose: define safety moments without making the product feel like compliance software

## The Approval Rule

The owner must approve before:

- customer-facing sends;
- money movement;
- public publishing;
- protected sharing;
- durable external writes.

This rule is not negotiable and must remain exact across web, SMS, signed review, generated UI, and future
clients.

## Approval Design

An approval is a permission moment, not a task card.

Every approval must answer:

- What did Avery prepare?
- Who or what will be affected?
- What exactly will be sent, charged, published, shared, or written?
- What happens after approval?
- What proof will be saved?

The owner should not need to infer consequences from labels.

## Approval Copy

Use verbs with consequences:

- Approve send
- Approve invoice
- Approve deposit link
- Save to QuickBooks
- Publish draft

Avoid generic:

- Submit
- Continue
- Run
- Confirm
- Resolve

## Risk Tone

Risk should be precise, not loud.

- Customer/money actions get a clear framed review.
- High-risk or destructive actions can use red.
- Normal approvals use calm amber or blue.
- Completed proof uses green sparingly.

Do not create "risk badge soup."

## Proof Model

Proof is the trust interface.

Proof should include:

- owner approval receipt;
- sent/created/provider receipt;
- artifact/document link;
- relevant customer/job context;
- time;
- who authorized it;
- safe reference ID only when useful.

Proof should not require the owner to understand audit tables or provider payloads.

## Refinding Proof

The owner finds proof by:

- recent action;
- customer/job;
- artifact/document;
- date;
- search;
- conversation context.

Do not require:

- scrolling through chat;
- remembering an approval ID;
- navigating raw activity logs;
- checking separate tasks/outputs/events tabs.

## Trust Repair

When Avery is wrong or blocked:

- say what failed in business language;
- say whether anything left the business;
- offer the next safe action;
- keep proof of any partial action;
- never imply success if the write/send did not happen.

Examples:

- "Avery could not reach QuickBooks. Nothing was saved there."
- "The email was not sent. The draft is still here."
- "This link expired. Ask Avery to send a fresh review link."

## Generated UI Safety

Generated cards may help inspect work, but they do not own permission.

Stable approval frame owns:

- action labels;
- risk/consequence;
- approval/decline/reply behavior;
- token scope;
- proof receipt.

No generated card can bypass or obscure the gate.

