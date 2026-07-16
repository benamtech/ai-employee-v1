# Post-Signup Email Onboarding Plan

Status: draft
Scope: after-signup email setup routing, connector-first UX, and memory capture for missing facts

## Problem

The first instinct during the live employee's first chat drifted toward terminal IMAP configuration instead of the product's actual owner-facing surface: the interactive MCP/UI path and the Gmail connector UI.

That is the wrong default for a first-contact experience. It needs a light tutorial/orientation layer that feels powerful, not a support script or a form wizard.

## Intended Behavior

- Start with a short, capable orientation when the live employee is new or the owner is asking for a first setup action.
- When a new owner says "set up my email", prefer the interactive Gmail connector UI or the interactive MCP UI.
- Keep the flow inside the product unless the owner explicitly asks for mailbox-only terminal setup.
- If the needed account or connector fact is unknown, ask one focused question or capture it in memory instead of guessing.
- Treat IMAP/SMTP terminal setup as an operator fallback, not the first path.
- Make the experience feel like an employee helping, not a technician reading a checklist.

## Why

After-signup onboarding needs to feel like product setup, not infrastructure configuration.
The owner should see the business workflow first:

1. connect email;
2. confirm permissions;
3. verify the connected account;
4. continue onboarding in the same session.

This is consistent with the public interaction standard: conversation captures intent, secure controls collect secrets, and private setup stays out of chat unless explicitly required.

## Acceptance Criteria

- The first response to email setup should route toward the Gmail connector UI or MCP UI.
- IMAP setup should only appear when the owner explicitly requests terminal mailbox configuration or when connector setup is not available.
- Missing facts should be handled with a single question or memory capture, not an invented configuration path.
- The onboarding experience should stay owner-facing and low-friction.

## Non-Goals

- No new mailbox backend.
- No new connector provider.
- No terminal-first operator workflow for normal signup.

## Related References

- `docs/public-interaction-standard.md`
- `docs/onboarding-live-review-2026-07-16.md`
- `docs/production-normal-employee-live-deploy-runbook.md`
- `docs/live-employee-first-chat-ux-gap.md`
- `email/himalaya/SKILL.md`

## Carry-Forward

The next implementation pass should update the onboarding/system prompt and any connector-discovery flow so the product favors:

1. interactive Gmail connector UI;
2. interactive MCP UI;
3. memory capture when facts are missing;
4. terminal IMAP setup only as an explicit fallback.
