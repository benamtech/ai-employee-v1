# Local Machine Production Verification — S1 through S8

This directory defines the local-production evidence boundary for `benamtech/ai-employee-v1`.

The local machine uses the same production Manager, Model Gateway, host provisioner, web, and Caddy topology. Remote deployment is a later transport step. A passing CI run is useful source evidence, but it does not replace the exact-SHA local proofs generated here.

## Package-manager authority

- Root `pnpm` is orchestration only.
- `mvp-build/package-lock.json` and `npm ci` are the application dependency authority.
- Do not generate `mvp-build/pnpm-lock.yaml`.
- The root lock contains no application dependencies.

## Required local toolchain

`mise.toml` pins Node, pnpm, and Python. Docker Engine is also required.

```bash
mise trust
mise install
pnpm install --frozen-lockfile
npm --prefix mvp-build ci
```

The test harness never pulls its PostgreSQL image. Make that network operation explicit before entering the offline gate:

```bash
docker pull postgres:17
```

## Environment

```bash
cp .env.example .env
cp mvp-build/infra/deploy/.env.production.example \
  mvp-build/infra/deploy/.env.production
```

Populate both files from a secret manager or local secret store. Do not commit either populated file. Preflight reports only whether required keys are present; it must not print values.

The tracked working tree must be clean before `pnpm build` or `pnpm dev`. Every image is tagged and labeled with the exact 40-character Git SHA.

## Verification order

```bash
pnpm audit
pnpm preflight --strict
pnpm typecheck
pnpm lint
pnpm build
pnpm test
pnpm verify
pnpm dev
pnpm s9:go-no-go
```

### What each command proves

| Command | Proof |
|---|---|
| `pnpm audit` | Per-script inputs, outputs, dependencies, failure behavior, exit semantics, attack vectors, local fidelity, idempotency, local cost, and performance vectors. |
| `pnpm preflight --strict` | Toolchain, lock authority, required environment, full production topology, Docker-socket isolation, machine capacity, and clean source identity. |
| `pnpm typecheck` | Measured TypeScript contract validation. |
| `pnpm lint` | Measured static policy validation. |
| `pnpm build` | Canonical workspace build plus exact-SHA production images; no services are started. |
| `pnpm test` | All unit/source tests and blank-PostgreSQL integration tests in parallel. External network is denied; integration may use loopback only. |
| `pnpm verify` | Aggregates exact-SHA evidence and maps S1 through S8. It does not start services. |
| `pnpm dev` | Starts the full prebuilt production topology with `--no-build --pull never`, proves health and image identity, and rolls back on failure. |
| `pnpm s9:go-no-go` | Reads exact-SHA proofs and decides only whether S9 implementation may begin. It does not promote a release. |

## Performance gates

Defaults are intentionally aggressive and fail closed:

- application and production-image build: less than 30 seconds;
- full unit plus PostgreSQL integration suite: less than 10 seconds;
- full production topology cold start: less than 5 seconds;
- application artifacts: less than 100 MB;
- measured command process tree: less than 4 GB RSS.

Docker/BuildKit daemon memory is outside the child-process RSS tree. Final capacity acceptance therefore also requires host telemetry proving total peak memory. The build proof records this limitation rather than fabricating a pass.

## Production topology

`pnpm build` and `pnpm dev` use `mvp-build/infra/deploy/docker-compose.production.yml`:

1. Manager
2. Model Gateway
3. Host provisioner
4. Web
5. Caddy

Manager has no Docker socket. It reaches the host provisioner through a Unix socket. The host provisioner is the only service with Docker authority. The older `docker-compose.yml` remains a compatibility path and is not the canonical local-production evidence topology.

## S8 platform authority

S8 admin reads require:

- the internal Manager control-plane credential;
- a durable `pad_` platform session whose raw token is not stored in PostgreSQL;
- correct audience and session version;
- a current durable platform principal and role;
- for customer detail, an exact expiring support lease.

S8 admin writes additionally require recent bounded step-up, exact account/employee/assignment lease scope, a stable idempotency key, C3 command registration, one effect reservation, and an accepted durable receipt before success is returned.

The operator CLI is:

```bash
pnpm admin -- --help
```

Example lifecycle:

```bash
PLATFORM_ADMIN_BOOTSTRAP_ACK=I_UNDERSTAND_SERVICE_ROLE_AUTHORITY \
  pnpm admin -- bootstrap --user-id=user_OPERATOR --role=platform_owner

pnpm admin -- mint --user-id=user_OPERATOR
pnpm admin -- step-up --method=operator_mfa
pnpm admin -- lease \
  --account=acct_TARGET \
  --employee=emp_TARGET \
  --assignment=asn_TARGET \
  --actions=admin:employee:inspect,admin:suspend_employee \
  --reason="Customer requested incident remediation."
```

The CLI writes the raw session token once to a mode-0600 local state file. PostgreSQL stores only its SHA-256 hash. The lease ID is not a credential by itself.

Live admin requests use:

- `Authorization: Bearer <MANAGER_INTERNAL_TOKEN>` for the internal control-plane boundary;
- `X-AMTECH-Admin-Authorization: Bearer pad_...` for the durable platform session;
- `X-AMTECH-Support-Lease-Id: psl_...` when a support lease is required.

`X-AMTECH-Platform-User-Id` and `X-AMTECH-Support-Reason` are legacy mutable identity inputs and are denied.

## SDRT-v2

```bash
pnpm sdrt:validate
pnpm sdrt:roundtrip
pnpm sdrt:query
pnpm sdrt:mcp
```

The parser is bounded by document, line, field, and value limits. The MCP server exposes read-only resources and one read-only query tool; mutation methods do not exist.

## Evidence and S9

Proofs are written under ignored `local-prod/reports/` as JSON and SDRT-v2. Every proof records the exact Git SHA.

S9 is **NO-GO** until all required proofs are present, passing, and from the same clean SHA. This gate is permission to begin S9 implementation only. It is not live provider acceptance, remote deployment, launch approval, or production-readiness certification.
