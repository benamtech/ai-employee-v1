import { existsSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFile(join(root, path), "utf8");

const productionEntrypoints = [
  "infra/scripts/production-normal-up.mjs",
  "infra/scripts/prod-like-normal-employee-up.mjs",
  "infra/scripts/deploy-smoke.mjs",
  "infra/scripts/deploy-rollback.mjs",
] as const;

const dockerComposeAvailable = spawnSync("docker", ["compose", "version"], {
  cwd: root,
  encoding: "utf8",
}).status === 0;

describe("canonical production deployment topology", () => {
  it("routes every production launcher, smoke, and rollback entrypoint through one compose authority", async () => {
    const topology = await source("infra/scripts/production-topology.mjs");
    expect(topology).toContain('PRODUCTION_COMPOSE_FILE = "infra/deploy/docker-compose.production.yml"');
    expect(topology).toContain('PRODUCTION_CONTROL_NETWORK = "amtech_control"');

    for (const path of productionEntrypoints) {
      const script = await source(path);
      expect(script, path).toContain('from "./production-topology.mjs"');
      expect(script, path).not.toContain("infra/deploy/docker-compose.yml");
    }
  });

  it("removes legacy bridge-Caddy and shared employee-network assumptions from production-like startup", async () => {
    const script = await source("infra/scripts/prod-like-normal-employee-up.mjs");
    expect(script).not.toContain("amtech_runtime");
    expect(script).not.toContain("amtech-ai-employee-caddy-1");
    expect(script).not.toContain("amtech-hermes-{{EMPLOYEE_ID}}");
    expect(script).toContain('put("CADDY_EMPLOYEE_UPSTREAM_HOST", "localhost")');
    expect(script).toContain('removeEnv(state, "HERMES_DOCKER_NETWORK")');
    expect(script).toContain("PROVISIONER_SOCKET_PATH");
    expect(script).toContain("MODEL_GATEWAY_EMPLOYEE_BASE_URL");
  });

  it("requires canonical five-service health, Unix-socket custody, and host-side employee topology inspection", async () => {
    const smoke = await source("infra/scripts/deploy-smoke.mjs");
    for (const service of ["manager", "model-gateway", "host-provisioner", "web", "caddy"]) {
      expect(smoke).toContain(`composeHealth("${service}")`);
    }
    expect(smoke).toContain('"host-provisioner",\n    "test",\n    "-S",\n    "/run/amtech-provisioner/provisioner.sock"');
    expect(smoke).toContain('spawnSync("docker", ["network", "inspect", network]');
    expect(smoke).not.toContain("getent");
    expect(smoke).not.toContain("EMPLOYEE_DNS_ALIAS");
  });

  it("plans rollback across the complete control plane and recomputes acceptance", async () => {
    const rollback = await source("infra/scripts/deploy-rollback.mjs");
    for (const service of ["manager", "model-gateway", "host-provisioner", "web", "caddy"]) {
      expect(rollback).toContain(service);
    }
    expect(rollback).toContain("config --quiet");
    expect(rollback).toContain("npm run deploy:smoke");
    expect(rollback).toContain("npm run prod:normal:validate");
    expect(rollback).toContain("ROLLBACK_DATABASE_COMPATIBILITY");
  });

  it.runIf(dockerComposeAvailable)("renders the canonical compose as a five-service topology with separated Docker authority", async () => {
    const envPath = join(root, "infra", "deploy", ".env.production");
    const createdEnv = !existsSync(envPath);
    if (createdEnv) await writeFile(envPath, "AMTECH_GIT_SHA=compose-contract-test\n", "utf8");

    try {
      const result = spawnSync("docker", [
        "compose",
        "-f",
        "infra/deploy/docker-compose.production.yml",
        "--env-file",
        "infra/deploy/.env.production",
        "config",
        "--format",
        "json",
      ], { cwd: root, encoding: "utf8" });

      expect(result.status, `${result.stdout ?? ""}\n${result.stderr ?? ""}`).toBe(0);
      const config = JSON.parse(result.stdout);
      expect(Object.keys(config.services).sort()).toEqual([
        "caddy",
        "host-provisioner",
        "manager",
        "model-gateway",
        "web",
      ]);
      expect(JSON.stringify(config.services.manager)).not.toContain("/var/run/docker.sock");
      expect(JSON.stringify(config.services["host-provisioner"])).toContain("/var/run/docker.sock");
      expect(config.services.caddy.network_mode).toBe("host");
      expect(config.networks.amtech_control.name).toBe("amtech_control");
    } finally {
      if (createdEnv) await unlink(envPath);
    }
  });
});

describe("production image inclusion", () => {
  it("fails the image build when gateway or worker artifacts are absent", async () => {
    const dockerfile = await source("infra/deploy/manager.Dockerfile");
    for (const artifact of [
      "apps/manager/dist/model-gateway-server.js",
      "apps/manager/dist/lib/model-gateway-http.js",
      "apps/manager/dist/lib/provisioner-idempotency.js",
      "apps/manager/dist/lib/provisioning-reconciler.js",
      "apps/manager/dist/lib/ambient-inbox.js",
      "apps/manager/dist/typeproofs/production-boundary.js",
    ]) {
      expect(dockerfile).toContain(`test -f ${artifact}`);
    }
  });
});

describe("employee runtime network boundary", () => {
  it("creates one isolated bridge per employee and attaches only scoped control peers", async () => {
    const launcher = await source("infra/scripts/local/start-hermes-container.sh");
    expect(launcher).toContain("--internal");
    expect(launcher).toContain('docker network connect --alias amtech-manager --gw-priority -1');
    expect(launcher).toContain('docker network connect --alias amtech-model-gateway --gw-priority -1');
    expect(launcher).toContain('docker network disconnect -f "$network" "$manager_container"');
    expect(launcher).toContain('docker network disconnect -f "$network" "$model_gateway_container"');
    expect(launcher).toContain("docker exec \"$container\" python3");
    expect(launcher).toContain("employee runtime cannot reach scoped model gateway");
    expect(launcher).toContain("employee runtime health did not pass");
    expect(launcher).toContain('os.environ["API_SERVER_PORT"]+"/health"');
  });

  it("uses network-scoped Manager and Model Gateway aliases in production profiles", async () => {
    const compose = await source("infra/deploy/docker-compose.production.yml");
    expect(compose).toContain("container_name: amtech-manager");
    expect(compose).toContain("container_name: amtech-model-gateway");
    expect(compose).toContain("DOCKER_MANAGER_API_ORIGIN: http://amtech-manager:8080");
    expect(compose).toContain("MODEL_GATEWAY_EMPLOYEE_BASE_URL: http://amtech-model-gateway:8092/v1");
    expect(compose).toContain("MANAGER_CONTAINER_NAME: amtech-manager");
    expect(compose).toContain("MODEL_GATEWAY_CONTAINER_NAME: amtech-model-gateway");
  });

  it("keeps Model Gateway host-loopback-bound and absent from public Caddy ingress", async () => {
    const compose = await source("infra/deploy/docker-compose.production.yml");
    const caddy = await source("infra/caddy/production.Caddyfile");
    expect(compose).toContain('"127.0.0.1:8092:8092"');
    expect(compose).toContain('command: ["node", "apps/manager/dist/model-gateway-server.js"]');
    expect(caddy).not.toContain("8092");
    expect(caddy.toLowerCase()).not.toContain("model-gateway");
  });

  it("runs production Caddy in the host namespace so loopback-only upstreams are reachable", async () => {
    const compose = await source("infra/deploy/docker-compose.production.yml");
    expect(compose).toContain("network_mode: host");
    expect(compose).toContain("WEB_UPSTREAM: ${WEB_UPSTREAM:-127.0.0.1:3000}");
    expect(compose).toContain("MANAGER_UPSTREAM: ${MANAGER_UPSTREAM:-127.0.0.1:8080}");
    expect(compose).toContain("CADDY_EMPLOYEE_UPSTREAM_HOST: localhost");
  });
});

describe("owner session containment", () => {
  it("keeps the owner bearer out of browser JSON and private-hop URLs", async () => {
    const login = await source("apps/web/app/api/auth/login/route.ts");
    const stream = await source("apps/web/app/api/employee/[employeeId]/events/route.ts");
    const generator = await source("apps/manager/scripts/generate-production-server.mjs");

    expect(login).toContain("delete safeJson.owner_session_token");
    expect(login).toContain('httpOnly: true');
    expect(login).toContain('response.headers.set("Cache-Control", "no-store")');
    expect(login).not.toContain("NextResponse.json(json");

    expect(stream).toContain('"X-AMTECH-Owner-Session": token');
    expect(stream).not.toContain("owner_session_token=");
    expect(stream).not.toContain("encodeURIComponent(token)");

    expect(generator).toContain('c.req.header("X-AMTECH-Owner-Session")');
    expect(generator).toContain('"owner_stream_session_header"');
  });
});

describe("rotation sequencing", () => {
  it("recreates the runtime from the rotated profile before old-token revocation", async () => {
    const renderer = await source("apps/manager/src/lib/profile-renderer.ts");
    const host = await source("apps/manager/src/provisioner-host.ts");
    const reconciler = await source("apps/manager/src/lib/provisioning-reconciler.ts");
    const rewrite = renderer.indexOf("writeFile(configPath, nextConfig");
    const checksum = renderer.indexOf("assertProfileTreeIntegrity(generated_path)", rewrite);
    const reload = renderer.indexOf("runRuntimeStart(generated_path)", checksum);
    expect(rewrite).toBeGreaterThan(-1);
    expect(checksum).toBeGreaterThan(rewrite);
    expect(reload).toBeGreaterThan(checksum);
    expect(host).toContain("rotated.runtime_reload_output");
    expect(host).not.toContain("restart runtime after credential rotation");

    const verifyNew = reconciler.indexOf("new_model_gateway_credential_not_live");
    const revokeOld = reconciler.indexOf("revokeModelGatewayCredential(db, oldCredentialId)", verifyNew);
    const verifyOldFails = reconciler.indexOf("old_model_gateway_credential_still_valid", revokeOld);
    expect(verifyNew).toBeGreaterThan(-1);
    expect(revokeOld).toBeGreaterThan(verifyNew);
    expect(verifyOldFails).toBeGreaterThan(revokeOld);
  });
});

describe("durable worker contracts", () => {
  it("uses atomic skip-locked leases and durable dead-letter/effect receipts", async () => {
    const leases = await source("packages/db/migrations/0034_reconciler_workers_and_ambient_replay.sql");
    const receipts = await source("packages/db/migrations/0035_worker_terminal_claim_and_effect_receipts.sql");
    expect(leases).toContain("for update skip locked");
    expect(leases).toContain("claim_next_provisioning_job");
    expect(leases).toContain("claim_next_provisioning_command");
    expect(leases).toContain("claim_next_ambient_event");
    expect(leases).toContain("ambient_event_dead_letters");
    expect(receipts).toContain("ambient_effect_receipts");
    expect(receipts).toContain("completed_at is null");
    expect(leases).not.toContain("security definer");
    expect(receipts).not.toContain("security definer");
  });

  it("grants the backend role explicitly while preserving browser-role revocations", async () => {
    const grants = await source("packages/db/migrations/0036_worker_service_role_grants.sql");
    expect(grants).toContain("to service_role");
    expect(grants).toContain("from anon, authenticated");
    expect(grants).toContain("grant execute on function claim_next_provisioning_job");
  });

  it("records verified duplicate provider deliveries atomically", async () => {
    const migration = await source("packages/db/migrations/0038_needs_reprovision_command_trigger.sql");
    const inbox = await source("apps/manager/src/lib/ambient-inbox.ts");
    expect(migration).toContain("duplicate_count");
    expect(migration).toContain("record_ambient_event_duplicate");
    expect(migration).toContain("security invoker");
    expect(inbox).toContain('db.rpc("record_ambient_event_duplicate"');
  });

  it("gates ready on a processed owner-facing welcome effect", async () => {
    const welcome = await source("packages/db/migrations/0037_welcome_effect_ready_gate.sql");
    expect(welcome).toContain("materialize_processed_employee_welcome");
    expect(welcome).toContain("ambient_employee_welcome_effect");
    expect(welcome).toContain("provisioning_ready_requires_welcome");
    expect(welcome).toContain("temporarily_welcome_effect_not_processed");
    expect(welcome).toContain("Your AI Employee is ready");
  });

  it("persists effect keys before host calls and schedules fleet drift checks", async () => {
    const reconciler = await source("apps/manager/src/lib/provisioning-reconciler.ts");
    expect(reconciler).toContain("effect_keys");
    expect(reconciler).toContain("saveContext(db, job, { effect_keys:");
    expect(reconciler).toContain("periodic_fleet_reconciliation");
    expect(reconciler).toContain("claim_next_provisioning_job");
  });

  it("keeps runtime, route, binding, and welcome transitions ordered", async () => {
    const machine = await source("apps/manager/src/lib/provisioning-state-machine.ts");
    const runtime = machine.indexOf('runtime_started: "runtime_healthy"');
    const route = machine.indexOf('runtime_healthy: "routing_activated"');
    const binding = machine.indexOf('routing_activated: "channel_configured"');
    const welcome = machine.indexOf('channel_configured: "welcome_sent"');
    const ready = machine.indexOf('welcome_sent: "ready"');
    expect(runtime).toBeGreaterThan(-1);
    expect(route).toBeGreaterThan(runtime);
    expect(binding).toBeGreaterThan(route);
    expect(welcome).toBeGreaterThan(binding);
    expect(ready).toBeGreaterThan(welcome);
  });

  it("routes operator lifecycle mutations through provisioning commands", async () => {
    const lifecycle = await source("infra/scripts/employee-lifecycle.mjs");
    expect(lifecycle).toContain("/manager/provisioning/commands");
    expect(lifecycle).toContain('restart: "restore"');
    expect(lifecycle).toContain('stop: "suspend"');
    expect(lifecycle).not.toContain('docker(["restart"');
    expect(lifecycle).not.toContain('docker(["stop"');
  });
});
