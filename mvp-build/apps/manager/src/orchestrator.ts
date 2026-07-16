import type { Hono } from "hono";
import {
  ID_PREFIX,
  OnboardingState,
  newId,
} from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import {
  OrchestratorProviderError,
  callOpenAiCompatibleModel,
  orchestratorModelConfig,
} from "./lib/orchestrator-model.js";

const SYSTEM_PROMPT = `You are AMTECH's front-door onboarding agent.
You are setting up a real AI employee, not a demo. Chat naturally, extract business facts, and never ask a rigid questionnaire when the owner already gave the information.

Rules:
- Before account setup you may answer product questions and collect context only.
- Do not provision, connect providers, send external messages, or perform business operations.
- Account setup requires phone verification and email/password. Payment is never required.
- The chat UI owns phone/code/password controls. Never ask the owner to type passwords, verification codes, API keys, OAuth tokens, or secrets into normal chat.
- When business intake is ready, route the owner to the secure controls in the chat instead of collecting more context.
- Default employee_type/profile_package_key is contractor_estimator, but support any business kind from the owner's words.
- Stop the onboarding chat as soon as you have the minimum setup facts. Do not keep interviewing the owner after that point.
- Minimum setup facts are: business_display_name, business_kind, timezone, owner_name if available, employee_name, and at least one workflow or seven_question_answers entry.
- When the minimum facts are present, set state to manifest_summary_confirmed, ready_for_phone_verification to true, missing_fields to [], and tell the owner to continue to phone verification.
- Return ONLY compact JSON matching:
{
  "assistant_message": "string",
  "state": "anonymous_chat|business_context_collected|manifest_summary_confirmed|phone_verified|amtech_account_created|employee_claimed|provision_requested|employee_live",
  "manifest_patch": {
    "employee_type": "string",
    "profile_package_key": "string",
    "business_display_name": "string",
    "business_kind": "string",
    "timezone": "string",
    "owner_name": "string",
    "owner_email": "string",
    "employee_name": "string",
    "top_workflows": ["string"],
    "tools_mentioned": ["string"],
    "seed_skills": ["string"],
    "pricing_facts": [{"key":"string","value":"string","source_snippet":"string","confidence":"high|medium|low"}],
    "branding_facts": [{"key":"string","value":"string","source_snippet":"string","confidence":"high|medium|low"}],
    "customer_job_facts": [{"key":"string","value":"string","source_snippet":"string","confidence":"high|medium|low"}],
    "seven_question_answers": {}
  },
  "ready_for_phone_verification": boolean,
  "missing_fields": ["string"]
}
Prefer a short useful next question.`;

interface OrchestratorRequest {
  session_id?: string;
  web_session_id?: string;
  phone_e164?: string;
  surface?: "web" | "sms";
  message: string;
}

function internalAuthorized(header: string | undefined | null): boolean {
  const token = process.env.MANAGER_INTERNAL_TOKEN;
  return Boolean(token && header === `Bearer ${token}`);
}

function mergeManifest(existing: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    merged[key] = value;
  }
  return merged;
}

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function hasArrayValue(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => nonBlank(item));
}

export function onboardingManifestReadiness(manifest: Record<string, unknown>): { ready: boolean; missing_fields: string[] } {
  const missing: string[] = [];
  if (!nonBlank(manifest.business_display_name)) missing.push("business_display_name");
  if (!nonBlank(manifest.business_kind)) missing.push("business_kind");
  if (!nonBlank(manifest.timezone)) missing.push("timezone");
  if (!nonBlank(manifest.employee_name)) missing.push("employee_name");
  const seven = manifest.seven_question_answers;
  const hasSevenAnswers = Boolean(seven && typeof seven === "object" && Object.values(seven as Record<string, unknown>).some(nonBlank));
  if (!hasArrayValue(manifest.top_workflows) && !hasSevenAnswers) missing.push("top_workflows");
  return { ready: missing.length === 0, missing_fields: missing };
}

function readyMessage(manifest: Record<string, unknown>): string {
  const employee = nonBlank(manifest.employee_name) ? manifest.employee_name : "your employee";
  const business = nonBlank(manifest.business_display_name) ? manifest.business_display_name : "your business";
  return `I have enough to set up ${employee} for ${business}. Next, verify your phone and create the owner account so I can provision the employee.`;
}

function logOnboarding(event: string, details: Record<string, unknown>): void {
  // Do not log owner messages, verification codes, passwords, cookies, or provider keys.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    scope: "onboarding",
    event,
    at: new Date().toISOString(),
    ...details,
  }));
}

function providerFailureResponse(err: OrchestratorProviderError): {
  error: string;
  operator_error_code: string;
  user_facing_summary_hint: string;
} {
  return {
    error: "onboarding_model_unavailable",
    operator_error_code: err.kind === "auth_or_credit" ? "provider_auth_or_credit_gated" : `provider_${err.kind}`,
    user_facing_summary_hint: "I could not complete that setup message right now. The setup service is temporarily unavailable; try again after the operator fixes the provider access.",
  };
}

export function registerOrchestratorRoutes(app: Hono): void {
  app.post("/manager/orchestrator/web", async (c) => {
    if (!internalAuthorized(c.req.header("Authorization"))) return c.json({ error: "unauthorized" }, 401);
    const input = (await c.req.json()) as OrchestratorRequest;
    if (!input.message) return c.json({ error: "message_required" }, 400);
    const db = serviceClient();
    let session: any = null;
    if (input.session_id) {
      const { data } = await db.from("onboarding_sessions").select("*").eq("id", input.session_id).maybeSingle();
      session = data;
    }
    if (!session) {
      const id = newId(ID_PREFIX.onboardingSession);
      const { data } = await db.from("onboarding_sessions").insert({
        id,
        web_session_id: input.web_session_id ?? null,
        phone_e164: input.phone_e164 ?? null,
        surface: input.surface ?? "web",
        state: "anonymous_chat",
        manifest_draft: {
          employee_type: "contractor_estimator",
          profile_package_key: "contractor_estimator",
          timezone: "America/New_York",
          seed_skills: ["estimate", "invoice", "daily-checkin"],
        },
        transcript: [],
      }).select("*").single();
      session = data;
    }

    const transcript = Array.isArray(session.transcript) ? session.transcript : [];
    const modelConfig = orchestratorModelConfig();
    const started = Date.now();
    logOnboarding("model_call_start", {
      session_id: session.id,
      state: session.state,
      surface: input.surface ?? "web",
      provider: modelConfig.provider,
      model: modelConfig.model,
      base_url: modelConfig.baseUrl,
      response_format: modelConfig.responseFormat,
      transcript_turns: transcript.length,
      message_chars: input.message.length,
    });
    let model;
    try {
      model = await callOpenAiCompatibleModel([
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            current_state: session.state,
            current_manifest: session.manifest_draft ?? {},
            transcript,
            new_owner_message: input.message,
          }),
        },
      ], modelConfig);
    } catch (err) {
      const elapsed_ms = Date.now() - started;
      if (err instanceof OrchestratorProviderError) {
        logOnboarding("model_call_failed", {
          session_id: session.id,
          state: session.state,
          surface: input.surface ?? "web",
          provider: err.provider,
          model: err.model,
          base_url: err.baseUrl,
          status: err.status,
          error_kind: err.kind,
          elapsed_ms,
        });
        return c.json(providerFailureResponse(err), err.kind === "auth_or_credit" ? 402 : 503);
      }
      logOnboarding("model_call_failed", {
        session_id: session.id,
        state: session.state,
        surface: input.surface ?? "web",
        provider: modelConfig.provider,
        model: modelConfig.model,
        base_url: modelConfig.baseUrl,
        error_kind: "unexpected",
        error_name: (err as Error).name,
        elapsed_ms,
      });
      return c.json({
        error: "onboarding_model_unavailable",
        operator_error_code: "onboarding_model_unexpected_error",
        user_facing_summary_hint: "I could not complete that setup message right now. Try again after the operator checks the setup service.",
      }, 503);
    }
    const state = OnboardingState.safeParse(model.state).success ? model.state : session.state;
    const manifest = mergeManifest(session.manifest_draft ?? {}, model.manifest_patch);
    const readiness = onboardingManifestReadiness(manifest);
    const resolvedState = readiness.ready && ["anonymous_chat", "business_context_collected"].includes(state)
      ? "manifest_summary_confirmed"
      : state;
    const assistantMessage = readiness.ready && !model.ready_for_phone_verification
      ? readyMessage(manifest)
      : model.assistant_message;
    const nextTranscript = [
      ...transcript,
      { role: "owner", body: input.message, at: new Date().toISOString() },
      { role: "assistant", body: assistantMessage, at: new Date().toISOString() },
    ];
    await db.from("onboarding_sessions").update({
      state: resolvedState,
      manifest_draft: manifest,
      transcript: nextTranscript,
      phone_e164: input.phone_e164 ?? session.phone_e164 ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", session.id);

    logOnboarding("model_call_succeeded", {
      session_id: session.id,
      previous_state: session.state,
      next_state: resolvedState,
      surface: input.surface ?? "web",
      provider: modelConfig.provider,
      model: modelConfig.model,
      elapsed_ms: Date.now() - started,
      ready_for_phone_verification: readiness.ready || model.ready_for_phone_verification,
      missing_fields: readiness.ready ? [] : (model.missing_fields?.length ? model.missing_fields : readiness.missing_fields),
    });

    return c.json({
      session_id: session.id,
      assistant_message: assistantMessage,
      state: resolvedState,
      manifest_draft: manifest,
      ready_for_phone_verification: readiness.ready || model.ready_for_phone_verification,
      missing_fields: readiness.ready ? [] : (model.missing_fields?.length ? model.missing_fields : readiness.missing_fields),
    });
  });
}
