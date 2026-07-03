#!/usr/bin/env node
/**
 * Hermes environment smoke check (Phase 0). Verifies the env needed to provision
 * a real employee is present and prints the manual smoke-test steps from the
 * runbook. It does NOT fake provider success — the real profile→gateway→SMS test
 * is performed by hand per infra/hermes/RUNBOOK.md and recorded in smoke-result.md.
 */
const required = [
  "HERMES_HOME",
  "HERMES_BIN",
  "AMTECH_CLIENTS_DIR",
  "HERMES_GATEWAY_PORT_BASE",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_TEST_NUMBER",
  "SMS_WEBHOOK_BASE_URL",
];

let ok = true;
console.log("Hermes/Twilio env check:");
for (const k of required) {
  const present = Boolean(process.env[k]);
  if (!present) ok = false;
  console.log(`  ${present ? "✓" : "✗"} ${k}`);
}

console.log("\nManual smoke test (see infra/hermes/RUNBOOK.md):");
console.log("  1. create throwaway profile  2. start gateway :8100  3. text the test number");
console.log("  4. send one outbound SMS → record the Twilio message SID in smoke-result.md");

if (!ok) {
  console.error("\nMissing env — fill .env before running the manual smoke test.");
  process.exit(1);
}
console.log("\nEnv looks complete. Run the manual steps to finish Phase 0 infra acceptance.");
