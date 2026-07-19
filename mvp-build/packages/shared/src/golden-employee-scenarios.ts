export type GoldenEmployeeScenarioId = "website_employee_a" | "contractor_office_employee_b" | "bookkeeping_employee_c";

export interface GoldenArtifactValidation {
  validator_key: string;
  status: "passed" | "failed" | "warning" | "skipped";
  summary: string;
  evidence: Record<string, unknown>;
}

export interface GoldenEmployeeScenario {
  id: GoldenEmployeeScenarioId;
  employee_type: "website" | "contractor_office" | "bookkeeping";
  artifact_kind: "website_project" | "contractor_office_packet" | "bookkeeping_review_packet";
  title: string;
  owner_goal: string;
  initial_payload: Record<string, unknown>;
  revised_payload: Record<string, unknown>;
  validations: GoldenArtifactValidation[];
  publish_action: "publish_artifact_sandbox";
  expected_receipts: string[];
}

const sharedProject = (input: {
  title: string;
  goal: string;
  deliverable_type: string;
  acceptance: string[];
  source_refs: string[];
}) => ({
  project: {
    title: input.title,
    goal: input.goal,
    status: "draft",
    artifact_contract_version: "amtech-artifact-v1",
  },
  deliverable: {
    type: input.deliverable_type,
    target: "amtech_sandbox",
  },
  sources: input.source_refs.map((ref) => ({ ref, status: "accepted" })),
  acceptance: input.acceptance.map((criterion) => ({ criterion, status: "pending" })),
  decisions: [],
  receipts: [],
});

const websiteBase = sharedProject({
  title: "AMTECH contractor landing page",
  goal: "Produce a responsive, accessible webpage that explains one contractor service and converts qualified leads.",
  deliverable_type: "webpage",
  acceptance: [
    "Valid semantic HTML with one H1",
    "Responsive at 390px and 1440px",
    "Keyboard-visible primary CTA",
    "No external scripts or trackers",
    "Sandbox publication verifies the approved revision hash",
  ],
  source_refs: ["business-brain://identity", "owner-thread://website-brief"],
});

const contractorBase = sharedProject({
  title: "Exterior repaint job packet",
  goal: "Prepare one owner-reviewable office packet for a contractor job without sending or booking anything.",
  deliverable_type: "job_folder",
  acceptance: [
    "Customer and site are explicit",
    "Scope separates labor, materials, exclusions, and assumptions",
    "Estimate math reconciles",
    "Schedule proposal is marked tentative",
    "Outbound drafts remain approval-gated",
  ],
  source_refs: ["business-brain://pricing", "connector://gmail/thread-demo", "owner-thread://job-brief"],
});

const bookkeepingBase = sharedProject({
  title: "Monthly bookkeeping review packet",
  goal: "Reconcile a bounded month, surface exceptions, and prepare proposed accounting writes without committing them.",
  deliverable_type: "dataset_report",
  acceptance: [
    "Opening and closing balances reconcile",
    "Every exception has source provenance",
    "Proposed writes are separated from observed transactions",
    "No payroll, tax filing, or bank transfer action is present",
    "Sandbox publication contains no raw access tokens or account numbers",
  ],
  source_refs: ["connector://quickbooks/sandbox", "upload://bank-export-redacted", "owner-thread://month-close-brief"],
});

export const GOLDEN_EMPLOYEE_SCENARIOS: Record<GoldenEmployeeScenarioId, GoldenEmployeeScenario> = {
  website_employee_a: {
    id: "website_employee_a",
    employee_type: "website",
    artifact_kind: "website_project",
    title: "Website Employee A",
    owner_goal: websiteBase.project.goal,
    initial_payload: {
      ...websiteBase,
      project: { ...websiteBase.project, revision_note: "Initial production draft" },
      files: {
        "index.html": "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Exterior Painting</title><link rel=\"stylesheet\" href=\"styles.css\"></head><body><main><h1>Exterior painting without the office runaround.</h1><p>Clear scope, careful prep, and owner-approved scheduling.</p><a class=\"cta\" href=\"#estimate\">Request an estimate</a></main></body></html>",
        "styles.css": "body{font-family:system-ui;margin:0;padding:3rem;line-height:1.5}.cta{display:inline-block;padding:1rem 1.25rem;border:2px solid currentColor} .cta:focus-visible{outline:4px solid #000;outline-offset:4px}@media(max-width:480px){body{padding:1.25rem}}",
      },
      validation_plan: ["html_semantics", "responsive_contract", "keyboard_cta", "external_dependency_scan"],
    },
    revised_payload: {
      ...websiteBase,
      project: { ...websiteBase.project, status: "ready_for_validation", revision_note: "Clarified service area and trust proof" },
      files: {
        "index.html": "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"description\" content=\"Owner-reviewed exterior painting estimates with clear prep, scope, and scheduling.\"><title>Exterior Painting</title><link rel=\"stylesheet\" href=\"styles.css\"></head><body><main><p class=\"eyebrow\">Licensed · insured · owner reviewed</p><h1>Exterior painting without the office runaround.</h1><p>Clear prep, written scope, and a schedule you approve before work begins.</p><a class=\"cta\" href=\"#estimate\">Request an estimate</a><section id=\"estimate\" aria-labelledby=\"estimate-title\"><h2 id=\"estimate-title\">What happens next</h2><ol><li>Share the property and scope.</li><li>Review the written estimate.</li><li>Approve the schedule.</li></ol></section></main></body></html>",
        "styles.css": "body{font-family:system-ui;margin:0;padding:3rem;line-height:1.5;color:#111;background:#fafafa}main{max-width:60rem;margin:auto}.eyebrow{font-weight:700}.cta{display:inline-block;padding:1rem 1.25rem;border:2px solid currentColor}.cta:focus-visible{outline:4px solid #000;outline-offset:4px}section{margin-top:3rem}@media(max-width:480px){body{padding:1.25rem}.cta{width:100%;box-sizing:border-box;text-align:center}}",
      },
      validation_plan: ["html_semantics", "responsive_contract", "keyboard_cta", "external_dependency_scan"],
    },
    validations: [
      { validator_key: "html_semantics", status: "passed", summary: "One semantic H1 and labelled secondary section are present.", evidence: { h1_count: 1, labelled_sections: 1 } },
      { validator_key: "responsive_contract", status: "passed", summary: "Responsive CSS contract covers mobile and desktop widths.", evidence: { widths: [390, 1440] } },
      { validator_key: "keyboard_cta", status: "passed", summary: "Primary CTA has a visible focus state.", evidence: { selector: ".cta:focus-visible" } },
      { validator_key: "external_dependency_scan", status: "passed", summary: "No external scripts, trackers, or remote assets are present.", evidence: { external_origins: [] } },
    ],
    publish_action: "publish_artifact_sandbox",
    expected_receipts: ["approval_snapshot_hash", "effect_receipt_id", "publication_ref", "post_publish_verification"],
  },
  contractor_office_employee_b: {
    id: "contractor_office_employee_b",
    employee_type: "contractor_office",
    artifact_kind: "contractor_office_packet",
    title: "Contractor Office Employee B",
    owner_goal: contractorBase.project.goal,
    initial_payload: {
      ...contractorBase,
      customer: { name: "Demo Homeowner", email: "owner@example.invalid", site: "123 Example St" },
      scope: { labor_hours: 48, labor_rate_cents: 9000, materials_cents: 85000, exclusions: ["wood replacement", "permit fees"] },
      estimate: { subtotal_cents: 517000, deposit_cents: 129250, status: "draft" },
      schedule: { window: "Week of August 10", status: "tentative" },
      outbound_drafts: [{ type: "estimate_email", status: "draft_only" }],
    },
    revised_payload: {
      ...contractorBase,
      project: { ...contractorBase.project, status: "ready_for_validation", revision_note: "Math and prep assumptions reconciled" },
      customer: { name: "Demo Homeowner", email: "owner@example.invalid", site: "123 Example St" },
      scope: { labor_hours: 48, labor_rate_cents: 9000, materials_cents: 85000, assumptions: ["sound existing substrate", "water and power available"], exclusions: ["wood replacement", "permit fees"] },
      estimate: { labor_cents: 432000, materials_cents: 85000, subtotal_cents: 517000, deposit_cents: 129250, status: "owner_review" },
      schedule: { window: "Week of August 10", status: "tentative", duration_days: 5 },
      outbound_drafts: [{ type: "estimate_email", status: "approval_required", recipient: "owner@example.invalid" }],
    },
    validations: [
      { validator_key: "estimate_math", status: "passed", summary: "Labor plus materials equals subtotal and the deposit is 25%.", evidence: { labor_cents: 432000, materials_cents: 85000, subtotal_cents: 517000, deposit_cents: 129250 } },
      { validator_key: "scope_completeness", status: "passed", summary: "Assumptions and exclusions are explicit.", evidence: { assumptions: 2, exclusions: 2 } },
      { validator_key: "side_effect_gate", status: "passed", summary: "Schedule and outbound email remain tentative or approval-required.", evidence: { sent: false, booked: false } },
    ],
    publish_action: "publish_artifact_sandbox",
    expected_receipts: ["approval_snapshot_hash", "effect_receipt_id", "publication_ref", "post_publish_verification"],
  },
  bookkeeping_employee_c: {
    id: "bookkeeping_employee_c",
    employee_type: "bookkeeping",
    artifact_kind: "bookkeeping_review_packet",
    title: "Bookkeeping Employee C",
    owner_goal: bookkeepingBase.project.goal,
    initial_payload: {
      ...bookkeepingBase,
      period: "2026-06",
      balances: { opening_cents: 2500000, inflows_cents: 910000, outflows_cents: 640000, observed_closing_cents: 2771000 },
      exceptions: [{ id: "ex-1", type: "difference", amount_cents: 1000, status: "unresolved" }],
      proposed_writes: [],
    },
    revised_payload: {
      ...bookkeepingBase,
      project: { ...bookkeepingBase.project, status: "ready_for_validation", revision_note: "Bank fee exception sourced and proposed" },
      period: "2026-06",
      balances: { opening_cents: 2500000, inflows_cents: 910000, outflows_cents: 640000, bank_fees_cents: 1000, reconciled_closing_cents: 2769000, observed_closing_cents: 2769000 },
      exceptions: [{ id: "ex-1", type: "bank_fee", amount_cents: 1000, status: "sourced", source_ref: "upload://bank-export-redacted#row-44" }],
      proposed_writes: [{ entity: "expense", amount_cents: 1000, category: "Bank Charges", status: "approval_required", committed: false }],
      redaction: { raw_account_numbers_present: false, access_tokens_present: false },
    },
    validations: [
      { validator_key: "reconciliation", status: "passed", summary: "Opening balance plus net activity and sourced bank fee equals observed closing balance.", evidence: { difference_cents: 0 } },
      { validator_key: "provenance", status: "passed", summary: "Every exception points to a bounded source reference.", evidence: { unsourced_exceptions: 0 } },
      { validator_key: "write_separation", status: "passed", summary: "Proposed QuickBooks write remains uncommitted and approval-required.", evidence: { proposed: 1, committed: 0 } },
      { validator_key: "sensitive_data_scan", status: "passed", summary: "Packet contains no raw access tokens or account numbers.", evidence: { findings: [] } },
    ],
    publish_action: "publish_artifact_sandbox",
    expected_receipts: ["approval_snapshot_hash", "effect_receipt_id", "publication_ref", "post_publish_verification"],
  },
};

export function getGoldenEmployeeScenario(id: GoldenEmployeeScenarioId): GoldenEmployeeScenario {
  return GOLDEN_EMPLOYEE_SCENARIOS[id];
}
