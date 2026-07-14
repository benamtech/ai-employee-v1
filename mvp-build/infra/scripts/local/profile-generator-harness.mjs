#!/usr/bin/env node
/**
 * Profile-generator-first materialization harness.
 *
 * This stays outside Manager/Web product code. It proves the normal-ish B2B
 * path: owner onboarding brief -> Hermes profile generator -> AMTECH profile
 * package adapter -> existing provision_employee/profile-renderer/runtime path.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_RESOURCE_POINTERS = [
  "amtech://manager/business-brain",
  "amtech://manager/business-facts",
  "amtech://manager/connector-status",
  "amtech://manager/work-queue",
  "amtech://manager/artifacts",
  "amtech://manager/approvals",
  "amtech://manager/capability-registry",
];

export const REQUIRED_LOCAL_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "MANAGER_INTERNAL_TOKEN",
  "PROVISIONER_TOKEN",
  "SECRET_REF_MASTER_KEY",
  "SIGNING_SECRET",
  "HERMES_RUNTIME_COMMAND",
  "AMTECH_CLIENTS_DIR",
  "HERMES_HOME",
];

const REQUIRED_PROFILE_FILES = [
  "SOUL.md",
  "distribution.yaml",
  "config.yaml",
  "README.md",
  ".env.EXAMPLE",
  "AGENTS.md",
];

const CONTEXT_SLOTS = [
  { key: "business_identity", title: "Business identity", priority: 10 },
  { key: "owner_identity", title: "Owner identity", priority: 20 },
  { key: "workflows", title: "Workflows", priority: 30 },
  { key: "tools", title: "Tools", priority: 40 },
  { key: "durable_facts", title: "Durable facts", priority: 50 },
  { key: "standing_preferences", title: "Standing preferences", priority: 60 },
  { key: "live_state_pointers", title: "Live state pointers", priority: 70 },
];

export async function loadProfileGeneratorConfig(path) {
  const config = JSON.parse(await readFile(path, "utf8"));
  assertProfileGeneratorConfig(config, path);
  return config;
}

export function assertProfileGeneratorConfig(config, label = "profile generator config") {
  const required = [
    "purpose_key",
    "display_name",
    "employee_name",
    "business_display_name",
    "business_kind",
    "owner_name",
    "owner_phone_e164",
    "timezone",
    "purpose",
  ];
  for (const key of required) {
    if (!config?.[key]) throw new Error(`${label}: ${key} is required`);
  }
  if (!/^[a-z][a-z0-9_:-]*$/.test(config.purpose_key)) {
    throw new Error(`${label}: purpose_key must be lowercase slug text`);
  }
  if (!/^\+[1-9]\d{6,14}$/.test(config.owner_phone_e164)) {
    throw new Error(`${label}: owner_phone_e164 must be E.164`);
  }
  const mode = config.mode ?? "company_data";
  if (!["company_data", "contractor_mode"].includes(mode)) {
    throw new Error(`${label}: mode must be company_data or contractor_mode`);
  }
}

export function packageKeyFor(config) {
  return config.profile_package_key ?? config.purpose_key;
}

export function generatedProfilePathFor(config, root) {
  return join(root, "generated-profile");
}

export function profileArchitectTemplateDir(env = process.env) {
  const hermesHome = env.HERMES_HOME ?? join(process.env.HOME ?? "", ".hermes");
  return join(hermesHome, "profiles", "profile-architect");
}

export function buildOnboardingBrief(config) {
  const mode = config.mode ?? "company_data";
  const facts = mode === "contractor_mode" ? (config.contractor_mode_facts ?? []) : (config.seed_facts ?? []);
  return [
    `# AMTECH B2B onboarding brief for ${config.display_name}`,
    "",
    "This is a normal B2B onboarding brief: it is intentionally phrased like owner onboarding context, not like a hand-authored internal package.",
    "",
    "## Owner and business",
    `- Business: ${config.business_display_name}`,
    `- Business kind: ${config.business_kind}`,
    `- Owner: ${config.owner_name}`,
    `- Owner email: ${config.owner_email ?? "unknown"}`,
    `- Owner phone: ${config.owner_phone_e164}`,
    `- Timezone: ${config.timezone}`,
    "",
    "## Employee to create",
    `- Employee name: ${config.employee_name}`,
    `- Purpose: ${config.purpose}`,
    `- Audience: ${config.audience ?? "website visitor requesting an estimate"}`,
    `- Materialization mode: ${mode}`,
    `- Conversation goal: ${config.conversation_goal ?? "collect enough context to complete the work"}`,
    "",
    "## Workflows",
    ...(config.top_workflows ?? ["website estimate intake"]).map((workflow) => `- ${workflow}`),
    "",
    "## Tools and expected outputs",
    ...(config.tools_mentioned ?? ["Manager MCP", "estimate artifacts"]).map((tool) => `- ${tool}`),
    `- Output expectations: ${config.output_expectations ?? "produce a structured work artifact with explicit assumptions"}`,
    "",
    "## Seeded or conversation-supplied facts",
    ...(facts.length ? facts.map((f) => `- ${f.key}: ${Array.isArray(f.value) ? f.value.join(", ") : f.value}`) : ["- No preloaded company rates; ask for missing facts in conversation."]),
    "",
  ].join("\n");
}

export function buildProfileArchitectPrompt(config, outputPath) {
  return [
    `As the installed profile-architect Hermes profile, turn the following normal B2B onboarding brief into a fantastic installable Hermes profile repo under ${outputPath}.`,
    "",
    "Expand the brief into a mature profile prompt first, preserve it in docs/profile-prompt.md, then generate the repo and run validation.",
    "",
    "Repository requirements:",
    "- Include SOUL.md, distribution.yaml, README.md, config.yaml, .env.EXAMPLE, AGENTS.md, CONTRIBUTING.md, SECURITY.md, and any needed bundled skills.",
    "- Include a bundled skill for the primary workflow if one is needed.",
    "- Do not use real credentials.",
    "- Keep customer-facing sends, money movement, and external writes behind approval or explicit user confirmation.",
    "- The profile should be installable with Hermes before AMTECH adapts it.",
    "",
    "AMTECH-specific runtime notes for the generated profile prompt, not direct implementation:",
    "- The eventual AMTECH adapter will provide Manager MCP tools, artifacts, approvals, memory/context, and runtime credentials.",
    "- Do not hard-code AMTECH secrets or local paths.",
    "- Treat website chat as the intake form; the website itself is only a local client.",
    "",
    buildOnboardingBrief(config),
  ].join("\n");
}

export function buildGeneratorParams(config) {
  const mode = config.mode ?? "company_data";
  const scope = [
    "Conduct website-visitor intake as a conversation.",
    "Collect contact details, job scope, constraints, timeline, photos/references when available, and estimating assumptions.",
    "Produce structured estimate artifacts with assumptions and low-confidence flags.",
  ];
  if (mode === "company_data") {
    scope.push("Use seeded business facts and rates before asking for missing estimating data.");
  } else {
    scope.push("Do not assume preloaded rates; ask for or use contractor-supplied rates and fee notes in conversation.");
  }
  return {
    name: packageKeyFor(config).replaceAll("_", "-"),
    display_name: config.display_name,
    description: config.purpose,
    author: "AMTECH local profile-generator harness",
    version: "0.1.0",
    license: "MIT",
    hermes_requires: ">=0.12.0",
    model_provider: "openrouter",
    model_default: "anthropic/claude-sonnet-4",
    template_source: {
      name: "codegraphtheory/hermes-profile-template",
      url: "https://github.com/codegraphtheory/hermes-profile-template",
      relationship: "generated-from-template",
    },
    toolsets: ["file", "terminal", "skills", "web", "session_search", "clarify"],
    env_requires: [],
    principles: [
      "Treat the conversation as the form.",
      "Ask one tight question at a time when required information is missing.",
      "Make assumptions visible instead of pretending certainty.",
      "Never fabricate provider results, customer replies, PDFs, or approvals.",
    ],
    scope,
    refusals: [
      "Sending customer-facing messages without approval.",
      "Moving money, creating invoices, or committing accounting records without approval.",
      "Claiming image/PDF support without real runtime evidence.",
      "Inventing rates, measurements, or business facts not provided by data or conversation.",
    ],
    output_contract: [
      "Contact summary.",
      "Job scope.",
      "Line items with quantities, units, unit prices when known, and totals.",
      "Assumptions.",
      "Low-confidence flags.",
      "Recommended total or range.",
      "Next step.",
    ],
    profile_prompt: buildProfilePrompt(config),
    github_topics: ["hermes-agent", "ai-agents", "agent-profile", "profile-distribution", "b2b-onboarding", "estimating"],
  };
}

export function generatorParamsYaml(config) {
  return yamlObject(buildGeneratorParams(config));
}

function buildProfilePrompt(config) {
  const mode = config.mode ?? "company_data";
  const modePolicy = mode === "company_data"
    ? "Use seeded company facts, rates, preferences, and business context before asking for missing estimating data."
    : "Do not assume rates are preloaded; ask for or use contractor-supplied rates, material surcharges, fee notes, and assumptions in the conversation.";
  return [
    `Create a Hermes profile for ${config.display_name}.`,
    "",
    `The profile is an AI employee named ${config.employee_name} for ${config.business_display_name}, a ${config.business_kind} business.`,
    `Primary purpose: ${config.purpose}`,
    "The form is the conversation: the profile should collect website visitor contact info and job details naturally rather than require a separate web form.",
    modePolicy,
    "It should produce a structured estimate with line items, assumptions, low-confidence flags, recommended total, and next step.",
    "It should use tools for durable artifacts when available, but never claim PDF/image/tool success unless the runtime actually produced it.",
    "It must keep customer-facing sends, money movement, accounting writes, and destructive/external writes behind approval.",
    "",
    buildOnboardingBrief(config),
  ].join("\n");
}

export function manifestFromOnboardingConfig(config) {
  const mode = config.mode ?? "company_data";
  const sourced = mode === "contractor_mode" ? [] : (config.seed_facts ?? []);
  return {
    employee_type: packageKeyFor(config),
    profile_package_key: packageKeyFor(config),
    profile_prompt: buildProfilePrompt(config),
    business_display_name: config.business_display_name,
    business_kind: config.business_kind,
    timezone: config.timezone,
    owner_name: config.owner_name,
    owner_email: config.owner_email,
    verified_phone_e164: config.owner_phone_e164,
    verification_method: "sms_inbound",
    consent_channel: "web",
    employee_name: config.employee_name,
    top_workflows: config.top_workflows ?? ["website estimate intake"],
    tools_mentioned: config.tools_mentioned ?? ["Manager MCP", "estimate artifacts"],
    seed_skills: config.seed_skills ?? ["estimate"],
    pricing_facts: sourced.filter((f) => (f.category ?? "pricing") === "pricing").map(toSourcedFact),
    branding_facts: sourced.filter((f) => f.category === "branding").map(toSourcedFact),
    customer_job_facts: sourced.filter((f) => f.category === "customer").map(toSourcedFact),
    seven_question_answers: {
      business: `${config.business_display_name}: ${config.business_kind}`,
      repeat_computer_work: config.purpose,
      tools_in_use: (config.tools_mentioned ?? ["Manager MCP"]).join(", "),
      profile_generator_brief: "Generated from normal B2B onboarding brief, then adapted into AMTECH profile package.",
    },
  };
}

export function profileContextFromOnboardingConfig(config) {
  const mode = config.mode ?? "company_data";
  const packageKey = packageKeyFor(config);
  const resourcePointers = config.resource_pointers?.length ? config.resource_pointers : DEFAULT_RESOURCE_POINTERS;
  const durableFacts = mode === "contractor_mode"
    ? contextFacts(config.contractor_mode_facts ?? [], "manifest")
    : contextFacts(config.seed_facts ?? [], "manifest");
  return {
    package_key: packageKey,
    generated_from: "onboarding_manifest",
    memory_limits: config.memory_limits ?? { memory_chars: 2200, user_chars: 1375 },
    resource_pointers: resourcePointers,
    slots: [
      slot("business_identity", "Business identity", 10, [
        fact("business_name", config.business_display_name),
        fact("business_kind", config.business_kind),
        fact("timezone", config.timezone),
        fact("profile_generator_mode", mode),
      ]),
      slot("owner_identity", "Owner identity", 20, [
        fact("owner_name", config.owner_name),
        fact("owner_phone", config.owner_phone_e164),
        fact("owner_email", config.owner_email),
      ]),
      slot("workflows", "Workflows", 30, [
        fact("top_workflows", config.top_workflows ?? ["website estimate intake"]),
        fact("conversation_goal", config.conversation_goal),
        fact("purpose", config.purpose),
      ]),
      slot("tools", "Tools", 40, [
        fact("tools_mentioned", config.tools_mentioned ?? ["Manager MCP", "estimate artifacts"]),
        fact("seed_skills", config.seed_skills ?? ["estimate"]),
      ]),
      slot("durable_facts", "Durable facts", 50, durableFacts),
      slot("standing_preferences", "Standing preferences", 60, [
        fact("generated_profile_prompt", buildProfilePrompt(config)),
      ]),
      slot("live_state_pointers", "Live state pointers", 70, resourcePointers.map((uri) => ({
        key: uri.replace("amtech://manager/", ""),
        value: uri,
        source: "manifest",
        confidence: "high",
      }))),
    ],
  };
}

export function buildProfileBuildParams(config, overrides = {}) {
  const employeeId = overrides.employee_id ?? config.employee_id ?? `emp_${hashShort(config.purpose_key)}`;
  const accountId = overrides.account_id ?? config.account_id ?? `acct_${hashShort(config.business_display_name)}`;
  const packageKey = packageKeyFor(config);
  return {
    client_id: overrides.client_id ?? employeeId.replace(/^emp_/, "client-"),
    account_id: accountId,
    employee_id: employeeId,
    profile_package_key: packageKey,
    runtime_backend: overrides.runtime_backend ?? config.runtime_backend ?? "docker",
    business_display_name: config.business_display_name,
    business_kind: config.business_kind,
    owner_name: config.owner_name,
    owner_phone_e164: config.owner_phone_e164,
    employee_name: config.employee_name,
    timezone: config.timezone,
    workspace_dir: overrides.workspace_dir ?? config.workspace_dir ?? `/tmp/amtech-profile-generator/${employeeId}/workspace`,
    webhook_url: overrides.webhook_url ?? config.webhook_url ?? `http://localhost:8080/webhooks/twilio/${employeeId}`,
    gateway_port: Number(overrides.gateway_port ?? config.gateway_port ?? 8101),
    top_workflows: config.top_workflows ?? ["website estimate intake"],
    tools_mentioned: config.tools_mentioned ?? ["Manager MCP", "estimate artifacts"],
    seed_skills: config.seed_skills ?? ["estimate"],
    api_server_key: overrides.api_server_key ?? config.api_server_key ?? "profile-generator-local-api-key",
    profile_context: profileContextFromOnboardingConfig(config),
    direct_mcp_connectors: config.direct_mcp_connectors ?? [],
  };
}

export function buildProvisionerRequest(config, overrides = {}) {
  const params = buildProfileBuildParams(config, overrides);
  return {
    account_id: params.account_id,
    employee_id: params.employee_id,
    manifest_id: overrides.manifest_id ?? `manifest_${hashShort(`${params.account_id}:${params.employee_id}`)}`,
    profile_package_key: params.profile_package_key,
    params,
    render_secrets: {
      manager_mcp_token: overrides.manager_mcp_token ?? "profile-generator-local-mcp-token",
    },
  };
}

export async function writeGeneratorInputs(config, options = {}) {
  const workDir = resolve(options.workDir ?? join(process.cwd(), "infra", ".local", "profile-generator", packageKeyFor(config)));
  const generatedProfileDir = resolve(options.generatedProfileDir ?? generatedProfilePathFor(config, workDir));
  await mkdir(workDir, { recursive: true });
  const prompt = buildProfileArchitectPrompt(config, generatedProfileDir);
  const files = {
    work_dir: workDir,
    generated_profile_dir: generatedProfileDir,
    prompt_path: join(workDir, "profile-architect.prompt.md"),
    params_path: join(workDir, "profile.params.yaml"),
    onboarding_brief_path: join(workDir, "onboarding-brief.md"),
    manifest_path: join(workDir, "onboarding-manifest.json"),
  };
  await writeFile(files.prompt_path, prompt, "utf8");
  await writeFile(files.params_path, generatorParamsYaml(config), "utf8");
  await writeFile(files.onboarding_brief_path, buildOnboardingBrief(config), "utf8");
  await writeFile(files.manifest_path, JSON.stringify(manifestFromOnboardingConfig(config), null, 2), "utf8");
  return files;
}

export async function productionLocalPreflight(options = {}) {
  const env = options.env ?? process.env;
  const runner = options.runner ?? runCommand;
  const fetcher = options.fetcher ?? fetch;
  const checks = [];
  const add = (name, ok, detail = "") => checks.push({ name, ok: Boolean(ok), detail });

  for (const name of REQUIRED_LOCAL_ENV) {
    const value = env[name];
    add(name, Boolean(value && !String(value).includes("PASTE")), value ? "set" : "missing");
  }
  add("PROVISIONER_SKIP_SMS", env.PROVISIONER_SKIP_SMS === "1" || env.PROVISIONER_SKIP_SMS === "true", "must be enabled for local no-SMS production-shaped run");
  add("HERMES_BACKEND_TYPE", env.HERMES_BACKEND_TYPE === "docker", env.HERMES_BACKEND_TYPE ?? "missing");

  for (const spec of [
    ["docker ps", "docker", ["ps"]],
    ["docker buildx", "docker", ["buildx", "version"]],
    ["hermes image", "docker", ["image", "inspect", "hermes-agent"]],
    ["caddy", "caddy", ["version"]],
    ["hermes cli", "hermes", ["--version"]],
  ]) {
    const res = runner(spec[1], spec[2]);
    add(spec[0], res.ok, res.ok ? firstLine(res.out) : (res.out || "failed"));
  }

  if (options.checkServices !== false) {
    for (const [name, url] of [
      ["manager :8080", "http://localhost:8080/health"],
      ["web :3000", "http://localhost:3000/"],
    ]) {
      const code = await httpCode(url, fetcher);
      add(name, code === 200, `HTTP ${code || "000"}`);
    }
  }

  return { ok: checks.every((check) => check.ok), checks };
}

export async function assertProductionLocalPreflight(options = {}) {
  const result = await productionLocalPreflight(options);
  if (!result.ok) {
    const blocked = result.checks
      .filter((check) => !check.ok)
      .map((check) => `- ${check.name}: ${check.detail}`)
      .join("\n");
    throw new Error(`production-level local stack is not ready:\n${blocked}\n\nRun from a sourced local env with Docker/Caddy/Hermes installed and the live stack up (npm run live:up).`);
  }
  return result;
}

export function runProfileArchitect(config, options) {
  if (!options?.promptPath) throw new Error("runProfileArchitect requires promptPath");
  const prompt = options.promptText ?? "";
  if (options.install !== false) {
    runRequired("hermes", ["profile", "install", "github.com/codegraphtheory/hermes-profile-template", "--name", "profile-architect", "--yes", "--force"]);
  }
  const text = prompt || readFileSyncCompat(options.promptPath);
  return runRequired("hermes", ["-p", "profile-architect", "chat", "-q", text]);
}

export function runDeterministicGenerator(options) {
  if (!options?.templateDir) throw new Error("runDeterministicGenerator requires templateDir");
  if (!options?.paramsPath) throw new Error("runDeterministicGenerator requires paramsPath");
  if (!options?.outputDir) throw new Error("runDeterministicGenerator requires outputDir");
  return runRequired("python3", [join(resolve(options.templateDir), "scripts", "generate_profile.py"), "--params", resolve(options.paramsPath), "--output", resolve(options.outputDir)]);
}

export async function ensureGeneratedProfileRepo(config, options = {}) {
  const generatedProfileDir = resolve(options.generatedProfileDir ?? generatedProfilePathFor(config, options.workDir ?? process.cwd()));
  if (existsSync(generatedProfileDir)) {
    return { generated_profile_dir: generatedProfileDir, fallback_used: false, materialization_output: null };
  }
  const templateDir = resolve(options.templateDir ?? profileArchitectTemplateDir(options.env));
  const generator = join(templateDir, "scripts", "generate_profile.py");
  if (!existsSync(generator)) {
    throw new Error(`generated profile dir missing and deterministic generator unavailable: ${generator}`);
  }
  const materialization_output = runDeterministicGenerator({
    templateDir,
    paramsPath: options.paramsPath,
    outputDir: generatedProfileDir,
  });
  return { generated_profile_dir: generatedProfileDir, fallback_used: true, materialization_output };
}

export async function validateGeneratedProfile(profileDir, options = {}) {
  const dir = resolve(profileDir);
  const missing = REQUIRED_PROFILE_FILES.filter((file) => !existsSync(join(dir, file)));
  if (missing.length) throw new Error(`generated profile missing required files: ${missing.join(", ")}`);
  const validate = join(dir, "scripts", "validate_profile.py");
  if (!existsSync(validate)) return { status: "skipped", output: "generated profile has no scripts/validate_profile.py" };
  const runner = options.runner ?? runCommand;
  const res = runner("python3", [validate, dir], { cwd: dir });
  if (!res.ok) throw new Error(`generated profile validation failed:\n${res.out}`);
  return { status: "passed", output: res.out };
}

export async function adaptGeneratedProfilePackage(config, options = {}) {
  const mvpRoot = resolve(options.mvpRoot ?? process.cwd());
  const generatedProfileDir = resolve(options.generatedProfileDir);
  const profilePackagesDir = resolve(options.profilePackagesDir ?? join(mvpRoot, "infra", ".local", "profile-packages"));
  const packageKey = packageKeyFor(config);
  const packageDir = join(profilePackagesDir, packageKey);
  if (!existsSync(generatedProfileDir)) throw new Error(`generated profile dir missing: ${generatedProfileDir}`);
  await validateGeneratedProfile(generatedProfileDir, options);
  await rm(packageDir, { recursive: true, force: true });
  await copyDir(generatedProfileDir, packageDir, { skip: new Set([".git", "__pycache__", "node_modules"]) });

  const generatedConfig = join(packageDir, "config.yaml");
  if (existsSync(generatedConfig)) await rename(generatedConfig, join(packageDir, "config.generated.yaml"));
  const generatedDistribution = join(packageDir, "distribution.yaml");
  if (existsSync(generatedDistribution)) await copyFile(generatedDistribution, join(packageDir, "distribution.generated.yaml"));

  await writeFile(join(packageDir, "config.yaml"), await readFile(join(mvpRoot, "packages", "agent-template", "config.yaml"), "utf8"), "utf8");
  await writeFile(join(packageDir, "distribution.yaml"), amtechDistributionYaml(config), "utf8");
  await copyFile(join(mvpRoot, "packages", "agent-template", ".env.tpl"), join(packageDir, ".env.tpl"));
  await copyDir(join(mvpRoot, "packages", "agent-template", "hooks"), join(packageDir, "hooks"));
  await copyDir(join(mvpRoot, "packages", "agent-template", "memories"), join(packageDir, "memories"));
  await copyDir(join(mvpRoot, "packages", "agent-template", "plugins"), join(packageDir, "plugins"), { skip: new Set(["__pycache__"]) });
  await mkdir(join(packageDir, "workspace"), { recursive: true });
  await copyFile(join(mvpRoot, "packages", "agent-template", "workspace", "manager-tools.md"), join(packageDir, "workspace", "manager-tools.md"));
  await writeFile(join(packageDir, "workspace", "AGENTS.md"), amtechWorkspacePolicy(config), "utf8");
  await writeFile(join(packageDir, "purpose.manifest.json"), JSON.stringify(manifestFromOnboardingConfig(config), null, 2), "utf8");
  await writeFile(join(packageDir, "purpose.profile-context.json"), JSON.stringify(profileContextFromOnboardingConfig(config), null, 2), "utf8");
  await mkdir(join(packageDir, "docs"), { recursive: true });
  await writeFile(join(packageDir, "docs", "amtech-adapter.md"), amtechAdapterMarkdown(config, generatedProfileDir), "utf8");
  await writeFile(join(packageDir, "amtech-package.manifest.json"), JSON.stringify(profilePackageRegistryRow(config), null, 2), "utf8");

  return {
    package_key: packageKey,
    package_dir: packageDir,
    profile_packages_dir: profilePackagesDir,
    generated_profile_dir: generatedProfileDir,
    registry_row: profilePackageRegistryRow(config),
  };
}

export function profilePackageRegistryRow(config) {
  return {
    id: `pkg_${packageKeyFor(config)}`,
    package_key: packageKeyFor(config),
    display_name: config.display_name,
    version: "0.1.0",
    description: `AMTECH-adapted Hermes profile-generator output: ${config.purpose}`,
    supported_business_kinds: [config.business_kind, "contractor", "home_services", "b2b"],
    default_skills: config.seed_skills ?? ["estimate"],
    template_source: {
      name: "codegraphtheory/hermes-profile-template",
      url: "https://github.com/codegraphtheory/hermes-profile-template",
      relationship: "generated-by-profile-generator-adapted-for-amtech",
    },
    env_requires: [],
    validation_command: null,
    status: "active",
  };
}

export async function registerProfilePackage(config, options = {}) {
  const { Client } = await import("pg");
  const connectionString = options.databaseUrl ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL missing");
  const row = profilePackageRegistryRow(config);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      `insert into profile_packages (
        id, package_key, display_name, version, description, supported_business_kinds,
        default_skills, template_source, env_requires, validation_command, status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11)
      on conflict (package_key) do update set
        display_name = excluded.display_name,
        version = excluded.version,
        description = excluded.description,
        supported_business_kinds = excluded.supported_business_kinds,
        default_skills = excluded.default_skills,
        template_source = excluded.template_source,
        env_requires = excluded.env_requires,
        validation_command = excluded.validation_command,
        status = excluded.status,
        updated_at = now()`,
      [
        row.id,
        row.package_key,
        row.display_name,
        row.version,
        row.description,
        row.supported_business_kinds,
        row.default_skills,
        JSON.stringify(row.template_source),
        JSON.stringify(row.env_requires),
        row.validation_command,
        row.status,
      ],
    );
  } finally {
    await client.end();
  }
  return row;
}

export function visitorSessionIds(config, visitorSessionId) {
  const raw = String(visitorSessionId || "").trim() || "anonymous";
  const sanitized = raw.replace(/[^a-zA-Z0-9._:-]+/g, "-").slice(0, 80);
  const digest = hashShort(`${config.purpose_key}:${sanitized}`);
  return {
    visitor_session_id: sanitized,
    transcript_session_id: `website-estimator:${config.purpose_key}:${digest}`,
    memory_session_key: `amtech:v1:profile-generator:${config.purpose_key}:employee:${config.employee_id ?? "local"}`,
  };
}

function amtechDistributionYaml(config) {
  return [
    `name: ${packageKeyFor(config)}`,
    `display_name: ${yamlString(config.display_name)}`,
    "version: 0.1.0",
    `description: ${yamlString(`AMTECH-adapted profile-generator output: ${config.purpose}`)}`,
    'hermes_requires: ">=0.12.0"',
    "template_source:",
    "  name: codegraphtheory/hermes-profile-template",
    "  url: https://github.com/codegraphtheory/hermes-profile-template",
    "  relationship: generated-by-profile-generator-adapted-for-amtech",
    "distribution_owned:",
    "  - SOUL.md",
    "  - config.yaml",
    "  - config.generated.yaml",
    "  - distribution.yaml",
    "  - distribution.generated.yaml",
    "  - .env.tpl",
    "  - hooks/",
    "  - memories/",
    "  - plugins/",
    "  - workspace/",
    "  - skills/",
    "  - docs/",
    "env_requires:",
    "  - name: ANTHROPIC_API_KEY",
    "    description: Employee model provider key.",
    "    required: true",
    "default_skills:",
    ...(config.seed_skills ?? ["estimate"]).map((skill) => `  - ${skill}`),
    "context_slots:",
    ...CONTEXT_SLOTS.flatMap((s) => [`  - key: ${s.key}`, `    title: ${s.title}`, `    priority: ${s.priority}`]),
    "memory_limits:",
    "  memory_chars: 2200",
    "  user_chars: 1375",
    "resource_pointers:",
    ...DEFAULT_RESOURCE_POINTERS.map((uri) => `  - ${uri}`),
    "",
  ].join("\n");
}

function amtechWorkspacePolicy(config) {
  return `# AMTECH operating policy — {{EMPLOYEE_NAME}}

This profile's purpose comes from a Hermes profile-generator output, adapted into
AMTECH's Manager/provisioner/runtime path.

## Purpose
${config.purpose}

## Rules
- Treat the visitor conversation as the intake form.
- Ask one tight question at a time when details are missing.
- Produce structured estimate data with explicit assumptions and low-confidence flags.
- Use Manager MCP tools for estimates, artifacts, approvals, connector state, and custody.
- Do not send customer-facing messages, move money, create invoices, commit accounting entries, or perform external writes without Manager-mediated approval.
- Do not claim PDF, multimodal, provider event, or runtime success without real proof from the local stack.

## Context
- Business: {{BUSINESS_DISPLAY_NAME}} — {{BUSINESS_KIND}}.
- Owner: {{OWNER_NAME}} ({{OWNER_PHONE_E164}}).
- Timezone: {{TIMEZONE}}.
`;
}

function amtechAdapterMarkdown(config, generatedProfileDir) {
  return `# AMTECH adapter for ${config.display_name}

Generated profile source: \`${generatedProfileDir}\`

This package preserves the profile-generator-authored identity and skills, then
overlays AMTECH runtime custody:

- \`config.generated.yaml\` keeps the generator's original Hermes config.
- \`config.yaml\` is AMTECH's rendered runtime config with Manager MCP, scoped
  credentials, hooks, compression, platform toolsets, and connector custody.
- \`workspace/manager-tools.md\` preserves the Manager tool contract.
- \`purpose.manifest.json\` and \`purpose.profile-context.json\` show the normal
  onboarding-derived factory inputs.

The generated website estimator is not proven live until provisioned through
\`provision_employee\`, started on the Docker Hermes runtime, and exercised
against Manager MCP/artifact tools.
`;
}

function toSourcedFact(f) {
  return {
    key: String(f.key),
    value: Array.isArray(f.value) ? f.value.join(", ") : String(f.value),
    source_snippet: f.source_snippet ?? "profile generator onboarding config",
    confidence: f.confidence ?? "medium",
  };
}

function contextFacts(items = [], source = "manifest") {
  return items
    .filter((item) => item?.key && item?.value !== undefined && item?.value !== null)
    .map((item) => ({
      key: String(item.key),
      value: Array.isArray(item.value) ? item.value.join(", ") : String(item.value),
      confidence: item.confidence ?? "medium",
      source: item.source ?? source,
    }));
}

function slot(key, title, priority, facts) {
  return { key, title, priority, facts: facts.filter(Boolean) };
}

function fact(key, value, source = "manifest", confidence = "high") {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  return { key, value: Array.isArray(value) ? value.join(", ") : String(value), source, confidence };
}

async function copyDir(src, dst, options = {}) {
  const s = await stat(src);
  if (s.isDirectory()) {
    await mkdir(dst, { recursive: true });
    for (const entry of await readdir(src)) {
      if (options.skip?.has(entry)) continue;
      await copyDir(join(src, entry), join(dst, entry), options);
    }
    return;
  }
  await mkdir(dirname(dst), { recursive: true });
  await copyFile(src, dst);
}

function runCommand(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { cwd: options.cwd, encoding: "utf8" });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    out: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
  };
}

function runRequired(cmd, args) {
  const res = runCommand(cmd, args);
  if (!res.ok) throw new Error(`${cmd} ${args.join(" ")} failed:\n${res.out}`);
  return res.out;
}

async function httpCode(url, fetcher) {
  try {
    const res = await fetcher(url);
    return res.status;
  } catch {
    return 0;
  }
}

function firstLine(value) {
  return String(value ?? "").split("\n")[0] ?? "";
}

function hashShort(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function yamlObject(obj, indent = 0) {
  const pad = " ".repeat(indent);
  return Object.entries(obj).map(([key, value]) => {
    if (Array.isArray(value)) return `${pad}${key}:\n${yamlArray(value, indent + 1)}`;
    if (value && typeof value === "object") return `${pad}${key}:\n${yamlObject(value, indent + 1)}`;
    if (typeof value === "string" && value.includes("\n")) return `${pad}${key}: |\n${indentBlock(value, indent + 1)}`;
    return `${pad}${key}: ${yamlScalar(value)}`;
  }).join("\n");
}

function yamlArray(items, indent = 0) {
  const pad = " ".repeat(indent);
  return items.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return `${pad}- ${yamlObject(item, indent + 1).trimStart()}`;
    }
    return `${pad}- ${yamlScalar(item)}`;
  }).join("\n");
}

function indentBlock(value, indent = 1) {
  const pad = " ".repeat(indent);
  return String(value).split("\n").map((line) => `${pad}${line}`).join("\n");
}

function yamlScalar(value) {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return yamlString(value);
}

function yamlString(value) {
  const text = String(value);
  if (/^[a-zA-Z0-9_./:=@+-]+$/.test(text)) return text;
  return JSON.stringify(text);
}

function readFileSyncCompat(path) {
  return readFileSync(path, "utf8");
}

function parseArgs(argv) {
  const args = { _: [] };
  const flags = new Set([
    "prepare-only",
    "run-profile-architect",
    "skip-profile-architect-install",
    "run-deterministic-generator",
    "adapt-generated",
    "register-package",
    "print-factory-input",
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) args._.push(a);
    else if (flags.has(a.slice(2))) args[a.slice(2)] = true;
    else args[a.slice(2)] = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = args.config ?? args._[0];
  if (!configPath) {
    throw new Error("Usage: profile-generator-harness.mjs --config <config.json> (--prepare-only | --run-profile-architect | --run-deterministic-generator | --generated-profile <dir>) [--adapt-generated] [--register-package] [--print-factory-input]");
  }
  await assertProductionLocalPreflight();
  const config = await loadProfileGeneratorConfig(configPath);
  const workDir = resolve(args["work-dir"] ?? join(process.cwd(), "infra", ".local", "profile-generator", packageKeyFor(config)));
  const generatedProfileDir = resolve(args["generated-profile"] ?? generatedProfilePathFor(config, workDir));
  const inputs = await writeGeneratorInputs(config, { workDir, generatedProfileDir });

  let generationOutput = null;
  if (args["run-profile-architect"]) {
    generationOutput = runProfileArchitect(config, {
      promptPath: inputs.prompt_path,
      install: !args["skip-profile-architect-install"],
    });
  } else if (args["run-deterministic-generator"]) {
    generationOutput = runDeterministicGenerator({
      templateDir: args["template-dir"],
      paramsPath: inputs.params_path,
      outputDir: generatedProfileDir,
    });
  } else if (!args["prepare-only"] && !args["generated-profile"]) {
    throw new Error("Choose --prepare-only, --run-profile-architect, --run-deterministic-generator, or --generated-profile <dir>. Refusing to fabricate profile-generation proof.");
  }

  let generatedRepo = { generated_profile_dir: generatedProfileDir, fallback_used: false, materialization_output: null };
  if (args["run-profile-architect"]) {
    generatedRepo = await ensureGeneratedProfileRepo(config, {
      generatedProfileDir,
      paramsPath: inputs.params_path,
      workDir,
      env: process.env,
    });
    if (generatedRepo.fallback_used) {
      generationOutput = `${generationOutput ? `${generationOutput}\n\n` : ""}[fallback] profile-architect did not materialize the repo directory; used deterministic generate_profile.py from the installed profile repo instead.`;
    }
  }

  let adapted = null;
  if (args["adapt-generated"] || args["generated-profile"] || args["run-profile-architect"] || args["run-deterministic-generator"]) {
    adapted = await adaptGeneratedProfilePackage(config, {
      generatedProfileDir: generatedRepo.generated_profile_dir ?? generatedProfileDir,
      mvpRoot: process.cwd(),
      profilePackagesDir: args["profile-packages-dir"] ? resolve(args["profile-packages-dir"]) : undefined,
    });
  }
  let registered = null;
  if (args["register-package"]) registered = await registerProfilePackage(config);

  const output = {
    status: "ok",
    inputs,
    generation_output: generationOutput,
    adapted,
    registered,
    profile_packages_dir: adapted?.profile_packages_dir ?? resolve(args["profile-packages-dir"] ?? join(process.cwd(), "infra", ".local", "profile-packages")),
    manifest: manifestFromOnboardingConfig(config),
    provisioner_request: buildProvisionerRequest(config, {
      employee_id: args["employee-id"],
      account_id: args["account-id"],
      gateway_port: args["gateway-port"],
    }),
    next: adapted
      ? `Start/provision with PROFILE_PACKAGES_DIR=${adapted.profile_packages_dir} and profile_package_key=${adapted.package_key}.`
      : `Run profile-architect using ${inputs.prompt_path}, then rerun with --generated-profile ${generatedProfileDir} --adapt-generated.`,
  };
  console.log(JSON.stringify(args["print-factory-input"] ? {
    profile_packages_dir: output.profile_packages_dir,
    manifest: output.manifest,
    provisioner_request: output.provisioner_request,
  } : output, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
