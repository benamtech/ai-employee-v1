import { createHash } from "node:crypto";

export const RELEASE_SERVICES = Object.freeze([
  "manager",
  "model-gateway",
  "host-provisioner",
  "web",
  "caddy",
]);

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortValue(child)]),
  );
}

export function manifestPayload(manifest) {
  const { payload_digest: _digest, signature: _signature, ...payload } = manifest;
  return payload;
}

export function validateManifestShape(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("release_manifest_object_required");
  }
  if (manifest.schema !== "amtech.release-manifest.v2") {
    throw new Error("release_manifest_schema_invalid");
  }
  if (!/^[a-f0-9]{40}$/.test(String(manifest.git_sha ?? ""))) {
    throw new Error("release_manifest_exact_git_sha_required");
  }
  if (!/^\d{4}$/.test(String(manifest.migration_head ?? ""))) {
    throw new Error("release_manifest_migration_head_invalid");
  }
  const imageKeys = Object.keys(manifest.images ?? {}).sort();
  const expected = [...RELEASE_SERVICES].sort();
  if (JSON.stringify(imageKeys) !== JSON.stringify(expected)) {
    throw new Error("release_manifest_five_service_image_set_required");
  }
  const ids = new Set();
  for (const service of RELEASE_SERVICES) {
    const image = manifest.images[service];
    if (!image || image.service !== service) throw new Error(`release_manifest_image_invalid:${service}`);
    if (image.revision !== manifest.git_sha) throw new Error(`release_manifest_image_revision_mismatch:${service}`);
    if (!String(image.image_id ?? "").startsWith("sha256:")) throw new Error(`release_manifest_image_id_invalid:${service}`);
    ids.add(image.image_id);
  }
  if (ids.size !== RELEASE_SERVICES.length) {
    throw new Error("release_manifest_distinct_image_identity_required");
  }
  if (!/^[a-f0-9]{64}$/.test(String(manifest.payload_digest ?? ""))) {
    throw new Error("release_manifest_payload_digest_invalid");
  }
  if (manifest.signature?.algorithm !== "Ed25519" || !manifest.signature?.value) {
    throw new Error("release_manifest_signature_invalid");
  }
  if (!/^[a-f0-9]{64}$/.test(String(manifest.signature.public_key_fingerprint ?? ""))) {
    throw new Error("release_manifest_public_key_fingerprint_invalid");
  }
}
