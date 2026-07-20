import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  OnboardingManifest,
  planAdaptiveOperatingLayout,
  type ActiveSave,
  type DelegatedWorkUnit,
  type OperatingContextManifest,
  type OperatingContextSignal,
  type OperatingDecision,
  type OperatingDomain,
  type OperatingEvidence,
  type OperatingGuidance,
  type OperatingSurfaceState,
  type OperatingSystemChange,
  type OperatingWorkLoop,
  type ProofEnvelope,
  type ResurfaceItem,
  type SurfaceEnvelope,
  type WorkTask,
} from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import { buildBusinessBrainIndex, readBusinessFactsResource } from "./business-brain.js";

const DESIGN_VERSION = "AMTECH_WEB_DESIGN_SYSTEM:2026-07-18";
const INTERFACE_VERSION = "AMTECH_AGENT_INTERFACE_STANDARD:operating-surface-v1";

type ManifestValue = {
  business_display_name: string;
  business_kind: string;
  top_workflows: string[];
  tools_mentioned: string[];
};

type ProfileBuildRow = {
  package_key?: string | null;
  package_version?: string | null;
  generated_path?: string | null;
  install_status?: string | null;
  validation_status?: string | null;
  updated_at?: string | null;
};

type SessionRow = {
  transcript_session_id?: string | null;
  created_at?: string | null;
};

type FactRow = {
  id?: string;
  fact_key?: string;
  fact_value?: string;
  category?: string;
  source?: string;
  confidence?: string;
  updated_at?: string | null;
};

export async function buildOperatingSurfaceState(
  db: SupabaseClient,
  snapshot: EmployeeSnapshot,
): Promise<OperatingSurfaceState> {
  const [brain, factResult, manifestResult, buildResult, sessionResult] = await Promise.all([
    buildBusinessBrainIndex(db, {
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      snapshot,
    }),
    readBusinessFactsResource(db, {
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
    }),
    db.from("employee_manifests")
      .select("manifest,profile_package_key,created_at")
      .eq("employee_id", snapshot.employee_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("employee_profile_builds")
      .select("package_key,package_version,generated_path,install_status,validation_status,updated_at")
      .eq("account_id", snapshot.account_id)
      .eq("employee_id", snapshot.employee_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("agent_context_primer_sessions")
      .select("transcript_session_id,created_at")
      .eq("account_id", snapshot.account_id)
      .eq("employee_id", snapshot.employee_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const parsedManifest = OnboardingManifest.safeParse(
    (manifestResult.data as { manifest?: unknown } | null)?.manifest,
  );
  const manifest = parsedManifest.success
    ? parsedManifest.data as ManifestValue
    : null;
  const build = buildResult.data as ProfileBuildRow | null;
  const session = sessionResult.data as SessionRow | null;
  const facts = (factResult.facts ?? []) as FactRow[];
  const context = compileContext({ snapshot, brain, manifest, build, session, facts });
  const loops = deriveLoops(snapshot);
  const activeSaves = deriveActiveSaves(snapshot, loops);
  const decisions = deriveDecisions(snapshot);
  const changes = deriveChanges(snapshot);
  const delegatedWork = deriveDelegatedWork(snapshot, loops);
  const evidence = deriveEvidence(snapshot);
  const guidance = deriveGuidance(snapshot, loops, activeSaves, decisions, delegatedWork);
  const contextFingerprint = fingerprint(context);
  const layout = planAdaptiveOperatingLayout({
    generated_at: context.generated_at,
    context_fingerprint: contextFingerprint,
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    loops,
    active_saves: activeSaves,
    decisions,
    changes,
    delegated_work: delegatedWork,
    evidence,
    connection_attention_count: (snapshot.connection_surfaces ?? [])
      .filter((connection) => connection.state === "needs_you").length,
  });

  return {
    version: 1,
    generated_at: context.generated_at,
    guidance,
    focus_loop_id: layout.focus_loop_id,
    loops,
    active_saves: activeSaves,
    decisions,
    changes,
    delegated_work: delegatedWork,
    evidence,
    context,
    layout,
  };
}

function compileContext(input: {
  snapshot: EmployeeSnapshot;
  brain: Awaited<ReturnType<typeof buildBusinessBrainIndex>>;
  manifest: ManifestValue | null;
  build: ProfileBuildRow | null;
  session: SessionRow | null;
  facts: FactRow[];
}): OperatingContextManifest {
  const generatedAt = new Date().toISOString();
  const signals: OperatingContextSignal[] = [];
  const add = (value: OperatingContextSignal) => {
    if (!value.owner_safe) return;
    if (signals.some((item) => item.source === value.source && item.key === value.key)) return;
    signals.push(value);
  };

  if (input.manifest) {
    add(signal("manifest", "business_name", "Business", input.manifest.business_display_name, "high", "current", "owner_fact"));
    add(signal("manifest", "business_kind", "Business type", input.manifest.business_kind, "high", "current", "owner_fact"));
    input.manifest.top_workflows.slice(0, 8).forEach((workflow, index) => {
      add(signal("manifest", `workflow_${index}`, "Primary workflow", workflow, "high", "current", "owner_fact"));
    });
    input.manifest.tools_mentioned.slice(0, 8).forEach((tool, index) => {
      add(signal("manifest", `tool_${index}`, "Known system", tool, "medium", "current", "owner_fact"));
    });
  }

  input.brain.brain_index.context_slots.slice(0, 8).forEach((slot) => {
    slot.facts.slice(0, 8).forEach((fact) => {
      add(signal(
        fact.source === "manifest" ? "manifest" : "profile",
        `${slot.key}:${fact.key}`,
        slot.title,
        fact.value,
        fact.confidence === "high" || fact.confidence === "low" ? fact.confidence : "medium",
        "current",
        fact.source === "manifest" ? "owner_fact" : "profile_fact",
      ));
    });
  });

  input.facts.slice(0, 40).forEach((fact) => {
    if (!fact.fact_key || !fact.fact_value) return;
    add(signal(
      "business_brain",
      fact.fact_key,
      humanize(fact.category ?? "Business fact"),
      fact.fact_value,
      fact.confidence === "high" || fact.confidence === "low" ? fact.confidence : "medium",
      "current",
      "owner_fact",
      fact.updated_at,
    ));
  });

  add(signal("runtime", "runtime_status", "Runtime", input.snapshot.runtime_health?.status ?? "unknown", "high", "live", "runtime_fact", input.snapshot.runtime_health?.checked_at));
  add(signal("session_history", "last_session", "Current session", input.session?.transcript_session_id ?? null, "high", "current", "runtime_fact", input.session?.created_at));
  add(signal("profile", "profile_package", "Employee profile", input.build?.package_key ?? input.brain.brain_index.profile_package, "high", "static", "profile_fact", input.build?.updated_at));
  add(signal("generated_soul", "generated_profile_status", "Generated employee context", `${input.build?.install_status ?? "pending"}/${input.build?.validation_status ?? "unknown"}`, "high", "current", "profile_fact", input.build?.updated_at));
  add(signal("agents_doctrine", "agents_version", "Agent doctrine", process.env.AMTECH_AGENTS_DOCTRINE_SHA ?? process.env.RELEASE_SHA ?? null, "high", "static", "product_doctrine"));
  add(signal("codegraph_doctrine", "codegraph_version", "Architecture doctrine", process.env.AMTECH_CODEGRAPH_DOCTRINE_SHA ?? process.env.RELEASE_SHA ?? null, "high", "static", "product_doctrine"));

  const experienceFact = input.facts.find((fact) => fact.fact_key === "ui_experience")?.fact_value;
  const densityFact = input.facts.find((fact) => fact.fact_key === "ui_density")?.fact_value;
  const ownerExperience = experienceFact === "expert" || experienceFact === "standard"
    ? experienceFact
    : "guided";
  const preferredDensity = densityFact === "dense" || densityFact === "calm"
    ? densityFact
    : "balanced";
  const domainInputs = [
    input.manifest?.business_kind,
    ...(input.manifest?.top_workflows ?? []),
    ...(input.manifest?.tools_mentioned ?? []),
    ...(input.snapshot.capabilities ?? []).map((capability) => `${capability.category} ${capability.label} ${capability.summary}`),
    ...input.facts.map((fact) => `${fact.category ?? ""} ${fact.fact_key ?? ""} ${fact.fact_value ?? ""}`),
  ];

  return {
    version: 1,
    generated_at: generatedAt,
    account_id: input.snapshot.account_id,
    assignment_id: input.snapshot.assignment_id,
    employee_id: input.snapshot.employee_id,
    employee_name: input.snapshot.employee?.name ?? "Employee",
    business_name: input.manifest?.business_display_name ?? null,
    business_kind: input.manifest?.business_kind ?? null,
    profile_key: input.build?.package_key ?? input.brain.brain_index.profile_package,
    profile_version: input.build?.package_version ?? null,
    session_id: input.session?.transcript_session_id ?? null,
    session_last_active: latestActivity(input.snapshot, input.session?.created_at ?? null),
    runtime_context_version: input.build?.updated_at ?? input.snapshot.runtime_health?.checked_at ?? null,
    doctrine_versions: {
      agents: process.env.AMTECH_AGENTS_DOCTRINE_SHA ?? process.env.RELEASE_SHA ?? null,
      codegraph: process.env.AMTECH_CODEGRAPH_DOCTRINE_SHA ?? process.env.RELEASE_SHA ?? null,
      design_system: DESIGN_VERSION,
      agent_interface: INTERFACE_VERSION,
    },
    dominant_domains: inferDomains(domainInputs),
    owner_experience: ownerExperience,
    preferred_density: preferredDensity,
    signals: signals.slice(0, 80),
  };
}

function deriveLoops(snapshot: EmployeeSnapshot): OperatingWorkLoop[] {
  return (snapshot.tasks ?? []).slice(0, 40).map((task) => {
    const resurfaced = (snapshot.resurface_items ?? []).find((item) =>
      item.target?.id === task.target_id || item.target?.id === task.id,
    );
    return {
      id: `loop:${task.id}`,
      title: task.title,
      summary: task.summary,
      state: loopState(task),
      horizon: task.status === "scheduled" ? "later" : task.status === "done" ? "next" : "now",
      domain: inferDomains([task.type, task.title, task.summary])[0] ?? "custom",
      updated_at: task.created_at ?? null,
      next_step: nextStep(task),
      return_condition: resurfaced
        ? returnCondition(resurfaced)
        : task.status === "scheduled"
          ? { kind: "time", description: task.summary ?? "Return at the scheduled time", due_at: task.created_at ?? null }
          : null,
      source_envelope_ids: resurfaced?.source_envelope_id ? [resurfaced.source_envelope_id] : [],
      target: task.target_id ? { kind: task.type, id: task.target_id } : { kind: "task", id: task.id },
      proof: withAssignment(snapshot, resurfaced?.proof ?? { source_table: "derived_work_tasks", source_id: task.id }),
    } satisfies OperatingWorkLoop;
  });
}

function deriveActiveSaves(snapshot: EmployeeSnapshot, loops: OperatingWorkLoop[]): ActiveSave[] {
  const items: ActiveSave[] = [];
  const seen = new Set<string>();
  const add = (item: ActiveSave) => {
    const key = item.target ? `${item.target.kind}:${item.target.id}` : item.id;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  (snapshot.resurface_items ?? []).forEach((item) => {
    const loop = loops.find((candidate) => candidate.target?.id === item.target?.id);
    add({
      id: `save:${item.id}`,
      title: item.title,
      why_held: item.why,
      state: saveState(item),
      return_condition: returnCondition(item),
      loop_id: loop?.id ?? null,
      target: item.target ?? null,
      proof: withAssignment(snapshot, item.proof),
    });
  });

  snapshot.reminders.forEach((reminder) => {
    if (reminder.status === "sent" || reminder.status === "failed") return;
    add({
      id: `save:reminder:${reminder.id}`,
      title: reminder.message ?? "Scheduled follow-up",
      why_held: "The employee is carrying this forward and will bring it back at the scheduled time.",
      state: "scheduled",
      return_condition: {
        kind: "time",
        description: `Return at ${reminder.scheduled_at}`,
        due_at: reminder.scheduled_at,
        source: reminder.channel,
      },
      loop_id: loops.find((loop) => loop.target?.id === reminder.id)?.id ?? null,
      target: { kind: "reminder", id: reminder.id },
      proof: withAssignment(snapshot, {
        source_table: "reminders",
        source_id: reminder.id,
        delivery_decision_id: reminder.provider_id ?? null,
      }),
    });
  });

  return items.slice(0, 40);
}

function deriveDecisions(snapshot: EmployeeSnapshot): OperatingDecision[] {
  return (snapshot.surface_envelopes ?? [])
    .filter((envelope) => envelope.kind === "approval" || envelope.safety.requires_approval)
    .slice(0, 25)
    .map((envelope) => ({
      id: `decision:${envelope.proof.approval_id ?? envelope.id}`,
      title: envelope.title,
      consequence: envelope.summary ?? consequence(envelope),
      risk: envelope.safety.money_involved || envelope.safety.leaves_business
        ? "high"
        : envelope.render_hints.priority === "high"
          ? "medium"
          : "low",
      source_envelope_id: envelope.id,
      target: envelope.proof.approval_id
        ? { kind: "approval", id: envelope.proof.approval_id }
        : null,
      proof: withAssignment(snapshot, envelope.proof),
    }));
}

function deriveChanges(snapshot: EmployeeSnapshot): OperatingSystemChange[] {
  return (snapshot.surface_envelopes ?? [])
    .filter((envelope) => ["work_event", "tool_activity", "connector", "invoice", "runtime_health", "artifact"].includes(envelope.kind))
    .sort((left, right) => String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")))
    .slice(0, 30)
    .map((envelope) => ({
      id: `change:${envelope.id}`,
      title: envelope.title,
      summary: envelope.summary,
      source: envelope.kind === "connector" ? "connected_system" : envelope.safety.trust_level,
      state: changeState(envelope),
      occurred_at: envelope.created_at ?? null,
      source_envelope_id: envelope.id,
      proof: withAssignment(snapshot, envelope.proof),
    }));
}

function deriveDelegatedWork(snapshot: EmployeeSnapshot, loops: OperatingWorkLoop[]): DelegatedWorkUnit[] {
  const seen = new Set<string>();
  const units: DelegatedWorkUnit[] = [];
  (snapshot.surface_envelopes ?? []).forEach((envelope) => {
    const delegationId = envelope.proof.delegation_id ?? envelope.proof.child_run_id;
    const toolUnit = envelope.kind === "tool_activity" || envelope.safety.trust_level === "manager_mcp";
    if (!delegationId && !toolUnit) return;
    const identity = delegationId ?? `tool:${envelope.id}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    const loop = loops.find((candidate) => candidate.source_envelope_ids.includes(envelope.id));
    units.push({
      id: `delegated:${identity}`,
      parent_loop_id: loop?.id ?? null,
      title: envelope.title,
      purpose: envelope.summary ?? "Complete a bounded part of the parent work loop.",
      executor_kind: toolUnit ? "tool" : "hermes_subagent",
      executor_label: toolUnit ? "Connected capability" : "Specialized delegated worker",
      state: delegatedState(envelope.status),
      result_summary: ["done", "completed", "accepted"].includes(String(envelope.status))
        ? envelope.summary ?? null
        : null,
      blocking_reason: ["blocked", "failed"].includes(String(envelope.status))
        ? envelope.summary ?? "Delegated work needs attention."
        : null,
      started_at: envelope.created_at ?? null,
      updated_at: envelope.created_at ?? null,
      source_envelope_id: envelope.id,
      proof: withAssignment(snapshot, envelope.proof),
    });
  });
  return units.slice(0, 30);
}

function deriveEvidence(snapshot: EmployeeSnapshot): OperatingEvidence[] {
  const rows: OperatingEvidence[] = (snapshot.outputs ?? []).map((output) => ({
    id: `evidence:${output.id}`,
    title: output.title,
    summary: output.summary,
    state: output.status === "failed" ? "failed" : output.status === "draft" ? "draft" : "recorded",
    recorded_at: output.created_at ?? null,
    href: output.href ?? null,
    proof: withAssignment(snapshot, {
      source_table: output.type === "artifact" ? "artifacts" : "work_outputs",
      source_id: output.artifact_id ?? output.id,
      artifact_id: output.artifact_id ?? null,
    }),
  }));

  (snapshot.surface_envelopes ?? []).forEach((envelope) => {
    const terminal = ["done", "completed", "failed", "accepted"].includes(String(envelope.status));
    if (!terminal && !envelope.proof.receipt_id) return;
    rows.push({
      id: `evidence:envelope:${envelope.id}`,
      title: envelope.title,
      summary: envelope.summary,
      state: envelope.status === "failed" ? "failed" : envelope.proof.receipt_id ? "accepted" : "recorded",
      recorded_at: envelope.created_at ?? null,
      source_envelope_id: envelope.id,
      proof: withAssignment(snapshot, envelope.proof),
    });
  });

  return rows
    .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)
    .slice(0, 40);
}

function deriveGuidance(
  snapshot: EmployeeSnapshot,
  loops: OperatingWorkLoop[],
  activeSaves: ActiveSave[],
  decisions: OperatingDecision[],
  delegatedWork: DelegatedWorkUnit[],
): OperatingGuidance {
  const employee = snapshot.employee?.name ?? "Your employee";
  if (decisions.length > 0) {
    return {
      headline: `${employee} has ${decisions.length} ${decisions.length === 1 ? "decision" : "decisions"} ready for you`,
      summary: `${loops.filter((loop) => loop.state === "active").length} work loops are moving and ${activeSaves.length} future conditions are being held. Start with the consequential item, then return to work in progress.`,
      suggested_prompt: "Explain the highest-impact decision and what changes if I approve it.",
      mode: "needs_you",
    };
  }
  const firstBlocked = loops.find((loop) => loop.state === "blocked" || loop.state === "failed");
  if (firstBlocked) {
    return {
      headline: `${employee} is blocked on ${firstBlocked.title}`,
      summary: firstBlocked.summary ?? "The employee preserved the work and is waiting for a dependency, repair, or owner input.",
      suggested_prompt: "Show me the safest way to clear this block without repeating completed work.",
      mode: "blocked",
    };
  }
  const activeCount = loops.filter((loop) => loop.state === "active" || loop.state === "repairing").length;
  const delegatedCount = delegatedWork.filter((unit) => unit.state === "working").length;
  if (activeCount > 0 || delegatedCount > 0) {
    return {
      headline: `${employee} is carrying ${activeCount || 1} active ${activeCount === 1 ? "work loop" : "work loops"}`,
      summary: `${delegatedCount} delegated units are contributing. The surface brings back material changes, decisions, active saves, and evidence.`,
      suggested_prompt: "What is moving, what is uncertain, and what will come back to me next?",
      mode: "working",
    };
  }
  if (snapshot.runtime_health?.status === "degraded" || snapshot.runtime_health?.status === "unhealthy") {
    return {
      headline: `${employee} is available with degraded runtime state`,
      summary: snapshot.runtime_health.message,
      suggested_prompt: "What work is safe to continue while the runtime is degraded?",
      mode: "degraded",
    };
  }
  return {
    headline: `${employee} is ready for the next outcome`,
    summary: activeSaves.length > 0
      ? `${activeSaves.length} saved conditions remain active in the background.`
      : "Describe the business result you need. AMTECH will form the work, delegate bounded parts, and bring back decisions and evidence.",
    suggested_prompt: "Here is the outcome I need next...",
    mode: "quiet",
  };
}

function signal(
  source: OperatingContextSignal["source"],
  key: string,
  label: string,
  value: string | null | undefined,
  confidence: OperatingContextSignal["confidence"],
  freshness: OperatingContextSignal["freshness"],
  authority: OperatingContextSignal["authority"],
  updatedAt?: string | null,
): OperatingContextSignal {
  return {
    id: `${source}:${key}`,
    source,
    key,
    label,
    value: value ?? null,
    confidence,
    freshness,
    authority,
    owner_safe: true,
    updated_at: updatedAt ?? null,
  };
}

function loopState(task: WorkTask): OperatingWorkLoop["state"] {
  if (task.status === "in_progress") return "active";
  if (task.status === "scheduled") return "waiting";
  return task.status;
}

function nextStep(task: WorkTask): string {
  if (task.status === "needs_you") return "Owner decision or information";
  if (task.status === "blocked") return "Clear the blocking dependency";
  if (task.status === "scheduled") return "Return when the saved condition is met";
  if (task.status === "failed") return "Repair or escalate without repeating accepted work";
  if (task.status === "done") return "Review evidence or close the loop";
  return "Continue the work";
}

function saveState(item: ResurfaceItem): ActiveSave["state"] {
  if (item.status === "scheduled") return "scheduled";
  if (item.status === "needs_you") return "needs_you";
  if (item.status === "blocked" || item.status === "failed") return "blocked";
  return "waiting";
}

function returnCondition(item: ResurfaceItem): ActiveSave["return_condition"] {
  if (item.status === "scheduled") {
    return { kind: "time", description: item.why, due_at: item.resurface_at ?? null, source: item.channel };
  }
  if (item.status === "needs_you") {
    return { kind: "owner", description: item.why, due_at: item.resurface_at ?? null, source: item.channel };
  }
  if (item.kind === "connector" || item.status === "blocked") {
    return { kind: "dependency", description: item.why, due_at: item.resurface_at ?? null, source: item.target?.kind ?? null };
  }
  return { kind: "event", description: item.why, due_at: item.resurface_at ?? null, source: item.channel };
}

function consequence(envelope: SurfaceEnvelope): string {
  if (envelope.safety.money_involved) return "This changes money state.";
  if (envelope.safety.leaves_business) return "This action leaves the business.";
  return "This work is held for owner judgment.";
}

function changeState(envelope: SurfaceEnvelope): OperatingSystemChange["state"] {
  const value = String(envelope.status ?? "").toLowerCase();
  if (["failed", "error", "unhealthy"].includes(value)) return "failed";
  if (["accepted", "completed", "done", "sent", "paid"].includes(value)) return "accepted";
  if (["repaired", "restored"].includes(value)) return "repaired";
  if (envelope.safety.requires_approval || ["draft", "pending", "prepared"].includes(value)) return "prepared";
  return "observed";
}

function delegatedState(status?: string): DelegatedWorkUnit["state"] {
  const value = String(status ?? "").toLowerCase();
  if (["done", "completed", "accepted", "success"].includes(value)) return "done";
  if (["failed", "error"].includes(value)) return "failed";
  if (["blocked", "degraded"].includes(value)) return "blocked";
  if (["waiting", "pending", "needs_you"].includes(value)) return "waiting";
  if (["queued", "scheduled"].includes(value)) return "queued";
  return "working";
}

function withAssignment(snapshot: EmployeeSnapshot, proof: ProofEnvelope): ProofEnvelope {
  return { ...proof, assignment_id: snapshot.assignment_id };
}

function inferDomains(values: Array<string | null | undefined>): OperatingDomain[] {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const candidates: Array<[OperatingDomain, string[]]> = [
    ["research", ["research", "browser", "source", "hypothesis", "citation", "investigation"]],
    ["growth", ["seo", "google ads", "campaign", "marketing", "content", "keyword", "lead generation"]],
    ["commerce", ["shopify", "store", "order", "product", "ecommerce", "inventory", "fulfillment"]],
    ["finance", ["stripe", "quickbooks", "invoice", "payment", "accounting", "bookkeeping", "reconciliation"]],
    ["customer", ["customer", "estimate", "jobber", "crm", "email", "follow-up", "proposal", "lead"]],
    ["people", ["hiring", "candidate", "team", "payroll", "training"]],
    ["system", ["runtime", "connector", "webhook", "session", "credential", "deployment", "repair"]],
    ["operations", ["operations", "schedule", "office", "workflow", "project", "task", "job"]],
  ];
  const scored = candidates
    .map(([domain, terms]) => ({ domain, score: terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.domain)
    .slice(0, 4);
  return scored.length > 0 ? scored : ["custom"];
}

function latestActivity(snapshot: EmployeeSnapshot, sessionCreatedAt: string | null): string | null {
  const values = [
    sessionCreatedAt,
    ...snapshot.messages.map((message) => message.created_at),
    ...snapshot.work_events.map((event) => event.created_at),
    ...(snapshot.surface_envelopes ?? []).map((envelope) => envelope.created_at ?? null),
  ].filter((value): value is string => Boolean(value));
  values.sort();
  return values.at(-1) ?? null;
}

function humanize(value: string): string {
  return value.replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function fingerprint(context: OperatingContextManifest): string {
  const stable = JSON.stringify({
    account_id: context.account_id,
    assignment_id: context.assignment_id,
    employee_id: context.employee_id,
    profile_key: context.profile_key,
    profile_version: context.profile_version,
    runtime_context_version: context.runtime_context_version,
    doctrine_versions: context.doctrine_versions,
    dominant_domains: context.dominant_domains,
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    signals: context.signals.map((item) => [item.source, item.key, item.value, item.updated_at]),
  });
  return `sha256:${createHash("sha256").update(stable).digest("hex")}`;
}
