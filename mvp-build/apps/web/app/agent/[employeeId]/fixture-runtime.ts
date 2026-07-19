import {
  planAdaptiveOperatingLayout,
  type AbilitySummary,
  type ActiveSave,
  type ConnectionSurface,
  type DelegatedWorkUnit,
  type OperatingContextManifest,
  type OperatingDecision,
  type OperatingDomain,
  type OperatingEvidence,
  type OperatingGuidance,
  type OperatingSurfaceState,
  type OperatingSystemChange,
  type OperatingWorkLoop,
  type ProofEnvelope,
  type ResourcePayload,
  type ReturnCondition,
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
    summary: "Shopify, email, business brain, material cost, production, fulfillment, margin, and purchasing.",
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

type RequiredChange = OperatingSystemChange & { summary: string };

type CommandConfig = {
  domain: OperatingDomain;
  delegatedTitle: string;
  delegatedPurpose: string;
  evidenceTitle: string;
  evidenceSummary: string;
  decision?: Pick<OperatingDecision, "title" | "consequence" | "risk">;
  returnCondition?: ReturnCondition;
};

type ScenarioDefinition = {
  id: Exclude<FixtureScenarioId, "contractor" | "research">;
  employeeName: string;
  businessName: string;
  businessKind: string;
  profileKey: string;
  domains: OperatingDomain[];
  ownerExperience: OperatingContextManifest["owner_experience"];
  density: OperatingContextManifest["preferred_density"];
  guidance: OperatingGuidance;
  loops: OperatingWorkLoop[];
  saves: ActiveSave[];
  decisions: OperatingDecision[];
  changes: RequiredChange[];
  delegated: DelegatedWorkUnit[];
  evidence: OperatingEvidence[];
  connections: ConnectionSurface[];
  abilities: AbilitySummary[];
  heartbeat: string[];
  command: CommandConfig;
};

const scenario = (id: FixtureScenarioId) => FIXTURE_SCENARIOS.find((item) => item.id === id)!;
const assignment = (id: FixtureScenarioId) => `asn_fixture_${id.replace(/-/g, "_")}`;
const account = (id: FixtureScenarioId) => `acct_fixture_${id.replace(/-/g, "_")}`;

function proof(id: FixtureScenarioId, table: string, sourceId: string, extra: Partial<ProofEnvelope> = {}): ProofEnvelope {
  return { assignment_id: assignment(id), source_table: table, source_id: sourceId, ...extra };
}

function loop(
  scenarioId: FixtureScenarioId,
  id: string,
  title: string,
  summary: string,
  state: OperatingWorkLoop["state"],
  domain: OperatingDomain,
  nextStep: string,
  updatedAt = FIXTURE_TIME,
): OperatingWorkLoop {
  return {
    id,
    title,
    summary,
    state,
    horizon: "now",
    domain,
    updated_at: updatedAt,
    next_step: nextStep,
    return_condition: null,
    source_envelope_ids: [],
    target: { kind: "fixture_work", id },
    proof: proof(scenarioId, "fixture_work_loops", id),
  };
}

function save(
  scenarioId: FixtureScenarioId,
  id: string,
  loopId: string,
  title: string,
  whyHeld: string,
  state: ActiveSave["state"],
  condition: ReturnCondition,
): ActiveSave {
  return {
    id,
    title,
    why_held: whyHeld,
    state,
    return_condition: condition,
    loop_id: loopId,
    target: { kind: "fixture_work", id: loopId },
    proof: proof(scenarioId, "fixture_active_saves", id),
  };
}

function decision(
  scenarioId: FixtureScenarioId,
  id: string,
  title: string,
  consequence: string,
  risk: OperatingDecision["risk"],
): OperatingDecision {
  return {
    id,
    title,
    consequence,
    risk,
    target: { kind: "fixture_decision", id },
    proof: proof(scenarioId, "fixture_decisions", id),
  };
}

function change(
  scenarioId: FixtureScenarioId,
  id: string,
  loopId: string,
  title: string,
  summary: string,
  source: string,
  occurredAt = FIXTURE_TIME,
): RequiredChange {
  return {
    id,
    title,
    summary,
    source,
    state: "observed",
    occurred_at: occurredAt,
    loop_id: loopId,
    proof: proof(scenarioId, "fixture_system_changes", id),
  };
}

function delegated(
  scenarioId: FixtureScenarioId,
  id: string,
  parentLoopId: string,
  title: string,
  purpose: string,
  executorKind: DelegatedWorkUnit["executor_kind"],
  state: DelegatedWorkUnit["state"],
  result: string,
): DelegatedWorkUnit {
  return {
    id,
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
    proof: proof(scenarioId, "fixture_delegations", id, {
      delegation_id: id,
      parent_run_id: `run_parent_${id}`,
      child_run_id: `run_child_${id}`,
    }),
  };
}

function evidence(
  scenarioId: FixtureScenarioId,
  id: string,
  title: string,
  summary: string,
  state: OperatingEvidence["state"],
): OperatingEvidence {
  return {
    id,
    title,
    summary,
    state,
    recorded_at: FIXTURE_TIME,
    proof: proof(scenarioId, "fixture_evidence", id, { artifact_id: `artifact_${id}` }),
  };
}

function connection(
  scenarioId: FixtureScenarioId,
  id: string,
  label: string,
  category: ConnectionSurface["category"],
  state: ConnectionSurface["state"],
  whatEmployeeCanDo: string,
  lastEvent?: string,
): ConnectionSurface {
  return {
    id,
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
    proof: proof(scenarioId, "fixture_connections", id),
  };
}

function ability(
  id: string,
  label: string,
  category: AbilitySummary["category"],
  status: AbilitySummary["status"],
  summary: string,
): AbilitySummary {
  return {
    id,
    label,
    category,
    status,
    summary,
    source: status === "policy_gated" ? "policy" : "profile",
  };
}

const WEBSITE: ScenarioDefinition = {
  id: "website",
  employeeName: "Avery Front Door",
  businessName: "Brightside Painting",
  businessKind: "residential painting contractor",
  profileKey: "public_front_door_operator",
  domains: ["customer", "operations", "growth"],
  ownerExperience: "standard",
  density: "balanced",
  guidance: {
    headline: "One visitor is ready for a scoped handoff",
    summary: "Avery answered public questions, confirmed service area and project type, and held private follow-up until the owner approves the handoff.",
    suggested_prompt: "Show the visitor request, verified facts, missing details, and the private-office boundary.",
    mode: "needs_you",
  },
  loops: [
    loop("website", "loop_website_visitor", "Qualify the Cedar Street repaint request", "A visitor supplied project type, neighborhood, target month, and preferred contact channel.", "needs_you", "customer", "Approve the private-office handoff or ask Avery to collect one more detail."),
  ],
  saves: [
    save("website", "save_website_photos", "loop_website_visitor", "Wait for exterior photos", "Avery should not make a scope claim before the promised photos arrive.", "watching", { kind: "event", description: "Return when the visitor uploads exterior photos.", source: "public website session" }),
  ],
  decisions: [
    decision("website", "decision_website_handoff", "Move this visitor into the private office", "Approval would create a private lead record and prepare an email follow-up; the fixture sends and creates nothing.", "medium"),
  ],
  changes: [
    change("website", "change_website_scope", "loop_website_visitor", "Visitor supplied a complete first-pass scope", "Exterior repaint, two stories, Cedar Street area, September target, email preferred.", "public website"),
  ],
  delegated: [
    delegated("website", "delegation_website_service_area", "loop_website_visitor", "Check service area and project fit", "Confirm the request is inside the operating radius and matches supported exterior work.", "system", "done", "Inside service area; exterior repaint is supported."),
  ],
  evidence: [
    evidence("website", "evidence_website_summary", "Visitor request summary", "Owner-safe public transcript summary with supplied facts, unanswered questions, consent boundary, and proposed handoff.", "draft"),
  ],
  connections: [
    connection("website", "website_public", "Public website", "custom", "working", "Qualify visitors and preserve the public/private boundary.", "Visitor scope received"),
    connection("website", "website_email", "Business email", "communication", "connected", "Prepare owner-approved follow-up and watch for replies."),
    connection("website", "website_calendar", "Estimate calendar", "calendar", "connected", "Offer approved estimate windows after the lead enters the office."),
  ],
  abilities: [
    ability("ability_public_guidance", "Public visitor guidance", "communication", "ready", "Answer bounded public questions without exposing private business state."),
    ability("ability_private_handoff", "Qualified lead handoff", "office", "policy_gated", "Prepare a private lead package and stop at the owner boundary."),
  ],
  heartbeat: [
    "Binding the public session to the website employee and visitor request.",
    "Checking service area, project fit, and consent boundary.",
    "Preparing a private handoff without sending or creating a real lead.",
  ],
  command: {
    domain: "customer",
    delegatedTitle: "Assemble the private handoff",
    delegatedPurpose: "Separate public facts, private office context, consent, and the next owner-safe action.",
    evidenceTitle: "Qualified visitor handoff",
    evidenceSummary: "Fixture-only public-to-private handoff with source facts and unanswered questions.",
    decision: {
      title: "Approve the private office handoff",
      consequence: "Approval would create the private lead and prepare follow-up; the fixture performs neither action.",
      risk: "medium",
    },
  },
};

const OFFICE: ScenarioDefinition = {
  id: "office",
  employeeName: "Avery Office",
  businessName: "Palmer Home Services",
  businessKind: "multi-trade service office",
  profileKey: "multi_role_office_operator",
  domains: ["operations", "people", "finance", "customer"],
  ownerExperience: "expert",
  density: "dense",
  guidance: {
    headline: "Monday's schedule needs one owner tradeoff",
    summary: "Avery aligned dispatcher, estimator, bookkeeper, and field obligations, but one crew move changes a customer promise and overtime exposure.",
    suggested_prompt: "Show the roles affected, safest schedule option, and customer and payroll consequences.",
    mode: "needs_you",
  },
  loops: [
    loop("office", "loop_office_schedule", "Coordinate Monday field schedule", "Three crews, two estimates, one urgent callback, and one weather-sensitive exterior job share the same capacity window.", "needs_you", "operations", "Choose whether to protect the exterior promise or avoid overtime."),
    loop("office", "loop_office_payroll", "Close two payroll exceptions", "The bookkeeper needs one break attestation and one corrected job code before payroll export.", "active", "finance", "Collect the field supervisor confirmations.", "2026-07-19T11:54:00.000Z"),
  ],
  saves: [
    save("office", "save_office_weather", "loop_office_schedule", "Watch Monday weather threshold", "The exterior plan remains safe only while precipitation stays below the operating threshold.", "watching", { kind: "threshold", description: "Return if Monday precipitation probability rises above 35%.", source: "weather planning feed" }),
  ],
  decisions: [
    decision("office", "decision_office_schedule", "Move Crew B to the exterior job", "This protects the weather-sensitive promise but creates 2.5 projected overtime hours and moves one non-urgent callback to Tuesday.", "high"),
  ],
  changes: [
    change("office", "change_office_customer_reply", "loop_office_schedule", "Customer accepted a narrower arrival window", "The exterior customer can receive the crew from 8:00–10:00 AM, reducing the travel conflict.", "email"),
  ],
  delegated: [
    delegated("office", "delegation_office_routes", "loop_office_schedule", "Build feasible crew routes", "Compare travel, skills, promised windows, and current job state.", "system", "done", "Two feasible schedules remain."),
    delegated("office", "delegation_office_payroll", "loop_office_payroll", "Resolve payroll exceptions", "Collect missing attestations and verify job codes.", "human", "working", "One of two confirmations received."),
    delegated("office", "delegation_office_estimator", "loop_office_schedule", "Protect estimate appointments", "Confirm both estimate appointments survive the proposed crew plan.", "specialist_agent", "done", "Both estimate appointments remain intact."),
  ],
  evidence: [
    evidence("office", "evidence_office_schedule", "Role and schedule impact matrix", "Crew capacity, travel time, customer promises, overtime, and role ownership for both feasible options.", "recorded"),
    evidence("office", "evidence_office_payroll", "Payroll exception packet", "Missing items, current owners, and the exact export blocker.", "draft"),
  ],
  connections: [
    connection("office", "office_email", "Shared office email", "communication", "working", "Watch customer and staff replies and prepare approved communication.", "Customer schedule reply received"),
    connection("office", "office_calendar", "Team calendar", "calendar", "working", "Coordinate role-aware appointments and field commitments."),
    connection("office", "office_accounting", "QuickBooks", "accounting", "working", "Prepare payroll and accounting work behind policy and approval."),
    connection("office", "office_field", "Field operations", "custom", "working", "Read job, crew, and route state from the operating system."),
  ],
  abilities: [
    ability("ability_office_coordinate", "Cross-role office coordination", "office", "ready", "Arrange work by obligation and dependency rather than app or department."),
    ability("ability_office_payroll", "Payroll preparation", "accounting", "policy_gated", "Prepare exceptions and export-ready work without authorizing payroll."),
  ],
  heartbeat: [
    "Binding owner, office roles, assignments, and current schedule version.",
    "Reconciling customer promises with crew capacity and travel time.",
    "Preparing one owner tradeoff with role and payroll consequences.",
  ],
  command: {
    domain: "operations",
    delegatedTitle: "Reconcile role and schedule dependencies",
    delegatedPurpose: "Compare customer promises, staff roles, capacity, payroll, and downstream conflicts.",
    evidenceTitle: "Cross-role operating plan",
    evidenceSummary: "Fixture-only role, dependency, schedule, and consequence matrix.",
    decision: {
      title: "Approve the cross-role operating change",
      consequence: "Approval would change team commitments and may prepare customer or staff communication; the fixture changes nothing.",
      risk: "high",
    },
  },
};

const PERSONAL_BRAIN: ScenarioDefinition = {
  id: "personal-brain",
  employeeName: "Avery Brain",
  businessName: "Personal operating system",
  businessKind: "research-only personal knowledge fixture",
  profileKey: "personal_operating_brain",
  domains: ["research", "operations", "custom"],
  ownerExperience: "standard",
  density: "balanced",
  guidance: {
    headline: "Your weekly review is assembled",
    summary: "Avery grouped commitments, unresolved decisions, saved intentions, and source-backed notes without taking any external action.",
    suggested_prompt: "Show what changed, what I am holding, and the three decisions with the highest downstream cost.",
    mode: "working",
  },
  loops: [
    loop("personal-brain", "loop_brain_review", "Prepare the weekly founder review", "Projects, commitments, decisions, notes, and open questions are grouped by outcome and dependency.", "active", "operations", "Review the three decisions and convert accepted direction into explicit work."),
  ],
  saves: [
    save("personal-brain", "save_brain_pricing", "loop_brain_review", "Return to pricing after customer evidence changes", "One more qualified customer conversation would materially change confidence.", "watching", { kind: "event", description: "Return after the next qualified customer pricing conversation.", source: "explicit personal save" }),
  ],
  decisions: [],
  changes: [
    change("personal-brain", "change_brain_commitment", "loop_brain_review", "A dormant commitment now conflicts with Tuesday launch work", "A saved research task is due in the same block reserved for production acceptance.", "personal commitments"),
  ],
  delegated: [
    delegated("personal-brain", "delegation_brain_notes", "loop_brain_review", "Group notes by active outcome", "Separate durable facts, hypotheses, commitments, and discarded ideas.", "system", "done", "Thirty-one notes grouped into six active outcomes."),
    delegated("personal-brain", "delegation_brain_sources", "loop_brain_review", "Verify source-backed claims", "Mark claims with primary support, contradiction, or missing provenance.", "specialist_agent", "working", "Two claims still need a primary source."),
  ],
  evidence: [
    evidence("personal-brain", "evidence_brain_review", "Weekly operating review", "Active outcomes, saved intentions, decisions, stale assumptions, and source boundaries.", "draft"),
  ],
  connections: [
    connection("personal-brain", "brain_notes", "Notes", "documents", "working", "Read explicitly selected notes and preserve provenance without exposing private memory internals."),
    connection("personal-brain", "brain_calendar", "Calendar", "calendar", "connected", "Compare commitments and available time without silently creating events."),
    connection("personal-brain", "brain_email", "Email", "communication", "connected", "Use explicitly selected messages as context; no autonomous sending."),
  ],
  abilities: [
    ability("ability_brain_saves", "Explicit future intentions", "office", "ready", "Hold a reason and return condition so the user does not carry it mentally."),
    ability("ability_brain_synthesis", "Source-aware synthesis", "research", "ready", "Separate fact, hypothesis, decision, and missing evidence."),
  ],
  heartbeat: [
    "Binding the explicit review scope and selected owner-safe sources.",
    "Grouping commitments, saves, and unresolved decisions by outcome.",
    "Checking provenance before presenting the weekly review.",
  ],
  command: {
    domain: "operations",
    delegatedTitle: "Organize the explicit personal outcome",
    delegatedPurpose: "Separate fact, hypothesis, commitment, decision, and future return condition.",
    evidenceTitle: "Personal operating note",
    evidenceSummary: "Fixture-only synthesis with provenance and no external action.",
    returnCondition: { kind: "owner", description: "Return during the next explicit review or when the user asks for this outcome again.", source: "fixture personal save" },
  },
};

const CLOTHING: ScenarioDefinition = {
  id: "clothing-ops",
  employeeName: "Avery Operations",
  businessName: "Northstar Supply Co.",
  businessKind: "independent apparel brand and fulfillment operation",
  profileKey: "shopify_apparel_operations",
  domains: ["commerce", "operations", "finance", "customer"],
  ownerExperience: "expert",
  density: "dense",
  guidance: {
    headline: "Approve one material buy to keep 42 orders on schedule",
    summary: "Avery reconciled Shopify orders, blank inventory, embroidery capacity, supplier pricing, fulfillment promises, and margin impact. The proposed buy is held at the money gate.",
    suggested_prompt: "Show the order-to-material calculation, supplier price change, capacity, margin impact, and safest purchase option.",
    mode: "needs_you",
  },
  loops: [
    loop("clothing-ops", "loop_clothing_drop", "Fulfill Drop 07 without stockouts", "Forty-two open orders require 96 garment units across sizes, colorways, embroidery, packaging, and carrier labels.", "needs_you", "commerce", "Approve, revise, or decline the recommended blank-garment purchase."),
    loop("clothing-ops", "loop_clothing_delay", "Recover the delayed embroidery batch", "The embroidery partner is six hours behind; eleven priority orders can still ship on time if the batch sequence changes.", "active", "operations", "Confirm the revised production sequence and prepare communication only for orders that miss promise.", "2026-07-19T11:56:00.000Z"),
  ],
  saves: [
    save("clothing-ops", "save_clothing_inventory", "loop_clothing_drop", "Watch black heavyweight blank inventory", "Demand is accelerating and supplier lead time is now the limiting dependency.", "needs_you", { kind: "threshold", description: "Return when projected black heavyweight blanks fall below 1.25 times committed demand.", source: "order-to-material calculator" }),
  ],
  decisions: [
    decision("clothing-ops", "decision_clothing_po", "Purchase 120 heavyweight black blanks", "The proposed $4,860 purchase covers committed demand plus 25% safety stock, preserves the ship promise, and lowers Drop 07 projected gross margin by 1.8 points after the supplier increase.", "high"),
  ],
  changes: [
    change("clothing-ops", "change_clothing_orders", "loop_clothing_drop", "Fourteen Shopify orders arrived since 8:00 AM", "Demand added 31 garment units, concentrated in medium and large black heavyweight blanks.", "Shopify"),
    change("clothing-ops", "change_clothing_supplier", "loop_clothing_drop", "Supplier raised heavyweight blank cost 6.2%", "The new quote applies after 2:00 PM and changes the margin of two reorder options.", "supplier email", "2026-07-19T11:57:00.000Z"),
  ],
  delegated: [
    delegated("clothing-ops", "delegation_clothing_material", "loop_clothing_drop", "Calculate material demand by order", "Expand every Shopify line item into garment, thread, label, packaging, and carrier-label requirements.", "system", "done", "Ninety-six garment units, 103 packaging units, and two thread colors required after spoilage allowance."),
    delegated("clothing-ops", "delegation_clothing_supplier", "loop_clothing_drop", "Compare supplier options", "Normalize unit cost, freight, lead time, minimum order, and defect allowance.", "specialist_agent", "done", "The 120-unit local-supplier option is the lowest schedule-risk choice."),
    delegated("clothing-ops", "delegation_clothing_fulfillment", "loop_clothing_delay", "Re-sequence fulfillment", "Protect priority ship promises while the embroidery batch is delayed.", "system", "working", "Eleven priority orders protected; four standard orders remain at risk."),
    delegated("clothing-ops", "delegation_clothing_comms", "loop_clothing_delay", "Prepare exception communication", "Draft messages only for orders that will actually miss the customer promise.", "specialist_agent", "waiting", "Waiting for the final production sequence."),
  ],
  evidence: [
    evidence("clothing-ops", "evidence_clothing_material", "Order-to-material requirements", "Per-order and aggregate garment, thread, label, packaging, spoilage, and carrier-label demand.", "recorded"),
    evidence("clothing-ops", "evidence_clothing_margin", "Purchase and margin comparison", "Three supplier options with landed cost, lead time, stockout risk, and projected gross-margin impact.", "recorded"),
    evidence("clothing-ops", "evidence_clothing_fulfillment", "Revised production and fulfillment plan", "Batch order, capacity, priority orders, risk window, and communication threshold.", "draft"),
  ],
  connections: [
    connection("clothing-ops", "clothing_shopify", "Shopify", "store", "working", "Read orders, products, variants, fulfillment state, and customer promises.", "Fourteen new orders ingested"),
    connection("clothing-ops", "clothing_email", "Operations email", "communication", "working", "Watch supplier and fulfillment replies and prepare approved communication.", "Supplier quote changed"),
    connection("clothing-ops", "clothing_brain", "Business brain", "custom", "working", "Use product BOMs, spoilage rules, margin targets, supplier preferences, and promise policies."),
    connection("clothing-ops", "clothing_material", "Material price feed", "custom", "working", "Use current approved supplier quotes in the material calculator."),
    connection("clothing-ops", "clothing_accounting", "Accounting", "accounting", "connected", "Prepare purchase and margin records after approval and durable receipt."),
  ],
  abilities: [
    ability("ability_clothing_orders", "Order and fulfillment operations", "office", "ready", "Carry orders through production dependencies and fulfillment exceptions."),
    ability("ability_clothing_materials", "Order-to-material calculation", "automation", "ready", "Convert product variants and quantities into material requirements with spoilage allowance."),
    ability("ability_clothing_purchase", "Purchase preparation", "money", "policy_gated", "Prepare supplier choices and purchase orders, then stop at the money gate."),
    ability("ability_clothing_email", "Supplier and customer communication", "communication", "policy_gated", "Prepare bounded messages and send only after the required authority path."),
  ],
  heartbeat: [
    "Binding Shopify orders, product BOMs, inventory, supplier quotes, and fulfillment promises.",
    "Calculating garment, thread, label, packaging, spoilage, and carrier-label demand.",
    "Comparing landed cost, lead time, stockout risk, capacity, and margin impact.",
    "Preparing one purchase decision and a revised fulfillment sequence.",
  ],
  command: {
    domain: "commerce",
    delegatedTitle: "Calculate order, material, and fulfillment impact",
    delegatedPurpose: "Reconcile current orders, BOMs, inventory, supplier quotes, capacity, margin, and customer promises.",
    evidenceTitle: "Order-to-material and fulfillment recommendation",
    evidenceSummary: "Fixture-only requirements, supplier comparison, capacity plan, margin impact, and customer-risk threshold.",
    decision: {
      title: "Approve the recommended material purchase",
      consequence: "Approval would authorize a bounded supplier purchase and accounting record; this fixture performs no purchase or external write.",
      risk: "high",
    },
  },
};

const DEFINITIONS: Record<ScenarioDefinition["id"], ScenarioDefinition> = {
  website: WEBSITE,
  office: OFFICE,
  "personal-brain": PERSONAL_BRAIN,
  "clothing-ops": CLOTHING,
};

const EXTERNAL_COMMANDS: Record<"contractor" | "research", CommandConfig> = {
  contractor: {
    domain: "customer",
    delegatedTitle: "Prepare the job package",
    delegatedPurpose: "Combine customer scope, estimate assumptions, schedule, and communication into one reviewable package.",
    evidenceTitle: "Draft job package",
    evidenceSummary: "Fixture-only estimate, schedule, customer reply, and next-step record.",
    decision: {
      title: "Approve the customer job package",
      consequence: "Approval would allow the customer-facing package to continue through exact gates; this fixture sends and charges nothing.",
      risk: "high",
    },
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
};

export function scenarioForEmployee(employeeId: string): typeof FIXTURE_SCENARIOS[number] {
  const normalized = employeeId.toLowerCase();
  if (normalized.includes("clothing") || normalized.includes("shopify") || normalized.includes("apparel")) return scenario("clothing-ops");
  if (normalized.includes("personal") || normalized.includes("brain")) return scenario("personal-brain");
  if (normalized.includes("research")) return scenario("research");
  if (normalized.includes("office") || normalized.includes("multi-role") || normalized.includes("multi_person")) return scenario("office");
  if (normalized.includes("website") || normalized.includes("front-door") || normalized.includes("public")) return scenario("website");
  return scenario("contractor");
}

export function fixtureRuntimeForEmployee(employeeId: string): FixtureRuntimeSession {
  const selected = scenarioForEmployee(employeeId);
  const payload = selected.id === "contractor"
    ? fixtureResourcePayload(employeeId)
    : selected.id === "research"
      ? researchFixtureResourcePayload(employeeId)
      : buildScenarioPayload(employeeId, DEFINITIONS[selected.id]);
  const summaries = selected.id === "contractor"
    ? [
      "Binding the contractor employee, assignment, customer job, and current work state.",
      "Reconciling estimate, customer reply, deposit, schedule, and follow-up dependencies.",
      "Preparing the next exact owner decision and fixture evidence.",
    ]
    : selected.id === "research"
      ? [
        "Binding the research question, source policy, session, and current claim state.",
        "Comparing primary evidence and preserving contradictory findings.",
        "Preparing one scoped recommendation decision with source-backed evidence.",
      ]
      : DEFINITIONS[selected.id].heartbeat;
  const initial = projection(selected.id, 0, "starting", "active", summaries[0]);
  const frames: FixtureRuntimeFrame[] = summaries.slice(1).map((summary, index) => ({
    after_ms: 700 + index * 1200,
    projection: projection(
      selected.id,
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
    projection: projection(selected.id, summaries.length, "completed", "completed", "Fixture projection reached its current stable state.", 700 + summaries.length * 1200),
    progress: "",
  });
  return { scenario: selected, initial_payload: payload, initial_projection: initial, frames };
}

function buildScenarioPayload(employeeId: string, definition: ScenarioDefinition): ResourcePayload {
  const context: OperatingContextManifest = {
    version: 1,
    generated_at: FIXTURE_TIME,
    account_id: account(definition.id),
    assignment_id: assignment(definition.id),
    employee_id: employeeId,
    employee_name: definition.employeeName,
    business_name: definition.businessName,
    business_kind: definition.businessKind,
    profile_key: definition.profileKey,
    profile_version: "fixture-v1",
    session_id: `session_fixture_${definition.id.replace(/-/g, "_")}`,
    session_last_active: FIXTURE_TIME,
    runtime_context_version: `fixture-context-${definition.id}-v1`,
    doctrine_versions: {
      agents: "fixture-agents-v1",
      codegraph: "fixture-codegraph-v1",
      design_system: "2026-07-19",
      agent_interface: "2026-07-19",
    },
    dominant_domains: definition.domains,
    owner_experience: definition.ownerExperience,
    preferred_density: definition.density,
    signals: [
      {
        id: `signal_fixture_${definition.id}`,
        source: "manifest",
        key: "fixture_scenario",
        label: "Fixture scenario",
        value: definition.id,
        confidence: "high",
        freshness: "static",
        authority: "product_doctrine",
        owner_safe: true,
      },
      {
        id: `signal_profile_${definition.id}`,
        source: "profile",
        key: "profile",
        label: "Employee profile",
        value: definition.profileKey,
        confidence: "high",
        freshness: "current",
        authority: "profile_fact",
        owner_safe: true,
        updated_at: FIXTURE_TIME,
      },
      {
        id: `signal_runtime_${definition.id}`,
        source: "runtime",
        key: "fixture_runtime",
        label: "Runtime projection",
        value: "Deterministic owner-safe heartbeat and typed work projection; no provider or external effect.",
        confidence: "high",
        freshness: "live",
        authority: "runtime_fact",
        owner_safe: true,
        updated_at: FIXTURE_TIME,
      },
    ],
  };
  const operating = relayout({
    version: 1,
    generated_at: FIXTURE_TIME,
    guidance: definition.guidance,
    loops: definition.loops,
    active_saves: definition.saves,
    decisions: definition.decisions,
    changes: definition.changes,
    delegated_work: definition.delegated,
    evidence: definition.evidence,
    context,
    layout: emptyLayout(context),
  }, definition.connections.filter((item) => item.state === "needs_you").length);

  return {
    account_id: account(definition.id),
    assignment_id: assignment(definition.id),
    employee_id: employeeId,
    employee: {
      id: employeeId,
      name: definition.employeeName,
      status: "working",
      profile_id: definition.profileKey,
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
    artifacts: definition.evidence.map((item) => ({
      id: item.proof.artifact_id ?? `artifact_${item.id}`,
      kind: item.id,
      mime_type: "application/json",
      storage_ref: null,
      created_at: item.recorded_at ?? FIXTURE_TIME,
    })),
    approvals: [],
    messages: [{
      id: `message_fixture_${definition.id}`,
      direction: "to_owner",
      body: `Fixture operating lab: ${definition.guidance.summary}`,
      status: "delivered",
      created_at: FIXTURE_TIME,
    }],
    connectors: definition.connections.map((item) => ({
      id: item.connector_id ?? `connector_${item.id}`,
      connector_key: item.id,
      provider: item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      status: item.state === "needs_you" ? "degraded" : "active",
      external_label: item.account_label ?? `${definition.businessName} fixture`,
      last_connector_test_at: FIXTURE_TIME,
      last_error: item.state === "needs_you" ? item.health ?? "Needs fixture attention" : null,
      created_at: "2026-07-19T10:00:00.000Z",
    })),
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: definition.changes.map((item) => ({
      id: item.id,
      event_type: item.source.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      status: item.state,
      created_at: item.occurred_at ?? FIXTURE_TIME,
      work_event_descriptor: {
        account_id: account(definition.id),
        employee_id: employeeId,
        source_event_id: item.id,
        move: "observe",
        title: item.title,
        summary: item.summary,
        proof: item.proof.artifact_id ? { artifact_id: item.proof.artifact_id } : undefined,
      },
    })),
    abilities: definition.abilities,
    capabilities: [],
    surface_envelopes: [],
    connection_surfaces: definition.connections,
    resurface_items: definition.saves.map((item) => ({
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
    outputs: definition.evidence.map((item) => ({
      id: `output_${item.id}`,
      type: "artifact",
      title: item.title,
      status: item.state,
      created_at: item.recorded_at ?? FIXTURE_TIME,
      artifact_id: item.proof.artifact_id ?? `artifact_${item.id}`,
      summary: item.summary,
    })),
    tasks: [
      ...definition.decisions.map((item) => ({
        id: `task_${item.id}`,
        type: "question" as const,
        title: item.title,
        status: "needs_you" as const,
        summary: item.consequence,
        created_at: FIXTURE_TIME,
        target_id: item.id,
      })),
      ...definition.loops.map((item) => ({
        id: `task_${item.id}`,
        type: "work" as const,
        title: item.title,
        status: loopTaskStatus(item.state),
        summary: item.summary,
        created_at: item.updated_at ?? FIXTURE_TIME,
        target_id: item.id,
      })),
    ],
    operating_state: operating,
  };
}

export function planFixtureCommand(
  current: ResourcePayload,
  currentOperating: OperatingSurfaceState,
  scenarioId: FixtureScenarioId,
  body: string,
  now = new Date().toISOString(),
): FixtureCommandPlan {
  const config = scenarioId === "contractor" || scenarioId === "research"
    ? EXTERNAL_COMMANDS[scenarioId]
    : DEFINITIONS[scenarioId].command;
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const assignmentId = currentOperating.context.assignment_id || current.assignment_id || assignment(scenarioId);
  const title = commandTitle(body);
  const loopId = `loop_fixture_command_${nonce}`;
  const delegationId = `delegation_fixture_command_${nonce}`;
  const evidenceId = `evidence_fixture_command_${nonce}`;
  const decisionId = `decision_fixture_command_${nonce}`;
  const saveId = `save_fixture_command_${nonce}`;

  const formingLoop: OperatingWorkLoop = {
    id: loopId,
    title,
    summary: "The fixture accepted this bounded owner outcome and is projecting work before any real provider or business effect.",
    state: "forming",
    horizon: "now",
    domain: config.domain,
    updated_at: now,
    next_step: "Bind context, delegate bounded analysis, and return a decision, save, or evidence object.",
    return_condition: null,
    source_envelope_ids: [],
    target: { kind: "fixture_command", id: loopId },
    proof: { assignment_id: assignmentId, source_table: "fixture_commands", source_id: loopId },
  };
  const queued: DelegatedWorkUnit = {
    id: delegationId,
    parent_loop_id: loopId,
    title: config.delegatedTitle,
    purpose: config.delegatedPurpose,
    executor_kind: "hermes_subagent",
    executor_label: "Fixture bounded worker",
    state: "queued",
    started_at: now,
    updated_at: now,
    proof: {
      assignment_id: assignmentId,
      delegation_id: delegationId,
      parent_run_id: `run_fixture_${nonce}`,
      child_run_id: `child_fixture_${nonce}`,
    },
  };
  const acceptedOperating = relayout({
    ...currentOperating,
    generated_at: now,
    guidance: {
      headline: `${currentOperating.context.employee_name} accepted the fixture outcome`,
      summary: "Context is bound and bounded analysis is starting. No provider, customer, money, publishing, inventory, or runtime effect is occurring.",
      suggested_prompt: null,
      mode: "working",
    },
    focus_loop_id: loopId,
    loops: [formingLoop, ...currentOperating.loops],
    delegated_work: [queued, ...currentOperating.delegated_work],
  });

  const completedLoop: OperatingWorkLoop = {
    ...formingLoop,
    state: config.decision ? "needs_you" : config.returnCondition ? "waiting" : "active",
    updated_at: offsetIso(now, 1800),
    next_step: config.decision
      ? "Review the fixture decision and consequence."
      : config.returnCondition
        ? "Hold this until the explicit return condition is met."
        : "Continue the bounded fixture work.",
    return_condition: config.returnCondition ?? null,
  };
  const doneDelegation: DelegatedWorkUnit = {
    ...queued,
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
      ...config.decision,
      target: { kind: "fixture_decision", id: decisionId },
      proof: { assignment_id: assignmentId, source_table: "fixture_decisions", source_id: decisionId },
    }
    : null;
  const newSave: ActiveSave | null = config.returnCondition
    ? {
      id: saveId,
      title,
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
        summary: "The bounded analysis returned its consequential branch to the owner. No real action occurred.",
        suggested_prompt: "Explain the consequence, evidence, and production path that would follow approval.",
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
          summary: "The bounded result and draft evidence are visible without claiming a provider or external effect.",
          suggested_prompt: "Show the result, evidence, and next safe step.",
          mode: "working",
        },
    focus_loop_id: loopId,
    loops: [completedLoop, ...currentOperating.loops],
    active_saves: newSave ? [newSave, ...currentOperating.active_saves] : currentOperating.active_saves,
    decisions: newDecision ? [newDecision, ...currentOperating.decisions] : currentOperating.decisions,
    delegated_work: [doneDelegation, ...currentOperating.delegated_work],
    evidence: [newEvidence, ...currentOperating.evidence],
  });

  const accepted: ResourcePayload = {
    ...current,
    operating_state: acceptedOperating,
    messages: [
      ...current.messages,
      { id: `fixture_owner_${nonce}`, direction: "from_owner", body, status: "delivered", created_at: now },
      { id: `fixture_employee_started_${nonce}`, direction: "to_owner", body: "I bound this fixture outcome to the current employee and context without touching a provider or business system.", status: "delivered", created_at: offsetIso(now, 100) },
    ],
    tasks: [
      { id: `task_${loopId}`, type: "work", title, status: "in_progress", summary: formingLoop.summary, created_at: now, target_id: loopId },
      ...(current.tasks ?? []),
    ],
  };
  const completed: ResourcePayload = {
    ...accepted,
    operating_state: completedOperating,
    messages: [
      ...accepted.messages,
      {
        id: `fixture_employee_completed_${nonce}`,
        direction: "to_owner",
        body: newDecision
          ? "The bounded fixture analysis is complete. I returned the consequential branch for your decision and recorded draft evidence."
          : newSave
            ? "I saved the outcome with an explicit reason and return condition. No external effect occurred."
            : "The bounded fixture work is projected with draft evidence. No external effect occurred.",
        status: "delivered",
        created_at: offsetIso(now, 1800),
      },
    ],
    outputs: [
      { id: `output_${evidenceId}`, type: "artifact", title: newEvidence.title, status: "draft", created_at: newEvidence.recorded_at, artifact_id: `artifact_${evidenceId}`, summary: newEvidence.summary },
      ...(current.outputs ?? []),
    ],
    tasks: [
      ...(newDecision ? [{ id: `task_${decisionId}`, type: "question" as const, title: newDecision.title, status: "needs_you" as const, summary: newDecision.consequence, created_at: offsetIso(now, 1800), target_id: decisionId }] : []),
      ...(newSave ? [{ id: `task_${saveId}`, type: "reminder" as const, title: newSave.title, status: "scheduled" as const, summary: newSave.return_condition.description, created_at: offsetIso(now, 1800), target_id: saveId }] : []),
      { id: `task_${loopId}`, type: "work", title, status: newDecision ? "needs_you" : newSave ? "scheduled" : "in_progress", summary: completedLoop.next_step ?? completedLoop.summary, created_at: now, target_id: loopId },
      ...(current.tasks ?? []),
    ],
  };

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

function relayout(state: OperatingSurfaceState, connectionAttentionCount = 0): OperatingSurfaceState {
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
    connection_attention_count: connectionAttentionCount,
  });
  return { ...state, focus_loop_id: layout.focus_loop_id, layout };
}

function emptyLayout(context: OperatingContextManifest): OperatingSurfaceState["layout"] {
  return {
    version: 1,
    layout_id: "guided_operating_surface_v1",
    generated_at: context.generated_at,
    primary_region: "guidance",
    ordered_regions: [],
    focus_loop_id: null,
    command_position: "anchored_bottom",
    density: context.preferred_density,
    rationale_codes: [],
    context_fingerprint: `sha256:fixture-${context.employee_id}`,
  };
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

function loopTaskStatus(state: OperatingWorkLoop["state"]): "needs_you" | "in_progress" | "blocked" | "done" | "failed" | "scheduled" {
  if (state === "needs_you") return "needs_you";
  if (state === "blocked") return "blocked";
  if (state === "failed") return "failed";
  if (state === "done") return "done";
  if (state === "waiting") return "scheduled";
  return "in_progress";
}

function commandTitle(body: string): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return "Fixture owner outcome";
  return clean.length <= 84 ? clean : `${clean.slice(0, 81)}…`;
}

function offsetIso(value: string, offsetMs: number): string {
  const parsed = Date.parse(value);
  return new Date((Number.isFinite(parsed) ? parsed : Date.now()) + offsetMs).toISOString();
}
