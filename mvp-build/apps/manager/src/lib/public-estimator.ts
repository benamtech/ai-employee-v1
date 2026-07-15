import { createHash, createHmac, randomBytes } from "node:crypto";
import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { mustWrite, orThrow } from "./db.js";
import { renderArtifactHtml } from "./artifact-view.js";

const DEFAULT_SESSION_TTL_DAYS = 14;
const DEFAULT_MAX_MESSAGE_CHARS = 4000;
const DEFAULT_MESSAGE_WINDOW_MS = 10 * 60_000;
const DEFAULT_MESSAGE_LIMIT = 12;

export type PublicEstimatorEventType =
  | "started"
  | "resumed"
  | "useful_input"
  | "message_sent"
  | "message_failed"
  | "rate_limited"
  | "draft_produced"
  | "draft_revised"
  | "draft_downloaded"
  | "draft_copied"
  | "email_submitted"
  | "email_sent"
  | "email_failed"
  | "trial_intent"
  | "feedback"
  | "founder_followup_needed";

export interface PublicEstimatorSession {
  id: string;
  account_id: string;
  employee_id: string;
  visitor_token_hash: string;
  transcript_session_id: string;
  memory_session_key: string;
  status?: "active" | "expired" | "blocked";
  visitor_email?: string | null;
  expires_at: string;
  created_at?: string;
}

export interface CurrentPublicDraft {
  artifact_id: string;
  mapping_id: string;
  html: string;
  text: string;
  payload: Record<string, unknown>;
  mime_type: "text/html";
  created_at?: string | null;
}

function signingSecret(): string {
  const secret = process.env.SIGNING_SECRET;
  if (!secret || secret.length < 16) throw new Error("SIGNING_SECRET missing or too short.");
  return secret;
}

export function mintVisitorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashVisitorToken(token: string): string {
  return createHmac("sha256", signingSecret()).update(token).digest("hex");
}

export function publicHash(value: string | undefined | null): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return createHash("sha256").update(normalized).digest("hex");
}

function configuredEmployeeId(): string {
  const id = process.env.PUBLIC_ESTIMATOR_EMPLOYEE_ID;
  if (!id) throw new Error("PUBLIC_ESTIMATOR_EMPLOYEE_ID missing");
  return id;
}

function configuredAccountId(): string {
  const id = process.env.PUBLIC_ESTIMATOR_ACCOUNT_ID;
  if (!id) throw new Error("PUBLIC_ESTIMATOR_ACCOUNT_ID missing");
  return id;
}

function sessionTtlMs(): number {
  const days = Number(process.env.PUBLIC_ESTIMATOR_SESSION_TTL_DAYS ?? DEFAULT_SESSION_TTL_DAYS);
  return Math.max(1, Math.min(days, 60)) * 24 * 60 * 60 * 1000;
}

function maxMessageChars(): number {
  return Math.max(200, Math.min(Number(process.env.PUBLIC_ESTIMATOR_MAX_MESSAGE_CHARS ?? DEFAULT_MAX_MESSAGE_CHARS), 12_000));
}

function messageWindowMs(): number {
  return Math.max(60_000, Math.min(Number(process.env.PUBLIC_ESTIMATOR_MESSAGE_WINDOW_MS ?? DEFAULT_MESSAGE_WINDOW_MS), 60 * 60_000));
}

function messageLimit(): number {
  return Math.max(2, Math.min(Number(process.env.PUBLIC_ESTIMATOR_MESSAGE_LIMIT ?? DEFAULT_MESSAGE_LIMIT), 60));
}

export function publicEstimatorSessionKey(employeeId: string, visitorSessionId: string): { transcript: string; memory: string } {
  return {
    transcript: `pubest:${visitorSessionId}`,
    memory: `amtech:v1:public-estimator:employee:${employeeId}:visitor:${visitorSessionId}`,
  };
}

export async function recordPublicEstimatorEvent(
  db: SupabaseClient,
  session: Pick<PublicEstimatorSession, "id" | "account_id" | "employee_id"> | null,
  eventType: PublicEstimatorEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await mustWrite(
    db.from("public_estimator_events").insert({
      id: newId(ID_PREFIX.publicEstimatorEvent),
      visitor_session_id: session?.id ?? null,
      account_id: session?.account_id ?? null,
      employee_id: session?.employee_id ?? null,
      event_type: eventType,
      metadata,
    }),
    `public_estimator_events.${eventType}`,
  );
}

export async function createOrResumePublicEstimatorSession(
  db: SupabaseClient,
  input: { visitor_token?: string | null; ip?: string | null; user_agent?: string | null },
): Promise<{ session: PublicEstimatorSession; visitor_token: string; resumed: boolean }> {
  const employeeId = configuredEmployeeId();
  const accountId = configuredAccountId();
  const employee = orThrow(
    await db.from("employees").select("id,account_id").eq("id", employeeId).eq("account_id", accountId).maybeSingle(),
    "public_estimator.employee.lookup",
  ) as { id: string; account_id: string } | null;
  if (!employee) throw new Error("public_estimator_employee_not_found");

  const existingToken = String(input.visitor_token ?? "");
  if (existingToken) {
    const hash = hashVisitorToken(existingToken);
    const row = orThrow(
      await db.from("public_estimator_sessions").select("*").eq("visitor_token_hash", hash).maybeSingle(),
      "public_estimator.sessions.resume",
    ) as PublicEstimatorSession | null;
    if (row && row.status === "active" && new Date(row.expires_at).getTime() > Date.now()) {
      await db
        .from("public_estimator_sessions")
        .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", row.id);
      await recordPublicEstimatorEvent(db, row, "resumed");
      return { session: row, visitor_token: existingToken, resumed: true };
    }
    if (row) {
      await db.from("public_estimator_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", row.id);
    }
  }

  const visitorToken = mintVisitorToken();
  const sessionId = newId(ID_PREFIX.publicEstimatorSession);
  const keys = publicEstimatorSessionKey(employeeId, sessionId);
  const expiresAt = new Date(Date.now() + sessionTtlMs()).toISOString();
  const row: PublicEstimatorSession = {
    id: sessionId,
    account_id: accountId,
    employee_id: employeeId,
    visitor_token_hash: hashVisitorToken(visitorToken),
    transcript_session_id: keys.transcript,
    memory_session_key: keys.memory,
    expires_at: expiresAt,
  };
  await mustWrite(
    db.from("public_estimator_sessions").insert({
      ...row,
      status: "active",
      ip_hash: publicHash(input.ip),
      user_agent_hash: publicHash(input.user_agent),
    }),
    "public_estimator.sessions.insert",
  );
  await recordPublicEstimatorEvent(db, row, "started");
  return { session: row, visitor_token: visitorToken, resumed: false };
}

export async function requirePublicEstimatorSession(
  db: SupabaseClient,
  input: { visitor_session_id?: string | null; visitor_token?: string | null },
): Promise<PublicEstimatorSession | null> {
  const id = String(input.visitor_session_id ?? "");
  const token = String(input.visitor_token ?? "");
  if (!id || !token) return null;
  const hash = hashVisitorToken(token);
  const row = orThrow(
    await db
      .from("public_estimator_sessions")
      .select("*")
      .eq("id", id)
      .eq("visitor_token_hash", hash)
      .maybeSingle(),
    "public_estimator.sessions.require",
  ) as PublicEstimatorSession | null;
  if (!row || row.status !== "active") return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.from("public_estimator_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", row.id);
    return null;
  }
  await db.from("public_estimator_sessions").update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
  return row;
}

export async function validatePublicEstimatorMessage(
  db: SupabaseClient,
  session: PublicEstimatorSession,
  raw: unknown,
): Promise<{ ok: true; message: string } | { ok: false; error: "message_required" | "message_too_long" | "rate_limited" }> {
  const message = String(raw ?? "").trim();
  if (!message) return { ok: false, error: "message_required" };
  if (message.length > maxMessageChars()) return { ok: false, error: "message_too_long" };

  const since = new Date(Date.now() - messageWindowMs()).toISOString();
  const recent = orThrow(
    await db
      .from("public_estimator_messages")
      .select("id")
      .eq("visitor_session_id", session.id)
      .eq("direction", "visitor")
      .gte("created_at", since),
    "public_estimator.messages.rate_lookup",
  ) as Array<{ id: string }> | null;
  if ((recent ?? []).length >= messageLimit()) {
    await recordPublicEstimatorEvent(db, session, "rate_limited", { window_ms: messageWindowMs(), limit: messageLimit() });
    return { ok: false, error: "rate_limited" };
  }
  return { ok: true, message };
}

export async function recordPublicEstimatorMessage(
  db: SupabaseClient,
  session: PublicEstimatorSession,
  input: {
    direction: "visitor" | "employee" | "system";
    body: string;
    status?: "received" | "delivered" | "queued" | "failed" | "recorded";
    turn_job_id?: string | null;
    work_run_id?: string | null;
    external_run_id?: string | null;
  },
): Promise<void> {
  await mustWrite(
    db.from("public_estimator_messages").insert({
      id: newId(ID_PREFIX.message),
      visitor_session_id: session.id,
      account_id: session.account_id,
      employee_id: session.employee_id,
      direction: input.direction,
      body: input.body,
      status: input.status ?? "recorded",
      turn_job_id: input.turn_job_id ?? null,
      work_run_id: input.work_run_id ?? null,
      external_run_id: input.external_run_id ?? null,
    }),
    "public_estimator.messages.insert",
  );
}

export async function mapPublicEstimatorArtifacts(
  db: SupabaseClient,
  session: PublicEstimatorSession,
  input: { since: string; run_id?: string | null },
): Promise<string[]> {
  const rows = orThrow(
    await db
      .from("artifacts")
      .select("*")
      .eq("account_id", session.account_id)
      .eq("employee_id", session.employee_id)
      .eq("kind", "estimate")
      .gte("created_at", input.since)
      .order("created_at", { ascending: false })
      .limit(10),
    "public_estimator.artifacts.discover",
  ) as Array<{ id: string; created_run?: string | null }> | null;
  const candidates = (rows ?? []).filter((row) => !input.run_id || !row.created_run || row.created_run === input.run_id);
  const mapped: string[] = [];
  for (const artifact of candidates.reverse()) {
    await db
      .from("public_estimator_artifacts")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("visitor_session_id", session.id)
      .eq("status", "current");
    const insert = await db.from("public_estimator_artifacts").insert({
      id: newId(ID_PREFIX.publicEstimatorArtifact),
      visitor_session_id: session.id,
      account_id: session.account_id,
      employee_id: session.employee_id,
      artifact_id: artifact.id,
      status: "current",
      source_run_id: input.run_id ?? artifact.created_run ?? null,
    });
    if (!insert.error) mapped.push(artifact.id);
  }
  if (mapped.length) {
    await recordPublicEstimatorEvent(db, session, mapped.length > 1 ? "draft_revised" : "draft_produced", {
      artifact_ids: mapped,
    });
  }
  return mapped;
}

export function artifactPayloadText(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  const visit = (key: string, value: unknown, depth = 0) => {
    if (value == null || value === "") return;
    const label = key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const indent = "  ".repeat(depth);
    if (Array.isArray(value)) {
      lines.push(`${indent}${label}:`);
      value.forEach((item, idx) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          lines.push(`${indent}- Item ${idx + 1}`);
          Object.entries(item as Record<string, unknown>).forEach(([k, v]) => visit(k, v, depth + 1));
        } else {
          lines.push(`${indent}- ${String(item)}`);
        }
      });
    } else if (typeof value === "object") {
      lines.push(`${indent}${label}:`);
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => visit(k, v, depth + 1));
    } else {
      lines.push(`${indent}${label}: ${String(value)}`);
    }
  };
  Object.entries(payload).forEach(([k, v]) => visit(k, v));
  return lines.join("\n").trim();
}

export async function getCurrentPublicEstimatorDraft(
  db: SupabaseClient,
  session: PublicEstimatorSession,
): Promise<CurrentPublicDraft | null> {
  const mapping = orThrow(
    await db
      .from("public_estimator_artifacts")
      .select("*")
      .eq("visitor_session_id", session.id)
      .eq("status", "current")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "public_estimator.current_mapping",
  ) as { id: string; artifact_id: string; created_at?: string | null } | null;
  if (!mapping) return null;
  const artifact = orThrow(
    await db
      .from("artifacts")
      .select("*")
      .eq("id", mapping.artifact_id)
      .eq("account_id", session.account_id)
      .eq("employee_id", session.employee_id)
      .maybeSingle(),
    "public_estimator.current_artifact",
  ) as { id: string; payload?: unknown; kind?: string | null; created_at?: string | null } | null;
  if (!artifact || !artifact.payload || typeof artifact.payload !== "object" || Array.isArray(artifact.payload)) return null;
  const html = renderArtifactHtml(artifact);
  if (!html) return null;
  const payload = artifact.payload as Record<string, unknown>;
  return {
    artifact_id: artifact.id,
    mapping_id: mapping.id,
    html,
    text: artifactPayloadText(payload),
    payload,
    mime_type: "text/html",
    created_at: artifact.created_at ?? mapping.created_at ?? null,
  };
}

export function normalizeVisitorEmail(value: unknown): string | null {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function saveVisitorEmail(db: SupabaseClient, session: PublicEstimatorSession, email: string): Promise<void> {
  await mustWrite(
    db.from("public_estimator_sessions").update({ visitor_email: email, updated_at: new Date().toISOString() }).eq("id", session.id),
    "public_estimator.sessions.email",
  );
  session.visitor_email = email;
}
