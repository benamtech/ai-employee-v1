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
  resolveOwnerOAuthConnectorSetup,
  type PreviewResourceType,
  type WorkAction,
  type WorkDeliverableDescriptor,
  type WorkResource,
  type WorkResourceField,
} from "@amtech/shared";
import { buildEmployeeSnapshotStrict as buildEmployeeSnapshot } from "./employee-stream-strict.js";
import { renderArtifactHtml } from "./artifact-view.js";
import { createArtifactStorageSignedUrl } from "./artifacts.js";
import { artifactRevisionDiff } from "./artifact-revisions.js";
import { compileDeliverableUiResource } from "./ui-resources.js";
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

function shortHash(value: unknown): string | null {
  const hash = typeof value === "string" ? value.replace(/^sha256:/, "") : "";
  return /^[a-f0-9]{64}$/.test(hash) ? `${hash.slice(0, 12)}…` : null;
}

function connectorConsentPath(employeeId: string, resourceId: string, provider?: string | null, connectorKey?: string | null): string | null {
  const setup = resolveOwnerOAuthConnectorSetup(provider ?? connectorKey ?? "");
  if (!setup) return null;
  const returnTo = `/agent/${encodeURIComponent(employeeId)}#work-${encodeURIComponent(resourceId)}`;
  return `/agent/${encodeURIComponent(employeeId)}/connect/${encodeURIComponent(setup.key)}?returnTo=${encodeURIComponent(returnTo)}`;
}

export interface BuildWorkResourceInput {
  employee_id: string;
  account_id: string;
  resource_type: PreviewResourceType;
  resource_id: string;
}

interface ArtifactPreviewRow {
  id: string;
  assignment_id?: string | null;
  kind?: string;
  mime_type?: string | null;
  storage_ref?: string | null;
  payload?: Record<string, unknown> | null;
  current_revision_id?: string | null;
  validation_status?: string | null;
  publication_state?: string | null;
  publication_ref?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ArtifactRevisionPreviewRow {
  id: string;
  revision_number: number;
  parent_revision_id?: string | null;
  payload?: Record<string, unknown> | null;
  content_sha256?: string | null;
  created_at?: string | null;
}

/** Returns null when the resource does not exist / is not owned by the account. */
export async function buildWorkResource(
  db: SupabaseClient,
  input: BuildWorkResourceInput,
): Promise<WorkResource | null> {
  const { employee_id, account_id, resource_type, resource_id } = input;

  // Artifacts remain one canonical row, enriched by immutable revision, validation,
  // approval, effect, publication, and verification evidence.
  if (resource_type === "artifact") {
    const artifact = orThrow(
      await db.from("artifacts").select("*").eq("id", resource_id).eq("employee_id", employee_id).eq("account_id", account_id).maybeSingle(),
      "preview.artifact.lookup",
    ) as ArtifactPreviewRow | null;
    if (!artifact) return null;
    const title = artifactTitle(artifact);
    const isMedia = typeof artifact.mime_type === "string" && (artifact.mime_type.startsWith("image/") || artifact.mime_type.startsWith("video/"));

    const current = artifact.current_revision_id
      ? orThrow(
        await db.from("artifact_revisions")
          .select("id,revision_number,parent_revision_id,payload,content_sha256,created_at")
          .eq("id", artifact.current_revision_id)
          .eq("artifact_id", artifact.id)
          .maybeSingle(),
        "preview.artifact.current_revision",
      ) as ArtifactRevisionPreviewRow | null
      : null;
    const previous = current?.parent_revision_id
      ? orThrow(
        await db.from("artifact_revisions")
          .select("id,revision_number,parent_revision_id,payload,content_sha256,created_at")
          .eq("id", current.parent_revision_id)
          .eq("artifact_id", artifact.id)
          .maybeSingle(),
        "preview.artifact.previous_revision",
      ) as ArtifactRevisionPreviewRow | null
      : null;
    const validations = current
      ? orThrow(
        await db.from("artifact_validations")
          .select("validator_key,status,summary,created_at")
          .eq("artifact_id", artifact.id)
          .eq("revision_id", current.id)
          .order("created_at", { ascending: false }),
        "preview.artifact.validations",
      ) as Array<{ validator_key?: string; status?: string; summary?: string; created_at?: string }>
      : [];
    const approval = artifact.assignment_id
      ? orThrow(
        await db.from("approvals")
          .select("id,status,resolution,snapshot_hash,execution_state,execution_receipt_id,resolved_at,created_at")
          .eq("assignment_id", artifact.assignment_id)
          .eq("resource_class", "artifact")
          .eq("resource_id", artifact.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        "preview.artifact.approval",
      ) as Record<string, unknown> | null
      : null;

    const revisionHash = shortHash(current?.content_sha256);
    const approvalHash = shortHash(approval?.snapshot_hash);
    const fields: WorkResourceField[] = [
      ...(current ? [{ label: "Revision", value: `#${current.revision_number}` }] : []),
      ...(revisionHash ? [{ label: "Revision SHA-256", value: revisionHash }] : []),
      ...(artifact.validation_status ? [{ label: "Validation", value: humanKind(artifact.validation_status) }] : []),
      ...(artifact.publication_state ? [{ label: "Publication", value: humanKind(artifact.publication_state) }] : []),
    ];
    const receipts: WorkResourceField[] = [
      ...(approvalHash ? [{ label: "Approval snapshot", value: approvalHash }] : []),
      ...(approval?.execution_receipt_id ? [{ label: "Effect receipt", value: String(approval.execution_receipt_id) }] : []),
      ...(artifact.publication_ref ? [{ label: "Sandbox publication", value: artifact.publication_ref }] : []),
      ...validations.slice(0, 6).map((item) => ({
        label: humanKind(item.validator_key) || "Validation",
        value: `${humanKind(item.status)}${item.summary ? ` · ${item.summary}` : ""}`,
      })),
    ];
    const diff = current && previous
      ? artifactRevisionDiff(previous.payload ?? {}, current.payload ?? {})
      : null;
    const deliverable: WorkDeliverableDescriptor | null = diff
      ? {
        type: artifact.kind === "bookkeeping_review_packet" ? "dataset_report" : artifact.kind === "contractor_office_packet" ? "job_folder" : "document",
        title,
        refs: { artifact_id: artifact.id, revision_id: current?.id ?? "" },
        leaves_business: false,
        reversible: true,
        acceptance: ["respond"],
        view: { kind: "diff", before: diff.before, after: diff.after },
      }
      : null;
    const ui_resource = deliverable ? compileDeliverableUiResource(deliverable) : undefined;
    const common = {
      resource_type,
      resource_id,
      assignment_id: artifact.assignment_id ?? null,
      title,
      subtitle: humanKind(artifact.kind),
      summary: current && previous ? `Revision ${current.revision_number} compared with revision ${previous.revision_number}.` : undefined,
      fields,
      receipts,
      ui_resource,
    } satisfies Partial<WorkResource>;

    if (artifact.storage_ref) {
      const url = await createArtifactStorageSignedUrl(db, String(artifact.storage_ref));
      return {
        ...common,
        resource_type,
        resource_id,
        title,
        body_kind: isMedia ? "media" : "document",
        media: isMedia ? { url, kind: artifact.mime_type?.startsWith("video/") ? "video" : "image" } : undefined,
        open_url: url,
        actions: [{ action: "view", label: isMedia ? "Open" : "Open document", style: "primary" }, { action: "respond", label: "Reply", style: "default" }],
      };
    }
    const body_html = renderArtifactHtml({ ...artifact, payload: current?.payload ?? artifact.payload }) ?? undefined;
    return {
      ...common,
      resource_type,
      resource_id,
      title,
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
    const openUrl = connectorConsentPath(employee_id, resource_id, c.provider, c.connector_key);
    return {
      resource_type,
      resource_id,
      title: `${humanKind(c.provider || c.connector_key)} needs attention`,
      subtitle: humanKind(c.connector_key),
      summary: c.last_error ?? "Reconnect or test this connection.",
      body_kind: "text",
      open_url: openUrl ?? undefined,
      actions: openUrl
        ? [{ action: "view", label: c.status === "connected" ? "Reconnect" : "Connect", style: "primary" }, { action: "respond", label: "Ask a question", style: "default" }]
        : defaultActionsFor("connector"),
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
  const project = row.payload?.project;
  if (project && typeof project === "object" && typeof (project as Record<string, unknown>).title === "string") {
    return String((project as Record<string, unknown>).title);
  }
  const kind = humanKind(row.kind) || "Output";
  const customer = row.payload?.customer_name as string | undefined;
  return customer ? `${kind} for ${customer}` : kind;
}
