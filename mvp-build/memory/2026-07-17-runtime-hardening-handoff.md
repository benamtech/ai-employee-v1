# Runtime Hardening Handoff

Date: 2026-07-17
Branch: `research`
Status: source-wired; live host acceptance pending

## Implemented

- Manager production Compose has no Docker socket.
- Manager image has no Docker CLI.
- Docker lifecycle and Caddy reload authority moved to a host-private Unix-socket provisioner.
- Manager keeps a narrow signed proxy boundary.
- Provisioner requests use short expiry, nonce, idempotency, fixed operations, runtime admission checks, and audit output.
- Twilio setup and welcome delivery are outside the host provisioner.
- Each employee gets a private Docker bridge and a loopback-only Hermes gateway port.
- Runtime mounts separate read-only profile, durable workspace, runtime tmpfs, and bounded temp storage.
- Migration 0031 adds provisioning transition, webhook inbox, dead-letter, and provisioner audit foundations.
- A compare-and-swap provisioning transition helper and static boundary regression tests were added.

## Not yet production-accepted

The model gateway is not complete. Direct provider-key rendering must remain non-production-safe until employee-scoped gateway credentials and negative runtime proofs are complete.

Provider webhook routes still need to move from synchronous processing to inbox-first acknowledgement plus leased worker processing.

The provisioning tool still needs full transition-by-transition orchestration, resume, timeout, retry, and compensation wiring.

## Required host proofs

- Apply migration 0031 and verify privileges.
- Build and start the host provisioner with only its Unix socket mounted into Manager.
- Provision two employees and prove peer isolation.
- Prove employees cannot reach Docker, database, Web, Caddy, or unrelated host services.
- Prove profile mutation disappears after reprovision and canonical checksum remains valid.
- Prove duplicate webhook delivery creates one inbox row and retries are safe.
- Prove interrupted provisioning resumes or compensates.
- Prove provider master keys are absent from rendered files and runtime environment.

## Canonical references

- `docs/security/host-private-runtime-hardening-plan.md`
- `docs/production-normal-employee-live-deploy-runbook.md`
- `docs/gtm/free-infrastructure-managed-workforce-strategy.md`

The public estimator remains an outdated acquisition/regression experiment and is not normal-employee production acceptance.
