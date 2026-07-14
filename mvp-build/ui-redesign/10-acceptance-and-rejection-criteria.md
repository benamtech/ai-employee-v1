# Acceptance And Rejection Criteria

Status: active  
Purpose: prevent future implementation from recreating rejected UI patterns

## Acceptance Criteria

A future implementation passes if:

- First screen reads as "talk to Avery and see what Avery needs," not "dashboard."
- Mobile is the design source of truth.
- The primary composer is obvious and warm.
- Avery's independent work is visible without internal state.
- Approvals are exact, calm, and single-purpose.
- Customer sends, money, publishing, protected sharing, and durable external writes remain gated.
- Proof is saved and refindable without owner ledger management.
- Connected accounts communicate capability in business language.
- Work object views are available when inspection is needed.
- The UI uses minimal badges/status pills.
- Typography is human and not mono-heavy.
- The visual system is warm, dimensional, and branded without red dominance or purple AI haze.
- Owner UI avoids implementation vocabulary.

## Rejection Criteria

Reject the implementation if it:

- looks like a CRM, inbox, admin console, task manager, or SaaS dashboard;
- defaults to three columns;
- makes chat a giant transcript with no durable work moments;
- hides approval consequences behind generic buttons;
- requires scrolling through chat to find proof;
- uses badges/status pills as the main information system;
- exposes MCP/tool/run/webhook/API/materialization/runtime vocabulary;
- makes Connected a provider table;
- uses red/black or mono-heavy styling as the dominant look;
- uses fake AI gradients or purple haze;
- copies Aqua, Claude, ChatGPT, Hermes, or any other product literally;
- makes the owner supervise internal state instead of business judgment.

## First Screen Test

Show the first screen to a cold reviewer for 10 seconds. They should be able to say:

- I can talk to Avery here.
- Avery is already watching/preparing some work.
- Avery will ask before risky actions.
- I can find proof later.

If they instead describe tabs, dashboards, cards, streams, metrics, or a CRM, the design fails.

## Approval Test

For a customer-facing estimate send, the owner must see:

- customer/recipient;
- document or message preview;
- amount if relevant;
- what happens after approval;
- proof that will be saved;
- clear approve/tweak/decline paths.

If the owner must infer any of these from chat or status labels, the design fails.

## Mobile Test

At 390x844:

- no horizontal scroll;
- no overlapping text;
- primary controls are thumb-usable;
- approval action bar does not hide critical content;
- first screen is not a compressed desktop dashboard.

## Visual Test

The product should feel like calm, capable personal business software. Reject if screenshots read as:

- enterprise admin;
- analytics dashboard;
- AI demo page;
- monochrome terminal tool;
- red alert surface;
- generic Tailwind SaaS.

## Safety Test

No visual redesign can weaken:

- signed review scoping;
- artifact protection;
- owner approval gates;
- admin redaction/audit;
- proof capture;
- no-fake-live-proof rules.

If a generated UI or new component makes a risky action look like a normal button, the design fails.

