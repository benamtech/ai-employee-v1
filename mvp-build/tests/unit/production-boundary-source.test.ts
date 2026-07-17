import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFile(join(root, path), "utf8");

describe("production image inclusion", () => {
  it("fails the image build when gateway or worker artifacts are absent", async () => {
    const dockerfile = await source("infra/deploy/manager.Dockerfile");
    for (const artifact of [
      "apps/manager/dist/model-gateway-server.js",
      "apps/manager/dist/lib/provisioning-reconciler.js",
      "apps/manager/dist/lib/ambient-inbox.js",
      "apps/manager/dist/typeproofs/production-boundary.js",
    ]) {
      expect(dockerfile).toContain(`test -f ${artifact}`);
    }
  });
});

describe("employee model-gateway network boundary", () => {
  it("requires explicit host-gateway mapping and a probe from the actual employee container", async () => {
    const launcher = await source("infra/scripts/local/start-hermes-container.sh");
    expect(launcher).toContain("--network \"$network\"");
    expect(launcher).toContain("--add-host=host.docker.internal:host-gateway");
    expect(launcher).toContain("docker exec \"$container\" python3");
    expect(launcher).toContain("MODEL_GATEWAY_URL");
    expect(launcher).toContain("employee runtime cannot reach host-private model gateway");
  });

  it("keeps the gateway loopback-bound and absent from public Caddy ingress", async () => {
    const compose = await source("infra/deploy/docker-compose.production.yml");
    const caddy = await source("infra/caddy/production.Caddyfile");
    expect(compose).toContain('"127.0.0.1:8092:8092"');
    expect(compose).toContain("node apps/manager/dist/model-gateway-server.js");
    expect(caddy).not.toContain("8092");
    expect(caddy.toLowerCase()).not.toContain("model-gateway");
  });
});

describe("rotation sequencing", () => {
  it("recreates the runtime from the rotated profile before old-token revocation", async () => {
    const renderer = await source("apps/manager/src/lib/profile-renderer.ts");
    const reconciler = await source("apps/manager/src/lib/provisioning-reconciler.ts");
    const rewrite = renderer.indexOf("writeFile(configPath, nextConfig");
    const checksum = renderer.indexOf("assertProfileTreeIntegrity(generated_path)", rewrite);
    const reload = renderer.indexOf("runRuntimeStart(generated_path)", checksum);
    expect(rewrite).toBeGreaterThan(-1);
    expect(checksum).toBeGreaterThan(rewrite);
    expect(reload).toBeGreaterThan(checksum);

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
});
