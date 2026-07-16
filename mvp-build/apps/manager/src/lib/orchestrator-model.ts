export interface OrchestratorModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OrchestratorModelConfig {
  provider: "openai_compatible" | "anthropic";
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  responseFormat: "json_schema" | "json_object" | "none";
}

export interface LlmResponse {
  assistant_message: string;
  state: string;
  manifest_patch: Record<string, unknown>;
  ready_for_phone_verification: boolean;
  missing_fields: string[];
}

export type OrchestratorProviderErrorKind =
  | "auth_or_credit"
  | "rate_limited"
  | "provider_unavailable"
  | "bad_request"
  | "unknown";

export class OrchestratorProviderError extends Error {
  status: number;
  provider: OrchestratorModelConfig["provider"];
  model: string;
  baseUrl: string;
  kind: OrchestratorProviderErrorKind;

  constructor(params: {
    status: number;
    provider: OrchestratorModelConfig["provider"];
    model: string;
    baseUrl: string;
    message: string;
  }) {
    super(params.message || `model_${params.status}`);
    this.name = "OrchestratorProviderError";
    this.status = params.status;
    this.provider = params.provider;
    this.model = params.model;
    this.baseUrl = params.baseUrl;
    this.kind = classifyProviderError(params.status, params.message);
  }
}

interface OpenAiCompatibleChoice {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
}

interface OpenAiCompatibleResponse {
  choices?: OpenAiCompatibleChoice[];
  error?: { message?: string };
}

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
}

export function classifyProviderError(status: number, message = ""): OrchestratorProviderErrorKind {
  const lower = message.toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    lower.includes("credit") ||
    lower.includes("spending limit") ||
    lower.includes("insufficient") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden")
  ) {
    return "auth_or_credit";
  }
  if (status === 429 || lower.includes("rate limit")) return "rate_limited";
  if (status >= 500) return "provider_unavailable";
  if (status >= 400) return "bad_request";
  return "unknown";
}

const ONBOARDING_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "assistant_message",
    "state",
    "manifest_patch",
    "ready_for_phone_verification",
    "missing_fields",
  ],
  properties: {
    assistant_message: { type: "string" },
    state: {
      type: "string",
      enum: [
        "anonymous_chat",
        "business_context_collected",
        "manifest_summary_confirmed",
        "phone_verified",
        "amtech_account_created",
        "employee_claimed",
        "provision_requested",
        "employee_live",
      ],
    },
    manifest_patch: {
      type: "object",
      additionalProperties: true,
      properties: {
        employee_type: { type: "string" },
        profile_package_key: { type: "string" },
        business_display_name: { type: "string" },
        business_kind: { type: "string" },
        timezone: { type: "string" },
        owner_name: { type: "string" },
        owner_email: { type: "string" },
        employee_name: { type: "string" },
        top_workflows: { type: "array", items: { type: "string" } },
        tools_mentioned: { type: "array", items: { type: "string" } },
        seed_skills: { type: "array", items: { type: "string" } },
        pricing_facts: { type: "array", items: sourcedFactSchema() },
        branding_facts: { type: "array", items: sourcedFactSchema() },
        customer_job_facts: { type: "array", items: sourcedFactSchema() },
        seven_question_answers: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    ready_for_phone_verification: { type: "boolean" },
    missing_fields: { type: "array", items: { type: "string" } },
  },
} as const;

function sourcedFactSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["key", "value", "source_snippet", "confidence"],
    properties: {
      key: { type: "string" },
      value: { type: "string" },
      source_snippet: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
  };
}

export function orchestratorModelConfig(env: NodeJS.ProcessEnv = process.env): OrchestratorModelConfig {
  const provider = env.ORCHESTRATOR_PROVIDER === "anthropic" ? "anthropic" : "openai_compatible";
  const firstNonBlank = (...values: Array<string | undefined>): string | undefined =>
    values.find((value) => value !== undefined && value.trim() !== "");
  const xaiConfigured = firstNonBlank(env.XAI_API_KEY, env.xai_api_key, env.XAI_MODEL, env.xai_model);
  const apiKey = provider === "anthropic"
    ? firstNonBlank(env.ORCHESTRATOR_API_KEY, env.ANTHROPIC_API_KEY)
    : firstNonBlank(env.ORCHESTRATOR_API_KEY, env.XAI_API_KEY, env.xai_api_key, env.OPENAI_API_KEY, env.openai_api_key);
  if (!apiKey) {
    throw new Error(provider === "anthropic"
      ? "ORCHESTRATOR_API_KEY or ANTHROPIC_API_KEY missing."
      : "ORCHESTRATOR_API_KEY, XAI_API_KEY, xai_api_key, or OPENAI_API_KEY missing.");
  }
  const responseFormat =
    env.ORCHESTRATOR_RESPONSE_FORMAT === "none" || env.ORCHESTRATOR_RESPONSE_FORMAT === "json_object"
      ? env.ORCHESTRATOR_RESPONSE_FORMAT
      : "json_schema";

  return {
    provider,
    apiKey,
    baseUrl: (env.ORCHESTRATOR_API_BASE_URL
      ?? (provider === "anthropic"
        ? "https://api.anthropic.com/v1"
        : xaiConfigured
          ? "https://api.x.ai/v1"
          : "https://api.openai.com/v1")).replace(/\/$/, ""),
    model: env.ORCHESTRATOR_MODEL ?? env.xai_model ?? env.XAI_MODEL ?? (provider === "anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4.1"),
    maxTokens: Number(env.ORCHESTRATOR_MAX_TOKENS ?? 1200),
    temperature: Number(env.ORCHESTRATOR_TEMPERATURE ?? 0.2),
    responseFormat: provider === "anthropic" ? "none" : responseFormat,
  };
}

export function extractJson(text: string): LlmResponse {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("orchestrator_response_not_json");
  const parsed = JSON.parse(text.slice(start, end + 1)) as LlmResponse;
  if (!parsed.assistant_message || !parsed.state || !parsed.manifest_patch) {
    throw new Error("orchestrator_response_invalid");
  }
  return {
    ...parsed,
    ready_for_phone_verification: Boolean(parsed.ready_for_phone_verification),
    missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : [],
  };
}

export function openAiCompatibleRequestBody(
  config: OrchestratorModelConfig,
  messages: OrchestratorModelMessage[],
): Record<string, unknown> {
  return {
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    ...(config.responseFormat === "json_schema"
      ? {
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "amtech_onboarding_response",
              schema: ONBOARDING_RESPONSE_SCHEMA,
              strict: true,
            },
          },
        }
      : {}),
    ...(config.responseFormat === "json_object" ? { response_format: { type: "json_object" } } : {}),
  };
}

function providerErrorFromResponse(
  res: Response,
  json: AnthropicResponse | OpenAiCompatibleResponse,
  config: OrchestratorModelConfig,
): OrchestratorProviderError {
  return new OrchestratorProviderError({
    status: res.status,
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    message: json?.error?.message ?? `model_${res.status}`,
  });
}

export function anthropicMessagesRequestBody(
  config: OrchestratorModelConfig,
  messages: OrchestratorModelMessage[],
): Record<string, unknown> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const nonSystem = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));
  return {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    ...(system ? { system } : {}),
    messages: nonSystem,
  };
}

function contentToText(content: string | Array<{ type?: string; text?: string }> | undefined): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? "").join("\n");
  }
  return "";
}

export async function callOpenAiCompatibleModel(
  messages: OrchestratorModelMessage[],
  config = orchestratorModelConfig(),
): Promise<LlmResponse> {
  if (config.provider === "anthropic") {
    const res = await fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(anthropicMessagesRequestBody(config, messages)),
    });
    const json = (await res.json()) as AnthropicResponse;
    if (!res.ok) throw providerErrorFromResponse(res, json, config);
    return extractJson(contentToText(json.content));
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(openAiCompatibleRequestBody(config, messages)),
  });
  const json = (await res.json()) as OpenAiCompatibleResponse;
  if (!res.ok) throw providerErrorFromResponse(res, json, config);
  const text = contentToText(json.choices?.[0]?.message?.content);
  return extractJson(text);
}
