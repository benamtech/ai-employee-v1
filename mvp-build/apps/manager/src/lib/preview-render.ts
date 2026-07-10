/**
 * Build a `WorkResource` — the owner-safe, surface-agnostic rendering of one unit
 * of employee work — from the SAME read model the web desk uses
 * (`buildEmployeeSnapshot`), so a signed mobile preview can never drift from
 * `/resources`. Generic renderer tiers only (document/table/media/structured/text);
 * no bespoke connector UI, and no tier relaxes an approval gate.
 */
import type { SupabaseClient } from "@amtech/db";
import {
  defaultActionsFor,
  type PreviewResourceType,
  type WorkAction,
  type WorkResource,
  type WorkResourceField,
} from "@amtech/shared";
import { buildEmployeeSnapshot } from "./employee-stream.js";
import { renderArtifactHtml } from "./artifact-view.js";
import { createArtifactStorageSignedUrl } from "./artifacts.js";
import { orThrow } from "./db.js";

const VIEW_ONLY: WorkAction[] = [{ action: "view", label: "Open", style: "default" }];

function money(cents?: number | string | null): string | undefined {
  const n = typeof cents === "string" ? Number(cents) : cents;
  if (n == null || !Number.isFinite(n)) return undefined;
  return `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function riskOf(level?: string | null): WorkResource["risk"] {
  const v = String(level ?? "").toLowerCase();
  return v === "low" || v === "medium" || v === "high" ? v : undefined;
}

function fieldsFrom(obj: Record<string, unknown> | undefined, keys: string[]): WorkResourceField[] {
  if (!obj) return [];
  const out: WorkResourceField[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (v == null || v === "") continue;
    out.push({ label: k.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), value: String(v) });
  }
  return out;
}

export interface BuildWorkResourceInput {
  employee_id: string;
  account_id: string;
  resource_type: PreviewResourceType;
  resource_id: string;
}

/** Returns null when the resource does not exist / is not owned by the account. */
export async function buildWorkResource(
  db: SupabaseClient,
  input: BuildWorkResourceInput,
): Promise<WorkResource | null> {
  const { employee_id, account_id, resource_type, resource_id } = input;

  // Artifacts are rendered from the artifact row itself (the snapshot's outputs are
  // derived from it) so we get the full payload/storage_ref and stay kind-agnostic.
  if (resource_type === "artifact") {
    const artifact = orThrow(
      await db.from("artifacts").select("*").eq("id", resource_id).eq("employee_id", employee_id).eq("account_id", account_id).maybeSingle(),
      "preview.artifact.lookup",
    ) as { id: string; kind?: string; mime_type?: string | null; storage_ref?: string | null; payload?: Record<string, unknown> | null; created_at?: string | null } | null;
    if (!artifact) return null;
    const title = artifactTitle(artifact);
    const isMedia = typeof artifact.mime_type === "string" && (artifact.mime_type.startsWith("image/") || artifact.mime_type.startsWith("video/"));
    if (artifact.storage_ref) {
      const url = await createArtifactStorageSignedUrl(db, String(artifact.storage_ref));
      return {
        resource_type,
        resource_id,
        title,
        subtitle: humanKind(artifact.kind),
        body_kind: isMedia ? "media" : "document",
        media: isMedia ? { url, kind: artifact.mime_type?.startsWith("video/") ? "video" : "image" } : undefined,
        // A stored document/file opens via the signed URL; `open_url` powers the view action.
        open_url: url,
        actions: [{ action: "view", label: isMedia ? "Open" : "Open document", style: "primary" }, { action: "respond", label: "Reply", style: "default" }],
      };
    }
    const body_html = renderArtifactHtml(artifact) ?? undefined;
    return {
      resource_type,
      resource_id,
      title,
      subtitle: humanKind(artifact.kind),
      body_kind: "document",
      body_html,
      actions: [{ action: "respond", label: "Reply", style: "default" }, { action: "acknowledge", label: "Got it", style: "default" }],
    };
  }

  // Everything else renders from the same snapshot the web desk consumes.
  const snapshot = await buildEmployeeSnapshot(db, employee_id, account_id);

  if (resource_type === "approval") {
    const a = snapshot.approvals.find((x) => x.id === resource_id);
    if (!a) {
      // Resolved/expired approvals drop out of the pending snapshot; look it up so
      // an opened link shows a calm "already handled" state rather than 404.
      const resolved = orThrow(
        await db.from("approvals").select("id,action_key,summary,risk_level,refs,resolution,expires_at").eq("id", resource_id).eq("employee_id", employee_id).eq("account_id", account_id).maybeSingle(),
        "preview.approval.lookup",
      ) as { id: string; action_key?: string; summary?: string; risk_level?: string; refs?: Record<string, unknown>; resolution?: string | null } | null;
      if (!resolved) return null;
      return {
        resource_type,
        resource_id,
        title: "Decision already handled",
        subtitle: humanKind(resolved.action_key),
        summary: resolved.summary ?? undefined,
        risk: riskOf(resolved.risk_level),
        expired: true,
        actions: VIEW_ONLY,
      };
    }
    const amount = money((a.refs as Record<string, unknown> | undefined)?.amount_cents as string | number | undefined);
    return {
      resource_type,
      resource_id,
      title: "Needs your decision",
      subtitle: humanKind(a.action_key),
      summary: a.summary,
      amount,
      recipient: (a.refs?.recipient as string | undefined) ?? (a.refs?.customer_name as string | undefined),
      risk: riskOf(a.risk_level),
      body_kind: "structured",
      fields: fieldsFrom(a.refs as Record<string, unknown> | undefined, ["customer_name", "recipient", "job_description", "action_key"]),
      actions: defaultActionsFor("approval"),
    };
  }

  if (resource_type === "task") {
    const t = (snapshot.tasks ?? []).find((x) => x.target_id === resource_id || x.id === resource_id);
    if (!t) return null;
    return {
      resource_type,
      resource_id,
      title: t.title,
      subtitle: humanKind(t.type),
      summary: t.summary,
      body_kind: "text",
      actions: t.type === "approval" || t.type === "question" ? defaultActionsFor("approval") : defaultActionsFor("task"),
    };
  }

  if (resource_type === "connector") {
    const c = snapshot.connectors.find((x) => x.id === resource_id);
    if (!c) return null;
    return {
      resource_type,
      resource_id,
      title: `${humanKind(c.provider || c.connector_key)} needs attention`,
      subtitle: humanKind(c.connector_key),
      summary: c.last_error ?? "Reconnect or test this connection.",
      body_kind: "text",
      actions: defaultActionsFor("connector"),
    };
  }

  if (resource_type === "job") {
    const j = snapshot.job_commitments.find((x) => x.id === resource_id);
    if (!j) return null;
    return {
      resource_type,
      resource_id,
      title: j.customer_ref ? `Job for ${j.customer_ref}` : "Job",
      summary: j.notes ?? j.start_window ?? undefined,
      body_kind: "structured",
      fields: fieldsFrom(j as unknown as Record<string, unknown>, ["customer_ref", "start_at", "start_window", "notes"]),
      actions: defaultActionsFor("job"),
    };
  }

  // work_event
  const e = (snapshot.work_events ?? []).find((x) => x.id === resource_id);
  if (!e) return null;
  const d = e.work_event_descriptor;
  return {
    resource_type,
    resource_id,
    title: d?.title ?? e.event_type,
    summary: d?.summary,
    amount: money(d?.deliverable?.money?.amount_cents),
    body_kind: "text",
    actions: defaultActionsFor("work_event", d?.deliverable),
  };
}

function humanKind(kind?: string | null): string {
  return String(kind ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function artifactTitle(row: { kind?: string | null; payload?: Record<string, unknown> | null }): string {
  const kind = humanKind(row.kind) || "Output";
  const customer = row.payload?.customer_name as string | undefined;
  return customer ? `${kind} for ${customer}` : kind;
}
