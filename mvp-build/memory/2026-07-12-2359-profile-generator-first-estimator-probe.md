# Profile-generator-first estimator probe source-wired

Date: 2026-07-12 23:59 EDT
Status: source-wired; generated-package provisioning/runtime proof passed; live LLM/tool-loop proof pending
Scope: replaced the custom purpose-package generator with a profile-generator-first harness

## What changed

- Replaced `infra/scripts/local/purpose-employee-harness.mjs` with
  `infra/scripts/local/profile-generator-harness.mjs`.
- Added profile-generator probe configs:
  - `infra/scripts/local/profile-generator-probes/website-estimator.company-data.json`
  - `infra/scripts/local/profile-generator-probes/website-estimator.contractor-mode.json`
- Added canonical package script `npm run local:profile-generator`; kept
  `local:purpose-employee` as a compatibility alias to the new harness.
- Replaced the old unit test with `tests/unit/profile-generator-harness.test.ts`.
- Adapter fix after live provisioning: generated packages now copy reusable
  AMTECH runtime support files from `packages/agent-template` (`.env.tpl`,
  `hooks/`, `memories/`, `plugins/`) so the existing provisioner can render and
  start a Docker Hermes runtime.

## Key decision

The probe now treats the owner/business conversation as the source of employee
purpose. The harness builds a normal B2B onboarding brief and `profile-architect`
prompt, writes deterministic `profile.params.yaml` for control/review, and then
adapts a real generated Hermes profile repo into an AMTECH-renderable package.

The harness no longer proves value by copying `packages/agent-template` and
writing a purpose-specific `SOUL.md` itself. That was too far from the normal
profile-generator/onboarding motion.

## Production-local requirement

CLI/live use fails closed unless the production-shaped local environment is up:

- required Supabase/database/Manager/provisioner/signing/Hermes env vars;
- `PROVISIONER_SKIP_SMS=true|1` for local no-SMS;
- `HERMES_BACKEND_TYPE=docker`;
- Docker daemon, Docker buildx, `hermes-agent` image, Caddy, and Hermes CLI;
- Manager `:8080/health` and Web `:3000`.

Unit tests only exercise pure helpers and adapter behavior; they do not claim
runtime proof. The local model bridge is not accepted as proof for this work;
conversation/tool-loop proof remains pending until Hermes has the intended real
provider credential/path.

## Adapter behavior

`adaptGeneratedProfilePackage` preserves the generated repo's purpose files and
skills, keeps original generator files as `config.generated.yaml` /
`distribution.generated.yaml`, and overlays AMTECH runtime custody:

- AMTECH `config.yaml` with Manager MCP, scoped token render, platform toolsets,
  CE hooks, compression, delegation, and connector custody;
- AMTECH `.env.tpl`, hooks, memories, and plugin support needed by the existing
  runtime launcher;
- `workspace/manager-tools.md` and AMTECH operating policy;
- onboarding-derived `purpose.manifest.json` and `purpose.profile-context.json`;
- `amtech-package.manifest.json` for `profile_packages` registration.

Generated employee purpose comes from the profile generator; AMTECH owns runtime
custody and provisioning.

## Verification

- `npm run test:unit -- tests/unit/profile-generator-harness.test.ts`
  - Result: 1 file / 7 tests passed.
- `node --check infra/scripts/local/profile-generator-harness.mjs`
  - Result: passed.
- `npm run typecheck`
  - Result: passed.
- `npm run lint`
  - Result: passed.
- Sourced local env + `npm run live:up`, then:
  `npm run local:profile-generator -- --config infra/scripts/local/profile-generator-probes/website-estimator.company-data.json --run-profile-architect --adapt-generated --register-package --print-factory-input`
  - Result: generated/adapted/registered `website_estimator_conversation`.
- Existing Manager `provision_employee` using the generated onboarding manifest:
  - Result: `employee_id=emp_5omv4ihbvggc8ibe31nj43`, `profile_id=client_emp_5omv4ihbvggc8ibe31nj43`, package `website_estimator_conversation`.
  - `employee_profile_builds`: `validation_status=passed`, `install_status=installed`, `generated_path=/home/georgej/.hermes/profiles/client_emp_5omv4ihbvggc8ibe31nj43`.
  - `runtime_endpoints`: Docker backend on `http://localhost:8748`, public route `/agent/emp_5omv4ihbvggc8ibe31nj43`.
  - `npm run live:status`: container `amtech-hermes-emp_5omv4ihbvggc8ibe31nj43` up and `tools:MCP-wired`.
- A web chat smoke accidentally completed through the old local model-bridge path. Do not count it as valid proof; this repo memory already marks the bridge path dead and current Hermes instances do not have live LLM provider credentials.

## Pending live proof

- Prove a real visitor/owner turn only after Hermes has the intended real LLM
  provider credentials/path; do not use the local model bridge as evidence.
- Confirm Manager MCP artifact creation and generic artifact HTML rendering.
- Mark multimodal/PDF only after real image processing or real PDF bytes.
