# Purpose employee factory probe source-wired

Date: 2026-07-12 23:59 EDT
Status: superseded by profile-generator-first harness; live Hermes/runtime/materialization proof pending
Scope: intermediate custom purpose-package harness for the website-estimator probe

> Superseded note: the founder clarified that the probe should stay as close as
> possible to normal B2B onboarding and the Hermes profile generator. The custom
> package-writing harness described below was replaced by
> `infra/scripts/local/profile-generator-harness.mjs`, which builds
> profile-architect inputs from onboarding context, adapts a generated Hermes
> profile repo into AMTECH's render/provision path, and requires a
> production-shaped local stack for CLI/live proof.

## What changed

- Added `infra/scripts/local/purpose-employee-harness.mjs`, a local-only reusable harness that turns a purpose config into:
  - a generated profile package under `infra/.local/profile-packages/<purpose_key>`;
  - a direct manifest shape;
  - a `ProvisionerRequest`/`ProfileBuildParams` object compatible with the existing profile renderer/provisioner path;
  - optional local HTTP chat harness with per-visitor Hermes transcript ids.
- Added two specific purpose configs:
  - `infra/scripts/local/purpose-employees/website-estimator.company-data.json`
  - `infra/scripts/local/purpose-employees/website-estimator.contractor-mode.json`
- Added `npm run local:purpose-employee`.
- Added `tests/unit/purpose-employee-harness.test.ts` to prove the generated employee is purpose-specific and not just the existing contractor-estimator package unchanged.

## Why

The founder corrected the probe framing: the point is not to reuse `contractor_estimator` inside a website page. The point is to see whether AMTECH software can create a new employee purpose from factory/profile/runtime/materialization inputs. The website is only a test client; the important proof is a purpose-generated employee package and factory input.

## Current status

- Purpose-employee harness is `source-wired`.
- The harness does not add internal Manager/Web product routes.
- It generates a distinct local profile package with a website-estimator `SOUL.md` and `website-estimate` skill while preserving the existing `config.yaml` machinery: Manager MCP, CE hooks, compression, delegation, resource pointers, and connector custody render tokens.
- Live proof remains `pending`: no real Hermes runtime turn, Manager MCP artifact creation, multimodal image understanding, or PDF storage was claimed.

## Files / seams touched

- `infra/scripts/local/purpose-employee-harness.mjs`
- `infra/scripts/local/purpose-employees/*.json`
- `package.json`
- `tests/unit/purpose-employee-harness.test.ts`

The seam is deliberately outside core product apps: generated local profile packages can be consumed by `profile-renderer.ts` by launching Manager/provisioner with `PROFILE_PACKAGES_DIR=<mvp-build>/infra/.local/profile-packages`.

## Carry-forward / next

- Run a live local proof with Manager/provisioner started against the generated `PROFILE_PACKAGES_DIR`.
- Provision `profile_package_key=website_estimator_conversation`.
- Drive two visitor sessions and confirm distinct Hermes transcript ids with shared employee-purpose memory key.
- Have the employee call Manager MCP to create a real `estimate` artifact and verify generic HTML fallback.
- Only mark image support live if a real vision-capable model processes an uploaded image.
- Only mark PDF live if real `%PDF` bytes are generated and accepted by `render_estimate_pdf`.

## Verification

- `npm run test:unit -- tests/unit/purpose-employee-harness.test.ts`
  - Result: 1 file / 5 tests passed.
- `npm run local:purpose-employee -- --config infra/scripts/local/purpose-employees/website-estimator.company-data.json --write-package --print-factory-input`
  - Result: emitted purpose-specific manifest + provisioner request and generated `infra/.local/profile-packages/website_estimator_conversation`.
- `npm run typecheck`
  - Result: passed.
- `npm run lint`
  - Result: passed.
