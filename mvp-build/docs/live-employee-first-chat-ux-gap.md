# Live Employee First-Chat UX Gap

Status: draft
Scope: applied UX and ease-of-use guidance for the live employee's first chat

## What failed

The transcript showed the live employee jumping between:

- email setup;
- MCP UI / Gmail connector intent;
- estimate work;
- runtime health noise;
- and then back to email setup.

That is not a calm first-contact experience. It reads like a tool router, not a managed employee.

## What it should feel like

- Light orientation first.
- One clear next step.
- Enough capability to feel powerful.
- No unnecessary technical jargon.
- No sudden context collapse into unrelated work.

The first chat should feel like: "I can help with that, and here is the right path," not "pick a subsystem."

## Applied UX gap

We have product language and backend contracts, but we do not yet have enough applied UX research for:

- first-chat tutorial framing;
- how much guidance to show before a connector or setup action;
- when to surface power vs. when to reduce choices;
- how to recover when the user switches topics mid-stream;
- how to keep the experience coherent across live employee, onboarding, and connector setup.

## Design direction

- Use a compact tutorial/orientation layer on first contact.
- Prefer business-language affordances over system-language affordances.
- Route into the correct connector or setup surface without narrating internals.
- Preserve momentum when the owner changes topics.
- Keep the employee voice confident and concise.

## Related docs

- `docs/public-interaction-standard.md`
- `docs/post-signup-email-onboarding-plan.md`
- `docs/onboarding-live-review-2026-07-16.md`
- `docs/production-normal-employee-live-deploy-runbook.md`

