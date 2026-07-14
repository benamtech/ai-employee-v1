import type { ResourcePayload, WorkEventRow } from "./surface-types";
import type { CapabilityGraphNode, SurfaceEnvelope, WorkResource } from "@amtech/shared";

const now = "2026-07-14T14:30:00Z";
const accountId = "acct_avery_home_fixture";

export function fixtureResourcePayload(employeeId: string): ResourcePayload {
  if (employeeId.includes("new")) return firstRunEmployee(employeeId);

  const resources = workResources(employeeId);
  const workEvents = eventRows(employeeId, resources);
  const envelopes = surfaceEnvelopes(employeeId, resources);
  const capabilities = capabilityGraph(employeeId);

  const payload: ResourcePayload = {
    account_id: accountId,
    employee_id: employeeId,
    employee: {
      id: employeeId,
      name: "Avery",
      status: "working",
      profile_id: "service_business_operator",
      web_route: `/agent/${employeeId}`,
      created_at: "2026-07-14T08:00:00Z",
    },
    runtime_health: {
      status: "healthy",
      checked_at: now,
      backend_type: "fixture",
      api_ok: true,
      sms_number_present: true,
      message: "Avery is reachable on web and text.",
    },
    artifacts: [
      {
        id: "artifact_riverbend_estimate",
        kind: "estimate",
        mime_type: "text/html",
        storage_ref: null,
        payload: { customer_name: "Riverbend Townhomes", job_description: "Hallway repaint and stairwell touchups.", recommended_total: 928000 },
        created_at: "2026-07-14T13:44:00Z",
      },
      {
        id: "artifact_close_packet",
        kind: "close_packet",
        mime_type: "text/html",
        storage_ref: null,
        payload: { customer_name: "June close", job_description: "Missing receipts and uncategorized charges.", recommended_total: 0 },
        created_at: "2026-07-14T12:10:00Z",
      },
      {
        id: "artifact_emergency_page",
        kind: "website_draft",
        mime_type: "text/html",
        storage_ref: null,
        payload: { customer_name: "Emergency repaint page", job_description: "Landing page copy assembled from recent work.", recommended_total: 0 },
        created_at: "2026-07-14T10:40:00Z",
      },
    ],
    approvals: [
      {
        id: "approval_send_riverbend_reply",
        action_key: "send_customer_reply",
        summary: "Send the Riverbend reply with the $9,280 estimate, schedule window, and deposit terms.",
        risk_level: "customer-facing",
        refs: { artifact_id: "artifact_riverbend_estimate", customer_email: "melissa@riverbend.example" },
        expires_at: "2026-07-15T14:30:00Z",
        created_at: "2026-07-14T13:46:00Z",
      },
      {
        id: "approval_riverbend_deposit",
        action_key: "send_deposit_invoice",
        summary: "Send a $2,784 deposit request for the Riverbend hallway job.",
        risk_level: "money",
        refs: { invoice_id: "invoice_riverbend_deposit" },
        expires_at: "2026-07-15T14:30:00Z",
        created_at: "2026-07-14T13:52:00Z",
      },
      {
        id: "approval_bookkeeping_write",
        action_key: "commit_bookkeeping_record",
        summary: "Record the paint supply receipt as a reimbursable Riverbend job expense.",
        risk_level: "accounting",
        refs: { vendor: "Sherwin-Williams", amount: "418.26" },
        expires_at: "2026-07-15T14:30:00Z",
        created_at: "2026-07-14T12:00:00Z",
      },
    ],
    messages: [
      {
        id: "message_owner_operator",
        direction: "from_owner",
        body: "Avery, Riverbend wants a hallway repaint number today. Use the photos, include a 30% deposit, and tell me if anything looks risky.",
        status: "delivered",
        created_at: "2026-07-14T13:21:00Z",
      },
      {
        id: "message_avery_operator",
        direction: "to_owner",
        body: "I checked the customer email, matched the photos to the last similar job, drafted the estimate, and stopped before the reply or deposit link could leave the business. The only uncertainty is whether the back stairwell is included.",
        status: "delivered",
        provider_id: "fixture",
        created_at: "2026-07-14T13:46:00Z",
      },
      {
        id: "message_owner_followup",
        direction: "from_owner",
        body: "Also keep an eye on Pine Lane. If they answer about Friday, bring it back to me.",
        status: "delivered",
        created_at: "2026-07-14T13:55:00Z",
      },
      {
        id: "message_avery_followup",
        direction: "to_owner",
        body: "I am watching for that reply. If it is a simple confirmation, I will prepare the schedule change and show you before I touch the calendar.",
        status: "delivered",
        provider_id: "fixture",
        created_at: "2026-07-14T13:56:00Z",
      },
    ],
    connectors: [
      { id: "connector_email", connector_key: "gmail", provider: "gmail", status: "connected", external_email: "owner@northstar.example" },
      { id: "connector_payments", connector_key: "stripe", provider: "stripe", status: "connected", external_label: "Northstar Painting" },
      { id: "connector_accounting", connector_key: "quickbooks", provider: "quickbooks", status: "needs_reauth", last_error: "Reconnect Accounting before Avery can post new records." },
      { id: "connector_files", connector_key: "drive", provider: "google_drive", status: "connected", external_label: "Northstar job photos" },
      { id: "connector_site", connector_key: "website", provider: "website", status: "not_connected", last_error: "Connect the website before publishing page changes." },
    ],
    stripe_invoices: [
      {
        id: "invoice_riverbend_deposit",
        estimate_id: "artifact_riverbend_estimate",
        stripe_invoice_id: "in_fixture_riverbend",
        deposit_amount: 278400,
        hosted_invoice_url: "https://example.com/riverbend-deposit",
        status: "draft",
      },
    ],
    reminders: [
      {
        id: "reminder_riverbend_reply",
        job_id: "job_riverbend",
        scheduled_at: "2026-07-15T16:00:00Z",
        channel: "sms",
        status: "scheduled",
        message: "Follow up with Riverbend if the estimate has not been approved.",
      },
    ],
    job_commitments: [
      {
        id: "job_riverbend",
        estimate_id: "artifact_riverbend_estimate",
        customer_ref: "Melissa Grant / Riverbend Townhomes",
        start_at: "2026-07-22T13:00:00Z",
        start_window: "next Wednesday afternoon",
        notes: "Hallways and stairwells. Confirm back stairwell before sending.",
        source_ref: "fixture",
        created_at: "2026-07-14T13:54:00Z",
      },
    ],
    work_events: workEvents,
    capabilities,
    abilities: capabilities.map((capability) => ({
      id: capability.id,
      label: capability.label,
      category: capability.category,
      status: capability.status === "needs_info" ? "degraded" : capability.status,
      summary: capability.summary,
      source: capability.sources.includes("connector") ? "connector" : capability.sources.includes("policy") ? "policy" : "manager",
    })),
    surface_envelopes: envelopes,
    connection_surfaces: connectionSurfaces(),
    resurface_items: [
      {
        id: "resurface:riverbend_reply",
        kind: "review",
        title: "Riverbend reply is ready",
        why: "Avery drafted the customer reply and estimate. It is held until you approve the exact preview.",
        status: "needs_you",
        channel: "both",
        source_envelope_id: "surface:riverbend_reply",
        target: { kind: "approval", id: "approval_send_riverbend_reply" },
        proof: { approval_id: "approval_send_riverbend_reply", artifact_id: "artifact_riverbend_estimate", source_table: "approvals", source_id: "approval_send_riverbend_reply" },
      },
      {
        id: "resurface:stairwell_question",
        kind: "question",
        title: "Avery needs one scope answer",
        why: "The back stairwell appears in the photos but not in the email. Avery is holding the send until you answer.",
        status: "needs_you",
        channel: "web",
        source_envelope_id: "surface:stairwell_question",
        target: { kind: "work_event", id: "event_stairwell_question" },
        proof: { inbound_event_id: "event_stairwell_question", source_table: "work_events", source_id: "event_stairwell_question" },
      },
      {
        id: "resurface:accounting_reconnect",
        kind: "connector",
        title: "Accounting is blocking one prepared write",
        why: "Avery prepared the receipt entry but cannot post it until Accounting is reconnected.",
        status: "blocked",
        channel: "web",
        source_envelope_id: "surface:accounting_reconnect",
        target: { kind: "connection", id: "connection_accounting" },
        proof: { source_table: "connector_accounts", source_id: "connector_accounting" },
      },
    ],
    outputs: [
      {
        id: "output_riverbend_estimate",
        type: "artifact",
        title: "Riverbend estimate",
        status: "draft",
        created_at: "2026-07-14T13:44:00Z",
        href: `/agent/${employeeId}/output/artifact_riverbend_estimate`,
        artifact_id: "artifact_riverbend_estimate",
        summary: "Hallway repaint estimate with scope assumption and deposit terms.",
      },
      {
        id: "output_close_packet",
        type: "artifact",
        title: "June close packet",
        status: "needs_you",
        created_at: "2026-07-14T12:10:00Z",
        href: `/agent/${employeeId}/output/artifact_close_packet`,
        artifact_id: "artifact_close_packet",
        summary: "Missing receipts and uncategorized charges Avery found while watching bookkeeping.",
      },
      {
        id: "output_emergency_page",
        type: "generic",
        title: "Emergency repaint page draft",
        status: "draft",
        created_at: "2026-07-14T10:40:00Z",
        href: `/agent/${employeeId}/output/artifact_emergency_page`,
        artifact_id: "artifact_emergency_page",
        summary: "Website draft assembled from recent storm-damage jobs and proof points.",
      },
    ],
    tasks: [
      { id: "task_send_riverbend", type: "approval", title: "Approve Riverbend reply", status: "needs_you", summary: "Customer reply and estimate are staged.", created_at: "2026-07-14T13:46:00Z", target_id: "approval_send_riverbend_reply" },
      { id: "task_deposit_riverbend", type: "approval", title: "Approve Riverbend deposit", status: "needs_you", summary: "Money request is held until approval.", created_at: "2026-07-14T13:52:00Z", target_id: "approval_riverbend_deposit" },
      { id: "task_stairwell_scope", type: "question", title: "Answer stairwell scope", status: "needs_you", summary: "Confirm whether the back stairwell is included.", created_at: "2026-07-14T13:48:00Z", target_id: "event_stairwell_question" },
      { id: "task_accounting_reconnect", type: "connector", title: "Reconnect Accounting", status: "blocked", summary: "Avery cannot post the prepared record until Accounting is reconnected.", target_id: "connector_accounting" },
      { id: "task_close_packet", type: "work", title: "Review June close packet", status: "in_progress", summary: "Avery found missing documents and drafted the owner request.", created_at: "2026-07-14T12:10:00Z", target_id: "event_close_packet" },
    ],
  };

  return JSON.parse(JSON.stringify(payload)) as ResourcePayload;
}

function firstRunEmployee(employeeId: string): ResourcePayload {
  return {
    account_id: accountId,
    employee_id: employeeId,
    employee: { id: employeeId, name: "Avery", status: "ready", profile_id: "service_business_operator", web_route: `/agent/${employeeId}`, created_at: now },
    runtime_health: { status: "healthy", checked_at: now, backend_type: "fixture", api_ok: true, sms_number_present: true, message: "Avery is set up and ready for the first real task." },
    artifacts: [],
    approvals: [],
    messages: [],
    connectors: [],
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: [],
    abilities: [],
    capabilities: capabilityGraph(employeeId),
    surface_envelopes: [],
    connection_surfaces: connectionSurfaces("empty"),
    resurface_items: [],
    outputs: [],
    tasks: [],
  };
}

function workResources(employeeId: string): Record<string, WorkResource> {
  return {
    reply: {
      resource_type: "approval",
      resource_id: "approval_send_riverbend_reply",
      title: "Send Riverbend reply",
      subtitle: "Customer-facing approval",
      summary: "Avery drafted the customer email, estimate summary, and next-step language. Review the exact preview before it leaves the business.",
      amount: "$9,280.00",
      recipient: "Melissa Grant",
      risk: "medium",
      body_kind: "document",
      body_html: estimateHtml(),
      fields: [
        { label: "Customer", value: "Riverbend Townhomes" },
        { label: "Avery used", value: "Customer email, job photos, prior hallway estimate" },
        { label: "Held because", value: "Customer-facing send" },
      ],
      actions: [
        { action: "approve", label: "Approve send", style: "primary", gated: true },
        { action: "reject", label: "Decline", style: "danger", gated: true },
        { action: "respond", label: "Ask Avery to revise", style: "default" },
      ],
    },
    stairwellQuestion: {
      resource_type: "work_event",
      resource_id: "event_stairwell_question",
      title: "Confirm the back stairwell",
      subtitle: "Avery stopped to ask",
      summary: "The photos show a back stairwell that the email did not mention. Avery can include it or exclude it, but will not guess before sending.",
      fields: [
        { label: "Question", value: "Include back stairwell in the Riverbend scope?" },
        { label: "Affects", value: "Estimate total, schedule, and customer reply" },
      ],
      actions: [
        { action: "respond", label: "Answer Avery", style: "primary" },
        { action: "acknowledge", label: "Not now", style: "default" },
      ],
    },
    deposit: {
      resource_type: "approval",
      resource_id: "approval_riverbend_deposit",
      title: "Send deposit request",
      subtitle: "Money approval",
      summary: "Avery prepared the deposit request and stopped before sending the payment link.",
      amount: "$2,784.00",
      recipient: "Melissa Grant",
      risk: "high",
      fields: [
        { label: "Source estimate", value: "$9,280.00" },
        { label: "Deposit", value: "30%" },
        { label: "Payment account", value: "Northstar Painting" },
      ],
      actions: [
        { action: "approve", label: "Approve payment link", style: "primary", gated: true },
        { action: "reject", label: "Decline", style: "danger", gated: true },
        { action: "respond", label: "Change amount", style: "default" },
      ],
    },
    closePacket: {
      resource_type: "task",
      resource_id: "event_close_packet",
      title: "June close packet",
      subtitle: "Bookkeeping work",
      summary: "Avery watched the accounting export, found missing receipts, and drafted the owner request.",
      body_kind: "table",
      fields: [
        { label: "Missing", value: "3 receipts" },
        { label: "Unclear", value: "2 charges need job match" },
        { label: "Held because", value: "Accounting write needs reconnection" },
      ],
      actions: [
        { action: "respond", label: "Send documents", style: "primary" },
        { action: "acknowledge", label: "Review later", style: "default" },
      ],
    },
    accountingReconnect: {
      resource_type: "connector",
      resource_id: "connector_accounting",
      title: "Reconnect Accounting",
      subtitle: "Connected account",
      summary: "Avery can prepare bookkeeping records, but posting is paused until Accounting is reconnected.",
      risk: "medium",
      fields: [
        { label: "Held work", value: "Paint supply receipt for Riverbend" },
        { label: "After repair", value: "Avery will still ask before writes" },
      ],
      actions: [
        { action: "respond", label: "Repair with Avery", style: "primary" },
        { action: "acknowledge", label: "Not now", style: "default" },
      ],
    },
    pageDraft: {
      resource_type: "artifact",
      resource_id: "artifact_emergency_page",
      title: "Emergency repaint page draft",
      subtitle: "Website work",
      summary: "Avery drafted a landing page from recent storm-damage work and marked what is still missing before publishing.",
      body_kind: "document",
      body_html: websiteDraftHtml(),
      open_url: `/agent/${employeeId}/output/artifact_emergency_page`,
      fields: [
        { label: "State", value: "Draft" },
        { label: "Needs", value: "Two photos and one customer quote" },
        { label: "Held because", value: "Website publishing is protected" },
      ],
      actions: [
        { action: "view", label: "Open work surface", style: "primary" },
        { action: "respond", label: "Revise with Avery", style: "default" },
      ],
    },
    proof: {
      resource_type: "work_event",
      resource_id: "event_pine_lane_proof",
      title: "Pine Lane reply handled",
      subtitle: "Proof",
      summary: "Avery caught the customer reply, prepared the schedule change, waited for approval, then sent the confirmation.",
      fields: [
        { label: "Sent to", value: "dan@pinelane.example" },
        { label: "Approved by", value: "Owner via web" },
        { label: "Result", value: "Customer confirmed Friday morning" },
      ],
      receipts: [
        { label: "Sent message", value: "#sent-message-proof" },
        { label: "Approval record", value: "#approval-proof" },
      ],
      actions: [{ action: "acknowledge", label: "Got it", style: "default" }],
    },
  };
}

function eventRows(employeeId: string, resources: Record<string, WorkResource>): WorkEventRow[] {
  return [
    event(employeeId, "event_riverbend_reply", "review", resources.reply.title, resources.reply.summary ?? "", "outbound_message", "approval_send_riverbend_reply", "needs_review"),
    event(employeeId, "event_stairwell_question", "question", resources.stairwellQuestion.title, resources.stairwellQuestion.summary ?? "", "recommendation", undefined, "delivered"),
    event(employeeId, "event_riverbend_deposit", "review", resources.deposit.title, resources.deposit.summary ?? "", "money_movement", "approval_riverbend_deposit", "needs_review"),
    event(employeeId, "event_close_packet", "question", resources.closePacket.title, resources.closePacket.summary ?? "", "dataset_report", undefined, "working"),
    event(employeeId, "event_pine_lane_proof", "notify", resources.proof.title, resources.proof.summary ?? "", "outbound_message", undefined, "done"),
    event(employeeId, "event_page_draft", "review", resources.pageDraft.title, resources.pageDraft.summary ?? "", "document", undefined, "draft"),
    generatedEvent(employeeId, "event_stream_table", "table"),
    generatedEvent(employeeId, "event_schedule_diff", "diff"),
    generatedEvent(employeeId, "event_start_window", "schedule"),
    generatedEvent(employeeId, "event_scope_form", "form"),
  ];
}

function event(
  employeeId: string,
  id: string,
  move: "notify" | "question" | "review",
  title: string,
  summary: string,
  type: NonNullable<NonNullable<WorkEventRow["work_event_descriptor"]>["deliverable"]>["type"],
  approvalId?: string,
  status = "delivered",
): WorkEventRow {
  const gated = move === "review" && (type === "outbound_message" || type === "money_movement");
  return {
    id,
    event_type: `avery_home.${move}`,
    status,
    created_at: now,
    work_event_descriptor: {
      account_id: accountId,
      employee_id: employeeId,
      source_event_id: id,
      move,
      title,
      summary,
      deliverable: {
        type,
        title,
        refs: approvalId ? { approval_id: approvalId } : {},
        leaves_business: type === "outbound_message" || type === "money_movement",
        money: type === "money_movement" ? { involved: true, amount_cents: 278400, currency: "usd" } : undefined,
        reversible: false,
        acceptance: gated ? ["approve", "edit", "reject"] : ["respond", "acknowledge"],
      },
      proof: { fixture: "avery_home" },
    },
  };
}

function generatedEvent(employeeId: string, id: string, kind: "table" | "schedule" | "diff" | "form"): WorkEventRow {
  const view = kind === "table"
    ? { kind, columns: ["Area", "Avery saw", "State"], rows: [["Email", "Riverbend asked for number today", "reply held"], ["Payments", "30% deposit needed", "link held"], ["Accounting", "Receipt ready to record", "connection blocked"], ["Website", "Storm page draft possible", "needs proof"]] }
    : kind === "schedule"
      ? { kind, span: "week" as const, slots: [{ when: "Wed 9:00", label: "Riverbend prep" }, { when: "Fri 8:30", label: "Pine Lane touchup" }] }
      : kind === "diff"
        ? { kind, before: { calendar: "Friday open", customer_reply: "unanswered", deposit: "none" }, after: { calendar: "Friday held", customer_reply: "confirmation drafted", deposit: "30% staged" } }
        : { kind, fields: [{ name: "scope", label: "Include back stairwell?", value: "", required: true }, { name: "start", label: "Preferred start", value: "Next Wednesday afternoon" }] };
  return {
    id,
    event_type: `avery_home.generated_${kind}`,
    status: kind === "table" ? "done" : "delivered",
    created_at: now,
    work_event_descriptor: {
      account_id: accountId,
      employee_id: employeeId,
      source_event_id: id,
      move: kind === "table" ? "notify" : "review",
      title: kind === "table" ? "Avery summarized what she is watching" : `Avery generated a ${kind} surface`,
      summary: kind === "table" ? "Avery reconciled customer, money, accounting, and website signals into one owner-safe view." : `Avery turned structured work into a ${kind} surface you can inspect or answer from chat.`,
      deliverable: {
        type: "tool_activity",
        title: `Generated ${kind} surface`,
        refs: {},
        acceptance: kind === "table" ? ["acknowledge"] : ["approve", "respond", "reject"],
        view,
      },
      proof: { fixture: "avery_home", kind },
    },
  } as WorkEventRow;
}

function surfaceEnvelopes(employeeId: string, resources: Record<string, WorkResource>): SurfaceEnvelope[] {
  return [
    envelope(employeeId, "surface:riverbend_reply", "approval", "native_card", resources.reply, "needs_you", true),
    envelope(employeeId, "surface:stairwell_question", "work_event", "generic", resources.stairwellQuestion, "needs_you"),
    envelope(employeeId, "surface:riverbend_deposit", "approval", "native_card", resources.deposit, "needs_you", true),
    envelope(employeeId, "surface:close_packet", "task", "generic", resources.closePacket, "working"),
    envelope(employeeId, "surface:accounting_reconnect", "connector", "generic", resources.accountingReconnect, "blocked"),
    envelope(employeeId, "surface:page_draft", "artifact", "generic", resources.pageDraft, "draft"),
    envelope(employeeId, "surface:proof", "work_event", "generic", resources.proof, "done"),
  ];
}

function envelope(
  employeeId: string,
  id: string,
  kind: SurfaceEnvelope["kind"],
  tier: SurfaceEnvelope["render_hints"]["tier"],
  resource: WorkResource,
  status: string,
  requiresApproval = false,
): SurfaceEnvelope {
  return {
    id,
    account_id: accountId,
    employee_id: employeeId,
    kind,
    title: resource.title,
    summary: resource.summary,
    status,
    created_at: now,
    render_hints: { tier, priority: requiresApproval ? "high" : "normal", body_kind: resource.body_kind },
    safety: {
      trust_level: "native_manager",
      owner_safe: true,
      redacted: true,
      requires_approval: requiresApproval,
      leaves_business: requiresApproval,
      money_involved: resource.risk === "high",
    },
    proof: { source_table: "fixture", source_id: id, approval_id: resource.resource_type === "approval" ? resource.resource_id : undefined },
    resource,
    actions: resource.actions,
  };
}

function connectionSurfaces(mode: "empty" | "full" = "full") {
  return [
    {
      id: "connection_email",
      label: "Email",
      category: "communication" as const,
      state: mode === "empty" ? "not_connected" as const : "working" as const,
      account_label: mode === "empty" ? null : "owner@northstar.example",
      health: mode === "empty" ? "Connect Email when Avery needs customer messages." : "Watching customer replies and holding sends for approval.",
      last_event: mode === "empty" ? null : "Riverbend reply drafted today",
      last_action: mode === "empty" ? null : "Customer send staged and waiting",
      what_employee_can_do: "Read customer messages, draft replies, send after approval, and bring replies back as work.",
      setup_requirement: mode === "empty" ? "Connect when the first customer send is ready." : null,
      connector_id: "connector_email",
      capability_keys: ["email.send_after_approval", "email.watch_replies"],
      proof: { source_table: "connector_accounts", source_id: "connector_email" },
    },
    {
      id: "connection_files",
      label: "Files and photos",
      category: "documents" as const,
      state: mode === "empty" ? "not_connected" as const : "working" as const,
      account_label: mode === "empty" ? null : "Northstar job photos",
      health: mode === "empty" ? "Connect Files when Avery needs job photos or old proposals." : "Reading job photos and prior proposals for context.",
      last_event: mode === "empty" ? null : "Matched Riverbend photos to prior hallway work",
      last_action: null,
      what_employee_can_do: "Use photos, old proposals, and stored documents to prepare work surfaces.",
      setup_requirement: mode === "empty" ? "Connect file storage when document context matters." : null,
      connector_id: "connector_files",
      capability_keys: ["files.read_context"],
      proof: { source_table: "connector_accounts", source_id: "connector_files" },
    },
    {
      id: "connection_payments",
      label: "Payments",
      category: "money" as const,
      state: "connected" as const,
      account_label: "Northstar Painting",
      health: "Ready for approved deposit links.",
      last_event: "Riverbend deposit draft ready",
      last_action: "No money request sent yet",
      what_employee_can_do: "Prepare deposit links, track payment status, and surface receipts.",
      setup_requirement: null,
      connector_id: "connector_payments",
      capability_keys: ["payments.deposit_links"],
      proof: { source_table: "connector_accounts", source_id: "connector_payments" },
    },
    {
      id: "connection_accounting",
      label: "Accounting",
      category: "accounting" as const,
      state: "needs_you" as const,
      account_label: null,
      health: "Reconnect Accounting before posting records.",
      last_event: "Receipt record prepared",
      last_action: null,
      what_employee_can_do: "Read reports and prepare approved accounting writes.",
      setup_requirement: "Reconnect Accounting.",
      connector_id: "connector_accounting",
      capability_keys: ["accounting.read_reports", "accounting.write_after_approval"],
      proof: { source_table: "connector_accounts", source_id: "connector_accounting" },
    },
    {
      id: "connection_website",
      label: "Website",
      category: "documents" as const,
      state: "not_connected" as const,
      account_label: null,
      health: "Avery can draft page changes, but publishing needs a connected website and exact approval.",
      last_event: "Emergency repaint page drafted",
      last_action: null,
      what_employee_can_do: "Prepare draft pages, compare changes, and publish only after approval.",
      setup_requirement: "Connect website before publishing.",
      connector_id: "connector_site",
      capability_keys: ["website.draft_pages", "website.publish_after_approval"],
      proof: { source_table: "connector_accounts", source_id: "connector_site" },
    },
  ];
}

function capabilityGraph(employeeId: string): CapabilityGraphNode[] {
  const base = {
    account_id: accountId,
    employee_id: employeeId,
    trust_level: "native_manager" as const,
    proof: { source_table: "capability_registry", source_id: "avery_home_fixture" },
  };
  return [
    { ...base, id: "cap_watch_customer_work", key: "communication.watch_replies", label: "Watch customer replies", summary: "Notice customer messages, turn them into work, and ask before sends.", category: "communication", status: "policy_gated", can_run_now: true, sources: ["connector", "policy"] },
    { ...base, id: "cap_estimates", key: "documents.estimates", label: "Prepare estimates", summary: "Draft structured estimates, assumptions, totals, and exact approval previews.", category: "documents", status: "ready", can_run_now: true, sources: ["manager_tool", "hermes"] },
    { ...base, id: "cap_deposits", key: "money.deposit_links", label: "Prepare deposit links", summary: "Create deposit requests and stop before sending them.", category: "money", status: "policy_gated", can_run_now: true, sources: ["connector", "policy"] },
    { ...base, id: "cap_accounting", key: "accounting.records", label: "Prepare bookkeeping records", summary: "Read reports and prepare records; posting needs connection and approval.", category: "accounting", status: "needs_connection", setup_requirement: "Reconnect Accounting.", can_run_now: false, sources: ["connector", "policy"] },
    { ...base, id: "cap_files", key: "documents.file_context", label: "Use files and photos", summary: "Use job photos and old proposals as context for estimates and drafts.", category: "documents", status: "ready", can_run_now: true, sources: ["connector", "manager_tool"] },
    { ...base, id: "cap_web", key: "documents.website_drafts", label: "Draft website updates", summary: "Turn recent work into draft pages and compare changes before publishing.", category: "documents", status: "needs_info", setup_requirement: "Add proof points and connect website before publishing.", can_run_now: true, sources: ["hermes", "manager_tool", "policy"] },
  ];
}

function estimateHtml(): string {
  return `<!doctype html><meta charset="utf-8"><body style="font-family:Inter,Arial,sans-serif;margin:0;padding:18px;color:#101418;background:#fff"><h2 style="margin:0 0 6px">Riverbend hallway repaint</h2><p style="margin:0 0 14px;color:#61706f">Prepared reply: confirm scope, price, deposit, and next Wednesday start window.</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #d8e0df">Hallway wall repair and prep</td><td style="padding:8px;border-bottom:1px solid #d8e0df;text-align:right">$2,140</td></tr><tr><td style="padding:8px;border-bottom:1px solid #d8e0df">Two-coat repaint, common areas</td><td style="padding:8px;border-bottom:1px solid #d8e0df;text-align:right">$5,720</td></tr><tr><td style="padding:8px;border-bottom:1px solid #d8e0df">Stairwell touchup allowance</td><td style="padding:8px;border-bottom:1px solid #d8e0df;text-align:right">$1,420</td></tr><tr><td style="padding:8px;font-weight:800">Total</td><td style="padding:8px;text-align:right;font-weight:800">$9,280</td></tr></table><p style="border-left:3px solid #a05a00;padding-left:10px;margin:14px 0 0;color:#29333d">Held: back stairwell is visible in photos but not mentioned in the email.</p></body>`;
}

function websiteDraftHtml(): string {
  return `<!doctype html><meta charset="utf-8"><body style="font-family:Inter,Arial,sans-serif;margin:0;padding:18px;color:#101418;background:#fff"><h2 style="margin:0 0 8px">Emergency repaint after storm damage</h2><p>Avery drafted this page from recent jobs, customer questions, and proof. It stays internal until photos, a quote, and publishing approval are ready.</p><ul><li>Fast hallway and exterior repaint estimates</li><li>Insurance-ready photos and notes</li><li>Owner-approved customer follow-up</li></ul></body>`;
}
