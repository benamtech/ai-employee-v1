# Host-Private Runtime Hardening Implementation Record

Date: 2026-07-17
Branch: `research`

## Source changes

- Removed Docker socket authority from Manager Compose.
- Removed Docker CLI installation from the Manager image.
- Added a dedicated host-provisioner image and Unix-socket service.
- Converted Manager provisioning into a signed proxy boundary.
- Added declarative lifecycle operations, expiry, nonce, idempotency, runtime admission checks, cached results, and audit output.
- Removed Twilio channel operations from the host-provisioner responsibility.
- Added per-employee private bridge creation and loopback-only Hermes port publishing.
- Added immutable profile and separated workspace/runtime/temp mounts.
- Added runtime profile checksum and provider-key integrity helpers.
- Added migration 0031 for provisioning transitions, webhook inbox/dead letters, and provisioner audit foundations.
- Added compare-and-swap provisioning transition scaffolding.
- Added static production-boundary tests.

## Status

These changes are source-wired, not runtime-accepted. Full production acceptance requires migration execution, image builds, host installation, two-employee network probes, reprovision tests, webhook concurrency tests, provisioning interruption tests, and negative provider-key inspection.

## Planned follow-on

- Full host-private model gateway with scoped employee tokens, budgets, model allowlists, concurrency, TTL, revocation, and metering.
- Inbox-first webhook adapters and leased worker for Stripe, Gmail/PubSub, Twilio, QuickBooks, and future providers.
- Full persisted provisioning orchestration with resume and compensation.
- Separate production processes for manager-api, event-worker, runtime-controller, and host-provisioner.
