import {
  ID_PREFIX,
  defaultActionsFor,
  newId,
  workDeliverableNeedsGate,
  type MaterializedWork,
  type ProofEnvelope,
  type SafetyEnvelope,
  type SurfaceEnvelope,
  type WorkAction,
  type WorkResource,
} from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import { abilitiesFromCapabilities, buildCapabilityRegistry } from "./capability-registry.js";

function baseSafety(input: Partial<SafetyEnvelope> = {}): SafetyEnvelope {
  return {
    trust_level: input.trust_level ?? "derived",
    owner_safe: true,
    redacted: input.redacted ?? true,
    requires_approval: input.requires_approval ?? false,
    leaves_business: input.leaves_business ?? false,
    money_involved: input.money_involved ?? false,
  };
}

function envelope(input: Omit<SurfaceEnvelope, "id"> & { id?: string }): SurfaceEnvelope {
  return { ...input, id: input.id ?? newId(ID_PREFIX.surfaceEnvelope) };
}

function proof(source_table: string, source_id?: string | null, extra: Partial<ProofEnvelope> = {}): ProofEnvelope {
  return { source_table, source_id: source_id ?? undefined, ...extra };
}

function humanKind(value?: string | null): string {
  return String(value ?? "")
    .replace(/[_:-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function money(cents?: number | string | null): string | undefined {
  const n = typeof cents === "string" ? Number(cents) : cents;
  if (n == null || !Number.isFinite(n)) return undefined;
  return `$${(n / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function workResourceFromEnvelope(e: SurfaceEnvelope): WorkResource | null {
  if (e.resource) return e.resource;
  if (e.kind === "artifact") {
    return {
      resource_type: "artifact",
      resource_id: e.proof.artifact_id ?? e.proof.source_id ?? e.id,
      title: e.title,
      summary: e.summary,
      body_kind: e.render_hints.body_kind ?? "document",
      actions: e.actions ?? defaultActionsFor("artifact"),
    };
  }
  if (e.kind === "approval") {
    return {
      resource_type: "approval",
      resource_id: e.proof.approval_id ?? e.proof.source_id ?? e.id,
      title: e.title,
      summary: e.summary,
      risk: e.safety.money_involved || e.safety.leaves_business ? "high" : undefined,
      body_kind: "structured",
      actions: e.actions ?? defaultActionsFor("approval"),
    };
  }
  if (e.kind === "connector") {
    return {
      resource_type: "connector",
      resource_id: e.proof.source_id ?? e.id,
      title: e.title,
      summary: e.summary,
      body_kind: "text",
      actions: e.actions ?? defaultActionsFor("connector"),
    };
  }
  if (e.kind === "work_event" || e.kind === "tool_activity") {
    return {
      resource_type: "work_event",
      resource_id: e.proof.inbound_event_id ?? e.proof.source_id ?? e.id,
      title: e.title,
      summary: e.summary,
      body_kind: e.render_hints.body_kind ?? "text",
      actions: e.actions ?? defaultActionsFor("work_event"),
    };
  }
  return null;
}

function normalizeOwnerTasks(snapshot: EmployeeSnapshot): NonNullable<EmployeeSnapshot["tasks"]> {
  const quietObserveTaskIds = new Set(
    snapshot.work_events
      .filter((event) => event.work_event_descriptor?.move === "observe")
      .map((event) => `work:${event.id}`),
  );
  return (snapshot.tasks ?? []).filter((task) => !quietObserveTaskIds.has(task.id));
}

export function materializeEmployeeSnapshot(snapshot: EmployeeSnapshot): MaterializedWork {
  // `buildEmployeeSnapshot` derives resurfacing immediately after materialization.
  // Normalize the shared read model here so quiet observation remains durable and
  // visible as a system change without becoming false active work or an obligation.
  const ownerTasks = normalizeOwnerTasks(snapshot);
  snapshot.tasks = ownerTasks;

  const capabilities = buildCapabilityRegistry(snapshot);
  const envelopes: SurfaceEnvelope[] = [];

  for (const artifact of snapshot.artifacts) {
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "artifact",
      title: artifact.payload?.customer_name ? `${humanKind(artifact.kind)} for ${artifact.payload.customer_name}` : humanKind(artifact.kind) || "Artifact",
      summary: artifact.payload?.job_description,
      status: artifact.storage_ref ? "ready" : "draft",
      created_at: artifact.created_at,
      render_hints: { tier: "generic", body_kind: "document", component: "artifact" },
      safety: baseSafety({ trust_level: "native_manager" }),
      proof: proof("artifacts", artifact.id, { artifact_id: artifact.id }),
      actions: defaultActionsFor("artifact"),
    }));
  }

  for (const approval of snapshot.approvals) {
    const refs = approval.refs ?? {};
    const moneyInvolved = Boolean(refs.amount_cents || approval.action_key.includes("invoice") || approval.action_key.includes("deposit"));
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "approval",
      title: "Decision needed",
      summary: approval.summary,
      status: "pending",
      created_at: approval.expires_at ?? null,
      render_hints: { tier: "native_card", component: "approval", priority: "high", body_kind: "structured" },
      safety: baseSafety({ trust_level: "native_manager", requires_approval: true, leaves_business: true, money_involved: moneyInvolved }),
      proof: proof("approvals", approval.id, { approval_id: approval.id }),
      actions: defaultActionsFor("approval").map((a) => ({ ...a, gated: a.action === "approve" || a.action === "reject" })),
      resource: {
        resource_type: "approval",
        resource_id: approval.id,
        title: "Needs your decision",
        subtitle: humanKind(approval.action_key),
        summary: approval.summary,
        amount: money(refs.amount_cents),
        recipient: refs.recipient ?? refs.customer_name,
        risk: approval.risk_level === "low" || approval.risk_level === "medium" || approval.risk_level === "high" ? approval.risk_level : undefined,
        body_kind: "structured",
        actions: defaultActionsFor("approval"),
      },
    }));
  }

  for (const message of snapshot.messages) {
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "message",
      title: message.direction === "to_owner" ? "Employee message" : "Owner message",
      summary: message.body,
      status: message.status,
      created_at: message.created_at,
      render_hints: { tier: "native_card", component: "message", body_kind: "text" },
      safety: baseSafety({ trust_level: "native_manager", redacted: true }),
      proof: proof("employee_messages", message.id, { delivery_decision_id: message.provider_id ?? null }),
      actions: [{ action: "respond", label: "Reply", style: "default" }],
    }));
  }

  for (const connector of snapshot.connectors) {
    const needsAttention = !["connected", "active", "ok"].includes(String(connector.status).toLowerCase());
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "connector",
      title: `${humanKind(connector.provider || connector.connector_key)} ${needsAttention ? "needs attention" : "connected"}`,
      summary: connector.last_error ?? connector.external_email ?? undefined,
      status: connector.status,
      render_hints: { tier: "native_card", component: "connector", body_kind: "text", priority: needsAttention ? "high" : "normal" },
      safety: baseSafety({ trust_level: "connector", redacted: true }),
      proof: proof("connector_accounts", connector.id),
      actions: defaultActionsFor("connector"),
    }));
  }

  for (const invoice of snapshot.stripe_invoices) {
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "invoice",
      title: invoice.deposit_amount ? `Deposit invoice ${money(invoice.deposit_amount)}` : "Deposit invoice",
      summary: invoice.stripe_invoice_id ? "Stripe invoice is tracked." : undefined,
      status: invoice.status,
      render_hints: { tier: "native_card", component: "invoice", body_kind: "structured" },
      safety: baseSafety({ trust_level: "connector", money_involved: true, requires_approval: invoice.status === "draft" }),
      proof: proof("stripe_invoices", invoice.id, { artifact_id: invoice.estimate_id ?? null }),
      actions: invoice.hosted_invoice_url ? [{ action: "view", label: "Open", style: "primary" }] : [{ action: "respond", label: "Reply", style: "default" }],
    }));
  }

  for (const reminder of snapshot.reminders) {
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "reminder",
      title: reminder.message ?? "Scheduled reminder",
      summary: reminder.scheduled_at ? `Scheduled for ${reminder.scheduled_at}` : undefined,
      status: reminder.status,
      created_at: reminder.scheduled_at,
      render_hints: { tier: "generic", component: "reminder", body_kind: "text" },
      safety: baseSafety({ trust_level: "native_manager" }),
      proof: proof("reminders", reminder.id, { delivery_decision_id: reminder.provider_id ?? null }),
      actions: [{ action: "acknowledge", label: "Got it", style: "default" }],
    }));
  }

  for (const event of snapshot.work_events) {
    const d = event.work_event_descriptor;
    const deliverable = d?.deliverable;
    const isTool = deliverable?.type === "tool_activity";
    const uiResource = deliverable?.ui_resource;
    const approvalId = deliverable?.refs.approval_id;
    const resourceType: WorkResource["resource_type"] = approvalId ? "approval" : "work_event";
    const actions = approvalId
      ? defaultActionsFor("approval", deliverable)
      : defaultActionsFor("work_event", deliverable).filter((action) => action.action === "respond" || action.action === "acknowledge");
    const bodyKind: WorkResource["body_kind"] = uiResource ? "structured" : "text";
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      assignment_id: snapshot.assignment_id,
      employee_id: snapshot.employee_id,
      kind: isTool ? "tool_activity" : "work_event",
      title: d?.title ?? event.event_type,
      summary: d?.summary,
      status: event.status,
      created_at: event.created_at,
      render_hints: { tier: uiResource ? "mcp_ui" : "generic", component: isTool ? "tool_activity" : "work_event", body_kind: bodyKind },
      safety: baseSafety({
        trust_level: isTool ? "manager_mcp" : "runtime",
        requires_approval: workDeliverableNeedsGate(deliverable),
        leaves_business: deliverable?.leaves_business ?? false,
        money_involved: deliverable?.money?.involved ?? false,
      }),
      proof: proof("inbound_events", event.id, {
        assignment_id: snapshot.assignment_id,
        inbound_event_id: event.id,
        approval_id: approvalId ?? null,
        artifact_id: deliverable?.refs.artifact_id ?? null,
        run_id: d?.proof?.run_id ?? null,
      }),
      actions,
      resource: {
        resource_type: resourceType,
        resource_id: approvalId ?? event.id,
        assignment_id: snapshot.assignment_id,
        title: d?.title ?? event.event_type,
        subtitle: deliverable?.type ? humanKind(deliverable.type) : undefined,
        summary: d?.summary,
        risk: workDeliverableNeedsGate(deliverable)
          ? deliverable?.money?.involved ? "high" : "medium"
          : "low",
        body_kind: bodyKind,
        ui_resource: uiResource,
        actions,
      },
    }));
  }

  const runtime = snapshot.runtime_health;
  if (runtime) {
    envelopes.push(envelope({
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      kind: "runtime_health",
      title: "Runtime health",
      summary: runtime.message,
      status: runtime.status,
      created_at: runtime.checked_at ?? null,
      render_hints: { tier: "native_card", component: "runtime_health", priority: runtime.status === "healthy" ? "low" : "high", body_kind: "structured" },
      safety: baseSafety({ trust_level: "native_manager" }),
      proof: proof("runtime_health_checks", runtime.checked_at ?? "latest"),
      actions: [{ action: "acknowledge", label: "Got it", style: "default" }],
    }));
  }

  const work_resources = envelopes.flatMap((e) => {
    const resource = workResourceFromEnvelope(e);
    return resource ? [resource] : [];
  });
  const work_actions: WorkAction[] = envelopes.flatMap((e) => e.actions ?? []).filter((a, idx, all) =>
    all.findIndex((b) => b.action === a.action && b.label === a.label && b.gated === a.gated) === idx,
  );

  return {
    capabilities,
    surface_envelopes: envelopes,
    work_resources,
    work_actions,
    abilities: abilitiesFromCapabilities(capabilities),
    outputs: snapshot.outputs ?? [],
    tasks: ownerTasks,
  };
}
