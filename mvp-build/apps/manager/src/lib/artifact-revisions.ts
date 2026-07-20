import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";

export type ArtifactValidationStatus = "passed" | "failed" | "warning" | "skipped";

function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 26)}`;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null) ?? "null";
}

export function artifactContentSha256(payload: unknown): string {
  return createHash("sha256").update(canonical(payload)).digest("hex");
}

export interface ArtifactRevisionInput {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  artifact_id?: string;
  kind: string;
  payload: Record<string, unknown>;
  mime_type?: string | null;
  storage_ref?: string | null;
  source_manifest?: Record<string, unknown>;
  created_run?: string | null;
  created_by?: string;
}

export async function createArtifactRevision(
  db: SupabaseClient,
  input: ArtifactRevisionInput,
): Promise<{ artifact_id: string; revision_id: string; revision_number: number; content_sha256: string; parent_revision_id: string | null }> {
  const artifactId = input.artifact_id ?? id("art");
  const current = input.artifact_id
    ? await db.from("artifacts")
      .select("id,current_revision_id,kind")
      .eq("id", artifactId)
      .eq("assignment_id", input.assignment_id)
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .maybeSingle()
    : { data: null, error: null };
  if (current.error) throw current.error;
  if (input.artifact_id && !current.data?.id) throw new Error("artifact_not_found_in_assignment");

  let revisionNumber = 1;
  let parentRevisionId: string | null = null;
  if (current.data?.current_revision_id) {
    const head = await db.from("artifact_revisions")
      .select("id,revision_number")
      .eq("id", current.data.current_revision_id)
      .eq("artifact_id", artifactId)
      .maybeSingle();
    if (head.error) throw head.error;
    if (!head.data?.id) throw new Error("artifact_head_revision_missing");
    parentRevisionId = String(head.data.id);
    revisionNumber = Number(head.data.revision_number) + 1;
  }

  if (!current.data?.id) {
    const inserted = await db.from("artifacts").insert({
      id: artifactId,
      assignment_id: input.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      kind: input.kind,
      mime_type: input.mime_type ?? null,
      storage_ref: input.storage_ref ?? null,
      created_run: input.created_run ?? null,
      payload: input.payload,
      validation_status: "unvalidated",
      publication_state: "draft",
    });
    if (inserted.error) throw inserted.error;
  }

  const revisionId = id("arv");
  const contentSha256 = artifactContentSha256(input.payload);
  const revision = await db.from("artifact_revisions").insert({
    id: revisionId,
    artifact_id: artifactId,
    assignment_id: input.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    revision_number: revisionNumber,
    parent_revision_id: parentRevisionId,
    payload: input.payload,
    mime_type: input.mime_type ?? null,
    storage_ref: input.storage_ref ?? null,
    content_sha256: contentSha256,
    source_manifest: input.source_manifest ?? {},
    created_run: input.created_run ?? null,
    created_by: input.created_by ?? "employee",
  });
  if (revision.error) throw revision.error;

  let update = db.from("artifacts").update({
    kind: input.kind,
    payload: input.payload,
    mime_type: input.mime_type ?? null,
    storage_ref: input.storage_ref ?? null,
    current_revision_id: revisionId,
    validation_status: "unvalidated",
    publication_state: "draft",
    publication_ref: null,
    published_at: null,
    updated_at: new Date().toISOString(),
  }).eq("id", artifactId).eq("assignment_id", input.assignment_id);
  update = parentRevisionId
    ? update.eq("current_revision_id", parentRevisionId)
    : update.is("current_revision_id", null);
  const updated = await update.select("id").maybeSingle();
  if (updated.error || !updated.data?.id) {
    await db.from("artifact_revisions").delete().eq("id", revisionId).eq("artifact_id", artifactId);
    if (updated.error) throw updated.error;
    throw new Error("artifact_revision_conflict");
  }

  return { artifact_id: artifactId, revision_id: revisionId, revision_number: revisionNumber, content_sha256: contentSha256, parent_revision_id: parentRevisionId };
}

export async function validateArtifactRevision(
  db: SupabaseClient,
  input: {
    account_id: string;
    employee_id: string;
    assignment_id: string;
    artifact_id: string;
    revision_id?: string;
    validations: Array<{ validator_key: string; status: ArtifactValidationStatus; summary: string; evidence?: Record<string, unknown> }>;
  },
): Promise<{ artifact_id: string; revision_id: string; status: "passed" | "failed" | "warning"; validation_ids: string[] }> {
  const artifact = await db.from("artifacts")
    .select("id,current_revision_id")
    .eq("id", input.artifact_id)
    .eq("assignment_id", input.assignment_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (artifact.error) throw artifact.error;
  const currentRevisionId = artifact.data?.current_revision_id ? String(artifact.data.current_revision_id) : null;
  const revisionId = input.revision_id ?? currentRevisionId;
  if (!artifact.data?.id || !revisionId || !currentRevisionId) throw new Error("artifact_revision_not_found");
  if (revisionId !== currentRevisionId) throw new Error("artifact_revision_stale");
  if (!input.validations.length) throw new Error("artifact_validations_required");

  const validationIds = input.validations.map(() => id("aval"));
  const rows = input.validations.map((validation, index) => ({
    id: validationIds[index],
    artifact_id: input.artifact_id,
    revision_id: revisionId,
    assignment_id: input.assignment_id,
    validator_key: validation.validator_key,
    status: validation.status,
    summary: validation.summary,
    evidence: validation.evidence ?? {},
  }));
  const inserted = await db.from("artifact_validations").insert(rows);
  if (inserted.error) throw inserted.error;

  const status = input.validations.some((item) => item.status === "failed")
    ? "failed"
    : input.validations.some((item) => item.status === "warning")
      ? "warning"
      : "passed";
  const updated = await db.from("artifacts").update({
    validation_status: status,
    updated_at: new Date().toISOString(),
  }).eq("id", input.artifact_id).eq("current_revision_id", revisionId).select("id").maybeSingle();
  if (updated.error || !updated.data?.id) {
    await db.from("artifact_validations").delete().in("id", validationIds);
    if (updated.error) throw updated.error;
    throw new Error("artifact_revision_stale");
  }
  return { artifact_id: input.artifact_id, revision_id: revisionId, status, validation_ids: validationIds };
}

export async function publishArtifactToSandbox(
  db: SupabaseClient,
  input: { account_id: string; employee_id: string; assignment_id: string; artifact_id: string; approval_id: string },
): Promise<{ artifact_id: string; revision_id: string; publication_ref: string; published_at: string }> {
  const artifact = await db.from("artifacts")
    .select("id,current_revision_id,validation_status")
    .eq("id", input.artifact_id)
    .eq("assignment_id", input.assignment_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (artifact.error) throw artifact.error;
  if (!artifact.data?.current_revision_id) throw new Error("artifact_revision_not_found");
  if (artifact.data.validation_status !== "passed") throw new Error("artifact_validation_not_passed");
  const revisionId = String(artifact.data.current_revision_id);
  const publishedAt = new Date().toISOString();
  const publicationRef = `sandbox://artifacts/${input.artifact_id}/revisions/${revisionId}`;
  const updated = await db.from("artifacts").update({
    publication_state: "published",
    publication_ref: publicationRef,
    published_at: publishedAt,
    updated_at: publishedAt,
  }).eq("id", input.artifact_id).eq("current_revision_id", revisionId).eq("validation_status", "passed").select("id").maybeSingle();
  if (updated.error || !updated.data?.id) {
    if (updated.error) throw updated.error;
    throw new Error("artifact_publish_head_changed");
  }
  return { artifact_id: input.artifact_id, revision_id: revisionId, publication_ref: publicationRef, published_at: publishedAt };
}

export async function verifyArtifactPublication(
  db: SupabaseClient,
  input: { account_id: string; employee_id: string; assignment_id: string; artifact_id: string; observed_ref: string },
): Promise<{ artifact_id: string; verified: true; publication_ref: string; receipt_id: string }> {
  const artifact = await db.from("artifacts")
    .select("id,current_revision_id,publication_ref,publication_state")
    .eq("id", input.artifact_id)
    .eq("assignment_id", input.assignment_id)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle();
  if (artifact.error) throw artifact.error;
  if (!artifact.data?.current_revision_id || artifact.data.publication_state !== "published") throw new Error("artifact_not_published");
  if (artifact.data.publication_ref !== input.observed_ref) throw new Error("artifact_publication_ref_mismatch");
  const receiptId = id("aval");
  const inserted = await db.from("artifact_validations").insert({
    id: receiptId,
    artifact_id: input.artifact_id,
    revision_id: artifact.data.current_revision_id,
    assignment_id: input.assignment_id,
    validator_key: "post_publish_verification",
    status: "passed",
    summary: "Published artifact was observed at the approved sandbox target.",
    evidence: { observed_ref: input.observed_ref, verified_at: new Date().toISOString() },
  });
  if (inserted.error) throw inserted.error;
  const updated = await db.from("artifacts").update({ publication_state: "verified", updated_at: new Date().toISOString() })
    .eq("id", input.artifact_id)
    .eq("current_revision_id", artifact.data.current_revision_id)
    .eq("publication_ref", input.observed_ref)
    .select("id")
    .maybeSingle();
  if (updated.error || !updated.data?.id) {
    await db.from("artifact_validations").delete().eq("id", receiptId);
    if (updated.error) throw updated.error;
    throw new Error("artifact_verification_head_changed");
  }
  return { artifact_id: input.artifact_id, verified: true, publication_ref: input.observed_ref, receipt_id: receiptId };
}

export async function loadArtifactRevisionHistory(db: SupabaseClient, artifactId: string, assignmentId: string) {
  const [revisions, validations] = await Promise.all([
    db.from("artifact_revisions").select("*").eq("artifact_id", artifactId).eq("assignment_id", assignmentId).order("revision_number", { ascending: false }),
    db.from("artifact_validations").select("*").eq("artifact_id", artifactId).eq("assignment_id", assignmentId).order("created_at", { ascending: false }),
  ]);
  if (revisions.error) throw revisions.error;
  if (validations.error) throw validations.error;
  return { revisions: revisions.data ?? [], validations: validations.data ?? [] };
}

function scalarMap(value: unknown, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (Array.isArray(value)) {
    out[prefix || "value"] = JSON.stringify(value);
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      scalarMap(item, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out[prefix || "value"] = value == null ? "" : String(value);
  return out;
}

export function artifactRevisionDiff(before: unknown, after: unknown): { before: Record<string, string>; after: Record<string, string> } {
  return { before: scalarMap(before), after: scalarMap(after) };
}
