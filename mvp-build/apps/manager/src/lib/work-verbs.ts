/**
 * Tool-name -> owner-safe work-verb allowlist (Phase 5 live progress).
 *
 * Guardrail: the owner never sees a raw tool name, argument, or payload — only a
 * warm work-verb ("Drafting the estimate..."). Anything not on the allowlist maps
 * to a generic verb, so a new/unknown tool can never leak its identity to the
 * Work Surface. This is the ONLY place a Hermes tool event becomes owner-facing.
 */

const VERB_BY_TOOL: Record<string, string> = {
  // Estimates / documents
  generate_estimate: "Drafting the estimate",
  render_estimate_pdf: "Preparing the estimate document",
  create_artifact: "Preparing a document",
  // Email / messaging
  send_email: "Drafting the email",
  gmail_send: "Drafting the email",
  gmail_history_sync: "Checking email",
  send_sms: "Preparing a text",
  send_employee_event: "Getting an update ready",
  // Money
  create_stripe_invoice: "Preparing the invoice",
  send_deposit_invoice: "Preparing the deposit invoice",
  stripe_connect: "Setting up payments",
  // Scheduling
  set_job_reminder: "Setting a reminder",
  schedule_job: "Updating the schedule",
  // Research / read
  search: "Looking into it",
  fetch_url: "Looking into it",
  read_file: "Reviewing the details",
};

const GENERIC_VERB = "Working on it";
const SAFE_STATUS_VERBS = new Set(["Waiting for approval"]);

/** Map a raw tool name to a safe, owner-facing work-verb. Never returns the tool
 *  name itself. Unknown tools collapse to a single generic verb. */
export function workVerbForTool(toolName: string | null | undefined): string {
  if (!toolName) return GENERIC_VERB;
  const key = String(toolName).trim().toLowerCase();
  return VERB_BY_TOOL[key] ?? GENERIC_VERB;
}

/** True when a candidate string would leak a raw tool identity to the owner.
 *  Used by tests to assert no un-mapped tool name escapes onto the surface. */
export function isSafeWorkVerb(text: string): boolean {
  return text === GENERIC_VERB || SAFE_STATUS_VERBS.has(text) || Object.values(VERB_BY_TOOL).includes(text);
}
