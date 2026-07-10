# agent-template — the AMTECH AI Employee, authored as files

This is the **template** (`product-ai-employee-context.md` — "the product's soul"). Only the data differs per client; the soul is constant. Phase 1's `provision_employee` renders these files into a per-client Hermes profile + workspace, substituting `{{TOKEN}}` placeholders from the onboarding manifest.

This package is the first AMTECH **profile package**, not the platform boundary.
The platform chooses a package after claim, renders deterministic params, records
the build, validates it, then installs/starts the Hermes profile. The default
package is `contractor_estimator` because the MVP is optimized for painting and
landscaping contractors, but provisioning must also accept other package keys.

**Render contract:** unknown/empty tokens are left **visible on purpose** (`{{LIKE_THIS}}`) so a bad render is obvious, not silent. The seven raw onboarding answers map to tokens deterministically (no AI step required); the verbatim transcript also seeds `workspace/brain/`.

## Layout
```
SOUL.md                       # employee persona + SMS voice (constant)
config.yaml                   # Hermes profile config (terminal backend, models, ports)
.env.tpl                      # source template; provisioner renders a real per-profile .env
workspace/AGENTS.md           # operating policy, loaded every session (the confirmation gate)
workspace/manager-tools.md    # AMTECH Manager tool-call contract for artifacts/approvals/connectors
workspace/brain/business-brain.md  # pricing/rates/suppliers — starts thin, agent fills in
workspace/brain/customers.md
skills/estimate/SKILL.md      # the wedge skill (Phase 2 exercises it)
skills/invoice/SKILL.md
skills/daily-checkin/SKILL.md
```

## Tokens (filled from the manifest)
`{{EMPLOYEE_NAME}}`, `{{BUSINESS_DISPLAY_NAME}}`, `{{BUSINESS_KIND}}`, `{{OWNER_NAME}}`, `{{OWNER_PHONE_E164}}`, `{{TIMEZONE}}`, `{{CLIENT_ID}}`, `{{GATEWAY_PORT}}`, `{{RUNTIME_BACKEND}}` (Manager isolation tier), `{{TERMINAL_BACKEND}}` (Hermes in-container execution backend), `{{MANAGER_MCP_URL}}` (container-facing), `{{MANAGER_MCP_TOKEN}}` (render-only scoped employee credential), `{{EMPLOYEE_NUMBER_E164}}`, `{{WEBHOOK_URL}}`, `{{API_SERVER_KEY}}`.

Manager owns SMS ingress and delivery. Hermes exposes the authenticated API server from `.env`; `config.yaml`
does not configure the API server in current Hermes.

> Runtime isolation: the Manager runtime backend is the isolation tier. For Docker employees, Hermes' own
> terminal backend runs `local` inside the already-isolated container; do not mount the host Docker socket.
