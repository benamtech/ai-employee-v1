#!/usr/bin/env node
/**
 * Phase 1 acceptance preflight. Reads process.env and prints a runnable/blocked
 * matrix for the 8 acceptance runs (doc 03), naming the exact missing vars per run.
 * Prints NO secret values — only names + present/absent. Exits non-zero unless every
 * run is runnable, so CI/operators can gate the live acceptance pass on it.
 *
 *   npm run acceptance:preflight
 */
import { RUNS, runnability, present } from "./_env.mjs";

let runnableCount = 0;
console.log("AMTECH Phase 1 — provider/runtime acceptance preflight\n");

for (const run of RUNS) {
  const { runnable, missing } = runnability(run);
  if (runnable) runnableCount += 1;
  const tag = runnable ? "RUNNABLE" : "BLOCKED ";
  console.log(`[${tag}] Run ${run.id} — ${run.label}`);
  if (!runnable) {
    console.log(`           missing: ${missing.join(", ")}`);
  }
}

const total = RUNS.length;
console.log(`\n${runnableCount}/${total} runs are runnable with the current environment.`);

if (runnableCount < total) {
  // Show which provider buckets are entirely unconfigured, as a hint.
  const buckets = {
    Supabase: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"],
    Twilio: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"],
    Hermes: ["HERMES_API_TOKEN", "HERMES_RUNTIME_COMMAND"],
    Gmail: ["GOOGLE_OAUTH_CLIENT_ID", "GMAIL_PUBSUB_TOPIC", "PUBSUB_VERIFICATION_AUDIENCE"],
    Stripe: ["STRIPE_SECRET_KEY", "STRIPE_CONNECT_CLIENT_ID", "STRIPE_WEBHOOK_SECRET"],
    Signing: ["SIGNING_SECRET", "SECRET_REF_MASTER_KEY"],
  };
  console.log("\nProvider configuration:");
  for (const [name, vars] of Object.entries(buckets)) {
    const have = vars.filter((v) => present(v)).length;
    console.log(`  ${name}: ${have}/${vars.length} vars present`);
  }
  console.log("\nFill .env (copy from .env.example) for the blocked runs, then re-run preflight.");
  process.exit(1);
}

console.log("All runs runnable. Proceed with the acceptance runbooks + `npm run acceptance:report`.");
