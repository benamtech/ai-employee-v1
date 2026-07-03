import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";

const DEFAULT_ARTIFACT_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_STORAGE_SIGNED_URL_TTL_SECONDS = 5 * 60;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function artifactBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET ?? "artifacts";
}

export function artifactLinkTtlSeconds(input?: number): number {
  if (!input || !Number.isFinite(input)) return DEFAULT_ARTIFACT_LINK_TTL_SECONDS;
  return Math.max(60, Math.min(Math.floor(input), 30 * 24 * 60 * 60));
}

export function storageSignedUrlTtlSeconds(): number {
  const configured = Number(process.env.ARTIFACT_STORAGE_SIGNED_URL_SECONDS ?? DEFAULT_STORAGE_SIGNED_URL_TTL_SECONDS);
  return Math.max(60, Math.min(configured, 60 * 60));
}

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed || "estimate"}.pdf`;
}

export function decodePdfBase64(pdf_base64: string, expectedSha256?: string): Buffer {
  const data = Buffer.from(pdf_base64, "base64");
  if (!data.length || data.length > MAX_PDF_BYTES) {
    throw new Error("pdf_size_invalid");
  }
  if (data.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("pdf_header_invalid");
  }
  const sha256 = createHash("sha256").update(data).digest("hex");
  if (expectedSha256 && expectedSha256 !== sha256) {
    throw new Error("pdf_checksum_mismatch");
  }
  return data;
}

export function artifactStoragePath(input: {
  account_id: string;
  employee_id: string;
  artifact_id: string;
  filename: string;
}): string {
  return [
    "accounts",
    input.account_id,
    "employees",
    input.employee_id,
    "artifacts",
    input.artifact_id,
    sanitizeFilename(input.filename),
  ].join("/");
}

export async function uploadArtifactPdf(
  db: SupabaseClient,
  storagePath: string,
  data: Buffer,
): Promise<void> {
  const { error } = await db.storage.from(artifactBucket()).upload(storagePath, data, {
    cacheControl: "3600",
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

export async function createArtifactStorageSignedUrl(
  db: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await db.storage
    .from(artifactBucket())
    .createSignedUrl(storagePath, storageSignedUrlTtlSeconds());
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "storage_signed_url_failed");
  return data.signedUrl;
}

/** Download a stored artifact PDF as bytes (used to attach to Gmail sends). */
export async function downloadArtifactPdf(
  db: SupabaseClient,
  storagePath: string,
): Promise<Buffer> {
  const { data, error } = await db.storage.from(artifactBucket()).download(storagePath);
  if (error || !data) throw new Error(error?.message ?? "storage_download_failed");
  const arrayBuffer = await (data as Blob).arrayBuffer();
  return Buffer.from(arrayBuffer);
}
