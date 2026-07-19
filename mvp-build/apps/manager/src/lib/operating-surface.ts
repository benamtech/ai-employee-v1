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
  type SurfaceEnvelope,
} from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import { buildBusinessBrainIndex, readBusinessFactsResource } from "./business-brain.js";

const DESIGN_VERSION = "AMTECH_WEB_DESIGN_SYSTEM:2026-07-18";
const INTERFACE_VERSION = "AMTECH_AGENT_INTERFACE_STANDARD:operating-surface-v1";

export async function buildOperatingSurfaceState(
  db: SupabaseClient,
  snapshot: EmployeeSnapshot,
): Promise<OperatingSurfaceState> {
  const [brain, factsResource, manifestResult, buildResult, sessionResult] = await Promise.all([
    buildBusinessBrainIndex(db, { account_id: snapshot.account_id, employee_id: snapshot.employee_id, snapshot }),
    readBusinessFactsResource(db, { account_id: snapshot.account_id, employee_id: snapshot.employee_id }),
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

  const parsedManifest = OnboardingManifest.safeParse((manifestResult.data as { manifest?: unknown } | null)?.manifest);
  const manifest = parsedManifest.success ? parsedManifest.data : null;
  const build = buildResult.data as {
    package_key?: string | null;
    package_version?: string | null;
    generated_path?: string | null;
    install_status?: string | null;
    validation_status?: string | null;
    updated_at?: string | null;
  } | null;
  const session = sessionResult.data as { transcript_session_id?: string | null; created_at?: string | null } | null;
  const facts = (factsResource.facts ?? []) as Array<{
    id?: string;
    fact_key?: string;
    fact_value?: string;
    category?: string;
    source?: string;
    confidence?: string;
    updated_at?: string | null;
  }>;

  const context = buildContextManifest({ snapshot, manifest, build, session, brain, facts });
  const loops = deriveLoops(snapshot);
  const activeSaves = deriveActiveSaves(snapshot, loops);
  const decisions = deriveDecisions(snapshot);
  const changes = deriveSystemChanges(snapshot);
  const delegatedWork = deriveDelegatedWork(snapshot, loops);
  const evidence = deriveEvidence(snapshot);
  const guidance = deriveGuidance({ snapshot, loops, activeSaves, decisions, delegatedWork });
  const layout = planAdaptiveOperatingLayout({
    generated_at: context.generated_at,
    context_fingerprint: fingerprintContext(context),
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    loops,
    active_saves: activeSaves,
    decisions,
    changes,
    delegated_work: delegatedWork,
    evidence,
    connection_attention_count: (snapshot.connection_surfaces ?? []).filter((connection) => connection.state === "needs_you").length,
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

function buildContextManifest(input: {
  snapshot: EmployeeSnapshot;
  manifest: ReturnType<typeof OnboardingManifest.parse> | null;
  build: {
    package_key?: string | null;
    package_version?: string | null;
    generated_path?: string | null;
    install_status?: string | null;
    validation_status?: string | null;
    updated_at?: string | null;
  } | null;
  session: { transcript_session_id?: string | null; created_at?: string | null } | null;
  brain: Awaited<ReturnType<typeof buildBusinessBrainIndex>>;
  facts: Array<{
    id?: string;
    fact_key?: string;
    fact_value?: string;
    category?: string;
    source?: string;
    confidence?: string;
    updated_at?: string | null;
  }>;
}): OperatingContextManifest {
  const generatedAt = new Date().toISOString();
  const preference = input.facts.find((fact) => fact.fact_key === "ui_experience")?.fact_value;
  const density = input.facts.find((fact) => fact.fact_key === "ui_density")?.fact_value;
  const ownerExperience = preference === "expert" || preference === "standard" ? preference : "guided";
  const preferredDensity = density === "dense" || density === "calm" ? density : "balanced";
  const contextSignals: OperatingContextSignal[] = [];

  const addSignal = (signal: OperatingContextSignal) => {
    if (!signal.owner_safe) return;
    if (contextSignals.some((current) => current.source === signal.source && current.key === signal.key && current.value === signal.value)) return;
    contextSignals.push(signal);
  };

  if (input.manifest) {
    addSignal(signal("manifest", "business_name", "Business", input.manifest.business_display_name, "high", "current", "owner_fact"));
    addSignal(signal("manifest", "business_kind", "Business type", input.manifest.business_kind, "high", "current", "owner_fact"));
    for (const [index, workflow] of input.manifest.top_workflows.slice(0, 8).entries()) {
      addSignal(signal("manifest", `workflow_${index}`, "Primary workflow", workflow, "high", "current", "owner_fact"));
    }
    for (const [index, tool] of input.manifest.tools_mentioned.slice(0, 8).entries()) {
      addSignal(signal("manifest", `tool_${index}`, "Known system", tool, "medium", "current", "owner_fact"));
    }
  }

  for (const slot of input.brain.brain_index.context_slots.slice(0, 8)) {
    for (const fact of slot.facts.slice(0, 8)) {
      addSignal(signal(
        fact.source === "manifest" ? "manifest" : "profile",
        `${slot.key}:${fact.key}`,
        slot.title,
        fact.value,
        fact.confidence === "high" || fact.confidence === "low" ? fact.confidence : "medium",
        "current",
        fact.source === "manifest" ? "owner_fact" : "profile_fact",
      ));
    }
  }

  for (const fact of input.facts.slice(0, 40)) {
    if (!fact.fact_key || !fact.fact_value) continue;
    addSignal(signal(
      "business_brain",
      fact.fact_key,
      humanLabel(fact.category || "Business fact"),
      fact.fact_value,
      fact.confidence === "high" || fact.confidence === "low" ? fact.confidence : "medium",
      "current",
      "owner_fact",
      fact.updated_at,
    ));
  }

  addSignal(signal("runtime", "runtime_status", "Runtime", input.snapshot.runtime_health?.status ?? "unknown", "high", "live", "runtime_fact", input.snapshot.runtime_health?.checked_at));
  addSignal(signal("session_history", "last_session", "Current session", input.session?.transcript_session_id ?? null, "high", "current", "runtime_fact", input.session?.created_at));
  addSignal(signal("profile", "profile_package", "Employee profile", input.build?.package_key ?? input.brain.brain_index.profile_package, "high", "static", "profile_fact", input.build?.updated_at));
  addSignal(signal("generated_soul", "generated_profile_status", "Generated employee context", `${input.build?.install_status ?? "pending"}/${input.build?.validation_status ?? "unknown"}`, "high", "current", "profile_fact", input.build?.updated_at));
  addSignal(signal("agents_doctrine", "agents_version", "Agent doctrine", process.env.AMTECH_AGENTS_DOCTRINE_SHA ?? process.env.RELEASE_SHA ?? null, "high", "static", "product_doctrine"));
  addSignal(signal("codegraph_doctrine", "codegraph_version", "Architecture doctrine", process.env.AMTECH_CODEGRAPH_DOCTRINE_SHA ?? process.env.RELEASE_SHA ?? null, "high", "static", "product_doctrine"));

  const domains = inferDomains([
    input.manifest?.business_kind,
    ...(input.manifest?.top_workflows ?? []),
    ...(input.manifest?.tools_mentioned ?? []),
    ...(input.snapshot.capabilities ?? []).map((capability) => `${capability.category} ${capability.label} ${capability.summary}`),
    ...input.facts.map((fact) => `${fact.category ?? ""} ${fact.fact_key ?? ""} ${fact.fact_value ?? ""}`),
  ]);

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
    dominant_domains: domains,
    owner_experience: ownerExperience,
    preferred_density: preferredDensity,
    signals: contextSignals.slice(0, 80),
  };
}

function deriveLoops(snapshot: EmployeeSnapshot): OperatingWorkLoop[] {
  const resurfaced = snapshot.resurface_items ?? [];
  const loops = (snapshot.tasks ?? []).map((task): OperatingWorkLoop => {
    const resurface = resurfaced.find((item) => item.target?.id === task.target_id || item.target?.id === task.id);
    const state = task.status === "in_progress" ? "active"
      : task.status === "scheduled" ? "waiting"
        : task.status === "needs_you" ? "needs_you"
          : task.status;
    return {
      id: `loop:${task.id}`,
      title: task.title,
      summary: task.summary,
      state,
      horizon: task.status === "scheduled" ? "later" : task.status === "in_progress" || task.status === "needs_you" || task.status === "blocked" ? "now" : "next",
      domain: inferDomains([task.type, task.title, task.summary])[0] ?? "operations",
      updated_at: task.created_at ?? null,
      next_step: task.status === "needs_you" ? "Owner decision or information" : task.status === "blocked" ? "Clear the blocking dependency" : task.status === "scheduled" ? "Return when the saved condition is met" : "Continue the work",
      return_condition: resurface ? returnConditionForResurface(resurface) : task.status === "scheduled" ? { kind: "time", description: task.summary ?? "Return at the scheduled time", due_at: task.created_at ?? null } : null,
      source_envelope_ids: resurface?.source_envelope_id ? [resurface.source_envelope_id] : [],
      target: task.target_id ? { kind: task.type, id: task.target_id } : { kind: "task", id: task.id },
      proof: proofFor(snapshot, resurface?.proof ?? { source_table: "derived_work_tasks", source_id: task.id }),
    };
  });
  return loops.slice(0, 40);
}

function deriveActiveSaves(snapshot: EmployeeSnapshot, loops: OperatingWorkLoop[]): ActiveSave[] {
  const saves: ActiveSave[] = [];
  const seen = new Set<string>();
  const add = (save: ActiveSave) => {
    const key = save.target ? `${save.target.kind}:${save.target.id}` : save.id;
    if (seen.has(key)) return;
    seen.add(key);
    saves.push(save);
  };

  for (const item of snapshot.resurface_items ?? []) {
    const loop = loops.find((candidate) => candidate.target?.id && candidate.target.id === item.target?.id);
    add({
      id: `save:${item.id}`,
      title: item.title,
      why_held: item.why,
      state: item.status === "scheduled" ? "scheduled" : item.status === "needs_you" ? "needs_you" : item.status === "blocked" || item.status === "failed" ? "blocked" : "waiting",
      return_condition: returnConditionForResurface(item),
      loop_id: loop?.id ?? null,
      target: item.target ?? null,
      proof: proofFor(snapshot, item.proof),
    });
  }
  for (const reminder of snapshot.reminders ?? []) {
    if (reminder.status === "sent" || reminder.status === "failed") continue;
    add({
      id: `save:reminder:${reminder.id}`,
      title: reminder.message ?? "Scheduled follow-up",
      why_held: "The employee is carrying this forward and will bring it back at the scheduled time.",
      state: "scheduled",
      return_condition: { kind: "time", description: `Return at ${reminder.scheduled_at}`, due_at: reminder.scheduled_at, source: reminder.channel },
      loop_id: loops.find((loop) => loop.target?.id === reminder.id)?.id ?? null,
      target: { kind: "reminder", id: reminder.id },
      proof: proofFor(snapshot, { source_table: "reminders", source_id: reminder.id, delivery_decision_id: reminder.provider_id ?? null }),
    });
  }
  return saves.slice(0, 40);
}

function deriveDecisions(snapshot: EmployeeSnapshot): OperatingDecision[] {
  const envelopes = snapshot.surface_envelopes ?? [];
  return envelopes
    .filter((envelope) => envelope.kind === "approval" || envelope.safety.requires_approval)
    .map((envelope): OperatingDecision => ({
      id: `decision:${envelope.proof.approval_id ?? envelope.id}`,
      title: envelope.title,
      consequence: envelope.summary ?? (envelope.safety.money_involved ? "This changes money state." : envelope.safety.leaves_business ? "This leaves the business." : "This work is held for owner judgment."),
      risk: envelope.safety.money_involved || envelope.safety.leaves_business ? "high" : envelope.render_hints.priority === "high" ? "medium" : "low",
      source_envelope_id: envelope.id,
      target: envelope.proof.approval_id ? { kind: "approval", id: envelope.proof.approval_id } : null,
      proof: proofFor(snapshot, envelope.proof),
    }))
    .slice(0, 25);
}

function deriveSystemChanges(snapshot: EmployeeSnapshot): OperatingSystemChange[] {
  return (snapshot.surface_envelopes ?? [])
    .filter((envelope) => ["work_event", "tool_activity", "connector", "invoice", "runtime_health", "artifact"].includes(envelope.kind))
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .map((envelope): OperatingSystemChange => ({
      id: `change:${envelope.id}`,
      title: envelope.title,
      summary: envelope.summary,
      source: envelope.kind === "connector" ? "connected_system" : envelope.safety.trust_level,
      state: changeState(envelope),
      occurred_at: envelope.created_at ?? null,
      source_envelope_id: envelope.id,
      proof: proofFor(snapshot, envelope.proof),
    }))
    .slice(0, 30);
}

function deriveDelegatedWork(snapshot: EmployeeSnapshot, loops: OperatingWorkLoop[]): DelegatedWorkUnit[] {
  const units: DelegatedWorkUnit[] = [];
  const seen = new Set<string>();
  for (const envelope of snapshot.surface_envelopes ?? []) {
    const delegationId = envelope.proof.delegation_id ?? envelope.proof.child_run_id;
    const isTool = envelope.kind === "tool_activity" || envelope.safety.trust_level === "manager_mcp";
    if (!delegationId && !isTool) continue;
    const id = delegationId ?? `tool:${envelope.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const loop = loops.find((candidate) => candidate.source_envelope_ids.includes(envelope.id));
    units.push({
      id: `delegated:${id}`,
      parent_loop_id: loop?.id ?? null,
      title: envelope.title,
      purpose: envelope.summary ?? "Complete a bounded part of the parent work loop.",
      executor_kind: isTool ? "tool" : "hermes_subagent",
      executor_label: isTool ? "Connected capability" : "Specialized delegated worker",
      state: delegatedState(envelope.status),
      result_summary: envelope.status === "done" || envelope.status === "completed" ? envelope.summary ?? null : null,
      blocking_reason: envelope.status === "blocked" || envelope.status === "failed" ? envelope.summary ?? "Delegated work needs attention." : null,
      started_at: envelope.created_at ?? null,
      updated_at: envelope.created_at ?? null,
      source_envelope_id: envelope.id,
      proof: proofFor(snapshot, envelope.proof),
    });
  }
  return units.slice(0, 30);
}

function deriveEvidence(snapshot: EmployeeSnapshot): OperatingEvidence[] {
  const evidence: OperatingEvidence[] = [];
  for (const output of snapshot.outputs ?? []) {
    evidence.push({
      id: `evidence:${output.id}`,
      title: output.title,
      summary: output.summary,
      state: output.status === "failed" ? "failed" : output.status === "draft" ? "draft" : "recorded",
      recorded_at: output.created_at ?? null,
      href: output.href ?? null,
      proof: proofFor(snapshot, { source_table: output.type === "artifact" ? "artifacts" : "work_outputs", source_id: output.artifact_id ?? output.id, artifact_id: output.artifact_id ?? null }),
    });
  }
  for (const envelope of snapshot.surface_envelopes ?? []) {
    if (!Object.values(envelope.proof).some(Boolean)) continue;
    if (!(["done", "completed", "failed", "accepted"].includes(String(envelope.status)) || envelope.proof.receipt_id)) continue;
    evidence.push({
      id: `evidence:envelope:${envelope.id}`,
      title: envelope.title,
      summary: envelope.summary,
      state: envelope.status === "failed" ? "failed" : envelope.proof.receipt_id ? "accepted" : "recorded",
      recorded_at: envelope.created_at ?? null,
      source_envelope_id: envelope.id,
      proof: proofFor(snapshot, envelope.proof),
    });
  }
  return evidence.filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index).slice(0, 40);
}

function deriveGuidance(input: {
  snapshot: EmployeeSnapshot;
  loops: OperatingWorkLoop[];
  activeSaves: ActiveSave[];
  decisions: OperatingDecision[];
  delegatedWork: DelegatedWorkUnit[];
}): OperatingGuidance {
  const employee = input.snapshot.employee?.name ?? "Your employee";
  if (input.decisions.length) return {
    headline: `${employee} has ${input.decisions.length} ${input.decisions.length === 1 ? "decision" : "decisions"} ready for you`,
    summary: `${input.loops.filter((loop) => loop.state === "active").length} work loops are moving and ${input.activeSaves.length} future conditions are being held. Start with the consequential item, then return to the work in progress.`,
    suggested_prompt: "Explain the highest-impact decision and what changes if I approve it.",
    mode: "needs_you",
  };
  const blocked = input.loops.filter((loop) => loop.state === "blocked" || loop.state === "failed");
  if (blocked.length) return {
    headline: `${employee} is blocked on ${blocked[0].title}`,
    summary: blocked[0].summary ?? "The employee preserved the work and is waiting for a dependency, repair, or owner input.",
    suggested_prompt: "Show me the safest way to clear this block without repeating completed work.",
    mode: "blocked",
  };
  const active = input.loops.filter((loop) => loop.state === "active" || loop.state === "repairing");
  if (active.length || input.delegatedWork.some((unit) => unit.state === "working")) return {
    headline: `${employee} is carrying ${active.length || 1} active ${active.length === 1 ? "work loop" : "work loops"}`,
    summary: `${input.delegatedWork.filter((unit) => unit.state === "working").length} delegated units are contributing. The surface will bring back only material changes, decisions, and evidence.`,
    suggested_prompt: "What is moving, what is uncertain, and what will come back to me next?",
    mode: "working",
  };
  if (input.snapshot.runtime_health?.status === "degraded" || input.snapshot.runtime_health?.status === "unhealthy") return {
    headline: `${employee} is available with degraded runtime state`,
    summary: input.snapshot.runtime_health.message,
    suggested_prompt: "What work is safe to continue while the runtime is degraded?",
    mode: "degraded",
  };
  return {
    headline: `${employee} is ready for the next outcome`,
    summary: input.activeSaves.length ? `${input.activeSaves.length} saved conditions remain active in the background.` : "Describe the business result you need. AMTECH will form the work, delegate bounded parts, and bring back decisions and proof.",
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
  updated_at?: string | null,
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
    updated_at: updated_at ?? null,
  };
}

function proofFor(snapshot: EmployeeSnapshot, proof: ProofEnvelope): ProofEnvelope {
  return { ...proof, assignment_id: snapshot.assignment_id };
}

function returnConditionForResurface(item: NonNullable<EmployeeSnapshot["resurface_items"]>[number]) {
  if (item.status === "scheduled") return { kind: "time" as const, description: item.why, due_at: item.resurface_at ?? null, source: item.channel };
  if (item.status === "needs_you") return { kind: "owner" as const, description: item.why, due_at: item.resurface_at ?? null, source: item.channel };
  if (item.kind === "connector" || item.status === "blocked") return { kind: "dependency" as const, description: item.why, due_at: item.resurface_at ?? null, source: item.target?.kind ?? null };
  return { kind: "event" as const, description: item.why, due_at: item.resurface_at ?? null, source: item.channel };
}

function inferDomains(values: Array<string | null | undefined>): OperatingDomain[] {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const scored: Array<[OperatingDomain, number]> = [
    ["research", score(text, ["research", "browser", "source", "hypothesis", "citation", "investigation", "evidence review"])],
    ["growth", score(text, ["seo", "google ads", "campaign", "marketing", "content", "keyword", "lead generation"])],
    ["commerce", score(text, ["shopify", "store", "order", "product", "ecommerce", "e-commerce", "inventory", "fulfillment"])],
    ["finance", score(text, ["stripe", "quickbooks", "invoice", "payment", "accounting", "bookkeeping", "reconciliation"])],
    ["customer", score(text, ["customer", "estimate", "jobber", "crm", "email", "follow-up", "proposal", "lead"])],
    ["people", score(text, ["hiring", "employee", "candidate", "team", "payroll", "training"])],
    ["system", score(text, ["runtime", "connector", "webhook", "session", "credential", "deployment", "repair"])],
    ["operations", score(text, ["operations", "schedule", "office", "workflow", "project", "task", "job"])],
  ];
  const domains = scored.filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).map(([domain]) => domain).slice(0, 4);
  return domains.length ? domains : ["custom"];
}

function score(text: string, terms: string[]): number {
  return terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
}

function latestActivity(snapshot: EmployeeSnapshot, sessionCreatedAt: string | null): string | null {
  return [
    sessionCreatedAt,
    ...snapshot.messages.map((message) => message.created_at),
    ...snapshot.work_events.map((event) => event.created_at),
    ...(snapshot.surface_envelopes ?? []).map((envelope) => envelope.created_at ?? null),
  ].filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

function changeState(envelope: SurfaceEnvelope): OperatingSystemChange["state"] {
  const status = String(envelope.status ?? "").toLowerCase();
  if (["failed", "error", "unhealthy"].includes(status)) return "failed";
  if (["accepted", "completed", "done", "sent", "paid"].includes(status)) return "accepted";
  if (["repaired", "restored"].includes(status)) return "repaired";
  if (envelope.safety.requires_approval || ["draft", "pending", "prepared"].includes(status)) return "prepared";
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

function humanLabel(value: string): string {
  return value.replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function fingerprintContext(context: OperatingContextManifest): string {
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
