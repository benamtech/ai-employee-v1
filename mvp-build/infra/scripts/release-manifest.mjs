#!/usr/bin/env node
import { createHash, createPrivateKey, createPublicKey, sign } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = resolve(root, process.env.AMTECH_RELEASE_MANIFEST_OUT ?? "infra/proofs/release-manifest.json");
const services = ["manager", "model-gateway", "host-provisioner", "web", "caddy"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileDigest = (path) => sha256(readFileSync(resolve(root, path)));
const canonical = (value) => JSON.stringify(value, Object.keys(value).sort());

function gitSha() {
  const value = process.env.AMTECH_GIT_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  if (!/^[a-f0-9]{40}$/.test(value)) throw new Error("release_manifest_exact_git_sha_required");
  return value;
}

function migrationHead() {
  const values = readdirSync(resolve(root, "packages/db/migrations"))
    .map((name) => /^(\d{4})[a-z]?_.*\.sql$/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  if (!values.length) throw new Error("release_manifest_migration_head_missing");
  return String(Math.max(...values)).padStart(4, "0");
}

function inspectImage(service, sha) {
  const envName = `AMTECH_${service.toUpperCase().replaceAll("-", "_")}_IMAGE`;
  const defaultRef = `amtech-ai-employee-${service}:${sha}`;
  const ref = process.env[envName] ?? defaultRef;
  const result = spawnSync("docker", ["image", "inspect", ref, "--format", "{{json .}}"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`release_manifest_image_missing:${service}:${ref}`);
  const image = JSON.parse(result.stdout.trim());
  const revision = image?.Config?.Labels?.["org.opencontainers.image.revision"];
  const runtime = image?.Config?.Labels?.["ai.amtech.runtime"];
  if (revision !== sha) throw new Error(`release_manifest_image_revision_mismatch:${service}`);
  return {
    service,
    ref,
    image_id: image.Id,
    repo_digests: [...(image.RepoDigests ?? [])].sort(),
    revision,
    runtime,
  };
}

const sha = gitSha();
const secretVersions = JSON.parse(process.env.AMTECH_SECRET_VERSION_REFS ?? "{}");
if (!secretVersions || typeof secretVersions !== "object" || Array.isArray(secretVersions)) {
  throw new Error("release_manifest_secret_version_refs_invalid");
}
const images = Object.fromEntries(services.map((service) => [service, inspectImage(service, sha)]));
const payload = {
  schema: "amtech.release-manifest.v2",
  repository: process.env.GITHUB_REPOSITORY ?? "benamtech/ai-employee-v1",
  git_sha: sha,
  migration_head: migrationHead(),
  compose: {
    path: "infra/deploy/docker-compose.production.yml",
    sha256: fileDigest("infra/deploy/docker-compose.production.yml"),
  },
  configuration: {
    caddyfile_sha256: fileDigest("infra/caddy/production.Caddyfile"),
    topology_sha256: fileDigest("infra/scripts/production-topology.mjs"),
    dockerfiles: Object.fromEntries([
      ["manager", "infra/deploy/manager.Dockerfile"],
      ["model-gateway", "infra/deploy/model-gateway.Dockerfile"],
      ["host-provisioner", "infra/deploy/provisioner.Dockerfile"],
      ["web", "infra/deploy/web.Dockerfile"],
      ["caddy", "infra/deploy/caddy.Dockerfile"],
    ].map(([name, path]) => [name, { path, sha256: fileDigest(path) }])),
  },
  images,
  secret_versions: Object.fromEntries(Object.entries(secretVersions).sort(([a], [b]) => a.localeCompare(b))),
  evidence_classes: {
    source: "represented",
    container_build: "represented",
    signed_release: "not_established_without_external_signing_authority",
    deployment: "not_established",
    production: "not_established",
  },
};
const payloadBytes = Buffer.from(JSON.stringify(payload));
const digest = sha256(payloadBytes);
const privatePem = process.env.AMTECH_RELEASE_PRIVATE_KEY_PEM;
if (!privatePem) throw new Error("release_manifest_private_key_required");
const privateKey = createPrivateKey(privatePem.replaceAll("\\n", "\n"));
const publicKey = createPublicKey(privateKey);
const signature = sign(null, payloadBytes, privateKey).toString("base64");
const manifest = {
  ...payload,
  payload_digest: digest,
  signature: { algorithm: "Ed25519", value: signature, public_key_fingerprint: sha256(publicKey.export({ type: "spki", format: "der" })) },
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ status: "ok", out, git_sha: sha, image_count: services.length, payload_digest: digest }));
