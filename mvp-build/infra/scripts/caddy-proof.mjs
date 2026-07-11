#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir, hostname } from "node:os";
import { join } from "node:path";

const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const image = process.env.CADDY_PROOF_IMAGE ?? "caddy:2.8-alpine";
const keepTmp = process.env.CADDY_PROOF_KEEP_TMP === "1";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(args, opts = {}) {
  const res = spawnSync(args[0], args.slice(1), { encoding: "utf8", ...opts });
  return {
    code: res.status,
    stdout: String(res.stdout ?? ""),
    stderr: String(res.stderr ?? ""),
    output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim().slice(0, 6000),
  };
}

function dockerCaddy(tmp, args, opts = {}) {
  return run([
    "docker", "run", "--rm",
    "-v", `${tmp}:/etc/caddy`,
    image,
    "caddy",
    ...args,
  ], opts);
}

function writeBase(tmp) {
  writeFileSync(join(tmp, "Caddyfile"), [
    ":8080 {",
    "  respond \"base-route-alive\"",
    "}",
    "import /etc/caddy/clients/*.caddy",
    "",
  ].join("\n"));
}

function validate(tmp) {
  return dockerCaddy(tmp, ["validate", "--config", "/etc/caddy/Caddyfile"]);
}

function oldRouteAlive(tmp) {
  const port = String(19080 + Math.floor(Math.random() * 1000));
  const server = spawnSync("docker", [
    "run", "--rm", "-d",
    "-p", `127.0.0.1:${port}:8080`,
    "-v", `${tmp}:/etc/caddy`,
    image,
    "caddy", "run", "--config", "/etc/caddy/Caddyfile",
  ], { encoding: "utf8" });
  const id = String(server.stdout ?? "").trim();
  if (server.status !== 0 || !id) return { status: "fail", error: `${server.stdout}${server.stderr}`.trim() };
  try {
    let last = null;
    for (let i = 0; i < 20; i++) {
      const curl = run(["curl", "-fsS", `http://127.0.0.1:${port}/`]);
      last = curl;
      if (curl.code === 0 && curl.stdout.includes("base-route-alive")) {
        return { status: "pass", output: curl.stdout.trim() };
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
    return { status: "fail", output: last?.output ?? "route_unreachable" };
  } finally {
    run(["docker", "rm", "-f", id]);
  }
}

const tmp = mkdtempSync(join(tmpdir(), "amtech-caddy-proof-"));
const clients = join(tmp, "clients");
mkdirSync(clients, { recursive: true });
writeBase(tmp);

const previousSnippet = [
  "old.agents.amtech.local {",
  "  respond \"old-route\"",
  "}",
  "",
].join("\n");
writeFileSync(join(clients, "client-old.caddy"), previousSnippet);

const initial = validate(tmp);
writeFileSync(join(clients, "client-good.caddy"), [
  "good.agents.amtech.local {",
  "  respond \"good-route\"",
  "}",
  "",
].join("\n"));
const good = validate(tmp);

writeFileSync(join(clients, "client-old.caddy"), "bad.agents.amtech.local {\n  reverse_proxy 127.0.0.1:1\n");
const bad = validate(tmp);
writeFileSync(join(clients, "client-old.caddy"), previousSnippet);
const rollbackValidate = validate(tmp);
const alive = oldRouteAlive(tmp);

const checks = [
  { name: "initial_config_valid", status: initial.code === 0 ? "pass" : "fail", output: initial.output },
  { name: "good_snippet_valid", status: good.code === 0 ? "pass" : "fail", output: good.output },
  { name: "bad_snippet_rejected", status: bad.code !== 0 ? "pass" : "fail", output: bad.output },
  { name: "rollback_config_valid", status: rollbackValidate.code === 0 ? "pass" : "fail", output: rollbackValidate.output },
  { name: "old_route_alive_after_rollback", ...alive },
];

for (const check of checks) {
  console.log(`${check.status === "pass" ? "PASS" : "FAIL"} ${check.name}`);
}

mkdirSync(proofDir, { recursive: true });
const proofPath = join(proofDir, `caddy-proof-${stamp()}.json`);
const proof = {
  kind: "caddy_activation_rollback_proof",
  status: checks.some((c) => c.status !== "pass") ? "fail" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  caddy_image: image,
  checks,
};
writeFileSync(proofPath, JSON.stringify(proof, null, 2));
console.log(`proof_json:${proofPath}`);

if (!keepTmp) rmSync(tmp, { recursive: true, force: true });
else console.log(`tmp_dir:${tmp}`);

if (proof.status !== "pass") process.exit(1);
