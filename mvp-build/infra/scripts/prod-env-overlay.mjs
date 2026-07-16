#!/usr/bin/env node
/**
 * prod-env-overlay.mjs
 * Durable local production overlay helper.
 *
 * Responsibilities:
 *  - Merge .env.production.local (gitignored) into infra/deploy/.env.production
 *  - Derive CLOUDFLARE_TUNNEL_TOKEN from infra/.local/cloudflared/cert.pem
 *  - Write a short proof artifact to infra/proofs/
 *
 * Used by:
 *  - npm run prod-like:env:sync
 *  - npm run prod-like:tunnel:ensure
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const deployDir = join(root, "infra", "deploy");
const deployEnvPath = join(deployDir, ".env.production");
const deployEnvExamplePath = join(deployDir, ".env.production.example");
const localOverlayPath = join(root, ".env.production.local");
const certPath = join(root, "infra", ".local", "cloudflared", "cert.pem");
const proofDir = join(root, "infra", "proofs");

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function parseEnvText(text) {
  const values = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return values;
}

function readEnv(path) {
  if (!existsSync(path)) return {};
  return parseEnvText(readFileSync(path, "utf8"));
}

function writeEnv(path, values) {
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`);
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
}

function deriveTunnelToken() {
  if (!existsSync(certPath)) return null;
  // Prefer native cloudflared binary; fall back to Docker image
  let result = spawnSync("cloudflared", ["tunnel", "--origincert", resolve(certPath), "token", "amtech-tunnel"], { encoding: "utf8" });
  if (result.status !== 0) {
    result = spawnSync("docker", [
      "run", "--rm", "--user", "0", "--network", "host",
      "-v", `${resolve(certPath)}:/cert.pem:ro`,
      "cloudflare/cloudflared:latest",
      "tunnel", "--origincert", "/cert.pem", "token", "amtech-tunnel"
    ], { encoding: "utf8" });
  }
  const token = (result.stdout ?? "").split("\n").map(l => l.trim()).filter(Boolean).at(-1) ?? "";
  return result.status === 0 && token.length > 20 ? token : null;
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function syncOverlay({ writeProof = true } = {}) {
  ensureDir(deployDir);
  ensureDir(proofDir);

  // Seed from example if no .env.production exists
  if (!existsSync(deployEnvPath)) {
    const seed = existsSync(deployEnvExamplePath) ? readFileSync(deployEnvExamplePath, "utf8") : "";
    writeFileSync(deployEnvPath, seed, "utf8");
  }

  const base = readEnv(deployEnvPath);
  const overlay = readEnv(localOverlayPath);
  const merged = { ...base, ...overlay };

  // Always derive fresh tunnel token (minted at deploy time) and overwrite
  const derivedToken = deriveTunnelToken();
  if (derivedToken) {
    merged.CLOUDFLARE_TUNNEL_TOKEN = derivedToken;
  }

  writeEnv(deployEnvPath, merged);

  const result = {
    ok: true,
    timestamp: new Date().toISOString(),
    overlayUsed: existsSync(localOverlayPath),
    tunnelTokenDerived: Boolean(derivedToken),
    tunnelTokenPresent: Boolean(merged.CLOUDFLARE_TUNNEL_TOKEN),
    deployEnvPath,
  };

  if (writeProof) {
    const proofPath = join(proofDir, `prod-env-overlay-${stamp()}.json`);
    writeFileSync(proofPath, JSON.stringify(result, null, 2), "utf8");
    result.proofPath = proofPath;
  }

  return result;
}

export function ensureTunnelToken({ writeProof = true } = {}) {
  const result = syncOverlay({ writeProof });
  if (!result.tunnelTokenPresent) {
    result.ok = false;
    result.error = "CLOUDFLARE_TUNNEL_TOKEN missing after sync";
  }
  return result;
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === "ensure-tunnel") {
    const r = ensureTunnelToken();
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  } else {
    const r = syncOverlay();
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  }
}
