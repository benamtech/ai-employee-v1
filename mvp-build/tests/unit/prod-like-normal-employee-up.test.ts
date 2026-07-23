import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("infra/scripts/prod-like-normal-employee-up.mjs", "utf8");

describe("production normal Caddy upstream preparation", () => {
  it("forces host-loopback upstreams for host-network Caddy", () => {
    expect(source).toContain('put("WEB_UPSTREAM", "127.0.0.1:3000")');
    expect(source).toContain('put("MANAGER_UPSTREAM", "127.0.0.1:8080")');

    const webOriginIndex = source.indexOf('put("WEB_APP_ORIGIN", webOrigin)');
    const webUpstreamIndex = source.indexOf('put("WEB_UPSTREAM", "127.0.0.1:3000")');
    const managerUpstreamIndex = source.indexOf('put("MANAGER_UPSTREAM", "127.0.0.1:8080")');
    const caddyClientDirIndex = source.indexOf('put("CADDY_CLIENTS_DIR", "/var/lib/amtech/caddy/clients")');

    expect(webOriginIndex).toBeGreaterThanOrEqual(0);
    expect(webUpstreamIndex).toBeGreaterThan(webOriginIndex);
    expect(managerUpstreamIndex).toBeGreaterThan(webUpstreamIndex);
    expect(caddyClientDirIndex).toBeGreaterThan(managerUpstreamIndex);
  });
});
