import { describe, expect, it } from "vitest";

describe("Cloudflare DNS desired-state planner", () => {
  it("plans Pod Alpha records with wildcard DNS-only and no AAAA by default", async () => {
    const mod = await import("../../infra/scripts/cloudflare-dns.mjs") as any;
    const records = mod.desiredRecords({ domain: "amtechai.com", ipv4: "203.0.113.10" });
    expect(records).toContainEqual({ type: "A", name: "*.agents.amtechai.com", content: "203.0.113.10", ttl: 300, proxied: false });
    expect(records).toContainEqual({ type: "A", name: "api.amtechai.com", content: "203.0.113.10", ttl: 300, proxied: false });
    expect(records).toContainEqual({ type: "CNAME", name: "www.amtechai.com", content: "amtechai.com", ttl: 300, proxied: false });
    expect(records.some((r: { type: string }) => r.type === "AAAA")).toBe(false);
  });

  it("only emits AAAA records behind explicit opt-in", async () => {
    const mod = await import("../../infra/scripts/cloudflare-dns.mjs") as any;
    const records = mod.desiredRecords({ domain: "amtechai.com", ipv4: "203.0.113.10", ipv6: "2001:db8::10", includeAaaa: true });
    expect(records).toContainEqual({ type: "AAAA", name: "*.agents.amtechai.com", content: "2001:db8::10", ttl: 300, proxied: false });
  });

  it("produces deterministic create/update diffs and redacts token-shaped fields", async () => {
    const mod = await import("../../infra/scripts/cloudflare-dns.mjs") as any;
    const desired = mod.desiredRecords({ domain: "amtechai.com", ipv4: "203.0.113.10" });
    const diff = mod.diffRecords(desired, [
      { id: "rec_1", type: "A", name: "api.amtechai.com", content: "198.51.100.1", ttl: 300, proxied: false },
    ]);
    expect(diff[0].action).toBe("create");
    expect(diff.some((change: { action: string; id?: string }) => change.action === "update" && change.id === "rec_1")).toBe(true);
    expect(JSON.stringify(mod.redact({ token: "abc.def.ghi", nested: { authorization: "Bearer verysecretvalue" } }))).not.toContain("verysecretvalue");
  });
});
