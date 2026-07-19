import {
  planAdaptiveOperatingLayout,
  type ActiveSave,
  type ConnectionSurface,
  type DelegatedWorkUnit,
  type OperatingContextManifest,
  type OperatingDecision,
  type OperatingDomain,
  type OperatingEvidence,
  type OperatingSurfaceState,
  type OperatingSystemChange,
  type OperatingWorkLoop,
  type ResourcePayload,
} from "@amtech/shared";
import { fixtureResourcePayload } from "./fixtures";
import { researchFixtureResourcePayload } from "./research-fixture";

const FIXTURE_TIME = "2026-07-19T12:00:00.000Z";

export const FIXTURE_SCENARIOS = [
  {
    id: "contractor",
    employeeId: "fixture-contractor",
    label: "Contractor employee",
    shortLabel: "Contractor",
    summary: "Estimate, customer reply, deposit, scheduling, follow-up, and signed review.",
  },
  {
    id: "website",
    employeeId: "fixture-website",
    label: "Employee as website",
    shortLabel: "Website",
    summary: "Public visitor guidance, qualification, private handoff, return condition, and evidence.",
  },
  {
    id: "office",
    employeeId: "fixture-office",
    label: "Multi-role office",
    shortLabel: "Office",
    summary: "Owner, dispatcher, estimator, bookkeeper, and field-team work projected by outcome.",
  },
  {
    id: "personal-brain",
    employeeId: "fixture-personal-brain",
    label: "Personal operating brain",
    shortLabel: "Brain",
    summary: "Explicit saves, recurring review, provenance, and no silent external effects.",
  },
  {
    id: "research",
    employeeId: "fixture-research",
    label: "Research employee",
    shortLabel: "Research",
    summary: "Question, source trail, competing claims, delegated review, synthesis, and evidence.",
  },
  {
    id: "clothing-ops",
    employeeId: "fixture-clothing-ops",
    label: "Clothing operations employee",
    shortLabel: "Clothing ops",
    summary: "Shopify, email, business brain, live material cost, production, fulfillment, and purchasing.",
  },
] as const;

export type FixtureScenarioId = typeof FIXTURE_SCENARIOS[number]["id"];

export interface FixtureRuntimeProjection {
  supported: true;
  source: "fixture" | "manager";
  run_id: string;
  sequence: number;
  observed_at: string;
  phase: "starting" | "working" | "waiting" | "reconciling" | "recovering" | "completed";
  health: "active" | "waiting" | "stalled" | "recovering" | "completed";
  summary: string;
  context_version?: string | null;
}

export interface FixtureRuntimeFrame {
  after_ms: number;
  projection: FixtureRuntimeProjection;
  progress?: string;
}

export interface FixtureRuntimeSession {
  scenario: typeof FIXTURE_SCENARIOS[number];
  initial_payload: ResourcePayload;
  initial_projection: FixtureRuntimeProjection;
  frames: FixtureRuntimeFrame[];
}

export interface FixtureCommandPlan {
  accepted: ResourcePayload;
  completed: ResourcePayload;
  frames: FixtureRuntimeFrame[];
  completion_delay_ms: number;
}

interface FixtureScenarioSpec {
  id: Exclude<FixtureScenarioId, "contractor" | "research">;
  employeeName: string;
  businessName: string;
  businessKind: string;
  profileKey: string;
  domains: OperatingDomain[];
  guidance: OperatingSurfaceState["guidance"];
  loops: OperatingWorkLoop[];
  saves: ActiveSave[];
  decisions: OperatingDecision[];
  changes: OperatingSystemChange[];
  delegated: DelegatedWorkUnit[];
  evidence: OperatingEvidence[];
  connections: ConnectionSurface[];
  abilities: NonNullable<ResourcePayload["abilities"]>;
  heartbeat: string[];
}

interface FixtureCommandConfig {
  domain: OperatingDomain;
  delegatedTitle: string;
  delegatedPurpose: string;
  evidenceTitle: string;
  evidenceSummary: string;
  decision?: {
    title: string;
    consequence: string;
    risk: OperatingDecision["risk"];
  };
  returnCondition?: ActiveSave["return_condition"];
}

const WEBSITE_SPEC: FixtureScenarioSpec = {
  id: "website",
  employeeName: "Avery Front Door",
  businessName: "Brightside Painting",
  businessKind: "residential painting contractor",
  profileKey: "public_front_door_operator",
  domains: ["customer", "operations", "growth"],
  guidance: {
    headline: "One visitor is ready for a scoped handoff",
    summary: "Avery answered the public questions, confirmed service area and project type, and held private follow-up until the owner approves the handoff.",
    suggested_prompt: "Show me the visitor's request, what was verified, and what would enter the private office after approval.",
    mode: "needs_you",
  },
  loops: [
    {
      id: "loop_website_visitor",
      title: "Qualify the Cedar Street repaint request",
      summary: "A visitor asked about repainting a two-story exterior and supplied the neighborhood, target month, and preferred contact channel.",
      state: "needs_you",
      horizon: "now",
      domain: "customer",
      updated_at: FIXTURE_TIME,
      next_step: "Approve the private office handoff or ask Avery to collect one more detail.",
      return_condition: null,
      source_envelope_ids: [],
      target: { kind: "visitor_request", id: "visitor_cedar_street" },
      proof: { assignment_id: "asn_fixture_website", source_table: "fixture_public_sessions", source_id: "visitor_cedar_street" },
    },
  ],
  saves: [
    {
      id: "save_website_photos",
      title: "Wait for exterior photos",
      why_held: "The visitor said photos are available after work; Avery should not make a scope claim before they arrive.",
      state: "watching",
      return_condition: { kind: "event", description: "Return when the visitor uploads exterior photos.", source: "public website session" },
      loop_id: "loop_website_visitor",
      target: { kind: "visitor_request", id: "visitor_cedar_street" },
      proof: { assignment_id: "asn_fixture_website", source_table: "fixture_public_saves", source_id: "save_website_photos" },
    },
  ],
  decisions: [
    {
      id: "decision_website_handoff",
      title: "Move this visitor into the private office",
      consequence: "Approval would create a private lead record and prepare an email follow-up; no message is sent in this fixture.",
      risk: "medium",
      target: { kind: "fixture_handoff", id: "visitor_cedar_street" },
      proof: { assignment_id: "asn_fixture_website", source_table: "fixture_public_decisions", source_id: "decision_website_handoff" },
    },
  ],
  changes: [
    {
      id: "change_website_scope",
      title: "Visitor supplied a complete first-pass scope",
      summary: "Exterior repaint, two stories, Cedar Street area, target month September, email preferred.",
      source: "public website",
      state: "observed",
      occurred_at: FIXTURE_TIME,
      loop_id: "loop_website_visitor",
      proof: { assignment_id: "asn_fixture_website", source_table: "fixture_public_events", source_id: "change_website_scope" },
    },
  ],
  delegated: [
    {
      id: "delegation_website_service_area",
      parent_loop_id: "loop_website_visitor",
      title: "Check service area and project fit",
      purpose: "Confirm the address is inside the operating radius and the request matches supported exterior work.",
      executor_kind: "system",
      executor_label: "Service-area checker",
      state: "done",
      result_summary: "Inside service area; exterior repaint is supported.",
      started_at: "2026-07-19T11:58:00.000Z",
      updated_at: FIXTURE_TIME,
      proof: { assignment_id: "asn_fixture_website", delegation_id: "delegation_website_service_area", child_run_id: "run_website_area" },
    },
  ],
  evidence: [
    {
      id: "evidence_website_summary",
      title: "Visitor request summary",
      summary: "Owner-safe public transcript summary with supplied facts, unanswered questions, consent boundary, and proposed handoff.",
      state: "draft",
      recorded_at: FIXTURE_TIME,
      proof: { assignment_id: "asn_fixture_website", artifact_id: "artifact_website_summary", source_table: "fixture_public_artifacts", source_id: "artifact_website_summary" },
    },
  ],
  connections: [
    connection("website", "Public website", "custom", "working", "Qualify visitors and preserve the public/private boundary.", "Visitor scope received"),
    connection("email", "Business email", "communication", "connected", "Prepare owner-approved follow-up and watch for replies."),
    connection("calendar", "Estimate calendar", "calendar", "connected", "Offer approved estimate windows after the lead enters the office."),
  ],
  abilities: [
    ability("public-guidance", "Public visitor guidance", "communication", "ready", "Answer bounded public questions without exposing private business state."),
    ability("lead-handoff", "Qualified lead handoff", "office", "policy_gated", "Prepare a private lead package and wait for the owner boundary."),
  ],
  heartbeat: [
    "Binding the public session to the website employee and visitor request.",
    "Checking service area, project fit, and consent boundary.",
    "Preparing a private handoff without sending or creating a real lead.",
  ],
};

const OFFICE_SPEC: FixtureScenarioSpec = {
  id: "office",
  employeeName: "Avery Office",
  businessName: "Palmer Home Services",
  businessKind: "multi-trade service office",
  profileKey: "multi_role_office_operator",
  domains: ["operations", "people", "finance", "customer"],
  guidance: {
    headline: "Monday's schedule needs one owner tradeoff",
    summary: "Avery aligned the dispatcher, estimator, bookkeeper, and field-team obligations, but moving one crew changes a customer promise and overtime exposure.",
    suggested_prompt: "Show the roles affected, the safest schedule option, and the customer and payroll consequences.",
    mode: "needs_you",
  },
  loops: [
    {
      id: "loop_office_schedule",
      title: "Coordinate Monday field schedule",
      summary: "Three crews, two estimate appointments, one urgent callback, and one weather-sensitive exterior job share the same capacity window.",
      state: "needs_you",
      horizon: "now",
      domain: "operations",
      updated_at: FIXTURE_TIME,
      next_step: "Choose whether to protect the exterior promise or avoid overtime.",
      source_envelope_ids: [],
      target: { kind: "schedule_plan", id: "monday_schedule_v3" },
      proof: { assignment_id: "asn_fixture_office", source_table: "fixture_office_loops", source_id: "loop_office_schedule" },
    },
    {
      id: "loop_office_payroll",
      title: "Close two payroll exceptions",
      summary: "The bookkeeper needs one missing break attestation and one corrected job code before payroll export.",
      state: "active",
      horizon: "now",
      domain: "finance",
      updated_at: "2026-07-19T11:54:00.000Z",
      next_step: "Collect the field supervisor confirmations.",
      source_envelope_ids: [],
      target: { kind: "payroll_batch", id: "payroll_week_29" },
      proof: { assignment_id: "asn_fixture_office", source_table: "fixture_office_loops", source_id: "loop_office_payroll" },
    },
  ],
  saves: [
    {
      id: "save_office_weather",
      title: "Watch Monday weather threshold",
      why_held: "The exterior crew plan is safe only while precipitation remains below the operating threshold.",
      state: "watching",
      return_condition: { kind: "threshold", description: "Return if Monday precipitation probability rises above 35%.", source: "weather planning feed" },
      loop_id: "loop_office_schedule",
      target: { kind: "schedule_plan", id: "monday_schedule_v3" },
      proof: { assignment_id: "asn_fixture_office", source_table: "fixture_office_saves", source_id: "save_office_weather" },
    },
  ],
  decisions: [
    {
      id: "decision_office_schedule",
      title: "Move Crew B to the exterior job",
      consequence: "This protects the weather-sensitive promise but creates 2.5 projected overtime hours and moves one non-urgent callback to Tuesday.",
      risk: "high",
      target: { kind: "schedule_plan", id: "monday_schedule_v3" },
      proof: { assignment_id: "asn_fixture_office", source_table: "fixture_office_decisions", source_id: "decision_office_schedule" },
    },
  ],
  changes: [
    {
      id: "change_office_customer_reply",
      title: "Customer accepted a narrower arrival window",
      summary: "The exterior customer can receive the crew from 8:00–10:00 AM, reducing travel conflict.",
      source: "email",
      state: "observed",
      occurred_at: FIXTURE_TIME,
      loop_id: "loop_office_schedule",
      proof: { assignment_id: "asn_fixture_office", source_table: "fixture_office_events", source_id: "change_office_customer_reply" },
    },
  ],
  delegated: [
    delegation("office_dispatch", "loop_office_schedule", "Build feasible crew routes", "Compare travel, skills, promised windows, and current job state.", "system", "done", "Two feasible schedules remain."),
    delegation("office_bookkeeping", "loop_office_payroll", "Resolve payroll exceptions", "Collect the missing attestations and verify job codes.", "human", "working", "One of two confirmations received."),
    delegation("office_estimator", "loop_office_schedule", "Protect estimate appointments", "Confirm the estimator can keep both appointments under the proposed field schedule.", "specialist_agent", "done", "Both estimate appointments remain intact."),
  ],
  evidence: [
    evidence("office_schedule_matrix", "Role and schedule impact matrix", "Crew capacity, travel time, customer promises, overtime, and role ownership for both feasible options.", "recorded"),
    evidence("office_payroll_packet", "Payroll exception packet", "Missing items, current owners, and the exact export blocker.", "draft"),
  ],
  connections: [
    connection("office-email", "Shared office email", "communication", "working", "Watch customer and staff replies and prepare approved communication.", "Customer schedule reply received"),
    connection("office-calendar", "Team calendar", "calendar", "working", "Coordinate role-aware appointments and field commitments."),
    connection("office-accounting", "QuickBooks", "accounting", "working", "Prepare payroll and accounting work behind policy and approval."),
    connection("office-field", "Field operations", "custom", "working", "Read job, crew, and route state from the operating system."),
  ],
  abilities: [
    ability("office-coordinate", "Cross-role office coordination", "office", "ready", "Arrange work by obligation and dependency rather than app or department."),
    ability("office-payroll", "Payroll preparation", "accounting", "policy_gated", "Prepare exceptions and export-ready work without authorizing payroll."),
  ],
  heartbeat: [
    "Binding the owner, office roles, assignments, and current schedule version.",
    "Reconciling customer promises with crew capacity and travel time.",
    "Preparing one owner tradeoff with role and payroll consequences.",
  ],
};

const PERSONAL_BRAIN_SPEC: FixtureScenarioSpec = {
  id: "personal-brain",
  employeeName: "Avery Brain",
  businessName: "Personal operating system",
  businessKind: "research-only personal knowledge fixture",
  profileKey: "personal_operating_brain",
  domains: ["research", "operations", "custom"],
  guidance: {
    headline: "Your weekly review is assembled",
    summary: "Avery grouped commitments, unresolved decisions, saved intentions, and source-backed notes without taking any external action.",
    suggested_prompt: "Show what changed this week, what I am still holding, and the three decisions with the highest downstream cost.",
    mode: "working",
  },
  loops: [
    {
      id: "loop_brain_weekly_review",
      title: "Prepare the weekly founder review",
      summary: "Projects, commitments, decisions, notes, and open questions are grouped by outcome and dependency.",
      state: "active",
      horizon: "now",
      domain: "operations",
      updated_at: FIXTURE_TIME,
      next_step: "Review the three decisions and convert any accepted direction into explicit work.",
      source_envelope_ids: [],
      target: { kind: "review", id: "weekly_review_29" },
      proof: { assignment_id: "asn_fixture_brain", source_table: "fixture_brain_loops", source_id: "loop_brain_weekly_review" },
    },
  ],
  saves: [
    {
      id: "save_brain_pricing",
      title: "Return to pricing after customer evidence changes",
      why_held: "The current idea is plausible, but one more customer conversation would materially change confidence.",
      state: "watching",
      return_condition: { kind: "event", description: "Return after the next qualified customer pricing conversation.", source: "explicit personal save" },
      loop_id: "loop_brain_weekly_review",
      target: { kind: "decision", id: "pricing_direction" },
      proof: { assignment_id: "asn_fixture_brain", source_table: "fixture_brain_saves", source_id: "save_brain_pricing" },
    },
  ],
  decisions: [],
  changes: [
    {
      id: "change_brain_commitment",
      title: "A dormant commitment now conflicts with Tuesday launch work",
      summary: "A saved research task is due in the same block reserved for production acceptance.",
      source: "personal commitments",
      state: "observed",
      occurred_at: FIXTURE_TIME,
      loop_id: "loop_brain_weekly_review",
      proof: { assignment_id: "asn_fixture_brain", source_table: "fixture_brain_events", source_id: "change_brain_commitment" },
    },
  ],
  delegated: [
    delegation("brain_group_notes", "loop_brain_weekly_review", "Group notes by active outcome", "Separate durable facts, hypotheses, commitments, and discarded ideas.", "system", "done", "Thirty-one notes grouped into six active outcomes."),
    delegation("brain_source_check", "loop_brain_weekly_review", "Verify source-backed claims", "Mark claims with primary support, contradiction, or missing provenance.", "specialist_agent", "working", "Two claims still need a primary source."),
  ],
  evidence: [
    evidence("brain_review", "Weekly operating review", "Active outcomes, saved intentions, decisions, stale assumptions, and source boundaries.", "draft"),
  ],
  connections: [
    connection("brain-notes", "Notes", "documents", "working", "Read explicit notes and preserve provenance without exposing private memory internals."),
    connection("brain-calendar", "Calendar", "calendar", "connected", "Compare commitments and available time without creating events silently."),
    connection("brain-email", "Email", "communication", "connected", "Use explicitly selected messages as context; no autonomous sending."),
  ],
  abilities: [
    ability("brain-saves", "Explicit future intentions", "office", "ready", "Hold a reason and return condition so the user does not carry it mentally."),
    ability("brain-synthesis", "Source-aware synthesis", "research", "ready", "Separate fact, hypothesis, decision, and missing evidence."),
  ],
  heartbeat: [
    "Binding the explicit review scope and selected owner-safe sources.",
    "Grouping commitments, saves, and unresolved decisions by outcome.",
    "Checking provenance before presenting the weekly review.",
  ],
};

const CLOTHING_SPEC: FixtureScenarioSpec = {
  id: "clothing-ops",
  employeeName: "Avery Operations",
  businessName: "Northstar Supply Co.",
  businessKind: "independent apparel brand and fulfillment operation",
  profileKey: "shopify_apparel_operations",
  domains: ["commerce", "operations", "finance", "customer"],
  guidance: {
    headline: "Approve one material buy to keep 42 orders on schedule",
    summary: "Avery reconciled Shopify orders, blank inventory, embroidery capacity, supplier pricing, fulfillment promises, and margin impact. The recommended buy is held at the money gate.",
    suggested_prompt: "Show the order-to-material calculation, supplier price change, production capacity, margin impact, and the safest purchase option.",
    mode: "needs_you",
  },
  loops: [
    {
      id: "loop_clothing_drop",
      title: "Fulfill Drop 07 without stockouts",
      summary: "Forty-two open orders require 96 garment units across four sizes, two colorways, embroidery, packaging, and carrier labels.",
      state: "needs_you",
      horizon: "now",
      domain: "commerce",
      updated_at: FIXTURE_TIME,
      next_step: "Approve, revise, or decline the recommended blank-garment purchase.",
      source_envelope_ids: [],
      target: { kind: "production_batch", id: "drop_07_batch" },
      proof: { assignment_id: "asn_fixture_clothing", source_table: "fixture_clothing_loops", source_id: "loop_clothing_drop" },
    },
    {
      id: "loop_clothing_delay",
      title: "Recover the delayed embroidery batch",
      summary: "The embroidery partner is six hours behind; eleven priority orders can still ship on time if the batch sequence changes.",
      state: "active",
      horizon: "now",
      domain: "operations",
      updated_at: "2026-07-19T11:56:00.000Z",
      next_step: "Confirm the revised production sequence and prepare customer communication only for orders that will miss promise.",
      source_envelope_ids: [],
      target: { kind: "production_batch", id: "embroidery_batch_0719" },
      proof: { assignment_id: "asn_fixture_clothing", source_table: "fixture_clothing_loops", source_id: "loop_clothing_delay" },
    },
  ],
  saves: [
    {
      id: "save_clothing_inventory",
      title: "Watch black heavyweight blank inventory",
      why_held: "Demand is accelerating and the supplier lead time is now the limiting dependency.",
      state: "needs_you",
      return_condition: { kind: "threshold", description: "Return when projected available black heavyweight blanks fall below 1.25 times committed demand.", source: "order-to-material calculator" },
      loop_id: "loop_clothing_drop",
      target: { kind: "inventory_sku", id: "blank_heavy_black" },
      proof: { assignment_id: "asn_fixture_clothing", source_table: "fixture_clothing_saves", source_id: "save_clothing_inventory" },
    },
  ],
  decisions: [
    {
      id: "decision_clothing_po",
      title: "Purchase 120 heavyweight black blanks",
      consequence: "The proposed $4,860 purchase covers committed demand plus 25% safety stock, preserves the current ship promise, and lowers projected Drop 07 gross margin by 1.8 points after the supplier increase.",
      risk: "high",
      target: { kind: "purchase_order", id: "po_northstar_0719" },
      proof: { assignment_id: "asn_fixture_clothing", source_table: "fixture_clothing_decisions", source_id: "decision_clothing_po" },
    },
  ],
  changes: [
    {
      id: "change_clothing_orders",
      title: "Fourteen Shopify orders arrived since 8:00 AM",
      summary: "Demand added 31 garment units, concentrated in medium and large black heavyweight blanks.",
      source: "Shopify",
      state: "observed",
      occurred_at: FIXTURE_TIME,
      loop_id: "loop_clothing_drop",
      proof: { assignment_id: "asn_fixture_clothing", source_table: "fixture_clothing_events", source_id: "shopify_orders_0719" },
    },
    {
      id: "change_clothing_supplier",
      title: "Supplier raised heavyweight blank cost 6.2%",
      summary: "The new quote applies to orders placed after 2:00 PM and changes the margin of two reorder options.",
      source: "supplier email",
      state: "observed",
      occurred_at: "2026-07-19T11:57:00.000Z",
      loop_id: "loop_clothing_drop",
      proof: { assignment_id: "asn_fixture_clothing", source_table: "fixture_clothing_events", source_id: "supplier_quote_0719" },
    },
  ],
  delegated: [
    delegation("clothing_material_calc", "loop_clothing_drop", "Calculate material demand by order", "Expand every Shopify line item into garment, thread, label, packaging, and carrier-label requirements.", "system", "done", "Ninety-six garment units, 103 packaging units, and two thread colors required after spoilage allowance."),
    delegation("clothing_supplier_compare", "loop_clothing_drop", "Compare supplier options", "Normalize unit cost, freight, lead time, minimum order, and defect allowance.", "specialist_agent", "done", "The 120-unit local-supplier option is the lowest schedule-risk choice."),
    delegation("clothing_fulfillment", "loop_clothing_delay", "Re-sequence fulfillment", "Protect priority ship promises while the embroidery batch is delayed.", "system", "working", "Eleven priority orders protected; four standard orders remain at risk."),
    delegation("clothing_customer_comms", "loop_clothing_delay", "Prepare exception communication", "Draft messages only for orders that will actually miss the customer promise.", "specialist_agent", "waiting", "Waiting for final production sequence."),
  ],
  evidence: [
    evidence("clothing_material_sheet", "Order-to-material requirements", "Per-order and aggregate garment, thread, label, packaging, spoilage, and carrier-label demand.", "recorded"),
    evidence("clothing_margin_model", "Purchase and margin comparison", "Three supplier options with landed cost, lead time, stockout risk, and projected gross-margin impact.", "recorded"),
    evidence("clothing_fulfillment_plan", "Revised production and fulfillment plan", "Batch order, capacity, priority orders, risk window, and communication threshold.", "draft"),
  ],
  connections: [
    connection("clothing-shopify", "Shopify", "store", "working", "Read orders, products, variants, fulfillment state, and customer promises.", "Fourteen new orders ingested"),
    connection("clothing-email", "Operations email", "communication", "working", "Watch supplier and fulfillment replies and prepare approved communication.", "Supplier quote changed"),
    connection("clothing-brain", "Business brain", "custom", "working", "Use product BOMs, spoilage rules, margin targets, supplier preferences, and promise policies."),
    connection("clothing-material", "Material price feed", "custom", "working", "Use current approved supplier quotes in the material calculator."),
    connection("clothing-accounting", "Accounting", "accounting", "connected", "Prepare purchase and margin records after approval and durable receipt."),
  ],
  abilities: [
    ability("clothing-orders", "Order and fulfillment operations", "office", "ready", "Carry orders from intake through production dependencies and fulfillment exceptions."),
    ability("clothing-materials", "Order-to-material calculation", "automation", "ready", "Convert product variants and quantities into material requirements with spoilage allowance."),
    ability("clothing-purchasing", "Purchase preparation", "money", "policy_gated", "Prepare supplier choices and purchase orders, then stop at the money gate."),
    ability("clothing-email", "Supplier and customer communication", "communication", "policy_gated", "Prepare bounded messages and send only after the required authority path."),
  ],
  heartbeat: [
    "Binding Shopify orders, product BOMs, inventory, supplier quotes, and fulfillment promises.",
    "Calculating garment, thread, label, packaging, spoilage, and carrier-label demand.",
    "Comparing landed cost, lead time, stockout risk, capacity, and margin impact.",
    "Preparing one purchase decision and a revised fulfillment sequence.",
  ],
};

const SPECS: Record<FixtureScenarioSpec["id"], FixtureScenarioSpec> = {
  website: WEBSITE_SPEC,
  office: OFFICE_SPEC,
  "personal-brain": PERSONAL_BRAIN_SPEC,
  "clothing-ops": CLOTHING_SPEC,
};

const COMMAND_CONFIG: Record<FixtureScenarioId, FixtureCommandConfig> = {
  contractor: {
    domain: "customer",
    delegatedTitle: "Prepare the job package",
    delegatedPurpose: "Combine customer scope, estimate assumptions, schedule, and communication into one reviewable package.",
    evidenceTitle: "Draft job package",
    evidenceSummary: "Fixture-only estimate, schedule, customer reply, and next-step record.",
    decision: {
      title: "Approve the customer job package",
      consequence: "Approval would allow the employee to send the customer-facing package and continue within the exact gate; this fixture performs no send or money effect.",
      risk: "high",
    },
  },
  website: {
    domain: "customer",
    delegatedTitle: "Assemble the private handoff",
    delegatedPurpose: "Separate public facts, private office context, consent, and the next owner-safe action.",
    evidenceTitle: "Qualified visitor handoff",
    evidenceSummary: "Fixture-only public-to-private handoff with source facts and unanswered questions.",
    decision: {
      title: "Approve the private office handoff",
      consequence: "Approval would create the private lead and prepare follow-up; the fixture does not create or send anything.",
      risk: "medium",
    },
  },
  office: {
    domain: "operations",
    delegatedTitle: "Reconcile role and schedule dependencies",
    delegatedPurpose: "Compare customer promises, staff roles, capacity, payroll, and downstream conflicts.",
    evidenceTitle: "Cross-role operating plan",
    evidenceSummary: "Fixture-only role, dependency, schedule, and consequence matrix.",
    decision: {
      title: "Approve the cross-role operating change",
      consequence: "Approval would change team commitments and may prepare customer or staff communication; no real schedule changes occur in this fixture.",
      risk: "high",
    },
  },
  "personal-brain": {
    domain: "operations",
    delegatedTitle: "Organize the explicit personal outcome",
    delegatedPurpose: "Separate fact, hypothesis, commitment, decision, and future return condition.",
    evidenceTitle: "Personal operating note",
    evidenceSummary: "Fixture-only synthesis with provenance and no external action.",
    returnCondition: { kind: "owner", description: "Return during the next explicit review or when the user asks for this outcome again.", source: "fixture personal save" },
  },
  research: {
    domain: "research",
    delegatedTitle: "Verify the source trail",
    delegatedPurpose: "Trace material claims to primary sources and preserve contradiction and uncertainty.",
    evidenceTitle: "Source-backed synthesis update",
    evidenceSummary: "Fixture-only claim matrix, source trail, confidence boundary, and next research question.",
    decision: {
      title: "Choose the recommendation scope",
      consequence: "The choice changes whether the final synthesis stays narrow or generalizes beyond the evidence.",
      risk: "medium",
    },
  },
  "clothing-ops": {
    domain: "commerce",
    delegatedTitle: "Calculate order, material, and fulfillment impact",
    delegatedPurpose: "Reconcile current orders, BOMs, inventory, supplier quotes, capacity, margin, and customer promises.",
    evidenceTitle: "Order-to-material and fulfillment recommendation",
    evidenceSummary: "Fixture-only requirements, supplier comparison, capacity plan, margin impact, and customer-risk threshold.",
    decision: {
      title: "Approve the recommended material purchase",
      consequence: "Approval would authorize a bounded supplier purchase and downstream accounting record; this fixture performs no purchase or external write.",
      risk: "high",
    },
  },
};

export function fixtureRuntimeForEmployee(employeeId: string): FixtureRuntimeSession {
  const scenario = scenarioForEmployee(employeeId);
  const initialPayload = scenario.id === "contractor"
    ? fixtureResourcePayload(employeeId)
    : scenario.id === "research"
      ? researchFixtureResourcePayload(employeeId)
      : buildScenarioPayload(employeeId, SPECS[scenario.id]);
  const summaries = scenario.id === "contractor"
    ? [
      "Binding the contractor employee, assignment, customer job, and current work state.",
      "Reconciling estimate, customer reply, deposit, schedule, and follow-up dependencies.",
      "Preparing the next exact owner decision and fixture evidence.",
    ]
    : scenario.id === "research"
      ? [
        "Binding the research question, source policy, session, and current claim state.",
        "Comparing primary evidence and preserving contradictory findings.",
        "Preparing one scoped recommendation decision with source-backed evidence.",
      ]
      : SPECS[scenario.id].heartbeat;
  const initialProjection = projection(scenario.id, 0, "starting", "active", summaries[0]);
  const frames = summaries.slice(1).map((summary, index) => ({
    after_ms: 700 + index * 1200,
    projection: projection(
      scenario.id,
      index + 1,
      index === summaries.length - 2 ? "waiting" : "working",
      index === summaries.length - 2 ? "waiting" : "active",
      summary,
      700 + index * 1200,
    ),
    progress: summary,
  }));
  frames.push({
    after_ms: 700 + summaries.length * 1200,
    projection: projection(scenario.id, summaries.length, "completed", "completed", "Fixture projection reached its current stable state.", 700 + summaries.length * 1200),
    progress: "",
  });
  return { scenario, initial_payload: initialPayload, initial_projection: initialProjection, frames };
}

export function planFixtureCommand(
  current: ResourcePayload,
  currentOperating: OperatingSurfaceState,
  scenarioId: FixtureScenarioId,
  body: string,
  now = new Date().toISOString(),
): FixtureCommandPlan {
  const config = COMMAND_CONFIG[scenarioId];
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const assignmentId = currentOperating.context.assignment_id || current.assignment_id || `asn_fixture_${scenarioId}`;
  const commandTitle = commandTitleFrom(body);
  const loopId = `loop_fixture_command_${nonce}`;
  const delegationId = `delegation_fixture_command_${nonce}`;
  const evidenceId = `evidence_fixture_command_${nonce}`;
  const decisionId = `decision_fixture_command_${nonce}`;
  const saveId = `save_fixture_command_${nonce}`;

  const formingLoop: OperatingWorkLoop = {
    id: loopId,
    title: commandTitle,
    summary: "The fixture runtime accepted this as a bounded owner outcome and is projecting the work before any real provider or business effect.",
    state: "forming",
    horizon: "now",
    domain: config.domain,
    updated_at: now,
    next_step: "Bind context, delegate the bounded analysis, and return a decision, save, or evidence.",
    return_condition: null,
    source_envelope_ids: [],
    target: { kind: "fixture_command", id: loopId },
    proof: { assignment_id: assignmentId, source_table: "fixture_commands", source_id: loopId },
  };
  const queuedDelegation: DelegatedWorkUnit = {
    id: delegationId,
    parent_loop_id: loopId,
    title: config.delegatedTitle,
    purpose: config.delegatedPurpose,
    executor_kind: "hermes_subagent",
    executor_label: "Fixture bounded worker",
    state: "queued",
    started_at: now,
    updated_at: now,
    proof: { assignment_id: assignmentId, delegation_id: delegationId, parent_run_id: `run_fixture_${nonce}`, child_run_id: `child_fixture_${nonce}` },
  };

  const acceptedOperating = relayout({
    ...currentOperating,
    generated_at: now,
    guidance: {
      headline: `${currentOperating.context.employee_name} accepted the fixture outcome`,
      summary: "Context is bound, the work loop is forming, and bounded delegated analysis is starting. No provider, customer, money, publishing, inventory, or runtime effect is occurring.",
      suggested_prompt: null,
      mode: "working",
    },
    focus_loop_id: loopId,
    loops: [formingLoop, ...currentOperating.loops],
    delegated_work: [queuedDelegation, ...currentOperating.delegated_work],
  });

  const completedLoop: OperatingWorkLoop = {
    ...formingLoop,
    state: config.decision ? "needs_you" : config.returnCondition ? "waiting" : "active",
    updated_at: offsetIso(now, 1800),
    next_step: config.decision
      ? "Review the fixture decision and consequence."
      : config.returnCondition
        ? "The employee will hold this until the explicit return condition is met."
        : "Continue the bounded fixture work.",
    return_condition: config.returnCondition ?? null,
  };
  const completedDelegation: DelegatedWorkUnit = {
    ...queuedDelegation,
    state: "done",
    result_summary: "The bounded fixture analysis completed and returned to the parent employee surface.",
    updated_at: offsetIso(now, 1600),
  };
  const newEvidence: OperatingEvidence = {
    id: evidenceId,
    title: config.evidenceTitle,
    summary: config.evidenceSummary,
    state: "draft",
    recorded_at: offsetIso(now, 1800),
    proof: { assignment_id: assignmentId, artifact_id: `artifact_${evidenceId}`, source_table: "fixture_evidence", source_id: evidenceId },
  };
  const newDecision: OperatingDecision | null = config.decision
    ? {
      id: decisionId,
      title: config.decision.title,
      consequence: config.decision.consequence,
      risk: config.decision.risk,
      target: { kind: "fixture_decision", id: decisionId },
      proof: { assignment_id: assignmentId, source_table: "fixture_decisions", source_id: decisionId },
    }
    : null;
  const newSave: ActiveSave | null = config.returnCondition
    ? {
      id: saveId,
      title: commandTitle,
      why_held: "The owner explicitly asked the fixture employee to preserve this outcome for a future return condition.",
      state: "watching",
      return_condition: config.returnCondition,
      loop_id: loopId,
      target: { kind: "fixture_command", id: loopId },
      proof: { assignment_id: assignmentId, source_table: "fixture_saves", source_id: saveId },
    }
    : null;

  const completedOperating = relayout({
    ...acceptedOperating,
    generated_at: offsetIso(now, 1800),
    guidance: newDecision
      ? {
        headline: "One fixture decision is ready",
        summary: "The employee completed the bounded analysis and returned the consequential branch to the owner. No real action has occurred.",
        suggested_prompt: "Explain the consequence, evidence, and what would happen after approval.",
        mode: "needs_you",
      }
      : newSave
        ? {
          headline: "The fixture employee is holding this for return",
          summary: "The outcome, reason, source, and return condition are explicit. No notification or external action is implied.",
          suggested_prompt: "Show the saved intention and exactly what will bring it back.",
          mode: "quiet",
        }
        : {
          headline: "Fixture work is projected",
          summary: "The bounded result and evidence are visible without claiming a provider or external effect.",
          suggested_prompt: "Show the result, evidence, and next safe step.",
          mode: "working",
        },
    focus_loop_id: loopId,
    loops: [completedLoop, ...currentOperating.loops],
    active_saves: newSave ? [newSave, ...currentOperating.active_saves] : currentOperating.active_saves,
    decisions: newDecision ? [newDecision, ...currentOperating.decisions] : currentOperating.decisions,
    delegated_work: [completedDelegation, ...currentOperating.delegated_work],
    evidence: [newEvidence, ...currentOperating.evidence],
  });

  const accepted = {
    ...current,
    operating_state: acceptedOperating,
    messages: [
      ...current.messages,
      { id: `fixture_owner_${nonce}`, direction: "from_owner", body, status: "delivered", created_at: now },
      { id: `fixture_employee_started_${nonce}`, direction: "to_owner", body: "I bound this fixture outcome to the current employee and context. I am projecting the work without touching a provider or business system.", status: "delivered", created_at: offsetIso(now, 100) },
    ],
    tasks: [
      { id: `task_${loopId}`, type: "work" as const, title: commandTitle, status: "in_progress" as const, summary: formingLoop.summary, created_at: now, target_id: loopId },
      ...(current.tasks ?? []),
    ],
  } satisfies ResourcePayload;

  const completed = {
    ...accepted,
    operating_state: completedOperating,
    messages: [
      ...accepted.messages,
      { id: `fixture_employee_completed_${nonce}`, direction: "to_owner", body: newDecision ? "The bounded fixture analysis is complete. I returned the consequential branch for your decision and recorded draft evidence." : newSave ? "I saved the outcome with an explicit reason and return condition. No external effect occurred." : "The bounded fixture work is projected with draft evidence. No external effect occurred.", status: "delivered", created_at: offsetIso(now, 1800) },
    ],
    outputs: [
      { id: `output_${evidenceId}`, type: "artifact" as const, title: newEvidence.title, status: "draft", created_at: newEvidence.recorded_at, artifact_id: `artifact_${evidenceId}`, summary: newEvidence.summary },
      ...(current.outputs ?? []),
    ],
    tasks: [
      ...(newDecision ? [{ id: `task_${decisionId}`, type: "question" as const, title: newDecision.title, status: "needs_you" as const, summary: newDecision.consequence, created_at: offsetIso(now, 1800), target_id: decisionId }] : []),
      ...(newSave ? [{ id: `task_${saveId}`, type: "reminder" as const, title: newSave.title, status: "scheduled" as const, summary: newSave.return_condition.description, created_at: offsetIso(now, 1800), target_id: saveId }] : []),
      { id: `task_${loopId}`, type: "work" as const, title: commandTitle, status: newDecision ? "needs_you" as const : newSave ? "scheduled" as const : "in_progress" as const, summary: completedLoop.next_step ?? completedLoop.summary, created_at: now, target_id: loopId },
      ...(current.tasks ?? []),
    ],
  } satisfies ResourcePayload;

  const runId = `run_fixture_command_${nonce}`;
  return {
    accepted,
    completed,
    completion_delay_ms: 1800,
    frames: [
      { after_ms: 0, projection: commandProjection(runId, 0, "starting", "active", "Binding the exact fixture employee, assignment, context, and stable intent.", now), progress: "Binding the fixture context" },
      { after_ms: 450, projection: commandProjection(runId, 1, "working", "active", config.delegatedPurpose, offsetIso(now, 450)), progress: config.delegatedTitle },
      { after_ms: 1100, projection: commandProjection(runId, 2, "working", "active", "Reducing the result into an owner-safe decision, save, or evidence object.", offsetIso(now, 1100)), progress: "Preparing the owner-safe result" },
      { after_ms: 1800, projection: commandProjection(runId, 3, newDecision ? "waiting" : "completed", newDecision ? "waiting" : "completed", newDecision ? "Fixture work is waiting for the owner's explicit decision." : "Fixture projection completed with no external effect.", offsetIso(now, 1800)), progress: "" },
    ],
  };
}

export function scenarioForEmployee(employeeId: string): typeof FIXTURE_SCENARIOS[number] {
  const normalized = employeeId.toLowerCase();
  if (normalized.includes("clothing") || normalized.includes("shopify") || normalized.includes("apparel")) return FIXTURE_SCENARIOS.find((item) => item.id === "clothing-ops")!;
  if (normalized.includes("personal") || normalized.includes("brain")) return FIXTURE_SCENARIOS.find((item) => item.id === "personal-brain")!;
  if (normalized.includes("research")) return FIXTURE_SCENARIOS.find((item) => item.id === "research")!;
  if (normalized.includes("office") || normalized.includes("multi-role") || normalized.includes("multi_person")) return FIXTURE_SCENARIOS.find((item) => item.id === "office")!;
  if (normalized.includes("website") || normalized.includes("front-door") || normalized.includes("public")) return FIXTURE_SCENARIOS.find((item) => item.id === "website")!;
  return FIXTURE_SCENARIOS.find((item) => item.id === "contractor")!;
}

function buildScenarioPayload(employeeId: string, spec: FixtureScenarioSpec): ResourcePayload {
  const accountId = `acct_fixture_${spec.id.replace(/-/g, "_")}`;
  const assignmentId = `asn_fixture_${spec.id.replace(/-/g, "_")}`;
  const context: OperatingContextManifest = {
    version: 1,
    generated_at: FIXTURE_TIME,
    account_id: accountId,
    assignment_id: assignmentId,
    employee_id: employeeId,
    employee_name: spec.employeeName,
    business_name: spec.businessName,
    business_kind: spec.businessKind,
    profile_key: spec.profileKey,
    profile_version: "fixture-v1",
    session_id: `session_fixture_${spec.id.replace(/-/g, "_")}`,
    session_last_active: FIXTURE_TIME,
    runtime_context_version: `fixture-context-${spec.id}-v1`,
    doctrine_versions: {
      agents: "fixture-agents-v1",
      codegraph: "fixture-codegraph-v1",
      design_system: "2026-07-19",
      agent_interface: "2026-07-19",
    },
    dominant_domains: spec.domains,
    owner_experience: spec.id === "office" || spec.id === "clothing-ops" ? "expert" : "standard",
    preferred_density: spec.id === "office" || spec.id === "clothing-ops" ? "dense" : "balanced",
    signals: [
      {
        id: `signal_fixture_${spec.id}`,
        source: "manifest",
        key: "fixture_scenario",
        label: "Fixture scenario",
        value: spec.id,
        confidence: "high",
        freshness: "static",
        authority: "product_doctrine",
        owner_safe: true,
      },
      {
        id: `signal_profile_${spec.id}`,
        source: "profile",
        key: "profile",
        label: "Employee profile",
        value: spec.profileKey,
        confidence: "high",
        freshness: "current",
        authority: "profile_fact",
        owner_safe: true,
        updated_at: FIXTURE_TIME,
      },
      {
        id: `signal_runtime_${spec.id}`,
        source: "runtime",
        key: "fixture_runtime",
        label: "Runtime projection",
        value: "Deterministic local heartbeat and work-state projection; no provider or external effect.",
        confidence: "high",
        freshness: "live",
        authority: "runtime_fact",
        owner_safe: true,
        updated_at: FIXTURE_TIME,
      },
    ],
  };
  const layout = planAdaptiveOperatingLayout({
    generated_at: FIXTURE_TIME,
    context_fingerprint: `sha256:fixture-${spec.id}-v1`,
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    loops: spec.loops,
    active_saves: spec.saves,
    decisions: spec.decisions,
    changes: spec.changes,
    delegated_work: spec.delegated,
    evidence: spec.evidence,
    connection_attention_count: spec.connections.filter((item) => item.state === "needs_you").length,
  });
  const operatingState: OperatingSurfaceState = {
    version: 1,
    generated_at: FIXTURE_TIME,
    guidance: spec.guidance,
    focus_loop_id: layout.focus_loop_id,
    loops: spec.loops,
    active_saves: spec.saves,
    decisions: spec.decisions,
    changes: spec.changes,
    delegated_work: spec.delegated,
    evidence: spec.evidence,
    context,
    layout,
  };

  return {
    account_id: accountId,
    assignment_id: assignmentId,
    employee_id: employeeId,
    employee: {
      id: employeeId,
      name: spec.employeeName,
      status: "working",
      profile_id: spec.profileKey,
      web_route: `/agent/${employeeId}`,
      created_at: "2026-07-19T10:00:00.000Z",
    },
    runtime_health: {
      status: "healthy",
      checked_at: FIXTURE_TIME,
      backend_type: "fixture-hermes-projection",
      api_ok: true,
      sms_number_present: false,
      message: "Deterministic fixture runtime is projecting owner-safe heartbeats and typed work. No provider is connected.",
    },
    artifacts: spec.evidence.map((item) => ({
      id: item.proof.artifact_id ?? `artifact_${item.id}`,
      kind: item.id,
      mime_type: "application/json",
      storage_ref: null,
      created_at: item.recorded_at ?? FIXTURE_TIME,
    })),
    approvals: [],
    messages: [
      {
        id: `message_fixture_${spec.id}`,
        direction: "to_owner",
        body: `Fixture operating lab: ${spec.guidance.summary}`,
        status: "delivered",
        created_at: FIXTURE_TIME,
      },
    ],
    connectors: spec.connections.map((item) => ({
      id: item.connector_id ?? `connector_${item.id}`,
      connector_key: item.id,
      provider: item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      status: item.state === "needs_you" ? "degraded" : "active",
      external_label: item.account_label ?? `${spec.businessName} fixture`,
      last_connector_test_at: FIXTURE_TIME,
      last_error: item.state === "needs_you" ? item.health ?? "Needs fixture attention" : null,
      created_at: "2026-07-19T10:00:00.000Z",
    })),
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: spec.changes.map((item) => ({
      id: item.id,
      event_type: item.source.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      status: item.state,
      created_at: item.occurred_at ?? FIXTURE_TIME,
      work_event_descriptor: {
        account_id: accountId,
        employee_id: employeeId,
        source_event_id: item.id,
        move: "observe",
        title: item.title,
        summary: item.summary,
        proof: { artifact_id: item.proof.artifact_id ?? undefined },
      },
    })),
    abilities: spec.abilities,
    capabilities: [],
    surface_envelopes: [],
    connection_surfaces: spec.connections,
    resurface_items: spec.saves.map((item) => ({
      id: item.id,
      kind: "work",
      title: item.title,
      why: item.return_condition.description,
      status: item.state === "needs_you" ? "needs_you" : item.state === "blocked" ? "blocked" : item.state === "scheduled" ? "scheduled" : "waiting",
      resurface_at: item.return_condition.due_at ?? null,
      channel: "web",
      target: item.target ? { kind: "task", id: item.target.id } : null,
      proof: item.proof,
    })),
    outputs: spec.evidence.map((item) => ({
      id: `output_${item.id}`,
      type: "artifact",
      title: item.title,
      status: item.state,
      created_at: item.recorded_at ?? FIXTURE_TIME,
      artifact_id: item.proof.artifact_id ?? `artifact_${item.id}`,
      summary: item.summary,
    })),
    tasks: [
      ...spec.decisions.map((item) => ({
        id: `task_${item.id}`,
        type: "question" as const,
        title: item.title,
        status: "needs_you" as const,
        summary: item.consequence,
        created_at: FIXTURE_TIME,
        target_id: item.id,
      })),
      ...spec.loops.map((item) => ({
        id: `task_${item.id}`,
        type: "work" as const,
        title: item.title,
        status: item.state === "needs_you" ? "needs_you" as const : item.state === "blocked" ? "blocked" as const : item.state === "failed" ? "failed" as const : item.state === "done" ? "done" as const : item.state === "waiting" ? "scheduled" as const : "in_progress" as const,
        summary: item.summary,
        created_at: item.updated_at ?? FIXTURE_TIME,
        target_id: item.id,
      })),
    ],
    operating_state: operatingState,
  };
}

function relayout(state: OperatingSurfaceState): OperatingSurfaceState {
  const layout = planAdaptiveOperatingLayout({
    generated_at: state.generated_at,
    context_fingerprint: state.layout.context_fingerprint,
    owner_experience: state.context.owner_experience,
    preferred_density: state.context.preferred_density,
    loops: state.loops,
    active_saves: state.active_saves,
    decisions: state.decisions,
    changes: state.changes,
    delegated_work: state.delegated_work,
    evidence: state.evidence,
    connection_attention_count: 0,
  });
  return { ...state, focus_loop_id: layout.focus_loop_id, layout };
}

function projection(
  scenarioId: FixtureScenarioId,
  sequence: number,
  phase: FixtureRuntimeProjection["phase"],
  health: FixtureRuntimeProjection["health"],
  summary: string,
  offsetMs = 0,
): FixtureRuntimeProjection {
  return {
    supported: true,
    source: "fixture",
    run_id: `run_fixture_${scenarioId.replace(/-/g, "_")}`,
    sequence,
    observed_at: offsetIso(FIXTURE_TIME, offsetMs),
    phase,
    health,
    summary,
    context_version: `fixture-context-${scenarioId}-v1`,
  };
}

function commandProjection(
  runId: string,
  sequence: number,
  phase: FixtureRuntimeProjection["phase"],
  health: FixtureRuntimeProjection["health"],
  summary: string,
  observedAt: string,
): FixtureRuntimeProjection {
  return {
    supported: true,
    source: "fixture",
    run_id: runId,
    sequence,
    observed_at: observedAt,
    phase,
    health,
    summary,
    context_version: "fixture-command-v1",
  };
}

function connection(
  id: string,
  label: string,
  category: ConnectionSurface["category"],
  state: ConnectionSurface["state"],
  whatEmployeeCanDo: string,
  lastEvent?: string,
): ConnectionSurface {
  return {
    id: `connection_${id}`,
    label,
    category,
    state,
    account_label: `${label} fixture`,
    health: state === "needs_you" ? "Needs fixture attention" : "Ready",
    last_event: lastEvent ?? null,
    last_action: `Fixture checked at ${FIXTURE_TIME}`,
    what_employee_can_do: whatEmployeeCanDo,
    setup_requirement: state === "not_connected" ? `Connect ${label}` : null,
    connector_id: `connector_${id}`,
    capability_keys: [`fixture:${id}`],
    proof: { source_table: "fixture_connections", source_id: `connector_${id}` },
  };
}

function ability(
  id: string,
  label: string,
  category: NonNullable<ResourcePayload["abilities"]>[number]["category"],
  status: NonNullable<ResourcePayload["abilities"]>[number]["status"],
  summary: string,
): NonNullable<ResourcePayload["abilities"]>[number] {
  return { id: `ability_${id}`, label, category, status, summary, source: status === "policy_gated" ? "policy" : "profile" };
}

function delegation(
  id: string,
  parentLoopId: string,
  title: string,
  purpose: string,
  executorKind: DelegatedWorkUnit["executor_kind"],
  state: DelegatedWorkUnit["state"],
  result: string,
): DelegatedWorkUnit {
  return {
    id: `delegation_${id}`,
    parent_loop_id: parentLoopId,
    title,
    purpose,
    executor_kind: executorKind,
    executor_label: title,
    state,
    result_summary: state === "done" ? result : null,
    blocking_reason: state === "blocked" || state === "failed" ? result : null,
    started_at: "2026-07-19T11:45:00.000Z",
    updated_at: FIXTURE_TIME,
    proof: { delegation_id: `delegation_${id}`, parent_run_id: `run_parent_${id}`, child_run_id: `run_child_${id}` },
  };
}

function evidence(id: string, title: string, summary: string, state: OperatingEvidence["state"]): OperatingEvidence {
  return {
    id: `evidence_${id}`,
    title,
    summary,
    state,
    recorded_at: FIXTURE_TIME,
    proof: { artifact_id: `artifact_${id}`, source_table: "fixture_evidence", source_id: `artifact_${id}` },
  };
}

function commandTitleFrom(body: string): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return "Fixture owner outcome";
  return clean.length <= 84 ? clean : `${clean.slice(0, 81)}…`;
}

function offsetIso(value: string, offsetMs: number): string {
  const base = Date.parse(value);
  return new Date((Number.isFinite(base) ? base : Date.now()) + offsetMs).toISOString();
}
