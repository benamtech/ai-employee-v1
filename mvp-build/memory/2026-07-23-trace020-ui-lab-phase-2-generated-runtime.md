# Trace020 — UI Lab Phase 2 generated experience runtime

Date: 2026-07-23
Transaction: `decision/trace020/` (`TRACE020-UI-LAB-PHASE2-GENERATED-RUNTIME`)
Branch: `task/ui-lab-phase2-generated-runtime-20260723`, based on merged `main` `e5e36c5072c69dcc57ccefce1a5d807f71f70058`
Evidence ceiling: **P3**. No P4 claimed.

Narrative handoff, not acceptance authority. Verify against current source, tests, verifiers, and the transaction ledger.

## What changed and why

Phase 1 shipped the variant seam without a boundary. On merged main, any registry variant rendered
against live employee state — including `radical-canvas`, declared `status: experiment` /
`eligibility: lab_only` — every variant received the whole `EmployeeExperienceModelV1` regardless of
its manifest declaration, and intent policy sat in a component branch chain.

Phase 2 moves the entire boundary into one pure shared module, `packages/shared/src/ui-variant-runtime.ts`:

- `admitUiVariantForRuntime` — tiered admission per surface. Approved renders live; candidate
  renders live only under an explicit per-open operator acknowledgement (`?admission=lab_review`)
  with a non-production banner; experiment and lab-only are refused live and stay on the fixture
  route; deprecated and unrecognized policy fail closed.
- `projectExperienceModelForVariant` — narrows the model to the manifest's declared capabilities
  over all sixteen `UiVariantCapability` values; undeclared ones arrive as neutral empty shapes.
- `resolveUiVariantIntent` — maps a declared model intent onto the closed `UiVariantHostMethod`
  union and emits a bounded redacted audit record.

`LiveEmployeeProvider` is now only an executor for the authorized host method. `UiVariantHost`
renders an honest refusal panel instead of the component when a variant is not admitted.

## Deliberate decisions worth carrying forward

- **Nothing was promoted.** `editorial-studio` stayed `candidate` and `radical-canvas` stayed
  `experiment`. Making Phase 2 demonstrable by upgrading a manifest would have tripped the spec's
  own promotion STOP condition.
- **Uniform capability enforcement**, including `identity` and `runtime`. All three current
  manifests declare them, so nothing regressed, and a future variant cannot inherit owner identity
  by forgetting to declare it.
- **`availability: "reference_client"` does not block direct dispatch.** The Phase 1 model builder
  marks `send-message` that way to mean "served by the host bridge", not "forbidden". Reading it as
  a denial would have broken the live workbench. Risk tiering carries the restriction instead: a
  high-risk intent is denied to a candidate variant under lab review.
- **The fixture route keeps its own dispatcher.** Unifying it with the live resolver would route
  sample-data actions through live code. Recorded in ADR-012 rather than silently unified.
- **An MCP-Apps-style sandboxed iframe was rejected** — variants are first-party source in the Web
  bundle, not negotiated remote `ui://` resources. It stays the escalation path if that changes.

## Evidence

Green on the exact candidate: focused runtime contract suite (23 cases, mutation-checked),
`test:ui:contracts` (12 files / 98 cases), `scripts/verify-ui-architecture.mjs`,
`scripts/validate-ui-system.mjs`, `scripts/ui-variant.mjs doctor`, web typecheck, and
`repo:verify:full`.

Browser: `decision/trace020/browser-acceptance.json` (also retained at
`infra/proofs/ui-lab-phase2-browser-2026-07-23.json`, which is gitignored). Seven checks pass on a
dev server built from this tree — lab-only admitted only on the fixture surface, banner present,
approved variant through the same policy, unauthenticated live route rendering the login document
with no variant host and no fixture fallback, no credential material in the document, no off-host
requests.

## Blockers — recorded, not passed

- `browser_acceptance_live_employee_unavailable`. The Phase 2 spec's acceptance line ("open an
  approved variant for ONE live employee") was **not** crossed. The only running stack is the
  production compose mirror (`infra/deploy/docker-compose.production.yml` + `.env.production`), its
  web image predates this candidate, and minting an owner session against production data is
  outside this transaction's authority. A disposable stack with an authorized employee is the
  prerequisite.
- Live provider acceptance (Gmail, Stripe Connect, QBO remain envvar-blocked at 6/9 preflight),
  managed database, target-host destructive recovery, trusted signing, fixture-free channels,
  manual accessibility, capacity, pilot, deployment, and production all remain open P4 gates.

## Next

Phase 3 attaches by adding members to `UiVariantHostMethod` and mapping new intent kinds to them —
no reopening of admission or projection. Open `trace021` from a fresh branch off merged main.
