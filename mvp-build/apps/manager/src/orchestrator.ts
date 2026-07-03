import type { Hono } from "hono";
import {
  ID_PREFIX,
  OnboardingState,
  newId,
} from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { callOpenAiCompatibleModel } from "./lib/orchestrator-model.js";

const SYSTEM_PROMPT = `You are AMTECH's front-door onboarding agent.
You are setting up a real AI employee, not a demo. Chat naturally, extract business facts, and never ask a rigid questionnaire when the owner already gave the information.

Rules:
- Before account setup you may answer product questions and collect context only.
- Do not provision, connect providers, send external messages, or perform business operations.
- Account setup requires phone verification and email/password. Payment is never required.
- Default employee_type/profile_package_key is contractor_estimator, but support any business kind from the owner's words.
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
    const model = await callOpenAiCompatibleModel([
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
    ]);
    const state = OnboardingState.safeParse(model.state).success ? model.state : session.state;
    const nextTranscript = [
      ...transcript,
      { role: "owner", body: input.message, at: new Date().toISOString() },
      { role: "assistant", body: model.assistant_message, at: new Date().toISOString() },
    ];
    const manifest = mergeManifest(session.manifest_draft ?? {}, model.manifest_patch);
    await db.from("onboarding_sessions").update({
      state,
      manifest_draft: manifest,
      transcript: nextTranscript,
      phone_e164: input.phone_e164 ?? session.phone_e164 ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", session.id);

    return c.json({
      session_id: session.id,
      assistant_message: model.assistant_message,
      state,
      manifest_draft: manifest,
      ready_for_phone_verification: model.ready_for_phone_verification,
      missing_fields: model.missing_fields ?? [],
    });
  });
}
