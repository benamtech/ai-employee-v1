#!/usr/bin/env node
/**
 * Production browser observer for the real public onboarding path.
 *
 * This does not fixture-drive onboarding, bypass Twilio, call dev login, or create
 * internal records. It opens the public page and records safe proof IDs from the
 * real browser responses while the operator completes the flow.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { join } from "node:path";

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("Playwright not installed. Run `npm run local:browser-install`.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const value = (name, fallback) => {
  const prefix = `${name}=`;
  return process.argv.slice(2).find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
};

const publicOrigin = value("--url", process.env.PUBLIC_WEB_ORIGIN ?? "https://agent.amtechai.com").replace(/\/$/, "");
const proofDir = value("--proof-dir", process.env.AMTECH_PROOF_DIR ?? "infra/proofs");
const scenario = value("--scenario", "manual-production-onboarding");
const headless = args.has("--headless");

const captured = {
  sessions: [],
  accounts: [],
  employees: [],
  verification_attempts: [],
  verified_phones: [],
  owner_email: null,
  current_url: null,
  dashboard_seen: false,
  secrets_logged: false,
};

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function pushUnique(list, item, key = "id") {
  if (!item?.[key] || list.some((existing) => existing[key] === item[key])) return;
  list.push(item);
}

async function writeProof(status = "observed") {
  await mkdir(proofDir, { recursive: true });
  const path = join(proofDir, `production-onboarding-${stamp()}.json`);
  await writeFile(path, `${JSON.stringify({
    kind: "production_onboarding_observer",
    status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    public_origin: publicOrigin,
    scenario,
    ...captured,
  }, null, 2)}\n`, "utf8");
  console.log(`proof_json:${path}`);
  return path;
}

const browser = await chromium.launch({ headless });
const context = await browser.newContext();
const page = await context.newPage();

page.on("response", async (response) => {
  const url = response.url();
  if (!url.includes("/api/front-door/")) return;
  let json = {};
  try {
    json = await response.json();
  } catch {
    return;
  }
  if (url.includes("/api/front-door/message")) {
    if (json.session_id) pushUnique(captured.sessions, { id: json.session_id, source: "message" });
  }
  if (url.includes("/api/front-door/send-code")) {
    const proof = json.proof ?? {};
    pushUnique(captured.verification_attempts, {
      id: proof.verification_attempt_id,
      twilio_verify_sid: proof.twilio_verify_sid ?? null,
      status: proof.status ?? null,
      dev_bypass: proof.dev_bypass === true,
    });
  }
  if (url.includes("/api/front-door/check-code")) {
    const proof = json.proof ?? {};
    pushUnique(captured.verified_phones, {
      id: proof.verified_phone_ref,
      status: proof.status ?? null,
      dev_bypass: proof.dev_bypass === true,
    });
  }
  if (url.includes("/api/front-door/create-account")) {
    const proof = json.proof ?? {};
    pushUnique(captured.accounts, {
      id: proof.account_id,
      user_id: proof.user_id ?? null,
      verified_phone_ref: proof.verified_phone_ref ?? null,
      source: "create-account",
    });
  }
  if (url.includes("/api/front-door/owner-context")) {
    if (json.account?.id) {
      pushUnique(captured.accounts, {
        id: json.account.id,
        display_name: json.account.display_name ?? null,
        verified_phone_ref: json.verified_phone?.id ?? null,
        source: "owner-context",
      });
    }
  }
  if (url.includes("/api/front-door/provision")) {
    const proof = json.proof ?? {};
    const employeeId = json.employee_id ?? proof.employee_id;
    pushUnique(captured.employees, {
      id: employeeId,
      account_id: json.account_id ?? proof.account_id ?? null,
      provisioning_job_id: proof.provisioning_job_id ?? null,
      web_route: proof.web_route ?? (employeeId ? `/agent/${employeeId}` : null),
      failure_state: proof.failure_state ?? null,
      failure_code: proof.failure_code ?? null,
      status: json.status ?? null,
    });
    await writeProof(json.status === "ok" || json.status === "pending" ? "provision_observed" : "provision_failed");
  }
});

page.on("framenavigated", (frame) => {
  if (frame === page.mainFrame()) {
    captured.current_url = frame.url();
    if (captured.current_url.includes("/dashboard")) captured.dashboard_seen = true;
  }
});

process.on("SIGINT", async () => {
  await writeProof("interrupted");
  await browser.close();
  process.exit(130);
});

await page.goto(`${publicOrigin}/create-ai-employee`, { waitUntil: "networkidle" });
console.log(`[prod-onboarding-proof] opened ${publicOrigin}/create-ai-employee`);
console.log("[prod-onboarding-proof] complete the real flow in the browser; press Ctrl-C after final proof is captured.");
await new Promise(() => {});
