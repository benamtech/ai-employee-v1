import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function script(path: string): Promise<string> {
  return readFile(path, "utf8");
}

describe("Pod Alpha operator proof scripts", () => {
  it("deploy smoke emits JSON proof and checks core services plus employee network topology", async () => {
    const src = await script("infra/scripts/deploy-smoke.mjs");
    expect(src).toContain("deploy_smoke");
    expect(src).toContain("manager-health");
    expect(src).toContain("caddy:validate");
    expect(src).toContain("employee-network:topology");
    expect(src).toContain("PRODUCTION_CONTAINER_NAMES.manager");
    expect(src).toContain("PRODUCTION_CONTAINER_NAMES.modelGateway");
    expect(src).toContain("unexpected_employee_containers");
    expect(src).toContain("proof_json:");
  });

  it("Caddy proof exercises good snippet, bad snippet, rollback validation, and old-route liveness", async () => {
    const src = await script("infra/scripts/caddy-proof.mjs");
    expect(src).toContain("good_snippet_valid");
    expect(src).toContain("bad_snippet_rejected");
    expect(src).toContain("rollback_config_valid");
    expect(src).toContain("old_route_alive_after_rollback");
  });

  it("wildcard Caddy proof checks DNS-01 config and Cloudflare module presence", async () => {
    const src = await script("infra/scripts/caddy-wildcard-proof.mjs");
    expect(src).toContain("dns.providers.cloudflare");
    expect(src).toContain("config_mentions_wildcard_dns01");
    expect(src).toContain("production_caddyfile_validates");
  });

  it("Cloudflare DNS script defaults to dry-run and gates apply with explicit confirmation", async () => {
    const src = await script("infra/scripts/cloudflare-dns.mjs");
    expect(src).toContain("cloudflare_dns_desired_state");
    expect(src).toContain("CLOUDFLARE_DNS_APPLY_CONFIRM");
    expect(src).toContain("*.agents");
    expect(src).toContain("secrets_logged");
  });

  it("production environment proof labels proof tiers and reads latest proof JSON", async () => {
    const src = await script("infra/scripts/prod-env-proof.mjs");
    expect(src).toContain("production_environment_proof");
    expect(src).toContain("limited_live_infra");
    expect(src).toContain("provider_runtime_live");
  });

  it("scoped MCP reprovision does not print the raw token and clears reprovision only after proof", async () => {
    const src = await script("infra/scripts/reprovision-scoped-mcp.mjs");
    expect(src).toContain("mcpToolList(minted.token)");
    expect(src).toContain("needs_reprovision=false");
    expect(src).toContain("raw_token_logged: false");
    expect(src).toContain("provisioner_result");
    expect(src).toContain("REPROVISION_SMS_ENABLED");
    expect(src).not.toMatch(/console\.log\([^)]*minted\.token/);
  });

  it("capacity harness is guarded before starting containers and records p95/p99 basis", async () => {
    const src = await script("infra/scripts/capacity-pod-alpha.mjs");
    expect(src).toContain("CAPACITY_ALLOW_START");
    expect(src).toContain("p95_pss_kb");
    expect(src).toContain("p99_pss_kb");
    expect(src).toContain("recommended_cap");
  });

  it("backup restore is dry-run by default for restores", async () => {
    const src = await script("infra/scripts/backup-restore.mjs");
    expect(src).toContain("AMTECH_RESTORE_APPLY");
    expect(src).toContain("dry_run");
    expect(src).toContain("sha256");
  });

  it("egress policy is dry-run by default and targets employee runtime containers", async () => {
    const src = await script("infra/scripts/egress-policy.mjs");
    expect(src).toContain("AMTECH_EGRESS_APPLY");
    expect(src).toContain("label=com.amtech.kind=employee-runtime");
    expect(src).toContain("DOCKER-USER");
    expect(src).toContain("169.254.169.254/32");
  });
});
