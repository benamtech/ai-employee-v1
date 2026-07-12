import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Caddy wildcard DNS-01 proof helpers", () => {
  it("recognizes the Cloudflare DNS provider module", async () => {
    const mod = await import("../../infra/scripts/caddy-wildcard-proof.mjs") as any;
    expect(mod.parseHasCloudflareDnsModule("http.handlers.reverse_proxy\ndns.providers.cloudflare\n")).toBe(true);
    expect(mod.parseHasCloudflareDnsModule("http.handlers.reverse_proxy\n")).toBe(false);
  });

  it("keeps production wildcard DNS-01 config explicit", async () => {
    const mod = await import("../../infra/scripts/caddy-wildcard-proof.mjs") as any;
    const source = await readFile("infra/caddy/production.Caddyfile", "utf8");
    expect(mod.configMentionsWildcardDns01(source)).toBe(true);
  });
});
