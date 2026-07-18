import { z } from "zod";

export const ReleaseEvidenceStatusSchema = z.enum([
  "pending",
  "source_wired",
  "ci_accepted",
  "real_supabase_accepted",
  "runtime_accepted",
  "provider_accepted",
  "browser_channel_accepted",
  "commercial_accepted",
  "capacity_recovery_accepted",
  "rollback_accepted",
  "production_deployed",
]);
export type ReleaseEvidenceStatus = z.infer<typeof ReleaseEvidenceStatusSchema>;

export const ReleaseGateNameSchema = z.enum([
  "source_typecheck",
  "shared_build",
  "unit_contracts",
  "relationship_authorization_matrix",
  "command_effect_matrix",
  "blank_migration_apply",
  "snapshot_clone_migration_apply",
  "real_supabase_matrix",
  "runtime_host_packet",
  "provider_packet",
  "browser_sms_packet",
  "commercial_reconciliation",
  "capacity_recovery_packet",
  "rollback_rehearsal",
  "proof_digest_claim_consistency",
]);
export type ReleaseGateName = z.infer<typeof ReleaseGateNameSchema>;

export const REQUIRED_RELEASE_GATES = ReleaseGateNameSchema.options;

export const ReleaseEvidenceGateSchema = z.object({
  gate: ReleaseGateNameSchema,
  status: ReleaseEvidenceStatusSchema,
  sha: z.string().regex(/^[a-f0-9]{40}$/),
  evidenceId: z.string().min(1).nullable(),
  generatedAt: z.string().datetime({ offset: true }),
  source: z.enum(["github_actions", "real_supabase", "provider", "browser", "operator_attestation", "local_diagnostic"]),
  redactionState: z.enum(["not_secret", "redacted", "contains_secret_do_not_publish"]),
  notes: z.string().min(1),
});
export type ReleaseEvidenceGate = z.infer<typeof ReleaseEvidenceGateSchema>;

export const ReleaseEvidenceManifestSchema = z.object({
  schemaVersion: z.literal("release-evidence-v1"),
  repository: z.string().min(1),
  branch: z.string().min(1),
  commitSha: z.string().regex(/^[a-f0-9]{40}$/),
  generatedAt: z.string().datetime({ offset: true }),
  generator: z.string().min(1),
  publicClaimState: z.enum([
    "not_launch_cleared",
    "source_and_ci_only",
    "staging_accepted",
    "production_ready",
  ]),
  gates: z.array(ReleaseEvidenceGateSchema).min(1),
});
export type ReleaseEvidenceManifest = z.infer<typeof ReleaseEvidenceManifestSchema>;

export interface ReleaseEvidenceValidation {
  ok: boolean;
  problems: string[];
  missingGates: ReleaseGateName[];
  staleGates: ReleaseGateName[];
}

const liveAcceptanceGates = new Set<ReleaseGateName>([
  "real_supabase_matrix",
  "runtime_host_packet",
  "provider_packet",
  "browser_sms_packet",
  "commercial_reconciliation",
  "capacity_recovery_packet",
  "rollback_rehearsal",
  "proof_digest_claim_consistency",
]);

function gateIsAccepted(gate: ReleaseEvidenceGate): boolean {
  if (gate.status === "pending" || gate.status === "source_wired") return false;
  if (liveAcceptanceGates.has(gate.gate)) return gate.evidenceId !== null && gate.status !== "ci_accepted";
  return gate.status === "ci_accepted" || gate.status.endsWith("_accepted") || gate.status === "production_deployed";
}

export function validateReleaseEvidenceManifest(
  raw: unknown,
  expectedSha?: string,
): ReleaseEvidenceValidation {
  const parsed = ReleaseEvidenceManifestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((issue) => `${issue.path.join(".") || "manifest"}: ${issue.message}`),
      missingGates: [...REQUIRED_RELEASE_GATES],
      staleGates: [],
    };
  }

  const manifest = parsed.data;
  const problems: string[] = [];
  const missingGates: ReleaseGateName[] = [];
  const staleGates: ReleaseGateName[] = [];
  const gates = new Map<ReleaseGateName, ReleaseEvidenceGate>();

  for (const gate of manifest.gates) {
    if (gates.has(gate.gate)) problems.push(`duplicate release evidence gate: ${gate.gate}`);
    gates.set(gate.gate, gate);
    if (gate.sha !== manifest.commitSha || (expectedSha && gate.sha !== expectedSha)) {
      staleGates.push(gate.gate);
    }
    if (gate.redactionState === "contains_secret_do_not_publish") {
      problems.push(`${gate.gate} evidence contains secrets and cannot be published`);
    }
  }

  for (const required of REQUIRED_RELEASE_GATES) {
    if (!gates.has(required)) missingGates.push(required);
  }

  if (expectedSha && manifest.commitSha !== expectedSha) {
    problems.push(`manifest sha ${manifest.commitSha} does not match expected sha ${expectedSha}`);
  }

  if (manifest.publicClaimState === "production_ready") {
    for (const required of REQUIRED_RELEASE_GATES) {
      const gate = gates.get(required);
      if (!gate || !gateIsAccepted(gate)) {
        problems.push(`production_ready claim without accepted gate: ${required}`);
      }
    }
  }

  if (manifest.publicClaimState === "staging_accepted") {
    for (const required of ["real_supabase_matrix", "runtime_host_packet", "browser_sms_packet"] as const) {
      const gate = gates.get(required);
      if (!gate || !gateIsAccepted(gate)) {
        problems.push(`staging_accepted claim without accepted gate: ${required}`);
      }
    }
  }

  return {
    ok: problems.length === 0 && missingGates.length === 0 && staleGates.length === 0,
    problems,
    missingGates,
    staleGates,
  };
}

export function assertReleaseEvidenceManifest(
  raw: unknown,
  expectedSha?: string,
): ReleaseEvidenceManifest {
  const parsed = ReleaseEvidenceManifestSchema.parse(raw);
  const validation = validateReleaseEvidenceManifest(parsed, expectedSha);
  if (!validation.ok) {
    throw new Error([
      ...validation.problems,
      ...validation.missingGates.map((gate) => `missing release evidence gate: ${gate}`),
      ...validation.staleGates.map((gate) => `stale release evidence gate: ${gate}`),
    ].join("\n"));
  }
  return parsed;
}

export function buildSourceCiReleaseEvidenceManifest(params: {
  repository: string;
  branch: string;
  commitSha: string;
  generatedAt: string;
  generator: string;
  runId?: string;
}): ReleaseEvidenceManifest {
  const sourceCiAccepted = new Set<ReleaseGateName>([
    "source_typecheck",
    "shared_build",
    "unit_contracts",
    "relationship_authorization_matrix",
    "command_effect_matrix",
    "blank_migration_apply",
  ]);

  return ReleaseEvidenceManifestSchema.parse({
    schemaVersion: "release-evidence-v1",
    repository: params.repository,
    branch: params.branch,
    commitSha: params.commitSha,
    generatedAt: params.generatedAt,
    generator: params.generator,
    publicClaimState: "source_and_ci_only",
    gates: REQUIRED_RELEASE_GATES.map((gate) => ({
      gate,
      status: sourceCiAccepted.has(gate) ? "ci_accepted" : "pending",
      sha: params.commitSha,
      evidenceId: sourceCiAccepted.has(gate) ? `github-actions:${params.runId ?? "local"}:${gate}` : null,
      generatedAt: params.generatedAt,
      source: sourceCiAccepted.has(gate) ? "github_actions" : "local_diagnostic",
      redactionState: "not_secret",
      notes: sourceCiAccepted.has(gate)
        ? "Integrated CI source gate placeholder; exact workflow run owns final evidence ID."
        : "Required hard gate remains pending and cannot promote release state.",
    })),
  });
}
