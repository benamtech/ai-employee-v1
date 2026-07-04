#!/usr/bin/env node
/**
 * Local VPS-faithful bootstrap - provision one employee end-to-end, no SMS.
 *
 * Runs the real Manager tools (create_account -> provision_employee), the same
 * path production uses. The only shortcut is phone verification: this script
 * inserts a verified_phones row directly with the service role, and the
 * provisioner skips Twilio webhook assignment + first SMS when
 * PROVISIONER_SKIP_SMS=1.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { pickFixture } from "./contractor-fixtures.mjs";

const statePath = join(process.cwd(), "infra", ".local", "state.json");

function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function id(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function managerBase() {
  return (process.env.MANAGER_BASE_URL ?? process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");
}

async function callTool(name, input) {
  const token = process.env.MANAGER_INTERNAL_TOKEN;
  const res = await fetch(`${managerBase()}/manager/tools/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === "failed") {
    throw new Error(`${name} failed: ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("local bootstrap cannot run with NODE_ENV=production.");
  }
  if (!(process.env.PROVISIONER_SKIP_SMS === "1" || process.env.PROVISIONER_SKIP_SMS === "true")) {
    throw new Error("Set PROVISIONER_SKIP_SMS=1 for the local no-SMS bootstrap.");
  }

  const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Varied plausible contractor data by default (explicit LOCAL_* env still wins),
  // so the bypass path doesn't hide onboarding/provisioning assumptions behind one
  // copy-pasted business. Set ONBOARD_FIXTURE=<kind|index> to pin a specific one.
  const fx = pickFixture();
  const phoneId = id("phone");
  const phone = env("LOCAL_OWNER_PHONE_E164", fx.phone_e164);
  const businessName = env("LOCAL_BUSINESS_DISPLAY_NAME", fx.business_display_name);
  const timezone = env("LOCAL_TIMEZONE", fx.timezone);
  const ownerName = env("LOCAL_OWNER_NAME", fx.owner_name);
  const ownerEmail = env("LOCAL_OWNER_EMAIL", fx.owner_email);

  const { error: phoneError } = await supabase.from("verified_phones").insert({
    id: phoneId,
    phone_e164: phone,
    verification_method: "twilio_verify",
    consent_channel: "web",
    consent_text: "Local no-SMS bootstrap shortcut for developer testing.",
    twilio_proof: { local_bootstrap: true },
  });
  if (phoneError) throw phoneError;

  const account = await callTool("create_account", {
    email: ownerEmail,
    password_or_auth_ref: env("LOCAL_OWNER_PASSWORD", "local-password-change-me"),
    verified_phone_ref: phoneId,
    business_display_name: businessName,
    timezone,
  });
  const accountId = account.account_id ?? account.proof?.account_id;
  const ownerSessionToken = account.proof?.owner_session_token;
  if (!accountId || !ownerSessionToken) throw new Error(`create_account returned no account/session: ${JSON.stringify(account)}`);

  const kind = env("LOCAL_BUSINESS_KIND", fx.business_kind);
  const manifest = {
    employee_type: "contractor_estimator",
    profile_package_key: env("DEFAULT_PROFILE_PACKAGE", "contractor_estimator"),
    business_display_name: businessName,
    business_kind: kind,
    timezone,
    owner_name: ownerName,
    owner_email: ownerEmail,
    verified_phone_e164: phone,
    verification_method: "twilio_verify",
    consent_channel: "web",
    employee_name: env("LOCAL_EMPLOYEE_NAME", fx.employee_name),
    top_workflows: ["estimate walkthroughs", "follow-up", "daily office reminders"],
    tools_mentioned: ["Gmail", "Stripe", "web chat"],
    seed_skills: ["estimate", "invoice", "daily-checkin"],
    pricing_facts: [{ key: "local_test_rate", value: "Use conservative local-test assumptions until owner pricing is supplied.", confidence: "low" }],
    branding_facts: [{ key: "tone", value: "Plainspoken, contractor-friendly, concise.", confidence: "medium" }],
    customer_job_facts: [{ key: "beachhead", value: "Residential painting and landscaping estimates.", confidence: "high" }],
    seven_question_answers: {
      business: `${businessName} is a local ${kind} contractor.`,
      team: "Owner-led small team.",
      repeat_computer_work: "Writing estimates and follow-up after walkthroughs.",
      tools_in_use: "Gmail, Stripe, phone, web chat.",
      money_shape: "Local test account.",
      ideal_customer: "Homeowner with a clear residential job.",
      friction_customer: "Vague scope or missing photos.",
    },
  };

  const provisioned = await callTool("provision_employee", {
    account_id: accountId,
    manifest,
    transcript_ref: "local-bootstrap",
    idempotency_key: `local-bootstrap:${Date.now()}`,
  });
  const employeeId = provisioned.employee_id ?? provisioned.proof?.employee_id;
  if (!employeeId) throw new Error(`provision_employee returned no employee: ${JSON.stringify(provisioned)}`);

  const state = {
    account_id: accountId,
    employee_id: employeeId,
    owner_session_token: ownerSessionToken,
    owner_session_expires_at: account.proof?.owner_session_expires_at ?? null,
    web_route: provisioned.proof?.web_route ?? `/agent/${employeeId}`,
    manager_base_url: managerBase(),
    sms_skipped: true,
  };
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  console.log("Local employee provisioned (SMS skipped).");
  console.log(JSON.stringify(state, null, 2));
  console.log(`State written to ${statePath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
