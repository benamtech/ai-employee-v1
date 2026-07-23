import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";

export interface EffectProofProjection {
  id: string;
  assignment_id: string;
  effect_receipt_id: string;
  approval_id: string | null;
  resource_class: string;
  resource_id: string;
  revision_id: string | null;
  projection_kind: string;
  state: "pending" | "projected" | "failed";
  output_ref: string | null;
  proof_ref: string | null;
  repair_count: number;
  last_error: string | null;
  evidence: Record<string, unknown>;
}

function stableId(effectReceiptId: string, projectionKind: string): string {
  return `eproj_${createHash("sha256").update(`${effectReceiptId}\u001f${projectionKind}`).digest("hex").slice(0, 28)}`;
}

function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === "object" ? value[0] as Record<string, unknown> : null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function normalize(row: Record<string, unknown>): EffectProofProjection {
  return {
    id: String(row.id ?? ""),
    assignment_id: String(row.assignment_id ?? ""),
    effect_receipt_id: String(row.effect_receipt_id ?? ""),
    approval_id: row.approval_id ? String(row.approval_id) : null,
    resource_class: String(row.resource_class ?? ""),
    resource_id: String(row.resource_id ?? ""),
    revision_id: row.revision_id ? String(row.revision_id) : null,
    projection_kind: String(row.projection_kind ?? ""),
    state: String(row.state ?? "failed") as EffectProofProjection["state"],
    output_ref: row.output_ref ? String(row.output_ref) : null,
    proof_ref: row.proof_ref ? String(row.proof_ref) : null,
    repair_count: Number(row.repair_count ?? 0),
    last_error: row.last_error ? String(row.last_error) : null,
    evidence: row.evidence && typeof row.evidence === "object" ? row.evidence as Record<string, unknown> : {},
  };
}

export async function projectArtifactEffectProof(db: SupabaseClient, input: {
  assignment_id: string;
  effect_receipt_id: string;
  approval_id: string;
  artifact_id: string;
  revision_id: string;
  publication_ref: string;
}): Promise<EffectProofProjection> {
  const projectionKind = "artifact_owner_completion";
  const proofRef = `proof://artifacts/${input.artifact_id}/revisions/${input.revision_id}/effects/${input.effect_receipt_id}`;
  const result = await db.rpc("project_effect_proof", {
    p_projection_id: stableId(input.effect_receipt_id, projectionKind),
    p_assignment_id: input.assignment_id,
    p_effect_receipt_id: input.effect_receipt_id,
    p_approval_id: input.approval_id,
    p_resource_class: "artifact",
    p_resource_id: input.artifact_id,
    p_revision_id: input.revision_id,
    p_projection_kind: projectionKind,
    p_output_ref: input.publication_ref,
    p_proof_ref: proofRef,
    p_evidence: {
      artifact_id: input.artifact_id,
      revision_id: input.revision_id,
      approval_id: input.approval_id,
      effect_receipt_id: input.effect_receipt_id,
      publication_ref: input.publication_ref,
    },
  });
  if (result.error) throw result.error;
  const row = firstRow(result.data);
  if (!row) throw new Error("artifact_effect_proof_projection_missing");
  return normalize(row);
}

export async function loadArtifactEffectProofs(
  db: SupabaseClient,
  artifactId: string,
  assignmentId: string,
): Promise<EffectProofProjection[]> {
  const result = await db.from("effect_proof_projections")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("resource_class", "artifact")
    .eq("resource_id", artifactId)
    .order("created_at", { ascending: false });
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => normalize(row as Record<string, unknown>));
}
