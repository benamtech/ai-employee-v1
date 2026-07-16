/** Identity tools. Spec: 04-manager-tools.md "Identity And Provisioning". */
import {
  ID_PREFIX,
  newId,
  ok,
  failed,
  type CreateAccountInput,
  type SendPhoneVerificationInput,
  type CheckPhoneCodeInput,
  type ToolName,
} from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { checkFeature } from "../lib/entitlements.js";
import {
  checkVerification,
  startVerification,
  verifyDevBypassEnabled,
  verifyDevBypassCode,
  VERIFY_DEV_BYPASS_SID,
} from "../lib/twilio.js";
import { mintOwnerSession } from "../lib/owner-session.js";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || `account-${Date.now()}`;
}

const sendPhoneVerification: ToolHandler = async (ctx, raw) => {
  await checkFeature(ctx.db, ctx, "send_phone_verification");
  const input = raw as SendPhoneVerificationInput;
  if (!input?.phone_e164 || !input?.session_id) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:send_phone_verification",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "phone_e164 and session_id are required.", { audit_id });
  }

  if (verifyDevBypassEnabled()) {
    const id = newId(ID_PREFIX.phoneVerificationAttempt);
    await ctx.db.from("phone_verification_attempts").insert({
      id,
      onboarding_session_id: input.session_id,
      phone_e164: input.phone_e164,
      twilio_verify_sid: VERIFY_DEV_BYPASS_SID,
      status: "pending",
      proof: { dev_bypass: true },
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:send_phone_verification",
      resource: id,
      result: "ok",
      details: { dev_bypass: true, session_id: input.session_id },
    });
    return ok({
      changed_resources: [`phone_verification_attempt:${id}`],
      proof: { verification_attempt_id: id, status: "pending", dev_bypass: true },
      user_facing_summary_hint: "Verification code sent (local dev bypass; no SMS).",
      next_suggested_action: "Enter the local dev verification code.",
      audit_id,
    });
  }

  try {
    const proof = await startVerification(input.phone_e164);
    const id = newId(ID_PREFIX.phoneVerificationAttempt);
    await ctx.db.from("phone_verification_attempts").insert({
      id,
      onboarding_session_id: input.session_id,
      phone_e164: input.phone_e164,
      twilio_verify_sid: proof.sid,
      status: proof.status,
      proof,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:send_phone_verification",
      resource: id,
      result: "ok",
      details: { twilio_verify_sid: proof.sid, session_id: input.session_id },
    });
    return ok({
      changed_resources: [`phone_verification_attempt:${id}`],
      proof: { verification_attempt_id: id, twilio_verify_sid: proof.sid, status: proof.status },
      user_facing_summary_hint: "Verification code sent.",
      next_suggested_action: "Ask the owner for the SMS code.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:send_phone_verification",
      result: "failed",
      details: { reason: "provider_error", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Twilio could not send the verification code.", { audit_id });
  }
};

const checkPhoneCode: ToolHandler = async (ctx, raw) => {
  await checkFeature(ctx.db, ctx, "check_phone_code");
  const input = raw as CheckPhoneCodeInput;
  if (!input?.verification_attempt_id || !input?.code) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:check_phone_code",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "verification_attempt_id and code are required.", { audit_id });
  }

  const { data: attempt } = await ctx.db
    .from("phone_verification_attempts")
    .select("*")
    .eq("id", input.verification_attempt_id)
    .maybeSingle();
  if (!attempt) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:check_phone_code",
      result: "failed",
      details: { reason: "verification_attempt_not_found" },
    });
    return failed("validation_failed", "Verification attempt not found.", { audit_id });
  }

  if (verifyDevBypassEnabled() && attempt.twilio_verify_sid === VERIFY_DEV_BYPASS_SID) {
    if (input.code !== verifyDevBypassCode()) {
      const audit_id = await writeAudit(ctx.db, {
        actor: ctx.actor,
        action: "tool:check_phone_code",
        resource: input.verification_attempt_id,
        result: "failed",
        details: { dev_bypass: true, reason: "bad_dev_code" },
      });
      return failed("validation_failed", "Verification code was not approved.", { audit_id });
    }
    await ctx.db
      .from("phone_verification_attempts")
      .update({ status: "approved", proof: { dev_bypass: true }, updated_at: new Date().toISOString() })
      .eq("id", input.verification_attempt_id);
    const phoneId = newId(ID_PREFIX.phone);
    await ctx.db.from("verified_phones").insert({
      id: phoneId,
      phone_e164: attempt.phone_e164,
      verification_method: "twilio_verify",
      consent_channel: "web",
      twilio_proof: { verification_attempt_id: input.verification_attempt_id, dev_bypass: true },
    });
    if (attempt.onboarding_session_id) {
      const { data: session } = await ctx.db
        .from("onboarding_sessions")
        .select("manifest_draft")
        .eq("id", attempt.onboarding_session_id)
        .maybeSingle();
      await ctx.db
        .from("onboarding_sessions")
        .update({
          state: "phone_verified",
          phone_e164: attempt.phone_e164,
          manifest_draft: {
            ...((session?.manifest_draft as Record<string, unknown> | null) ?? {}),
            verified_phone_ref: phoneId,
            verified_phone_e164: attempt.phone_e164,
            verification_method: "twilio_verify",
            consent_channel: "web",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", attempt.onboarding_session_id);
    }
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:check_phone_code",
      resource: phoneId,
      result: "ok",
      details: { dev_bypass: true, verification_attempt_id: input.verification_attempt_id },
    });
    return ok({
      changed_resources: [`verified_phone:${phoneId}`],
      proof: { verified_phone_ref: phoneId, status: "approved", dev_bypass: true },
      user_facing_summary_hint: "Phone verified (local dev bypass).",
      next_suggested_action: "Create the AMTECH account.",
      audit_id,
    });
  }

  try {
    const proof = await checkVerification(String(attempt.phone_e164), input.code);
    await ctx.db
      .from("phone_verification_attempts")
      .update({ status: proof.status, proof, updated_at: new Date().toISOString() })
      .eq("id", input.verification_attempt_id);

    if (!proof.valid) {
      const audit_id = await writeAudit(ctx.db, {
        actor: ctx.actor,
        action: "tool:check_phone_code",
        resource: input.verification_attempt_id,
        result: "failed",
        details: { status: proof.status },
      });
      return failed("validation_failed", "Verification code was not approved.", { audit_id });
    }

    const phoneId = newId(ID_PREFIX.phone);
    await ctx.db.from("verified_phones").insert({
      id: phoneId,
      phone_e164: attempt.phone_e164,
      verification_method: "twilio_verify",
      consent_channel: "web",
      twilio_proof: { verification_attempt_id: input.verification_attempt_id, ...proof },
    });
    if (attempt.onboarding_session_id) {
      const { data: session } = await ctx.db
        .from("onboarding_sessions")
        .select("manifest_draft")
        .eq("id", attempt.onboarding_session_id)
        .maybeSingle();
      await ctx.db
        .from("onboarding_sessions")
        .update({
          state: "phone_verified",
          phone_e164: attempt.phone_e164,
          manifest_draft: {
            ...((session?.manifest_draft as Record<string, unknown> | null) ?? {}),
            verified_phone_ref: phoneId,
            verified_phone_e164: attempt.phone_e164,
            verification_method: "twilio_verify",
            consent_channel: "web",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", attempt.onboarding_session_id);
    }
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:check_phone_code",
      resource: phoneId,
      result: "ok",
      details: { verification_attempt_id: input.verification_attempt_id },
    });
    return ok({
      changed_resources: [`verified_phone:${phoneId}`],
      proof: { verified_phone_ref: phoneId, status: proof.status },
      user_facing_summary_hint: "Phone verified.",
      next_suggested_action: "Create the AMTECH account.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:check_phone_code",
      result: "failed",
      details: { reason: "provider_error", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Twilio could not check the verification code.", { audit_id });
  }
};

const createAccount: ToolHandler = async (ctx, raw) => {
  await checkFeature(ctx.db, ctx, "create_account");
  const input = raw as CreateAccountInput;
  if (!input?.email || !input?.password_or_auth_ref || !input?.verified_phone_ref || !input?.business_display_name) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:create_account",
      result: "failed",
      details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "email, password_or_auth_ref, verified_phone_ref, and business_display_name are required.", { audit_id });
  }

  const accountId = newId(ID_PREFIX.account);
  const userId = newId(ID_PREFIX.user);
  const membershipId = newId(ID_PREFIX.membership);
  const { data: phone } = await ctx.db
    .from("verified_phones")
    .select("*")
    .eq("id", input.verified_phone_ref)
    .maybeSingle();
  if (!phone || phone.account_id) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:create_account",
      result: "failed",
      details: { reason: "verified_phone_unavailable" },
    });
    return failed("validation_failed", "Verified phone is missing or already claimed.", { audit_id });
  }

  const auth = await ctx.db.auth.admin.createUser({
    email: input.email,
    password: input.password_or_auth_ref,
    email_confirm: true,
    user_metadata: { account_id: accountId },
  });
  if (auth.error || !auth.data.user) {
    const audit_id = await writeAudit(ctx.db, {
      actor: ctx.actor,
      action: "tool:create_account",
      result: "failed",
      details: { reason: "supabase_auth_error", message: auth.error?.message },
    });
    return failed("provider_error", "Supabase could not create the account user.", { audit_id });
  }

  await ctx.db.from("accounts").insert({
    id: accountId,
    display_name: input.business_display_name,
    slug: slugify(input.business_display_name),
    timezone: input.timezone || "America/New_York",
  });
  await ctx.db.from("users").insert({
    id: userId,
    auth_user_id: auth.data.user.id,
    email: input.email,
    full_name: null,
  });
  await ctx.db.from("account_memberships").insert({
    id: membershipId,
    account_id: accountId,
    user_id: userId,
    role: "owner",
  });
  await ctx.db
    .from("verified_phones")
    .update({ account_id: accountId })
    .eq("id", input.verified_phone_ref);
  if (input.session_id) {
    const { data: session } = await ctx.db
      .from("onboarding_sessions")
      .select("manifest_draft")
      .eq("id", input.session_id)
      .maybeSingle();
    await ctx.db
      .from("onboarding_sessions")
      .update({
        state: "amtech_account_created",
        account_id: accountId,
        manifest_draft: {
          ...((session?.manifest_draft as Record<string, unknown> | null) ?? {}),
          account_id: accountId,
          business_display_name: input.business_display_name,
          timezone: input.timezone || "America/New_York",
          owner_email: input.email,
          ...(input.owner_name ? { owner_name: input.owner_name } : {}),
          verified_phone_ref: input.verified_phone_ref,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.session_id);
  }

  const ownerSession = await mintOwnerSession(ctx.db, accountId, userId);
  const audit_id = await writeAudit(ctx.db, {
    account_id: accountId,
    actor: ctx.actor,
    action: "tool:create_account",
    resource: accountId,
    result: "ok",
    details: { auth_user_id: auth.data.user.id, verified_phone_ref: input.verified_phone_ref },
  });
  return ok({
    account_id: accountId,
    changed_resources: [`account:${accountId}`, `user:${userId}`, `membership:${membershipId}`],
    proof: {
      account_id: accountId,
      user_id: userId,
      auth_user_id: auth.data.user.id,
      verified_phone_ref: input.verified_phone_ref,
      owner_session_token: ownerSession.token,
      owner_session_expires_at: ownerSession.expires_at,
    },
    user_facing_summary_hint: "AMTECH account created.",
    next_suggested_action: "Provision the claimed employee.",
    audit_id,
  });
};

export const identityTools: Partial<Record<ToolName, ToolHandler>> = {
  send_phone_verification: sendPhoneVerification,
  check_phone_code: checkPhoneCode,
  create_account: createAccount,
};
