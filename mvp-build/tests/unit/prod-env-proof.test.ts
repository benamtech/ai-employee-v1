import { describe, expect, it } from "vitest";

describe("production environment proof aggregation", () => {
  it("labels local mirror proof separately from missing live provider/runtime proof", async () => {
    const mod = await import("../../infra/scripts/prod-env-proof.mjs") as any;
    const proof = mod.summarizeEnvironment([
      { kind: "deploy_smoke", status: "pass", checked_at: "2026-07-11T18:00:00Z", proof_path: "infra/proofs/deploy.json" },
      { kind: "caddy_wildcard_dns01_proof", status: "pass", checked_at: "2026-07-11T18:01:00Z", proof_path: "infra/proofs/caddy.json" },
      { kind: "cloudflare_dns_desired_state", status: "dry_run", proof_tier: "static", checked_at: "2026-07-11T18:02:00Z", proof_path: "infra/proofs/cf.json" },
    ], { AMTECH_ENVIRONMENT_NAME: "test", HERMES_DOCKER_NETWORK: "amtech_runtime", AMTECH_PUBLIC_DOMAIN: "amtechai.com" });
    expect(proof.proof_tier).toBe("local_mirror");
    expect(proof.status).toBe("needs_proof");
    expect(proof.checks.find((c: { name: string }) => c.name === "core_compose").status).toBe("pass");
    expect(JSON.stringify(proof)).not.toContain("provider_runtime_live proof exists");
  });

  it("fails production-like proof when UI fixture mode is enabled", async () => {
    const mod = await import("../../infra/scripts/prod-env-proof.mjs") as any;
    const proof = mod.summarizeEnvironment([], {
      AMTECH_ENVIRONMENT_NAME: "pod-alpha",
      NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1",
    });
    expect(proof.status).toBe("fail");
    const fixture = proof.checks.find((c: { name: string }) => c.name === "ui_fixture_mode");
    expect(fixture.status).toBe("fail");
  });
});
