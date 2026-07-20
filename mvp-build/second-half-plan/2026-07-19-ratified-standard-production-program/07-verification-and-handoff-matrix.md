# Verification and Handoff Matrix

Status: active evidence checklist; Gate 0 implementation/document evidence accepted on `4be092f009de`  
Task family: `AMTECH-P0-GOV-001`, `AMTECH-P0-DOC-002`

## Gate matrix

| Gate | Required verification | Evidence | Current state |
|---|---|---|---|
| Standard syntax and vector | `npm run test:standard` | workflow `29713849506` | accepted on `4be092f009de` |
| Shared/Manager/Web contracts | exact-head typechecks | required workflow family | accepted on `4be092f009de` |
| Unit/source contracts | affected Vitest matrices | Standard, authority, production, UI workflows | accepted on `4be092f009de` |
| Production boundary | migration/image/source/unit proof | workflow `29713849468` | accepted on `4be092f009de` |
| Web source and build | UI source-contract job | workflow `29713849427` | accepted on `4be092f009de` |
| Compiled browser fixtures | UI browser-fixture job | workflow `29713849427` | accepted on `4be092f009de` |
| Plan/vector integrity | ratified Standard workflow | workflow `29713849506` | accepted on `4be092f009de` |
| Documentation archaeology | repository archaeology | workflow `29713849452` | accepted on `4be092f009de` |
| Database platform release | risk-triggered disposable Supabase proof | migration/advisor/behavior JSON | open only when DTEP trigger applies |
| Target-host runtime | five-service and isolation harness | exact host/image/network JSON | open |
| Provider/owner journey | fixture-free connector + golden journey | provider/effect/proof IDs | open |
| MCP Apps/AG-UI conformance | negotiated adapter matrices | protocol fixtures + exact runtime/browser evidence | open |
| Commercial/recovery/release | budget, ambiguity, crash, rollback, attestation | exact release evidence | open |

## Exact Gate 0 evidence head

All required workflows completed successfully on `4be092f009de3a591e505cc6e4f30ab7685b6511`:

- Repository Documentation Archaeology — `29713849452`;
- Ratified Standard and Production Plan Integrity — `29713849506`;
- S10.1 Onboarding Identity Authority — `29713849429`;
- Lane 1 Relationships and Authorization — `29713849449`;
- S2 S7 S9 Production Boundary — `29713849430`;
- Lane 10 Integrated CI and Release Evidence — `29713849481`;
- Employee Work Production Boundary — `29713849468`;
- Agent Operating Surface Standard — `29713849427`.

A cancelled run is not a pass. An ancestor SHA is not proof for a changed code path. The final metadata/index head must also rerun; its exact matrix belongs in PR `#23` because writing run IDs into Git necessarily creates another SHA.

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

The dated handoff records:

1. repository, branch, base, PR, date, and exact evidence SHA;
2. primary role and interacting subsystems;
3. ratification decision and approval basis;
4. exact code/document files changed;
5. behavior before/after;
6. Standard evolution vector and direction basis;
7. failed attempts and fixes;
8. every workflow ID and conclusion on the Gate 0 evidence head;
9. explicit evidence not run;
10. unresolved P0/P1 risks;
11. next dependency-ordered task;
12. root/scoped/wiki/plan/memory/PR synchronization.

## Completion rules

- `AMTECH-P0-GOV-001` is resolved for ratification, vector, research disposition, code enforcement, tests, and Gate 0 exact-head CI scope.
- `AMTECH-P0-DOC-002` is resolved for one active plan, root/scoped/wiki routing, historical supersession, current memory, and Gate 0 exact-head CI scope.
- The post-evidence metadata head must remain green before downstream work begins.
- Neither gate implies launch clearance.
