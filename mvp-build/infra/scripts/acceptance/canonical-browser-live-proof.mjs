#!/usr/bin/env node
import { readProof, requireArg, requireEnv, run, writeProof, assert } from "./production-proof-lib.mjs";

requireEnv("PUBLIC_WEB_ORIGIN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
const onboardingProofPath = requireArg("--onboarding-proof");
const proof = await readProof(onboardingProofPath);
const publicOrigin = process.env.PUBLIC_WEB_ORIGIN.replace(/\/$/, "");
assert(String(proof.public_origin ?? publicOrigin).replace(/\/$/, "") === publicOrigin, "onboarding_public_origin_mismatch");
assert((proof.browser_routes ?? proof.visited_routes ?? []).some((route) => String(route).includes("/create-ai-employee")) || proof.start_url?.includes("/create-ai-employee"), "canonical_create_employee_route_not_observed");
assert(!(proof.verification_attempts ?? []).some((attempt) => attempt.dev_bypass), "dev_phone_bypass_present");
assert(!(proof.network_events ?? []).some((event) => String(event.url ?? "").includes("/api/dev/login")), "dev_login_present");
assert((proof.employees ?? []).length >= 1, "onboarding_proof_has_no_employee");
assert((proof.accounts ?? []).length >= 1, "onboarding_proof_has_no_account");

const validation = run("node", ["infra/scripts/prod-normal-employee-validate.mjs", `--proof=${onboardingProofPath}`], { timeout: 180_000 });
assert(!validation.output.includes("FAIL "), "canonical_onboarding_validation_failed", validation.output.split("\n").filter((line) => line.startsWith("FAIL ")));
assert(validation.output.includes("validated_proof:"), "canonical_onboarding_validation_marker_missing");

await writeProof("canonical-browser-onboarding-live", "passed", {
  source_proof: onboardingProofPath,
  public_origin: publicOrigin,
  account_ids: (proof.accounts ?? []).map((account) => account.id),
  employee_ids: (proof.employees ?? []).map((employee) => employee.id),
  verification_attempt_ids: (proof.verification_attempts ?? []).map((attempt) => attempt.sid ?? attempt.id ?? null).filter(Boolean),
  validation_tail: validation.output.split("\n").slice(-30),
});
