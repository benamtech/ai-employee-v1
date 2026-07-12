#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";

const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const image = process.env.CADDY_WILDCARD_PROOF_IMAGE ?? process.env.CADDY_PROOF_IMAGE ?? "amtech-caddy-cloudflare:local";
const configPath = process.env.CADDY_WILDCARD_CONFIG ?? "infra/caddy/production.Caddyfile";
const keepTmp = process.env.CADDY_PROOF_KEEP_TMP === "1";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitInfo() {
  try {
    return {
      sha: execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim(),
      dirty: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0,
    };
  } catch {
    return { sha: null, dirty: null };
  }
}

function run(args, opts = {}) {
  const res = spawnSync(args[0], args.slice(1), { encoding: "utf8", ...opts });
  return { code: res.status, output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim().slice(0, 8000) };
}

function dockerCaddy(tmp, args, env = {}) {
  return run([
    "docker", "run", "--rm",
    "-e", `CLOUDFLARE_API_TOKEN=${env.CLOUDFLARE_API_TOKEN ?? "placeholder-token-for-validate-only"}`,
    "-e", "WEB_UPSTREAM=web:3000",
    "-e", "MANAGER_UPSTREAM=manager:8080",
    "-v", `${tmp}:/etc/caddy:ro`,
    image,
    "caddy",
    ...args,
  ]);
}

export function parseHasCloudflareDnsModule(output) {
  return String(output).split(/\r?\n/).some((line) => line.trim() === "dns.providers.cloudflare");
}

export function configMentionsWildcardDns01(source) {
  return source.includes("*.agents.amtechai.com") &&
    source.includes("dns cloudflare") &&
    source.includes("{env.CLOUDFLARE_API_TOKEN}");
}

export async function main() {
  const tmp = mkdtempSync(join(tmpdir(), "amtech-caddy-wildcard-"));
  const clients = join(tmp, "clients");
  mkdirSync(clients, { recursive: true });
  const source = readFileSync(configPath, "utf8");
  writeFileSync(join(tmp, "Caddyfile"), source);
  writeFileSync(join(clients, "placeholder.caddy"), [
    "placeholder.agents.amtechai.com {",
    "  reverse_proxy amtech-hermes-placeholder:8000",
    "}",
    "",
  ].join("\n"));

  const modules = dockerCaddy(tmp, ["list-modules"]);
  const validate = dockerCaddy(tmp, ["validate", "--config", "/etc/caddy/Caddyfile"]);
  const checks = [
    { name: "config_mentions_wildcard_dns01", status: configMentionsWildcardDns01(source) ? "pass" : "fail" },
    { name: "cloudflare_dns_module_present", status: modules.code === 0 && parseHasCloudflareDnsModule(modules.output) ? "pass" : "fail", output: modules.output },
    { name: "production_caddyfile_validates", status: validate.code === 0 ? "pass" : "fail", output: validate.output },
  ];

  for (const check of checks) console.log(`${check.status === "pass" ? "PASS" : "FAIL"} ${check.name}`);

  mkdirSync(proofDir, { recursive: true });
  const proofPath = join(proofDir, `caddy-wildcard-proof-${stamp()}.json`);
  const proof = {
    kind: "caddy_wildcard_dns01_proof",
    proof_tier: "static",
    status: checks.some((check) => check.status !== "pass") ? "fail" : "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git: gitInfo(),
    caddy_image: image,
    config_path: configPath,
    tls_status: "config_validated_only_no_acme_order",
    checks,
  };
  writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  console.log(`proof_json:${proofPath}`);
  if (!keepTmp) rmSync(tmp, { recursive: true, force: true });
  else console.log(`tmp_dir:${tmp}`);
  if (proof.status !== "pass") process.exit(1);
  return proof;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(String(err?.message ?? err));
    process.exit(1);
  });
}
