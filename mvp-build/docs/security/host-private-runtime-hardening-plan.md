# Host-Private Runtime Hardening Plan

Status: approved implementation plan
Branch: `hardening/host-private-runtime-boundaries`
Scope: prod-like hardening before unrelated customer pilots

## Required invariants

1. Manager MUST NOT mount `/var/run/docker.sock`.
2. Docker authority MUST move to a host-private provisioner bound to `127.0.0.1` or a Unix socket and excluded from Cloudflare, Caddy, and public DNS.
3. The provisioner MUST accept only signed, short-lived, idempotent declarative lifecycle requests. It MUST reject arbitrary image, mount, network, capability, command, entrypoint, and environment overrides.
4. Each employee MUST receive a dedicated private Docker bridge. Employees MUST NOT share a fleet network or route to peers, Web, Caddy, databases, Docker APIs, metadata endpoints, or unrelated host services.
5. Hermes gateway ports MUST publish only to host loopback. Manager reaches runtimes through a host-private runtime proxy/controller.
6. Hermes retains terminal, file, browser, delegation, MCP, and native-skill capability. Security is enforced through isolation, scoped identity, controlled egress, and policy rather than disabling the runtime.
7. Canonical generated profiles MUST be immutable and checksummed. Runtime copies are disposable. Secrets, canonical profile, writable workspace, and ephemeral runtime state MUST be separate mounts.
8. Provider master model keys MUST NOT be rendered into employee containers. Employees use scoped credentials to a host-private model gateway.
9. Provisioning MUST be a persisted state machine with compare-and-swap transitions, idempotency, retries, timeouts, evidence, and compensation.
10. Provider webhooks MUST verify and durably insert into an inbox before acknowledgement. Processing occurs asynchronously through leased workers with retry, dead-letter, and replay support.
11. Manager MUST be decomposed into separately privileged entrypoints: public/API control plane, event worker, runtime controller, and host provisioner.

## Target topology

```text
Cloudflare -> Caddy -> Web / public Manager API
                         |
                         +-> host-private runtime controller
                         +-> host-private model gateway
                         +-> host-private provisioner -> Docker socket

127.0.0.1 runtime ports:
  employee A private bridge -> Hermes A
  employee B private bridge -> Hermes B
  employee C private bridge -> Hermes C
```

## Provisioning state machine

```text
requested
resources_reserved
profile_rendered
credentials_minted
runtime_started
runtime_healthy
routing_activated
channel_configured
welcome_sent
ready
failed
compensating
compensated
```

Effect order: reserve resources -> render immutable profile -> mint scoped credentials -> start isolated runtime -> prove health -> activate runtime/public routing -> configure channels -> send welcome -> mark ready.

## Runtime filesystem contract

```text
/opt/amtech/profile   read-only canonical profile
/opt/amtech/secrets   read-only files or tmpfs
/workspace            explicit writable business workspace
/run/amtech           tmpfs runtime state
/tmp                  bounded tmpfs
```

Use read-only root filesystem where Hermes permits. Apply `nodev,nosuid,noexec` to writable mounts where compatible. Reprovision from canonical profile and preserve only approved durable data classes.

## Webhook contract

Request path: bounded raw body -> signature verification -> provider identity validation -> atomic inbox insert -> immediate 200/202.

Worker path: lease row -> resolve tenant context -> normalize -> append internal event -> mark processed. Retry with backoff; dead-letter after bounded attempts; retain operator replay.

## Acceptance gates

- Manager has no Docker socket.
- Provisioner is unreachable through public ingress.
- Employee-to-employee network probes fail.
- Employee-to-control-service probes fail except scoped MCP/model routes.
- Canonical profile checksum survives runtime mutation attempts.
- Provider master keys are absent from runtime environment/files.
- Host reboot reconstructs all `ready` employees from desired state.
- Duplicate webhooks under concurrency produce one internal event.
- Provisioning interruption at every transition resumes or compensates deterministically.
