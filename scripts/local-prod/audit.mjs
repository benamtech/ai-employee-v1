#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { ROOT, displayPath, readJson, walk, writeProof, writeSdrt } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm audit [--strict]\nAudits package scripts, workflows, shell/Node/Python scripts, Docker/deploy config, environment handling, local fidelity, idempotency, exit semantics, attack vectors, local cost, and performance instrumentation. No repository code is executed.");
  process.exit(0);
}
const strict = process.argv.includes("--strict");
const findings = [];
const scripts = [];
const addFinding = (id, severity, vector, mitigation, testCaseId, perfImpact, evidence = {}) => {
  findings.push({ id, severity, vector, mitigation, test_case_id: testCaseId, perf_impact: perfImpact, evidence });
};

const rootPackage = readJson(join(ROOT, "package.json"), {});
const mvpPackage = readJson(join(ROOT, "mvp-build", "package.json"), {});
for (const [scope, pkg] of [["root", rootPackage], ["mvp-build", mvpPackage]]) {
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    scripts.push({
      id: `${scope}:${name}`,
      path: `${scope}/package.json`,
      kind: "package_script",
      command,
      input_boundary: ["process.env", "working tree", "declared command arguments"],
      output_boundary: /build|deploy|up|proof|report/.test(name) ? ["build/runtime/proof artifacts"] : ["stdout/stderr", "exit code"],
      dependency_graph: String(command).split(/\s+/).slice(0, 4),
      failure_mode: "delegated command exit code must propagate",
      exit_codes: "zero=success; nonzero=block",
      local_fidelity: scope === "root" ? "root wrapper delegates to canonical mvp-build scripts" : "canonical application script",
      idempotency: /down|status|check|audit|test|lint|typecheck|proof|plan/.test(name) ? "expected_safe" : "requires_explicit_review",
      performance_vector: /build|typecheck|test|lint/.test(name) ? "measured_by_root_wrapper" : "unmeasured_or_runtime_bound",
      local_cost: /build|test|dev/.test(name) ? "captured by local performance proof" : "unknown until local audit",
    });
  }
}

const candidateExtensions = new Set([".mjs", ".js", ".ts", ".tsx", ".sh", ".py", ".yml", ".yaml", ".json", ".toml", ".Dockerfile"]);
const files = [
  ...walk(join(ROOT, "scripts"), (path) => candidateExtensions.has(extname(path))),
  ...walk(join(ROOT, ".github", "workflows"), (path) => /\.ya?ml$/.test(path)),
  ...walk(join(ROOT, "mvp-build", "infra", "scripts"), (path) => /\.(mjs|js|sh|py)$/.test(path)),
  ...walk(join(ROOT, "mvp-build", "infra", "deploy"), (path) => /Dockerfile$|docker-compose.*\.ya?ml$|\.sh$/.test(path)),
];

const absolutePath = /(?:\/home\/[\w.-]+|\/Users\/[\w.-]+|[A-Za-z]:\\Users\\[^\\\s]+)/;
const secretPrint = /(?:console\.log|echo|printf).*?(?:TOKEN|SECRET|PASSWORD|SERVICE_ROLE|DATABASE_URL|AUTHORIZATION)/i;
const shellInjection = /\b(?:eval|exec)\s*\(|shell\s*:\s*true|\$\{[^}]+\}.*(?:sh -c|bash -c)/;
const destructive = /rm\s+-rf|docker\s+(?:system\s+prune|volume\s+rm)|drop\s+(?:database|schema)/i;
const dockerAuthority = /docker\.sock|--privileged|network_mode:\s*host/i;
const latestTag = /(?:image:\s*|docker\s+(?:run|pull)\s+)[^\s]+:latest\b/i;
const network = /\b(?:fetch\(|curl\s|wget\s|https?:\/\/|npm\s+(?:install|ci)|pnpm\s+install|docker\s+pull)/i;
const pathWrite = /writeFile|writeFileSync|mkdir|rmSync|unlink|cp\s|mv\s/i;

for (const path of files) {
  const rel = displayPath(path);
  const text = readFileSync(path, "utf8");
  const productionCompose = rel.endsWith("mvp-build/infra/deploy/docker-compose.production.yml");
  const legacyCompose = rel.endsWith("mvp-build/infra/deploy/docker-compose.yml");
  const managerBlock = productionCompose ? (text.split("  model-gateway:")[0] ?? "") : "";
  const isolatedHostAuthority = productionCompose
    && text.includes("  host-provisioner:")
    && !managerBlock.includes("/var/run/docker.sock")
    && text.includes("provisioner_socket:/run/amtech-provisioner")
    && text.includes("PROVISIONER_SOCKET_PATH");
  const rawHostAuthority = dockerAuthority.test(text);
  const item = {
    id: `file:${rel}`,
    path: rel,
    kind: rel.includes(".github/workflows") ? "ci_workflow" : rel.includes("infra/deploy") ? "deploy_config" : "script",
    input_boundary: [text.includes("process.env") || text.includes("$ENV") ? "environment" : null, text.includes("process.argv") || text.includes("$1") ? "arguments" : null, network.test(text) ? "network/provider" : null].filter(Boolean),
    output_boundary: [pathWrite.test(text) ? "filesystem" : null, text.includes("console.") || /echo\s/.test(text) ? "stdout/stderr" : null].filter(Boolean),
    dependency_graph: [...new Set([...text.matchAll(/(?:spawnSync|spawn|execFileSync?)\(["']([^"']+)/g)].map((match) => match[1]))],
    failure_mode: text.includes("process.exit(1)") || text.includes("set -e") || text.includes("ON_ERROR_STOP") ? "explicit_nonzero" : "review_exit_semantics",
    exit_codes: text.includes("process.exit(1)") || text.includes("set -e") || text.includes("ON_ERROR_STOP") ? "explicit_nonzero_on_detected_failure" : "unproven",
    attack_vectors: [],
    local_fidelity: rel.includes(".github/workflows") ? "ci_specific" : text.includes("NODE_ENV") ? "environment_sensitive" : "nominal",
    idempotency: /on conflict|ignoreDuplicates|--down-first|docker rm -f|existsSync/.test(text) ? "guarded" : "unproven",
    performance_vector: /build|vitest|tsc|docker compose|playwright/.test(text) ? "cpu_disk_io" : network.test(text) ? "network_io" : "low_or_unknown",
    local_cost: /build|vitest|tsc|docker compose|playwright/.test(text) ? "must be measured locally" : network.test(text) ? "provider/network dependent" : "low_or_unknown",
  };
  const matches = [
    [absolutePath.test(text), "hardcoded_absolute_path"],
    [secretPrint.test(text), "secret_log"],
    [shellInjection.test(text), "command_injection"],
    [destructive.test(text), "destructive_operation"],
    [rawHostAuthority && isolatedHostAuthority, "host_authority_isolated"],
    [rawHostAuthority && !isolatedHostAuthority, legacyCompose ? "legacy_host_authority" : "host_authority"],
    [latestTag.test(text), "unpinned_supply_chain"],
    [network.test(text), "network_dependency"],
  ];
  for (const [matched, vector] of matches) if (matched) item.attack_vectors.push(vector);
  scripts.push(item);

  if (item.attack_vectors.includes("hardcoded_absolute_path")) addFinding(`absolute_path:${rel}`, "high", "path_portability", "Replace user-specific absolute paths with repo-relative/configured paths.", "LP-AUDIT-ABSOLUTE-PATH", "local/CI divergence", { path: rel });
  if (item.attack_vectors.includes("secret_log")) addFinding(`secret_log:${rel}`, "critical", "secret_leak", "Redact values and log only key presence or secret references.", "LP-AUDIT-SECRET-LOG", "none", { path: rel });
  if (item.attack_vectors.includes("command_injection")) addFinding(`shell_injection:${rel}`, "critical", "code_injection", "Use argv arrays, allowlists, and shell:false; reject untrusted fragments.", "LP-AUDIT-COMMAND-INJECTION", "negligible", { path: rel });
  if (item.attack_vectors.includes("destructive_operation")) addFinding(`destructive:${rel}`, "high", "destructive_retry", "Require explicit confirmation, scoped targets, dry-run, and idempotent recovery.", "LP-AUDIT-DESTRUCTIVE", "operator latency", { path: rel });
  if (item.attack_vectors.includes("host_authority")) addFinding(`host_authority:${rel}`, "critical", "container_escape_or_host_control", "Keep Docker authority in the signed host provisioner and prove no public route reaches it.", "LP-AUDIT-HOST-AUTHORITY", "runtime isolation", { path: rel });
  if (item.attack_vectors.includes("legacy_host_authority")) addFinding(`legacy_host_authority:${rel}`, "high", "legacy_container_host_control", "Keep this compatibility topology non-canonical; use docker-compose.production.yml for local-production and launch evidence.", "LP-AUDIT-LEGACY-HOST-AUTHORITY", "legacy path only", { path: rel });
  if (item.attack_vectors.includes("unpinned_supply_chain")) addFinding(`latest_tag:${rel}`, "high", "supply_chain", "Pin image/action digests or immutable versions and record SBOM/attestation.", "LP-AUDIT-PINNED-SUPPLY", "repeatability", { path: rel });
}

if (!existsSync(join(ROOT, "pnpm-lock.yaml"))) addFinding("root_lock_missing", "critical", "supply_chain", "Restore the root pnpm orchestration lock.", "LP-LOCK-ROOT", "dependency install");
if (!existsSync(join(ROOT, "mvp-build", "package-lock.json"))) addFinding("lock_missing", "critical", "supply_chain", "Restore the canonical npm lock and require npm ci.", "LP-LOCK-001", "dependency install");
if (existsSync(join(ROOT, "mvp-build", "pnpm-lock.yaml"))) addFinding("dual_lock", "critical", "supply_chain", "Remove the competing application lock; root pnpm must remain orchestration-only.", "LP-LOCK-002", "dependency install");
if (existsSync(join(ROOT, "GTM-RESEARCH", "website-framework"))) addFinding("foreign_hyper_site", "critical", "repository_boundary", "Keep W1/W2/W3 and Hyper Site in benamtech/hyper-site; do not re-import them.", "LP-BOUNDARY-001", "CI/build graph");

const requiredRootScripts = ["audit", "preflight", "build", "test", "dev", "typecheck", "lint", "verify", "s9:go-no-go", "sdrt:validate", "sdrt:mcp"];
for (const name of requiredRootScripts) if (!rootPackage.scripts?.[name]) addFinding(`root_script_missing:${name}`, "critical", "entrypoint_gap", `Add the root ${name} command.`, `LP-ROOT-${name.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-")}`, "operator workflow");

const status = findings.some((finding) => finding.severity === "critical") ? "blocked" : findings.length ? "needs_review" : "pass";
const summary = {
  scripts_audited: scripts.length,
  findings_total: findings.length,
  findings_by_severity: Object.fromEntries(["critical", "high", "medium", "low"].map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length])),
  package_manager_boundary: "root pnpm orchestration; mvp-build npm/package-lock dependency authority",
  production_topology_boundary: "docker-compose.production.yml isolates Docker authority in host-provisioner; legacy compose is non-canonical compatibility",
  foreign_repo_boundary: "W1/W2/W3/Hyper Site are not part of this repository",
};
const { proof, latest } = writeProof("script-audit", { status, summary, scripts, findings });
const sdrt = writeSdrt("script-audit", proof);
console.log(JSON.stringify(summary, null, 2));
console.log(`proof_json:${latest}`);
console.log(`proof_sdrt:${sdrt}`);
if (strict && status !== "pass") process.exit(1);
