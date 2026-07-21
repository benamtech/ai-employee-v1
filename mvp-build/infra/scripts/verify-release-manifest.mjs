#!/usr/bin/env node
import { createPublicKey, verify } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  RELEASE_SERVICES,
  canonicalJson,
  manifestPayload,
  sha256,
  validateManifestShape,
} from "./release-manifest-contract.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const manifestPath = resolve(root, process.argv[2] ?? process.env.AMTECH_RELEASE_MANIFEST ?? "infra/proofs/release-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
validateManifestShape(manifest);

const payload = manifestPayload(manifest);
const payloadBytes = Buffer.from(canonicalJson(payload));
const digest = sha256(payloadBytes);
if (digest !== manifest.payload_digest) throw new Error("release_manifest_payload_digest_mismatch");

const publicPem = process.env.AMTECH_RELEASE_PUBLIC_KEY_PEM;
if (!publicPem) throw new Error("release_manifest_public_key_required");
const publicKey = createPublicKey(publicPem.replaceAll("\\n", "\n"));
const publicDer = publicKey.export({ type: "spki", format: "der" });
const fingerprint = sha256(publicDer);
if (fingerprint !== manifest.signature.public_key_fingerprint) {
  throw new Error("release_manifest_public_key_fingerprint_mismatch");
}
const expectedFingerprint = process.env.AMTECH_RELEASE_EXPECTED_PUBLIC_KEY_FINGERPRINT;
if (expectedFingerprint && expectedFingerprint !== fingerprint) {
  throw new Error("release_manifest_untrusted_signing_key");
}
if (!verify(null, payloadBytes, publicKey, Buffer.from(manifest.signature.value, "base64"))) {
  throw new Error("release_manifest_signature_verification_failed");
}

function fileDigest(path) {
  return sha256(readFileSync(resolve(root, path)));
}
function requireDigest(path, expected, label) {
  if (fileDigest(path) !== expected) throw new Error(`release_manifest_file_digest_mismatch:${label}`);
}
requireDigest(manifest.compose.path, manifest.compose.sha256, "compose");
requireDigest("infra/caddy/production.Caddyfile", manifest.configuration.caddyfile_sha256, "caddyfile");
requireDigest("infra/scripts/production-topology.mjs", manifest.configuration.topology_sha256, "topology");
for (const [name, item] of Object.entries(manifest.configuration.dockerfiles)) {
  requireDigest(item.path, item.sha256, `dockerfile:${name}`);
}
const migrationHead = String(Math.max(...readdirSync(resolve(root, "packages/db/migrations"))
  .map((name) => /^(\d{4})[a-z]?_.*\.sql$/.exec(name))
  .filter(Boolean)
  .map((match) => Number(match[1])))).padStart(4, "0");
if (migrationHead !== manifest.migration_head) throw new Error("release_manifest_migration_head_mismatch");

if (process.env.AMTECH_RELEASE_VERIFY_LOCAL_IMAGES !== "0") {
  for (const service of RELEASE_SERVICES) {
    const recorded = manifest.images[service];
    const result = spawnSync("docker", ["image", "inspect", recorded.ref, "--format", "{{json .}}"], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`release_manifest_local_image_missing:${service}`);
    const image = JSON.parse(result.stdout.trim());
    if (image.Id !== recorded.image_id) throw new Error(`release_manifest_local_image_id_mismatch:${service}`);
    if (image?.Config?.Labels?.["org.opencontainers.image.revision"] !== manifest.git_sha) {
      throw new Error(`release_manifest_local_image_revision_mismatch:${service}`);
    }
  }
}

console.log(JSON.stringify({
  status: "ok",
  manifest: manifestPath,
  git_sha: manifest.git_sha,
  migration_head: manifest.migration_head,
  image_count: RELEASE_SERVICES.length,
  payload_digest: manifest.payload_digest,
  public_key_fingerprint: fingerprint,
  trust_note: expectedFingerprint ? "matched_external_fingerprint" : "cryptographic_integrity_only",
}, null, 2));
