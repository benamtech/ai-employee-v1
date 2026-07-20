import { chmod, lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { employeeModelGatewayUrl } from "../../apps/manager/src/lib/model-gateway.js";
import {
  renderProfilePackage,
  rotateRenderedModelGatewayCredential,
} from "../../apps/manager/src/lib/profile-renderer.js";
import { computeProfileChecksum } from "../../apps/manager/src/lib/runtime-profile-integrity.js";
import type { ProvisionerRequest } from "../../packages/shared/src/provisioner.js";

let tempRoot: string | null = null;
const originalEnv = { ...process.env };

async function thawTree(path: string): Promise<void> {
  const info = await lstat(path);
  if (info.isDirectory()) {
    await chmod(path, 0o700);
    for (const entry of await readdir(path, { withFileTypes: true })) {
      await thawTree(join(path, entry.name));
    }
    return;
  }
  await chmod(path, 0o600);
}

afterEach(async () => {
  process.env = { ...originalEnv };
  if (tempRoot) {
    try {
      await thawTree(tempRoot);
      await rm(tempRoot, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup only; test assertions remain authoritative.
    }
  }
  tempRoot = null;
});

async function allText(root: string): Promise<string> {
  const files: string[] = [];
  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else files.push(full);
    }
  }
  await walk(root);
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
}

function profileRequest(token: string, version: number, workspace: string): ProvisionerRequest {
  return {
    request_id: `preq_profile_${version}`,
    operation: version === 1 ? "render_profile" : "rotate_model_gateway_credential",
    profile_package_key: "contractor_estimator",
    account_id: "acct_alpha",
    employee_id: "emp_alpha",
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    nonce: `nonce_profile_${version}`,
    idempotency_key: `idem_profile_${version}`,
    params: {
      client_id: "client-alpha",
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      profile_package_key: "contractor_estimator",
      runtime_backend: "docker",
      business_display_name: "Alpha Painting",
      business_kind: "painting",
      owner_name: "Alex",
      owner_phone_e164: "+15555550100",
      employee_name: "Avery",
      timezone: "America/New_York",
      workspace_dir: workspace,
      webhook_url: "https://api.test/webhooks/twilio/emp_alpha",
      gateway_port: 8123,
      top_workflows: ["estimates"],
      tools_mentioned: [],
      seed_skills: ["estimate"],
      profile_context: {
        package_key: "contractor_estimator",
        generated_from: "onboarding_manifest",
        memory_limits: { memory_chars: 2200, user_chars: 1375 },
        resource_pointers: ["amtech://manager/business-brain"],
        slots: [],
      },
      model_gateway: {
        gateway_url: employeeModelGatewayUrl("emp_alpha"),
        model_alias: "amtech-primary",
        allowed_providers: ["openai_compatible"],
        allowed_models: ["amtech-primary"],
        spend_limit_cents: 40000,
        rate_limit_per_minute: 60,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
        credential_version: version,
      },
    },
    render_secrets: {
      manager_mcp_token: `mcp_scoped_employee_alpha_v${version}`,
      model_gateway_token: token,
    },
  };
}

describe("profile tree integrity", () => {
  it("freezes rendered profiles and exposes out-of-band mutation as checksum drift", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "amtech-profile-integrity-"));
    process.env.AMTECH_MVP_ROOT = process.cwd();
    process.env.HERMES_HOME = join(tempRoot, "hermes");
    process.env.PROFILE_VALIDATION_COMMAND = "node -e \"process.exit(0)\"";
    process.env.NODE_ENV = "production";

    const rendered = await renderProfilePackage(profileRequest("mgw_scoped_integrity", 1, join(tempRoot, "workspace")));
    const rootStat = await lstat(rendered.generated_path);
    const configPath = join(rendered.generated_path, "config.yaml");
    const configStat = await lstat(configPath);

    expect(rootStat.mode & 0o022).toBe(0);
    expect(configStat.mode & 0o022).toBe(0);
    expect(configStat.mode & 0o004).toBe(0);
    expect(await computeProfileChecksum(rendered.generated_path)).toBe(rendered.profile_checksum);

    // Simulate a privileged/out-of-band host mutation. The runtime reconciler
    // compares this recomputed value with the render-time checksum and fails with
    // runtime_profile_checksum_drift; this test proves the underlying signal.
    await thawTree(rendered.generated_path);
    const original = await readFile(configPath, "utf8");
    await writeFile(configPath, `${original}\n# simulated drift\n`, "utf8");
    expect(await computeProfileChecksum(rendered.generated_path)).not.toBe(rendered.profile_checksum);
  });
});

describe("rendered profile isolation", () => {
  it("renders no provider master secrets or unresolved tokens and updates checksum on rotation", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "amtech-profile-proof-"));
    process.env.AMTECH_MVP_ROOT = process.cwd();
    process.env.HERMES_HOME = join(tempRoot, "hermes");
    process.env.PROFILE_VALIDATION_COMMAND = "node -e \"process.exit(0)\"";
    process.env.NODE_ENV = "production";
    process.env.MODEL_GATEWAY_PROVIDER_API_KEY = "MASTER_PROVIDER_SECRET_MUST_NOT_RENDER";
    process.env.OPENAI_API_KEY = "OPENAI_MASTER_SECRET_MUST_NOT_RENDER";

    const firstToken = "mgw_scoped_employee_alpha_v1";
    const first = await renderProfilePackage(profileRequest(firstToken, 1, join(tempRoot, "workspace")));
    const firstText = await allText(first.generated_path);
    expect(firstText).toContain(employeeModelGatewayUrl("emp_alpha"));
    expect(firstText).toContain(firstToken);
    expect(firstText).not.toContain(process.env.MODEL_GATEWAY_PROVIDER_API_KEY);
    expect(firstText).not.toContain(process.env.OPENAI_API_KEY);
    expect(firstText).not.toMatch(/{{\s*[A-Z0-9_]+\s*}}/);

    const secondToken = "mgw_scoped_employee_alpha_v2";
    const rotatedRequest = profileRequest(secondToken, 2, join(tempRoot, "workspace"));
    rotatedRequest.operation = "rotate_model_gateway_credential";
    const rotated = await rotateRenderedModelGatewayCredential(rotatedRequest);
    const rotatedText = await allText(rotated.generated_path);
    expect(rotated.profile_checksum).not.toBe(first.profile_checksum);
    expect(rotatedText).toContain(secondToken);
    expect(rotatedText).not.toContain(firstToken);
    expect(rotatedText).not.toContain(process.env.MODEL_GATEWAY_PROVIDER_API_KEY);
    expect(rotatedText).not.toMatch(/{{\s*[A-Z0-9_]+\s*}}/);
  });
});

describe("production gateway exposure", () => {
  it("keeps the gateway loopback-bound, scoped to employee networks, and out of public Caddy routing", async () => {
    const compose = await readFile(join(process.cwd(), "infra/deploy/docker-compose.production.yml"), "utf8");
    const caddy = await readFile(join(process.cwd(), "infra/caddy/production.Caddyfile"), "utf8");
    const launcher = await readFile(join(process.cwd(), "infra/scripts/local/start-hermes-container.sh"), "utf8");
    expect(compose).toContain("MODEL_GATEWAY_EMPLOYEE_BASE_URL: http://amtech-model-gateway:8092/v1");
    expect(compose).toContain('"127.0.0.1:8092:8092"');
    expect(compose).toContain("MODEL_GATEWAY_CONTAINER_NAME: amtech-model-gateway");
    expect(launcher).toContain("docker network connect --alias amtech-model-gateway");
    expect(caddy).not.toContain("8092");
    expect(caddy.toLowerCase()).not.toContain("model-gateway");
  });
});
