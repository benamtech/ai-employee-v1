import type { Hono } from "hono";
import { streamSSE } from "hono/streaming";
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
  streamOpenAiCompatibleText,
} from "./lib/orchestrator-model.js";

const CONVERSATION_SYSTEM_PROMPT = `You are AMTECH's front-door onboarding agent.
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
- If the owner has not already said it naturally, ask one compact follow-up about the operating stack that would help a real employee become useful:
  current scheduling/CRM/field-service software, accounting/payments, website setup, paid ads, lead sources, and whether they use tools such as Jobber, ServiceTitan, QuickBooks, Square, Stripe, Google Business Profile, Google Ads, Meta Ads, Wix, Squarespace, WordPress, Shopify, or a custom site.
- Do not ask for credentials, API keys, admin login details, ad account IDs, payment information, or private customer data in chat. Only ask what they use and what they know about the setup.
- Prefer natural grouped questions over a checklist. If the owner already gave enough detail, acknowledge it and move on.
- When the minimum facts are present, tell the owner to continue to phone verification in the secure step.
- Return only natural language for the owner. Do not return JSON.`;

const EXTRACTOR_SYSTEM_PROMPT = `You are AMTECH's onboarding state extractor.
Extract structured setup state from the redacted onboarding context and the visible assistant message. Return ONLY compact JSON matching:
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
    "employee_name": "string",
    "top_workflows": ["string"],
    "tools_mentioned": ["string"],
    "current_software": ["string"],
    "field_service_platforms": ["string"],
    "accounting_payment_tools": ["string"],
    "website_setup": {"platform":"string","domain_status":"string","known_notes":"string"},
    "paid_ads": {"uses_paid_ads": "yes|no|unknown", "channels": ["string"], "known_notes": "string"},
    "lead_sources": ["string"],
    "seed_skills": ["string"],
    "pricing_facts": [{"key":"string","value":"string","source_snippet":"string","confidence":"high|medium|low"}],
    "branding_facts": [{"key":"string","value":"string","source_snippet":"string","confidence":"high|medium|low"}],
    "customer_job_facts": [{"key":"string","value":"string","source_snippet":"string","confidence":"high|medium|low"}],
    "seven_question_answers": {}
  },
  "ready_for_phone_verification": boolean,
  "missing_fields": ["string"]
}
Rules:
- Use proposed_assistant_message as assistant_message unless it conflicts with the extracted state.
- Never add phone numbers, emails, passwords, verification codes, API keys, OAuth tokens, secrets, session ids, account ids, or auth refs to manifest_patch.
- Capture only non-secret operating context in current_software, field_service_platforms, accounting_payment_tools, website_setup, paid_ads, lead_sources, tools_mentioned, and seven_question_answers.
- Recognize common tools and platforms including Jobber, ServiceTitan, Housecall Pro, QuickBooks, Square, Stripe, Google Business Profile, Google Ads, Meta/Facebook Ads, WordPress, Wix, Squarespace, Shopify, GoDaddy, and custom websites.
- When the minimum facts are present, set state to manifest_summary_confirmed, ready_for_phone_verification to true, and missing_fields to [].
- Minimum setup facts are: business_display_name, business_kind, timezone, owner_name if available, employee_name, and at least one workflow or seven_question_answers entry.`;

interface OrchestratorRequest {
  session_id?: string;
  web_session_id?: string;
  phone_e164?: string;
  surface?: "web" | "sms";
  message: string;
}

interface OnboardingTurnResult {
  session_id: string;
  assistant_message: string;
  state: string;
  manifest_draft: Record<string, unknown>;
  ready_for_phone_verification: boolean;
  missing_fields: string[];
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

const SENSITIVE_MODEL_FIELD = /(email|phone|password|code|token|secret|key|auth|session|account_id|verified_phone_ref)/i;

function redactSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[redacted-phone-or-code]");
}

function modelSafeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_MODEL_FIELD.test(key)) return undefined;
  if (typeof value === "string") return redactSensitiveText(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => modelSafeValue(key, item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") return modelSafeObject(value as Record<string, unknown>);
  return value;
}

export function modelSafeObject(input: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const next = modelSafeValue(key, value);
    if (next !== undefined) safe[key] = next;
  }
  return safe;
}

export function modelSafeTranscript(transcript: unknown[]): unknown[] {
  return transcript.map((turn) => {
    if (!turn || typeof turn !== "object") return turn;
    const record = turn as Record<string, unknown>;
    return {
      ...modelSafeObject(record),
      ...(typeof record.body === "string" ? { body: redactSensitiveText(record.body) } : {}),
    };
  });
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

function buildOnboardingMessages(
  systemPrompt: string,
  session: Record<string, any>,
  transcript: unknown[],
  input: OrchestratorRequest,
  proposedAssistantMessage?: string,
) {
  return [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        current_state: session.state,
        current_manifest: modelSafeObject(session.manifest_draft ?? {}),
        transcript: modelSafeTranscript(transcript),
        new_owner_message: redactSensitiveText(input.message),
        ...(proposedAssistantMessage ? { proposed_assistant_message: redactSensitiveText(proposedAssistantMessage) } : {}),
      }),
    },
  ];
}

async function getOrCreateOnboardingSession(input: OrchestratorRequest): Promise<Record<string, any>> {
  const db = serviceClient();
  let session: any = null;
  if (input.session_id) {
    const { data } = await db.from("onboarding_sessions").select("*").eq("id", input.session_id).maybeSingle();
    session = data;
  }
  if (session) return session;

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
  return data as Record<string, any>;
}

async function handleOnboardingTurn(
  input: OrchestratorRequest,
  streamAssistantDelta?: (delta: string) => Promise<void> | void,
): Promise<OnboardingTurnResult> {
  const db = serviceClient();
  const session = await getOrCreateOnboardingSession(input);
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
    stream: Boolean(streamAssistantDelta),
    transcript_turns: transcript.length,
    message_chars: input.message.length,
  });

  let model;
  try {
    let assistantText = "";
    if (streamAssistantDelta) {
      assistantText = await streamOpenAiCompatibleText(
        buildOnboardingMessages(CONVERSATION_SYSTEM_PROMPT, session, transcript, input),
        modelConfig,
        streamAssistantDelta,
      );
    }
    model = await callOpenAiCompatibleModel(
      buildOnboardingMessages(
        EXTRACTOR_SYSTEM_PROMPT,
        session,
        transcript,
        input,
        assistantText || undefined,
      ),
      modelConfig,
    );
    if (assistantText.trim()) model.assistant_message = assistantText.trim();
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
      throw err;
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
    throw err;
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

  const missing_fields = readiness.ready ? [] : (model.missing_fields?.length ? model.missing_fields : readiness.missing_fields);
  const ready_for_phone_verification = readiness.ready || model.ready_for_phone_verification;
  logOnboarding("model_call_succeeded", {
    session_id: session.id,
    previous_state: session.state,
    next_state: resolvedState,
    surface: input.surface ?? "web",
    provider: modelConfig.provider,
    model: modelConfig.model,
    elapsed_ms: Date.now() - started,
    ready_for_phone_verification,
    missing_fields,
  });

  return {
    session_id: session.id,
    assistant_message: assistantMessage,
    state: resolvedState,
    manifest_draft: manifest,
    ready_for_phone_verification,
    missing_fields,
  };
}

export function registerOrchestratorRoutes(app: Hono): void {
  app.post("/manager/orchestrator/web", async (c) => {
    if (!internalAuthorized(c.req.header("Authorization"))) return c.json({ error: "unauthorized" }, 401);
    const input = (await c.req.json()) as OrchestratorRequest;
    if (!input.message) return c.json({ error: "message_required" }, 400);
    try {
      return c.json(await handleOnboardingTurn(input));
    } catch (err) {
      if (err instanceof OrchestratorProviderError) {
        return c.json(providerFailureResponse(err), err.kind === "auth_or_credit" ? 402 : 503);
      }
      return c.json({
        error: "onboarding_model_unavailable",
        operator_error_code: "onboarding_model_unexpected_error",
        user_facing_summary_hint: "I could not complete that setup message right now. Try again after the operator checks the setup service.",
      }, 503);
    }
  });

  app.post("/manager/orchestrator/web/stream", async (c) => {
    if (!internalAuthorized(c.req.header("Authorization"))) return c.json({ error: "unauthorized" }, 401);
    const input = (await c.req.json()) as OrchestratorRequest;
    if (!input.message) return c.json({ error: "message_required" }, 400);
    return streamSSE(c, async (stream) => {
      let closed = false;
      let writeChain = Promise.resolve();
      stream.onAbort(() => { closed = true; });
      const writeSse = (event: string, data: Record<string, unknown>) => {
        writeChain = writeChain
          .then(() => closed ? undefined : stream.writeSSE({ event, data: JSON.stringify(data) }))
          .catch((err) => {
            closed = true;
            // eslint-disable-next-line no-console
            console.warn("[manager] onboarding SSE write failed:", err instanceof Error ? err.message : String(err));
          });
        return writeChain;
      };

      await writeSse("status", { kind: "status", status: "reading" });
      try {
        const result = await handleOnboardingTurn(input, async (delta) => {
          await writeSse("delta", { kind: "delta", delta });
        });
        await writeSse("done", { kind: "done", ...result });
      } catch (err) {
        if (err instanceof OrchestratorProviderError) {
          await writeSse("error", { kind: "error", ...providerFailureResponse(err) });
        } else {
          await writeSse("error", {
            kind: "error",
            error: "onboarding_model_unavailable",
            operator_error_code: "onboarding_model_unexpected_error",
            user_facing_summary_hint: "I could not complete that setup message right now. Try again after the operator checks the setup service.",
          });
        }
      }
    });
  });
}
