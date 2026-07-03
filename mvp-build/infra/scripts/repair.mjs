#!/usr/bin/env node
/**
 * Repair dispatcher (infra/scripts/README.md; 10-security-ops-observability.md
 * "Repair Commands"). The sanctioned path for privileged ops — NOT ad-hoc SQL.
 * Tool-backed commands POST to the Manager tool route (audited, confirmation-gated
 * server-side); host actions print the exact sanctioned procedure.
 *
 *   node infra/scripts/repair.mjs list
 *   node infra/scripts/repair.mjs <command> --employee emp_123 --account acct_1 [--arg key=value ...] [--confirm]
 *
 * Money/customer-facing commands (resend-invoice) require --confirm.
 */
const argv = process.argv.slice(2);
const command = argv[0];

function flag(name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
const hasConfirm = argv.includes("--confirm");
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--arg") {
    const [k, ...rest] = String(argv[i + 1] ?? "").split("=");
    if (k) args[k] = rest.join("=");
  }
}
const employee_id = flag("employee");
const account_id = flag("account");

/** command -> { tool | host, risk, build(input) }. */
const COMMANDS = {
  "retry-provisioning": { tool: "provision_employee", risk: "low", needs: ["account"], build: () => ({ account_id, idempotency_key: args.idempotency_key ?? `repair_${Date.now()}`, manifest: args.manifest ? JSON.parse(args.manifest) : undefined }) },
  "regenerate-artifact-link": { tool: "create_signed_artifact_link", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id, artifact_id: args.artifact_id }) },
  "reconnect-gmail": { tool: "connect_email", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id, provider: "gmail", requested_scopes: [] }) },
  "renew-watch": { tool: "renew_email_watch", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id, connector_id: args.connector_id }) },
  "replay-gmail-history": { tool: "replay_gmail_history_range", risk: "medium", needs: ["account", "employee"], build: () => ({ account_id, employee_id, connector_id: args.connector_id, start_history_id: args.start_history_id, end_history_id: args.end_history_id }) },
  "reconnect-stripe": { tool: "connect_stripe", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id }) },
  "regenerate-stripe-link": { tool: "regenerate_stripe_onboarding_link", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id, stripe_connection_id: args.stripe_connection_id }) },
  "resend-invoice": { tool: "send_deposit_invoice", risk: "money", needs: ["account", "employee"], build: () => ({ account_id, employee_id, stripe_invoice_row_id: args.stripe_invoice_row_id, approval_id: args.approval_id }) },
  "replay-stripe-event": { tool: "replay_stripe_event", risk: "medium", needs: [], build: () => ({ stripe_event_id: args.stripe_event_id }) },
  "set-reminder": { tool: "set_internal_reminder", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id, scheduled_at: args.scheduled_at, message: args.message }) },
  "get-reminders": { tool: "get_reminders", risk: "low", needs: ["account", "employee"], build: () => ({ account_id, employee_id }) },
  "redeliver-event": { tool: "redeliver_employee_event", risk: "low", needs: [], build: () => ({ event_id: args.event_id, channel: args.channel }) },
  "suppress-source": { tool: "suppress_event_source", risk: "medium", needs: [], build: () => ({ account_id, source: args.source, event_type: args.event_type, reason: args.reason ?? "operator repair" }) },
  // Host actions (no Manager tool): runtime-host operations.
  "restart-runtime": { host: true, risk: "medium" },
  "send-test-sms": { host: true, risk: "low" },
};

function printList() {
  console.log("Repair commands:\n");
  for (const [name, c] of Object.entries(COMMANDS)) {
    const where = c.host ? "host action" : `tool: ${c.tool}`;
    console.log(`  ${name.padEnd(24)} ${where}${c.risk === "money" ? "  [requires --confirm]" : ""}`);
  }
  console.log("\nExample: node infra/scripts/repair.mjs renew-watch --account acct_1 --employee emp_1 --arg connector_id=conn_1");
}

if (!command || command === "list" || command === "--help" || command === "-h") {
  printList();
  process.exit(command && command !== "list" ? 0 : 0);
}

const spec = COMMANDS[command];
if (!spec) { console.error(`repair: unknown command "${command}". Run \`repair.mjs list\`.`); process.exit(2); }

if (spec.host) {
  if (command === "restart-runtime") {
    console.log("Host action — restart the employee runtime via the provisioner/systemd wrapper:");
    console.log("  set HERMES_RUNTIME_COMMAND in .env; restart the per-employee unit (e.g. `systemctl --user restart hermes@<employee>`).");
    console.log("  then verify with: node infra/scripts/healthcheck.mjs --employee " + (employee_id ?? "<id>"));
  } else if (command === "send-test-sms") {
    console.log("Host action — send a test SMS from the employee number:");
    console.log("  the live owner inbound path is the sanctioned channel; for an outbound smoke use the runtime's SMS sender.");
    console.log("  verify delivery in employee_messages (direction=to_owner, provider_id set).");
  }
  process.exit(0);
}

// Tool-backed command.
const base = (process.env.MANAGER_BASE_URL ?? process.env.MANAGER_API_ORIGIN);
if (!base) { console.error("repair: MANAGER_BASE_URL (or MANAGER_API_ORIGIN) is required for tool-backed commands."); process.exit(2); }
const token = process.env.MANAGER_INTERNAL_TOKEN;
if (!token || /change-me/.test(token)) { console.error("repair: MANAGER_INTERNAL_TOKEN is required."); process.exit(2); }

for (const need of spec.needs ?? []) {
  const have = need === "account" ? account_id : need === "employee" ? employee_id : true;
  if (!have) { console.error(`repair: --${need} is required for ${command}.`); process.exit(2); }
}
if (spec.risk === "money" && !hasConfirm) {
  console.error(`repair: ${command} touches money/customer-facing actions. Re-run with --confirm.`);
  process.exit(1);
}

const input = spec.build();
const res = await fetch(`${base.replace(/\/$/, "")}/manager/tools/${spec.tool}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(input),
});
const out = await res.json().catch(() => ({}));
if (!res.ok) { console.error(`repair: ${spec.tool} -> ${res.status}`, out); process.exit(1); }
console.log(`repair: ${command} -> ${spec.tool} ok`);
console.log(JSON.stringify(out, null, 2));
