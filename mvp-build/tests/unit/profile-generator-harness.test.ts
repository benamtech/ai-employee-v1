import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM harness helper, no types published
import {
  adaptGeneratedProfilePackage,
  buildGeneratorParams,
  buildOnboardingBrief,
  buildProfileArchitectPrompt,
  buildProfileBuildParams,
  buildProvisionerRequest,
  ensureGeneratedProfileRepo,
  loadProfileGeneratorConfig,
  manifestFromOnboardingConfig,
  productionLocalPreflight,
  profileContextFromOnboardingConfig,
  profileArchitectTemplateDir,
  visitorSessionIds,
  writeGeneratorInputs,
} from "../../infra/scripts/local/profile-generator-harness.mjs";

const companyConfigPath = "infra/scripts/local/profile-generator-probes/website-estimator.company-data.json";
const sparseConfigPath = "infra/scripts/local/profile-generator-probes/website-estimator.contractor-mode.json";
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempDir() {
  const dir = await mkdtemp(join(tmpdir(), "amtech-profile-generator-"));
  tempDirs.push(dir);
  return dir;
}

async function fakeGeneratedProfile(root: string) {
  await mkdir(join(root, "scripts"), { recursive: true });
  await mkdir(join(root, "skills", "estimate-intake"), { recursive: true });
  await writeFile(join(root, "SOUL.md"), "# Generated Website Estimator\n\nTreat the conversation as the form.\n", "utf8");
  await writeFile(join(root, "distribution.yaml"), "name: generated-website-estimator\nversion: 0.1.0\n", "utf8");
  await writeFile(join(root, "config.yaml"), "profile:\n  name: generated\n", "utf8");
  await writeFile(join(root, "README.md"), "# Generated profile\n", "utf8");
  await writeFile(join(root, ".env.EXAMPLE"), "# no real credentials\n", "utf8");
  await writeFile(join(root, "AGENTS.md"), "# Generated maintainer instructions\n", "utf8");
  await writeFile(join(root, "CONTRIBUTING.md"), "# Contributing\n", "utf8");
  await writeFile(join(root, "SECURITY.md"), "# Security\n", "utf8");
  await writeFile(join(root, "docs.profile-prompt.md"), "profile prompt", "utf8");
  await writeFile(join(root, "skills", "estimate-intake", "SKILL.md"), "# Skill\n", "utf8");
  await writeFile(join(root, "scripts", "validate_profile.py"), "print('validated')\n", "utf8");
}

describe("profile generator harness", () => {
  it("turns normal onboarding context into profile-generator inputs", async () => {
    const config = await loadProfileGeneratorConfig(companyConfigPath);
    const outRoot = await tempDir();
    const inputs = await writeGeneratorInputs(config, {
      workDir: outRoot,
      generatedProfileDir: join(outRoot, "generated-profile"),
    });

    const brief = buildOnboardingBrief(config);
    const prompt = buildProfileArchitectPrompt(config, join(outRoot, "generated-profile"));
    const params = buildGeneratorParams(config);
    const paramsYaml = await readFile(inputs.params_path, "utf8");

    expect(brief).toContain("normal B2B onboarding brief");
    expect(brief).toContain("Example Painting Co.");
    expect(prompt).toContain("profile-architect");
    expect(prompt).toContain("generate the repo and run validation");
    expect(params.profile_prompt).toContain("The form is the conversation");
    expect(paramsYaml).toContain("profile_prompt: |");
    expect(paramsYaml).toContain("website-visitor intake");
  });

  it("keeps company-data seeded and contractor-mode sparse", async () => {
    const company = await loadProfileGeneratorConfig(companyConfigPath);
    const sparse = await loadProfileGeneratorConfig(sparseConfigPath);

    const companyFacts = profileContextFromOnboardingConfig(company).slots.find((s: any) => s.key === "durable_facts")!.facts;
    const sparseFacts = profileContextFromOnboardingConfig(sparse).slots.find((s: any) => s.key === "durable_facts")!.facts;

    expect(companyFacts.map((f: any) => f.key)).toContain("interior_wall_rate");
    expect(companyFacts.map((f: any) => f.key)).toContain("materials_surcharge");
    expect(sparseFacts.map((f: any) => f.key)).not.toContain("interior_wall_rate");
    expect(buildGeneratorParams(sparse).profile_prompt).toContain("Do not assume rates are preloaded");
  });

  it("requires production-level local infra for CLI/live proof", async () => {
    const env = {
      SUPABASE_URL: "set",
      SUPABASE_ANON_KEY: "set",
      SUPABASE_SERVICE_ROLE_KEY: "set",
      DATABASE_URL: "set",
      MANAGER_INTERNAL_TOKEN: "set",
      PROVISIONER_TOKEN: "set",
      SECRET_REF_MASTER_KEY: "set",
      SIGNING_SECRET: "set",
      HERMES_RUNTIME_COMMAND: "set",
      AMTECH_CLIENTS_DIR: "set",
      HERMES_HOME: "set",
      PROVISIONER_SKIP_SMS: "1",
      HERMES_BACKEND_TYPE: "docker",
    };
    const ok = await productionLocalPreflight({
      env,
      runner: () => ({ ok: true, out: "ok" }),
      fetcher: async () => ({ status: 200 }),
    });
    const blocked = await productionLocalPreflight({
      env: { ...env, HERMES_BACKEND_TYPE: "local" },
      runner: () => ({ ok: true, out: "ok" }),
      fetcher: async () => ({ status: 200 }),
    });

    expect(ok.ok).toBe(true);
    expect(blocked.ok).toBe(false);
    expect(blocked.checks.find((c: any) => c.name === "HERMES_BACKEND_TYPE")?.ok).toBe(false);
  });

  it("falls back to the deterministic generator when profile-architect chat does not materialize a repo", async () => {
    const config = await loadProfileGeneratorConfig(companyConfigPath);
    const workDir = await tempDir();
    const templateDir = await tempDir();
    await mkdir(join(templateDir, "scripts"), { recursive: true });
    await writeFile(join(templateDir, "scripts", "generate_profile.py"), `from pathlib import Path\nimport sys\nout = Path(sys.argv[sys.argv.index("--output") + 1])\nout.mkdir(parents=True, exist_ok=True)\n(out / "SOUL.md").write_text("# Generated\\n", encoding="utf8")\n(out / "distribution.yaml").write_text("name: generated\\n", encoding="utf8")\n(out / "config.yaml").write_text("profile:\\n  name: generated\\n", encoding="utf8")\n(out / "README.md").write_text("# Generated\\n", encoding="utf8")\n(out / ".env.EXAMPLE").write_text("# env\\n", encoding="utf8")\n(out / "AGENTS.md").write_text("# agents\\n", encoding="utf8")\n(out / "CONTRIBUTING.md").write_text("# contributing\\n", encoding="utf8")\n(out / "SECURITY.md").write_text("# security\\n", encoding="utf8")\n(out / "scripts").mkdir(parents=True, exist_ok=True)\n(out / "scripts" / "validate_profile.py").write_text("print('validated')\\n", encoding="utf8")\n`, "utf8");

    const generatedProfileDir = join(workDir, "generated-profile");
    const result = await ensureGeneratedProfileRepo(config, {
      generatedProfileDir,
      paramsPath: join(workDir, "profile.params.yaml"),
      templateDir,
    });

    expect(result.fallback_used).toBe(true);
    expect(await readFile(join(generatedProfileDir, "SOUL.md"), "utf8")).toContain("Generated");
    expect(profileArchitectTemplateDir({ HERMES_HOME: "/tmp/hermes-home" })).toContain("/tmp/hermes-home/profiles/profile-architect");
  });

  it("adapts a generated Hermes profile repo into an AMTECH-renderable package", async () => {
    const config = await loadProfileGeneratorConfig(companyConfigPath);
    const generatedRoot = await tempDir();
    const packageRoot = await tempDir();
    await fakeGeneratedProfile(generatedRoot);

    const adapted = await adaptGeneratedProfilePackage(config, {
      generatedProfileDir: generatedRoot,
      mvpRoot: process.cwd(),
      profilePackagesDir: packageRoot,
      runner: () => ({ ok: true, out: "validated" }),
    });

    const soul = await readFile(join(adapted.package_dir, "SOUL.md"), "utf8");
    const generatedConfig = await readFile(join(adapted.package_dir, "config.generated.yaml"), "utf8");
    const configYaml = await readFile(join(adapted.package_dir, "config.yaml"), "utf8");
    const envTemplate = await readFile(join(adapted.package_dir, ".env.tpl"), "utf8");
    const hook = await readFile(join(adapted.package_dir, "hooks", "pre-session-context.mjs"), "utf8");
    const memory = await readFile(join(adapted.package_dir, "memories", "MEMORY.md"), "utf8");
    const workspacePolicy = await readFile(join(adapted.package_dir, "workspace", "AGENTS.md"), "utf8");
    const adapterDoc = await readFile(join(adapted.package_dir, "docs", "amtech-adapter.md"), "utf8");
    const skills = await readdir(join(adapted.package_dir, "skills"));

    expect(adapted.package_key).toBe("website_estimator_conversation");
    expect(soul).toContain("Generated Website Estimator");
    expect(generatedConfig).toContain("profile:");
    expect(configYaml).toContain("amtech_manager:");
    expect(configYaml).toContain("{{MANAGER_MCP_TOKEN}}");
    expect(configYaml).toContain("{{HOOKS}}");
    expect(configYaml).toContain("{{CONNECTOR_MCP_SERVERS}}");
    expect(envTemplate).toContain("API_SERVER_PORT={{GATEWAY_PORT}}");
    expect(hook).toContain("MANAGER_API_ORIGIN");
    expect(memory).toContain("{{MEMORY_SEED}}");
    expect(workspacePolicy).toContain("profile-generator output");
    expect(adapterDoc).toContain("config.generated.yaml");
    expect(skills).toEqual(["estimate-intake"]);
  });

  it("emits existing factory/provisioner inputs for the generated package key", async () => {
    const config = await loadProfileGeneratorConfig(companyConfigPath);
    const manifest = manifestFromOnboardingConfig(config);
    const params = buildProfileBuildParams(config, { employee_id: "emp_web_estimator", account_id: "acct_web_estimator" });
    const request = buildProvisionerRequest(config, { employee_id: "emp_web_estimator", account_id: "acct_web_estimator", gateway_port: 8123 });

    expect(manifest.profile_package_key).toBe("website_estimator_conversation");
    expect(manifest.seven_question_answers.profile_generator_brief).toContain("normal B2B onboarding");
    expect(params.profile_context.package_key).toBe("website_estimator_conversation");
    expect(params.profile_context.resource_pointers).toContain("amtech://manager/business-brain");
    expect(request.profile_package_key).toBe("website_estimator_conversation");
    expect(request.params.gateway_port).toBe(8123);
  });

  it("uses per-visitor transcript ids without changing the stable employee memory key", async () => {
    const config = await loadProfileGeneratorConfig(companyConfigPath);
    const a = visitorSessionIds(config, "lead-a@example.com");
    const b = visitorSessionIds(config, "lead-b@example.com");

    expect(a.transcript_session_id).not.toBe(b.transcript_session_id);
    expect(a.memory_session_key).toBe(b.memory_session_key);
    expect(a.transcript_session_id).toContain("website-estimator:website_estimator_conversation");
  });
});
