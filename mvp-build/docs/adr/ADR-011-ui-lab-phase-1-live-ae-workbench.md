# ADR-011: UI Lab Phase 1 Live AE Workbench

Status: accepted
Date: 2026-07-23

## Context

UI Lab was fixture-first. Phase 1 makes `/ui-lab` a live-first owner workbench for one authorized AI Employee while preserving fixtures as explicit secondary evidence.

## Decision

- The AE subject is the existing owner-visible AI Employee authorized by `MANAGER_API.ownerDashboard`.
- UI Lab owns one browser `openOwnerProjectionController` through `LiveEmployeeProvider`.
- `ResourcePayload` remains the canonical employee read model.
- UI variants consume `EmployeeExperienceModelV1`; live routes set `metadata.evidence_level` to `live`.
- Fixtures live at `/ui-lab/fixtures` and never backfill live failures.
- Manager keeps owner session, assignment, approval, capability, and custody authority.

## Consequences

No Manager endpoint, migration, Hermes protocol, replay store, launcher rewrite, or generated runtime is introduced in Phase 1. Evidence ceiling is P3 until external/live production acceptance is actually crossed.
