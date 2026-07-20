import {
  planAdaptiveOperatingLayout,
  type OperatingContextManifest,
  type OperatingSurfaceState,
  type ResourcePayload,
} from "@amtech/shared";

const generatedAt = "2026-07-19T05:00:00.000Z";
const accountId = "acct_research_fixture";
const assignmentId = "asn_research_fixture";
const loopId = "loop_research_competitor_claims";

export function researchFixtureResourcePayload(employeeId: string): ResourcePayload {
  const context: OperatingContextManifest = {
    version: 1,
    generated_at: generatedAt,
    account_id: accountId,
    assignment_id: assignmentId,
    employee_id: employeeId,
    employee_name: "Avery Research",
    business_name: "AMTECH Research Lab",
    business_kind: "agentic research",
    profile_key: "research_browser_operator",
    profile_version: "fixture-v1",
    session_id: "session_research_fixture",
    session_last_active: generatedAt,
    runtime_context_version: "research-context-v1",
    doctrine_versions: {
      agents: "fixture-agents-v1",
      codegraph: "fixture-codegraph-v1",
      design_system: "2026-07-19",
      agent_interface: "2026-07-19",
    },
    dominant_domains: ["research"],
    owner_experience: "standard",
    preferred_density: "balanced",
    signals: [
      {
        id: "signal_research_question",
        source: "manifest",
        key: "active_question",
        label: "Active research question",
        value: "Which agent-browser interaction patterns improve long-horizon research quality without hiding provenance?",
        confidence: "high",
        freshness: "current",
        authority: "owner_fact",
        owner_safe: true,
        updated_at: generatedAt,
      },
      {
        id: "signal_source_policy",
        source: "agents_doctrine",
        key: "source_policy",
        label: "Source policy",
        value: "Prefer primary sources; preserve contradictions and uncertainty.",
        confidence: "high",
        freshness: "static",
        authority: "product_doctrine",
        owner_safe: true,
      },
      {
        id: "signal_browser_runtime",
        source: "runtime",
        key: "browser_runtime",
        label: "Research browser runtime",
        value: "Connected; source capture and delegated review available.",
        confidence: "high",
        freshness: "live",
        authority: "runtime_fact",
        owner_safe: true,
        updated_at: generatedAt,
      },
    ],
  };

  const loops: OperatingSurfaceState["loops"] = [
    {
      id: loopId,
      title: "Evaluate agent-browser interaction patterns",
      summary: "Avery is comparing primary sources, preserving competing claims, and assembling a revisable synthesis.",
      state: "active",
      horizon: "now",
      domain: "research",
      updated_at: generatedAt,
      next_step: "Resolve the contradictory evidence about proactive interruption before drafting the recommendation.",
      return_condition: {
        kind: "event",
        description: "Return when a new primary source materially changes the confidence of either competing claim.",
        source: "research source monitor",
      },
      source_envelope_ids: [],
      target: { kind: "research_question", id: "question_agent_browser_patterns" },
      proof: { assignment_id: assignmentId, source_table: "fixture_research_loops", source_id: loopId },
    },
  ];

  const activeSaves: OperatingSurfaceState["active_saves"] = [
    {
      id: "save_proactive_interruption_evidence",
      title: "Watch for stronger interruption evidence",
      why_held: "The current sources disagree about when proactive agent interruption helps rather than distracts.",
      state: "watching",
      return_condition: {
        kind: "event",
        description: "Return when a primary study reports task-resumption or decision-quality outcomes for proactive agents.",
        source: "saved literature monitor",
      },
      loop_id: loopId,
      target: { kind: "claim", id: "claim_proactive_interruption" },
      proof: { assignment_id: assignmentId, source_table: "fixture_research_saves", source_id: "save_proactive_interruption_evidence" },
    },
  ];

  const decisions: OperatingSurfaceState["decisions"] = [
    {
      id: "decision_scope_recommendation",
      title: "Choose the recommendation scope",
      consequence: "A broad recommendation would combine evidence from office-work, research-browser, and business-operations studies; a narrow recommendation would cover research-browser behavior only.",
      risk: "medium",
      target: { kind: "research_scope", id: "scope_recommendation" },
      proof: { assignment_id: assignmentId, source_table: "fixture_research_decisions", source_id: "decision_scope_recommendation" },
    },
  ];

  const changes: OperatingSurfaceState["changes"] = [
    {
      id: "change_new_primary_source",
      title: "New primary source challenges the interruption claim",
      summary: "The source reports improved recall with event-based cues but weaker performance when interruptions arrive without task-state context.",
      source: "research_browser",
      state: "observed",
      occurred_at: generatedAt,
      loop_id: loopId,
      proof: { assignment_id: assignmentId, source_refs: ["doi:fixture-primary-source"], source_table: "fixture_research_sources", source_id: "source_interruption_context" },
    },
  ];

  const delegatedWork: OperatingSurfaceState["delegated_work"] = [
    {
      id: "delegation_source_method_review",
      parent_loop_id: loopId,
      title: "Review study methodology",
      purpose: "Check whether the cited interruption result measures task completion, recall, or only user preference.",
      executor_kind: "hermes_subagent",
      executor_label: "Methods reviewer",
      state: "done",
      result_summary: "The study measures resumption lag and error rate; it does not support the broader productivity claim.",
      started_at: "2026-07-19T04:42:00.000Z",
      updated_at: generatedAt,
      proof: { assignment_id: assignmentId, parent_run_id: "run_research_parent", child_run_id: "run_methods_review", delegation_id: "delegation_source_method_review" },
    },
    {
      id: "delegation_source_trail_check",
      parent_loop_id: loopId,
      title: "Verify the source trail",
      purpose: "Trace two secondary claims back to their original studies and record any citation drift.",
      executor_kind: "specialist_agent",
      executor_label: "Source-trail verifier",
      state: "working",
      started_at: "2026-07-19T04:55:00.000Z",
      updated_at: generatedAt,
      proof: { assignment_id: assignmentId, parent_run_id: "run_research_parent", child_run_id: "run_source_trail", delegation_id: "delegation_source_trail_check" },
    },
  ];

  const evidence: OperatingSurfaceState["evidence"] = [
    {
      id: "evidence_source_matrix",
      title: "Source and claim matrix",
      summary: "Six primary sources, four secondary sources, two unresolved contradictions, and confidence labels for each material claim.",
      state: "recorded",
      recorded_at: generatedAt,
      proof: { assignment_id: assignmentId, artifact_id: "artifact_source_matrix", source_refs: ["doi:fixture-primary-source", "url:fixture-agent-ui-spec"] },
    },
    {
      id: "evidence_draft_synthesis",
      title: "Draft synthesis",
      summary: "A revisable draft separates supported findings, disputed claims, and design implications.",
      state: "draft",
      recorded_at: generatedAt,
      proof: { assignment_id: assignmentId, artifact_id: "artifact_draft_synthesis", source_table: "fixture_research_artifacts", source_id: "artifact_draft_synthesis" },
    },
  ];

  const layout = planAdaptiveOperatingLayout({
    generated_at: generatedAt,
    context_fingerprint: "sha256:research-fixture-context-v1",
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    loops,
    active_saves: activeSaves,
    decisions,
    changes,
    delegated_work: delegatedWork,
    evidence,
    connection_attention_count: 0,
  });

  const operatingState: OperatingSurfaceState = {
    version: 1,
    generated_at: generatedAt,
    guidance: {
      headline: "One research decision is ready",
      summary: "Avery preserved the source trail, separated competing claims, and needs the scope of the final recommendation.",
      suggested_prompt: "Keep the recommendation narrow, show the contradictory evidence, and state what would change the conclusion.",
      mode: "needs_you",
    },
    focus_loop_id: loopId,
    loops,
    active_saves: activeSaves,
    decisions,
    changes,
    delegated_work: delegatedWork,
    evidence,
    context,
    layout,
  };

  return {
    account_id: accountId,
    assignment_id: assignmentId,
    employee_id: employeeId,
    employee: {
      id: employeeId,
      name: "Avery Research",
      status: "working",
      profile_id: "research_browser_operator",
      web_route: `/agent/${employeeId}`,
      created_at: "2026-07-19T03:00:00.000Z",
    },
    runtime_health: {
      status: "healthy",
      checked_at: generatedAt,
      backend_type: "fixture",
      api_ok: true,
      sms_number_present: false,
      message: "Research browser, source capture, and delegated review are available.",
    },
    artifacts: [
      { id: "artifact_source_matrix", kind: "research_matrix", mime_type: "application/json", storage_ref: null, created_at: generatedAt },
      { id: "artifact_draft_synthesis", kind: "research_synthesis", mime_type: "text/markdown", storage_ref: null, created_at: generatedAt },
    ],
    approvals: [],
    messages: [],
    connectors: [],
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: [],
    abilities: [
      { id: "ability_research", label: "Research and source analysis", category: "research", status: "ready", summary: "Browse, capture, compare, monitor, and synthesize owner-safe sources.", source: "profile" },
    ],
    capabilities: [],
    surface_envelopes: [],
    connection_surfaces: [],
    resurface_items: [],
    outputs: [
      { id: "output_source_matrix", type: "artifact", title: "Source and claim matrix", status: "recorded", created_at: generatedAt, artifact_id: "artifact_source_matrix", summary: "Claim-level provenance and contradictions." },
      { id: "output_draft_synthesis", type: "artifact", title: "Draft synthesis", status: "draft", created_at: generatedAt, artifact_id: "artifact_draft_synthesis", summary: "Revisable synthesis with confidence boundaries." },
    ],
    tasks: [
      { id: "task_research_scope", type: "question", title: "Choose recommendation scope", status: "needs_you", summary: "Decide whether the synthesis stays research-browser-specific or generalizes across business work.", target_id: "decision_scope_recommendation" },
      { id: "task_source_trail", type: "work", title: "Verify source trail", status: "in_progress", summary: "A delegated reviewer is tracing secondary claims to primary studies.", target_id: "delegation_source_trail_check" },
    ],
    operating_state: operatingState,
  };
}
