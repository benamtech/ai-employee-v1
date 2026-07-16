# Post-signup email onboarding routing

Date: 2026-07-16 08:31 EDT
Status: planned
Scope: onboarding prompt/context engineering for email setup after signup

## What changed

- Captured the onboarding misrouting issue where the first instinct was to run terminal IMAP setup instead of steering the owner toward the interactive MCP UI or Gmail connector UI.
- Recorded the product rule that email setup after signup should prefer the in-product connector path, and only fall back to terminal IMAP/SMTP setup when the owner explicitly wants mailbox-only configuration.
- Added a plan doc at `docs/post-signup-email-onboarding-plan.md` to keep this decision visible outside chat.

## Why

The current onboarding surface is strong when it stays in the product flow, but it can drift toward infrastructure-style setup when context is thin. That is acceptable for operator work and wrong for a first-run owner onboarding experience.

The fix is not "more IMAP". The fix is better routing:

- interactive connector UI first;
- interactive MCP UI when a connector surface is the right affordance;
- memory capture when the system does not know a stable fact yet;
- terminal setup only when the owner explicitly asks for it.

## Current status

planned

This is a prompt/context-engineering and product-routing issue, not a code acceptance claim.

## Files / seams touched

- `docs/post-signup-email-onboarding-plan.md`
- `docs/public-interaction-standard.md`
- `docs/onboarding-live-review-2026-07-16.md`
- `email/himalaya/SKILL.md`

Seams:

- owner onboarding intent routing
- connector discovery and launch affordance selection
- memory capture when facts are missing
- terminal IMAP fallback policy

## Carry-forward / next

Update the onboarding prompt and any connector selection logic so "set up my email" lands on the product surface first.

If the assistant cannot determine the correct email route, it should ask one focused question or store the missing fact in memory rather than guessing a terminal setup path.

## Verification

- Documentation-only handoff.
- No source/runtime changes were claimed here.

