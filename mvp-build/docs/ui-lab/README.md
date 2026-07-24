# UI Lab

Status: Phase 2 generated experience runtime source candidate
Updated: 2026-07-23

Phase 1 routes `/ui-lab` through the existing owner dashboard session and opens one authorized employee workbench at `/ui-lab/employee/[employeeId]`. The workbench reuses the owner projection stream and canonical `ResourcePayload`; fixtures are explicit at `/ui-lab/fixtures`.

Phase 2 makes the variant seam a boundary. `packages/shared/src/ui-variant-runtime.ts` owns it:

- **Admission** — `admitUiVariantForRuntime` decides per surface. Approved variants render over live employee state; candidates render only under an explicit per-open operator acknowledgement (`?admission=lab_review`) with a non-production banner; experiment and lab-only variants are refused live and stay on the fixture route. Unrecognized policy fails closed.
- **Projection** — `projectExperienceModelForVariant` narrows `EmployeeExperienceModelV1` to the capabilities the variant's own `variant.json` declares. Undeclared capabilities arrive as neutral empty shapes.
- **Intent bridge** — `resolveUiVariantIntent` maps a declared model intent onto the closed `UiVariantHostMethod` union and returns a bounded, redacted audit record. Variants never name a host action directly.

`/ui-lab/employee/[employeeId]/variants` lists every design with its live admission decision. Phase 3 and Phase 4 attach by extending `UiVariantHostMethod`; see `docs/adr/ADR-012-ui-lab-phase-2-generated-experience-runtime.md`.

Evidence boundary: source, contracts, typecheck, browser, and local executable checks can reach P3. They do not prove P4 production, provider, deployment, pilot, or external acceptance. The Phase 2 live-employee browser acceptance line remains a recorded blocker.
