const DIGEST = /^sha256:[a-f0-9]{64}$/;

export interface RuntimeImageEvidence {
  image: string;
  digest: string;
  source_sha: string;
  resolved_at: string;
  registry: string;
}

export function validateRuntimeImageEvidence(input: RuntimeImageEvidence): RuntimeImageEvidence {
  if (!input.image || input.image.includes("@sha256:") === false) throw new Error("runtime_image_not_digest_pinned");
  if (!DIGEST.test(input.digest)) throw new Error("runtime_digest_invalid");
  if (!input.image.endsWith(`@${input.digest}`)) throw new Error("runtime_image_digest_mismatch");
  if (!/^[a-f0-9]{40}$/.test(input.source_sha)) throw new Error("runtime_source_sha_invalid");
  if (!Number.isFinite(Date.parse(input.resolved_at))) throw new Error("runtime_digest_resolution_time_invalid");
  if (!/^https:\/\//.test(input.registry)) throw new Error("runtime_registry_invalid");
  return Object.freeze({ ...input });
}

export function assertExactRuntimeImage(expected: RuntimeImageEvidence, observedImageId: string): void {
  const evidence = validateRuntimeImageEvidence(expected);
  if (!observedImageId.includes(evidence.digest)) throw new Error("runtime_observed_digest_mismatch");
}
