# ADR-012: UI Lab Phase 2 Generated Experience Runtime

Status: accepted
Date: 2026-07-23
Transaction: `decision/trace020/` (`TRACE020-UI-LAB-PHASE2-GENERATED-RUNTIME`)

## Context

Phase 1 (ADR-011) landed the seams a generated runtime needs — `EmployeeExperienceModelV1`,
`UiVariantHost`, the variant registry, and an inline intent dispatcher — but none of them was a
boundary. On merged main any registry variant rendered against live employee state, including
`radical-canvas` (`status: experiment`, `production.eligibility: lab_only`); every variant received
the whole model regardless of what its `variant.json` declared; and intent policy lived in a
component branch chain with no host-action vocabulary for later phases to attach to.

The Phase 2 spec names those exact gaps as its blockers: "unclear generated runtime isolation,
missing variant safety policy".

## Decision

One shared, pure module — `packages/shared/src/ui-variant-runtime.ts` — owns the whole boundary.

**1. Admission is tiered by declared eligibility, and live employee state is the protected resource.**

```text
status=deprecated            → refused on every surface
adapter not supported        → refused
unrecognized status/tier     → refused (fail closed, never default-admit)
live + status=experiment     → refused
live + eligibility=lab_only  → refused
live + candidate (either axis)→ admitted only with explicit operator acknowledgement, with a banner
live + approved/approved     → admitted
fixture_lab                  → admitted, bannered unless approved
```

Acknowledgement is a per-open route parameter (`?admission=lab_review`). It never mutates a
manifest, and it cannot admit a variant that is not candidate-eligible in the first place. No
manifest, preset, or fixture was promoted to make Phase 2 demonstrable.

**2. A manifest capability declaration is a runtime boundary.**
`projectExperienceModelForVariant` narrows the model to `required ∪ optional` minus
`intentionally_omitted`, over all sixteen `UiVariantCapability` values. An undeclared capability
arrives as its neutral empty shape, so a variant sees the slice it asked for and nothing else.
Only `version`, `adapter_key`, and non-fixture `metadata` provenance are structural.

**3. Variants name intents, never host actions.**
`resolveUiVariantIntent` resolves a dispatch against the *projected* model and the admission
decision, and returns at most one member of the closed `UiVariantHostMethod` union:
`send_owner_message | resolve_approval | open_owner_resource | reset_fixture_state`.
Fixture intents are denied on the live surface and live intents on the fixture surface; a
high-risk intent is denied to a candidate variant under lab review; unsupported kinds are rejected
rather than falling through. Each decision emits a bounded, redacted audit record carrying no owner
payload or credential material.

`LiveEmployeeProvider` is now only an executor for the host method the resolver authorized.

## Phase 3 / Phase 4 extension point

`UiVariantHostMethod` and its `HOST_METHOD_BY_INTENT_KIND` mapping are the attachment surface.
Phase 3 channel/runtime access and Phase 4 recording/replay add members to that union and map new
intent kinds to them; `UiVariantIntentAudit` is the frame Phase 4 records. Neither phase needs to
reopen admission, projection, or the provider. No Phase 3/4 behavior is implemented here.

## Consequences

- No Manager endpoint, migration, provider adapter, Hermes change, or browser credential custody.
- `ResourcePayload` remains the canonical employee read model; no second employee model exists.
- The fixture route keeps its own deterministic dispatcher and never reaches Manager, so the
  resolver's `live_intent_denied_on_fixture` rule governs the live runtime only. Recorded
  deliberately rather than unified, because unifying would route fixture actions through live code.
- A sandboxed opaque-origin iframe transport (CCIP-6.8) was rejected: variants are first-party
  repository source compiled into the Web bundle, not negotiated remote `ui://` resources. That
  remains the escalation path if variants ever become non-first-party.
- Evidence ceiling is **P3**. Live-employee browser acceptance is **blocked**, not passed: the only
  running stack is the production compose mirror, and minting an owner session against it is
  outside this transaction's authority. Fixture-surface admission and unauthenticated live-surface
  fail-closed were proven in a real browser on the exact candidate
  (`decision/trace020/browser-acceptance.json`).
