## Task contract

- Task ID:
- Objective:
- Primary role / subsystem:
- Allowed files:
- Forbidden files:
- Maximum commits:

## Six-point rubric

| Authority | Completeness | Agility | Isolation | Provability | Moat |
|---:|---:|---:|---:|---:|---:|
|  |  |  |  |  |  |

Mitigations for any score below `0.5`:

## Standard and architecture alignment

- Ratified Standard clauses:
- Manager/Hermes boundary preserved:
- Connector/capability manifest impact:
- Durable command/effect/receipt impact:
- Database/migration impact:
- Evidence state claimed:

## TDD and verification

- Failing contract established before implementation:
- Focused tests:
- `npm run repo:verify:quick`:
- `npm run repo:verify:full`:
- Unit/integration/build/browser/live checks:
- Skipped or unavailable environments, stated as skipped:

## Hermes upstream review

Required when touching Hermes integration, runtime, profiles, tool discovery, sessions, gateway, or Hermes-derived UI.

- `npm run hermes:upstream:check` result:
- Upstream head reviewed:
- Relevant commits/PRs:
- Adopted, rejected, or deferred insight:

## Evidence boundary

State exactly what this PR proves and what remains unproven. Do not promote source, fixture, local PostgreSQL, or ancestor-SHA evidence into a live acceptance state it did not exercise.
