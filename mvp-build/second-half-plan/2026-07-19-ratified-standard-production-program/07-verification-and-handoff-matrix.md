# Verification and Handoff Matrix

Status: active evidence checklist  
Task family: `AMTECH-P0-GOV-001`, `AMTECH-P0-DOC-002`

## Gate matrix

| Gate | Required verification | Evidence | Current state |
|---|---|---|---|
| Standard syntax and vector | `npm run test:standard` | test output + parsed vector | pending final authority head |
| Shared/Manager/Web contracts | `npm run typecheck` | exact-head compiler logs | connector checkpoint green |
| Unit contracts | `npm run test:unit` | exact-head Vitest output | pending final authority head |
| Production boundary | `npm run test:production-boundary` | workflow artifacts | connector checkpoint green |
| Web source and build | UI source-contract job | typecheck, validation, contracts, build | connector checkpoint green |
| Compiled browser fixtures | UI browser-fixture job | screenshots/logs/JSON evidence | connector checkpoint green |
| Plan/vector integrity | ratified Standard workflow | plan + vector parser | pending final authority head |
| Documentation archaeology | repository archaeology workflow | tracked-object bundle | pending final authority head |
| Database platform release | risk-triggered disposable Supabase proof | migration/advisor/behavior JSON | not yet required on documentation head |
| Target-host runtime | five-service and isolation harness | exact host/image/network JSON | open |
| Provider/owner journey | fixture-free connector + golden journey | provider/effect/proof IDs | open |
| Commercial/recovery/release | budget, ambiguity, crash, rollback, attestation | exact release evidence | open |

## Required workflow family

The final Gate 0 head must complete all required workflows associated with draft PR `#23`:

- Repository Documentation Archaeology;
- Ratified Standard and Production Plan Integrity;
- S10.1 Onboarding Identity Authority;
- Lane 1 Relationships and Authorization;
- S2 S7 S9 Production Boundary;
- Lane 10 Integrated CI and Release Evidence;
- Employee Work Production Boundary;
- Agent Operating Surface Standard.

A cancelled run is not a pass. A prior SHA is not proof for changed paths.

## Required command set

```bash
npm ci
npm run test:standard
npm run typecheck
npm run test:unit
npm run test:production-boundary
npm run ui:validate
npm run test:ui:contracts
npm run build
```

Environment-gated integration/live checks state `skipped` or `blocked` when credentials/infrastructure are absent. They do not become pass.

## Handoff content

The final dated handoff records:

1. repository, branch, base, PR, date, and exact SHA;
2. primary role and interacting subsystems;
3. ratification decision and approval basis;
4. exact code and document files changed;
5. behavior before/after;
6. Standard evolution vector summary and hash;
7. failed attempts and fixes;
8. every workflow ID and conclusion on the final head;
9. explicit evidence not run;
10. unresolved P0/P1 risks;
11. next dependency-ordered task;
12. root/scoped/wiki/plan/memory/PR synchronization.

## Completion rules

- `AMTECH-P0-GOV-001` closes only after the ratified Standard, vector, research disposition, code enforcement, tests, and exact-head CI agree.
- `AMTECH-P0-DOC-002` closes only after one active plan is routed everywhere and stale current-status claims are corrected.
- Neither gate implies launch clearance.
- The next implementation task cannot begin while final authority CI is red or incomplete.
