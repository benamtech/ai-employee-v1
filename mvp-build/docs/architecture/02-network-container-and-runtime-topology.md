# 02 — Network, Container, and Runtime Topology

Status: **[VERIFIED] source topology; [INCOMPLETE] target-host acceptance**

## Production process topology

```text
PUBLIC INTERNET
      |
      v
Caddy (host network, public :80/:443)
      |-- 127.0.0.1:3000 → Web
      |-- 127.0.0.1:8080 → Manager public/approved routes
      `-- 127.0.0.1:<employee gateway port> → one Hermes employee gateway

HOST-LOOPBACK-PUBLISHED CONTROL SERVICES
  Web          127.0.0.1:3000
  Manager      127.0.0.1:8080
  ModelGateway 127.0.0.1:8092

DOCKER CONTROL NETWORK: amtech_control
  Manager
  Model Gateway
  Host Provisioner
  Web

UNIX SOCKET TRUST BOUNDARY
  Manager → /run/amtech-provisioner/provisioner.sock → Host Provisioner

PER-EMPLOYEE INTERNAL BRIDGE: amtech-employee-<employee_id>
  Hermes employee runtime
  Manager, alias amtech-manager
  Model Gateway, alias amtech-model-gateway
```

Primary source:

- `infra/deploy/docker-compose.production.yml`
- `infra/caddy/production.Caddyfile`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/caddy-activation.ts`
- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/model-gateway.ts`

## Public ingress

### Caddy

[VERIFIED] Production Caddy is the only public listener in the declared Compose topology. It uses `network_mode: host` so `localhost` and `127.0.0.1` refer to the Linux host namespace. This is required because Web, Manager, Model Gateway, and each Hermes gateway are published only on host loopback.

Static routes in `production.Caddyfile` include the owner application and intentionally exposed Manager endpoints. Per-employee routes are imported from `/etc/caddy/clients/*.caddy`.

`caddy-activation.ts`:

- derives an exact employee host from the client ID and public base domain;
- renders a reverse proxy to the configured employee upstream host and gateway port;
- writes a temporary snippet and atomically renames it into the active clients directory;
- runs configured validation and reload commands;
- optionally runs a smoke command;
- restores or removes the previous snippet if activation fails;
- reloads the restored configuration during rollback.

### Host-network constraint

[VERIFIED] This Compose topology is Linux-host specific. Docker host networking and host-loopback semantics must be accepted on the real deployment host. It is not equivalent to Docker Desktop bridge behavior.

[INCOMPLETE] The branch does not contain exact-SHA target-VPS evidence proving:

- host networking is enabled and available;
- Caddy can reach Web and Manager on host loopback;
- Caddy can reach a real employee gateway on its host-loopback port;
- per-employee DNS and TLS issuance work on the target domain;
- reload/rollback works under real process and filesystem permissions.

## Control network

`amtech_control` is a named user-defined bridge containing Manager, Model Gateway, Host Provisioner, and Web.

[VERIFIED] Its purposes are:

- stable service DNS for Manager, Web, and Model Gateway;
- health and dependency ordering in Compose;
- separation from the public network namespace used by Caddy;
- access to the shared provisioner Unix-socket volume.

[VERIFIED] Only Host Provisioner mounts `/var/run/docker.sock`.

Manager does not receive the Docker socket. It sends a bounded, signed operation request over the Unix socket. The provisioner validates operation, identifiers, timestamp window, nonce, idempotency key, account/employee binding, runtime backend, and required render secret before executing a fixed allowlisted operation.

## Per-employee network

### Creation

`start-hermes-container.sh` derives:

- container: `amtech-hermes-<employee_id>`
- network: `amtech-employee-<employee_id>`
- loopback gateway port from the rendered profile
- workspace and Model Gateway URL from the profile environment

For production-scoped Model Gateway URLs, it:

1. removes the previous employee container;
2. disconnects Manager and Model Gateway from the previous employee network;
3. removes the previous network;
4. creates a new `--internal` bridge with employee labels;
5. connects Manager with alias `amtech-manager` and negative gateway priority;
6. connects Model Gateway with alias `amtech-model-gateway` and negative gateway priority;
7. starts the employee container on that bridge;
8. publishes only its gateway port to host loopback;
9. probes Model Gateway reachability from inside the employee;
10. probes Hermes health from inside the employee.

### Isolation semantics

[VERIFIED] Employees do not share the same employee bridge. An employee bridge contains exactly the employee runtime and the two control-plane peers attached by the launcher.

[VERIFIED] `--internal` removes ordinary external routing from that bridge. The employee can communicate with:

- Manager through `http://amtech-manager:8080` when the runtime uses its Manager MCP configuration;
- Model Gateway through `http://amtech-model-gateway:8092/v1`;
- its own loopback services and mounted workspace/profile files.

[INCOMPLETE] The employee cannot directly reach arbitrary Internet endpoints through this production network. That blocks direct external MCP servers or runtime-local Internet tools unless they are proxied through a controlled egress service or another explicitly attached network. Current business integrations are Manager-mediated.

### Local/development mode

[VERIFIED] A separate local path accepts `host.docker.internal` for the Model Gateway and uses a non-internal bridge plus host-gateway mapping. This is a development topology and must not be presented as production employee isolation.

## Container filesystem and privilege boundaries

### Manager image

`manager.Dockerfile` builds shared/database/Manager packages and verifies required artifacts, including:

- generated Manager server;
- Model Gateway server and HTTP implementation;
- provisioner client/idempotency/reconciler modules;
- ambient inbox;
- production typeproof.

The runtime image runs as non-root `amtech` and contains no Docker CLI requirement.

### Host Provisioner image

`provisioner.Dockerfile` includes Docker CLI and Compose/buildx plugins because it controls host runtime resources. It runs as root inside the container, but Compose applies `no-new-privileges` and the service has no public port. Its authority comes from the Docker socket and host-mounted AMTECH state directories.

### Web image

`web.Dockerfile` builds the Next standalone application and runs as non-root `nextjs`. Browser calls terminate at Next routes, which proxy to Manager with internal credentials and HttpOnly owner-session custody.

### Hermes employee container

The launcher applies:

- `--cap-drop=ALL` plus a bounded set required for the image entrypoint;
- `no-new-privileges`;
- PID, memory, and CPU limits;
- read-only root filesystem;
- tmpfs mounts for secrets, runtime state, and `/tmp`;
- read-only rendered profile mounts;
- writable per-employee workspace;
- local log driver with rotation;
- employee/account/profile/credential-version labels.

[INCOMPLETE] This is Docker namespace isolation, not a gVisor/Kata/microVM sandbox. Runtime tool policy and filesystem/network restrictions remain part of the security boundary.

## Manager-to-Hermes communication

`hermes-client.ts` resolves the durable runtime endpoint and secret, then selects a Manager-reachable URL. A Docker endpoint whose durable URL is host loopback is transformed into the employee container DNS form `http://amtech-hermes-<employee_id>:<port>`.

This requires Manager to be attached to the employee bridge. The current launcher now establishes that relationship explicitly.

Manager sends:

- Bearer runtime credential;
- optional `X-Hermes-Session-Key` when advertised by runtime capabilities;
- run/session request body;
- AMTECH work-run metadata when available.

The client uses bounded timeouts and polls. Runtime capability and toolset discovery are read through `/v1/capabilities` and `/v1/toolsets`.

## Model Gateway network path

```text
Hermes employee
  → http://amtech-model-gateway:8092/v1/employees/<employee_id>/...
  → Model Gateway validates employee-scoped token and current commercial scope
  → provider API over Model Gateway's control-network/default egress
  → usage/provider/accounting receipt persisted
  → bounded response returned to employee
```

Provider master credentials exist only in Model Gateway environment configuration. Rendered employee profiles receive the scoped gateway URL, model alias, policy fields, and employee token.

## Provisioning effect graph

```text
verified activation / operator command
  → provisioning job + desired resource graph in PostgreSQL
  → reconciler leases work
  → Manager constructs signed provisioner request
  → Unix socket POST /v1/runtime
  → Host Provisioner idempotency/nonce claim
  → profile render/checksum
  → employee bridge and control-peer attachment
  → Hermes container start
  → in-container health probes
  → Caddy snippet write/validate/reload
  → observed resource states + receipts
  → ready only after required ordered resources and welcome effect
```

## Network-related failure semantics

| Failure | Source behavior |
|---|---|
| Model Gateway unreachable from employee | launcher fails closed and emits container logs |
| Hermes local health does not pass | launcher fails closed |
| Caddy validation/reload fails | prior snippet restored or new snippet removed, then reload attempted |
| Manager cannot reach Hermes | bounded runtime error/timeout; owner turn is not falsely reported as terminal success |
| Unix socket request replay | nonce/idempotency claim rejects or returns cached result |
| Employee network removal while peers attached | provisioner now disconnects Manager/Model Gateway before network removal |
| Provider unavailable | bounded retries, failed usage/accounting receipt, 503 to runtime |

## Interaction surfaces

### INTERACTION-NET-001: Compose × launcher | TRANSFORM

Surface: `docker-compose.production.yml` → environment rendered into profile → `start-hermes-container.sh`.

Emergent finding: a Model Gateway URL is also a network-topology declaration. The production alias requires dynamic attachment of the shared gateway container to every employee bridge.

Defects exposed: DEF-002, DEF-003.

Value: Authority 5 × Connectivity 5 × Effect Coverage 5 × Defect Exposure 5 → **20/20**.

### INTERACTION-NET-002: Caddy snippets × loopback publishing | EMERGENT

Surface: `caddy-activation.ts` + Compose port bindings + Caddy network namespace.

Emergent finding: `localhost:<employee_port>` is correct only when Caddy shares the host network namespace containing the loopback-published employee gateway.

Defects exposed: DEF-002, DEF-003.

Value: Authority 5 × Connectivity 5 × Effect Coverage 5 × Defect Exposure 5 → **20/20**.

### INTERACTION-NET-003: employee isolation × direct MCP | GATE

Surface: internal employee bridge + Hermes tool/MCP configuration.

Emergent finding: network isolation intentionally permits Manager and Model Gateway but prevents arbitrary direct external MCP transport. Controlled egress must be designed as a separate product/security primitive.

Defects exposed: none in the current Manager-mediated connector path; [INCOMPLETE] for direct MCP.

Value: Authority 5 × Connectivity 5 × Effect Coverage 4 × Defect Exposure 4 → **18/20**.
