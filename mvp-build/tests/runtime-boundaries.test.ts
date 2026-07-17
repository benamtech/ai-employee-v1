import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFile(resolve(root, path), "utf8");

describe("production runtime authority boundaries", () => {
  it("does not give Manager the Docker socket or Docker CLI", async () => {
    const compose = await read("infra/deploy/docker-compose.production.yml");
    const dockerfile = await read("infra/deploy/manager.Dockerfile");
    expect(compose).not.toContain("/var/run/docker.sock:/var/run/docker.sock");
    expect(dockerfile).not.toMatch(/apt-get install[^\n]*docker(?:\.io)?/);
  });

  it("keeps the provisioner host-private on a Unix socket", async () => {
    const compose = await read("infra/deploy/docker-compose.production.yml");
    const provisioner = await read("apps/manager/src/host-provisioner.ts");
    expect(compose).toContain("PROVISIONER_SOCKET_PATH");
    expect(compose).not.toMatch(/host-provisioner:[\s\S]*?ports:/);
    expect(provisioner).toContain("server.listen(path");
    expect(provisioner).toContain("PROVISIONER_SIGNING_SECRET");
    expect(provisioner).toContain("nonce_replayed");
  });

  it("uses one internal bridge and loopback gateway per employee", async () => {
    const launcher = await read("infra/scripts/local/start-hermes-container.sh");
    expect(launcher).toContain('network="amtech-employee-${employee_id}"');
    expect(launcher).toContain("docker network create --internal");
    expect(launcher).toContain('-p "127.0.0.1:${port}:${port}"');
    expect(launcher).not.toContain("--network-alias");
    expect(launcher).not.toContain("/var/run/docker.sock");
  });

  it("mounts canonical profile read-only and separates mutable state", async () => {
    const launcher = await read("infra/scripts/local/start-hermes-container.sh");
    expect(launcher).toContain("/opt/amtech/profile:ro");
    expect(launcher).toContain("/workspace:rw");
    expect(launcher).toContain("--read-only");
    expect(launcher).toContain("/run/amtech");
    expect(launcher).toContain("/tmp");
  });

  it("fails production safety when provider master keys can enter profiles", async () => {
    const integrity = await read("apps/manager/src/lib/runtime-profile-integrity.ts");
    expect(integrity).toContain("provider_master_key_rendered");
    expect(integrity).toContain("provider_master_key_value_rendered");
    const renderer = await read("apps/manager/src/lib/profile-renderer.ts");
    // Until the host-private model gateway fully replaces direct-key rendering,
    // this assertion intentionally records the remaining production blocker.
    expect(renderer).toContain("ANTHROPIC_API_KEY");
  });
});
