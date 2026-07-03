#!/usr/bin/env node
/**
 * Shared acceptance-harness helpers: the per-run env requirement matrix,
 * placeholder-aware env presence checks, a service-role Supabase client, employee
 * resolution, and result printing. Used by preflight.mjs, run{1..8}-*.mjs, report.mjs.
 *
 * REALNESS: nothing here injects synthetic provider results. A run is `pass` ONLY
 * when real proof rows exist in the live database. Missing env => `not-run`;
 * env present but proof absent => `fail`. Never report `pass` without real ids.
 * Spec: wiki/MVP/build-plan-current/03-provider-runtime-acceptance-plan.md
 */
import { createClient } from "@supabase/supabase-js";

/** Values that look like unfilled .env.example placeholders count as ABSENT. */
export function isPlaceholder(v) {
  if (v == null) return true;
  const s = String(v).trim();
  if (s === "") return true;
  if (/^change-me/i.test(s)) return true;
  if (s === "sk_test_" || s === "whsec_") return true;
  if (/XXXX/.test(s)) return true;
  if (/YOUR-PROJECT|YOUR-|your-tunnel\.example\.com/.test(s)) return true;
  return false;
}

export function present(name) {
  return !isPlaceholder(process.env[name]);
}

/**
 * The 8 acceptance runs from doc 03, each with the env it needs. `require` = all
 * must be present; `anyOf` = at least one of each listed group must be present.
 */
export const RUNS = [
  {
    id: 1,
    key: "db-rls",
    label: "Database & RLS",
    require: ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    anyOf: [],
  },
  {
    id: 2,
    key: "provision",
    label: "Account, Claim, Provisioning",
    require: [
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MANAGER_INTERNAL_TOKEN", "PROVISIONER_TOKEN",
      "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID", "TWILIO_FRONTDOOR_NUMBER",
      "HERMES_API_TOKEN", "HERMES_RUNTIME_COMMAND", "SIGNING_SECRET", "SMS_WEBHOOK_BASE_URL",
    ],
    anyOf: [
      ["MANAGER_API_ORIGIN", "MANAGER_BASE_URL"],
      ["TWILIO_EMPLOYEE_NUMBER", "TWILIO_MESSAGING_SERVICE_SID"],
    ],
  },
  {
    id: 3,
    key: "artifact",
    label: "Estimate Artifact",
    require: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET", "SIGNING_SECRET"],
    anyOf: [],
  },
  {
    id: 4,
    key: "gmail",
    label: "Gmail Send & Reply",
    require: [
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET",
      "GOOGLE_OAUTH_REDIRECT_URI", "GMAIL_PUBSUB_TOPIC", "PUBSUB_VERIFICATION_AUDIENCE",
      "PUBSUB_SERVICE_ACCOUNT_EMAIL", "SECRET_REF_MASTER_KEY", "TWILIO_AUTH_TOKEN",
    ],
    anyOf: [],
  },
  {
    id: 5,
    key: "stripe",
    label: "Stripe Connect Deposit",
    require: [
      "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY",
      "STRIPE_CONNECT_CLIENT_ID", "STRIPE_WEBHOOK_SECRET",
    ],
    anyOf: [],
  },
  {
    id: 6,
    key: "reminder",
    label: "Reminder & Scheduler",
    require: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MANAGER_BASE_URL"],
    anyOf: [["EMPLOYEE_SMS_FROM", "TWILIO_MESSAGING_SERVICE_SID"]],
  },
  {
    id: 7,
    key: "repair-eventbus",
    label: "Repair & Event Bus",
    require: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MANAGER_INTERNAL_TOKEN", "MANAGER_BASE_URL"],
    anyOf: [],
  },
  {
    id: 8,
    key: "security",
    label: "Security (forged-request denial)",
    // The live probe only needs a reachable deployed Manager; it sends forged
    // requests and asserts rejection. (The deterministic boundary proof is the
    // always-on unit test tests/unit/forged-requests.test.ts.)
    require: ["MANAGER_BASE_URL"],
    anyOf: [],
  },
];

export function runById(id) {
  const r = RUNS.find((x) => x.id === id);
  if (!r) throw new Error(`unknown run ${id}`);
  return r;
}

/** Which required/anyOf env names are missing for a run. */
export function runnability(run) {
  const missing = run.require.filter((n) => !present(n));
  const anyOfMissing = (run.anyOf ?? [])
    .filter((grp) => !grp.some((n) => present(n)))
    .map((grp) => `(${grp.join(" | ")})`);
  const all = [...missing, ...anyOfMissing];
  return { runnable: all.length === 0, missing: all };
}

/** Service-role client, or null when Supabase env is absent. */
export function serviceDb() {
  if (!present("SUPABASE_URL") || !present("SUPABASE_SERVICE_ROLE_KEY")) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolve the employee under test: SMOKE_EMPLOYEE_ID, else the latest live one. */
export async function resolveEmployee(db) {
  if (process.env.SMOKE_EMPLOYEE_ID) {
    const { data, error } = await db.from("employees").select("*").eq("id", process.env.SMOKE_EMPLOYEE_ID).maybeSingle();
    if (error) throw error;
    return data;
  }
  const { data, error } = await db
    .from("employees")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const STATUS = { PASS: "pass", FAIL: "fail", NOT_RUN: "not-run" };

/** Build a normalized result object the report aggregates. */
export function mkResult(run, status, { proofs = {}, missing = [], notes = [] } = {}) {
  return { id: run.id, key: run.key, label: run.label, status, proofs, missing, notes };
}

export function isMain(metaUrl) {
  return metaUrl === `file://${process.argv[1]}`;
}

export function printResult(r) {
  const icon = r.status === STATUS.PASS ? "✓" : r.status === STATUS.FAIL ? "✗" : "•";
  console.log(`${icon} Run ${r.id} — ${r.label}: ${r.status.toUpperCase()}`);
  for (const [k, v] of Object.entries(r.proofs ?? {})) console.log(`    ${k}: ${v}`);
  if (r.missing?.length) console.log(`    missing env: ${r.missing.join(", ")}`);
  for (const n of r.notes ?? []) console.log(`    note: ${n}`);
}

/** Standard standalone-run wrapper: print + exit non-zero unless PASS. */
export async function runMain(metaUrl, verify) {
  if (!isMain(metaUrl)) return;
  const r = await verify();
  printResult(r);
  process.exit(r.status === STATUS.PASS ? 0 : 1);
}
