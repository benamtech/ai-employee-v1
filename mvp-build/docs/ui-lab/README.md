# UI Lab

Status: Phase 1 live-first workbench source candidate
Updated: 2026-07-23

Phase 1 routes `/ui-lab` through the existing owner dashboard session and opens one authorized employee workbench at `/ui-lab/employee/[employeeId]`. The workbench reuses the owner projection stream and canonical `ResourcePayload`; fixtures are explicit at `/ui-lab/fixtures`.

Evidence boundary: source, contracts, typecheck, browser, and local executable checks can reach P3. They do not prove P4 production, provider, deployment, pilot, or external acceptance.
