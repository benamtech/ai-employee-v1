import type { SupabaseClient } from "@amtech/db";
import { compileAdaptiveConnectorPlan, OnboardingManifest } from "@amtech/shared";
import { buildProfileContext } from "./profile-context.js";
import { renderProfileContextMarkdown } from "./memory-seed.js";

function clip(text: string, max = 2600): string {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  return clean.length <= max ? clean : clean.slice(0, max).replace(/\s+\S*$/, "");
}

export interface OwnerDecisionTurnContext {
  context_id: string;
  approval_id: string;
  owner_message_id: string;
  human_principal_id: string;
  action_key: string;
  summary: string;
  risk_level: string;
  resource_class: string;
  resource_id: string;
  snapshot_hash: string;
  expires_at: string;
}

export async function buildOwnerTurnSystemMessage(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  channel: "sms" | "web";
  decision_context?: OwnerDecisionTurnContext | null;
}): Promise<string> {
  const [manifestResult, bindingResult, setupIntentResult] = await Promise.all([
    db.from("employee_manifests")
      .select("manifest,profile_package_key")
      .eq("employee_id", input.employee_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("connector_bindings")
      .select("connector_key,provider,status,lifecycle_state,revoked_at")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .eq("assignment_id", input.assignment_id),
    db.from("connector_setup_intents")
      .select("id,connector_key,label,setup_experience,status,owner_context,updated_at")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .eq("assignment_id", input.assignment_id)
      .in("status", ["requested", "in_progress", "ready"])
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);
  if (manifestResult.error) throw manifestResult.error;
  if (bindingResult.error) throw bindingResult.error;
  if (setupIntentResult.error) throw setupIntentResult.error;

  const manifestRow = manifestResult.data as { manifest?: unknown; profile_package_key?: string | null } | null;
  const parsed = OnboardingManifest.safeParse(manifestRow?.manifest);
  const context = parsed.success
    ? renderProfileContextMarkdown(buildProfileContext({
      packageKey: String(manifestRow?.profile_package_key ?? "contractor_estimator"),
      manifest: parsed.data,
    }))
    : "";
  const connectedConnectorKeys = (bindingResult.data ?? [])
    .filter((binding) =>
      !binding.revoked_at
      && binding.lifecycle_state !== "revoked"
      && ["active", "connected", "working", "current"].includes(String(binding.status)),
    )
    .map((binding) => String(binding.connector_key || binding.provider));
  const activationPlan = compileAdaptiveConnectorPlan(parsed.success ? {
    business_kind: parsed.data.business_kind,
    business_description: `${parsed.data.business_display_name} ${parsed.data.seven_question_answers?.business ?? ""}`,
    tools_mentioned: parsed.data.tools_mentioned,
    top_workflows: parsed.data.top_workflows,
    connected_connector_keys: connectedConnectorKeys,
  } : { connected_connector_keys: connectedConnectorKeys });
  const recommended = activationPlan.recommendations
    .filter((item) => item.recommendation_class === "activate_now" || item.recommendation_class === "high_gain")
    .slice(0, 4);
  const setupIntents = (setupIntentResult.data ?? []) as Array<{
    id: string;
    connector_key: string;
    label: string;
    setup_experience: string;
    status: string;
    owner_context?: Record<string, unknown> | null;
  }>;

  const channelLines = input.channel === "sms"
    ? [
      "Owner channel: SMS. Keep the reply short, useful, and limited to one question.",
      "This is an already verified, assignment-bound owner session. Do not ask for a code, password, or repeated identity challenge merely because the owner is texting.",
      "Interpret ordinary conversational language naturally; a reply may approve, reject, request edits, answer a question, or continue unrelated work.",
    ]
    : ["Owner channel: web. Be concise, but use enough business context to feel like their employee."];

  const setupLines = setupIntents.flatMap((intent) => [
    `Active business-system setup: ${intent.label} [${intent.status}], intent_id=${intent.id}.`,
    "Guide the owner through the next missing business fact or provider action in plain language. Do not ask them to understand OAuth, MCP, webhook signatures, secret storage, or infrastructure terminology.",
  ]);
  const recommendationLines = recommended.length ? [
    `Highest-gain connection opportunities from onboarding evidence: ${recommended.map((item) => `${item.label} (${item.reasons.join("; ")})`).join(" | ")}.`,
    "Recommend at most one connection or automation at a time, tied to a concrete time-saving workflow. Do not turn the conversation into a setup checklist.",
  ] : [];

  const decisionLines = input.decision_context ? [
    "The conversation is currently focused on exactly one pending approval. The following identifiers are hidden authority context, not text to repeat to the owner.",
    `Decision context: context_id=${input.decision_context.context_id}; approval_id=${input.decision_context.approval_id}; owner_message_id=${input.decision_context.owner_message_id}.`,
    `Held action: ${input.decision_context.action_key}. Summary: ${input.decision_context.summary}. Risk: ${input.decision_context.risk_level}.`,
    `Immutable resource: ${input.decision_context.resource_class}:${input.decision_context.resource_id}; snapshot=${input.decision_context.snapshot_hash}; expires=${input.decision_context.expires_at}.`,
    "Use the full language and conversation to infer intent; never require a keyword such as YES.",
    "When the owner clearly approves or rejects this exact held action, call resolve_owner_channel_decision with these exact identifiers and a bounded interpretation of what they meant.",
    "When the owner requests a change, asks a question, gives a conditional answer, or is ambiguous, do not resolve the approval. Respond naturally, perform only safe preparatory work, or ask one concise clarifying question.",
    "Never apply this reply to another approval, never invent identifiers, and never execute the external effect directly from the reply.",
  ] : [];

  return [
    "Owner chat hot path: answer as the live Hermes-backed employee, not a setup router.",
    `Current assignment: ${input.assignment_id}.`,
    "First contact: give a light orientation only if useful, then move to one practical high-time-save next step.",
    ...channelLines,
    "Reason broadly and use effective tools proactively. Narrow only at the final customer-facing, money, or destructive effect boundary.",
    "Do the work where you can. Use the existing Manager approval and durable-effect tools before consequential actions.",
    "Never expose credentials, raw provider payloads, MCP terminology, or Manager policy internals.",
    ...setupLines,
    ...recommendationLines,
    ...decisionLines,
    context ? `Business context:\n${clip(context)}` : "",
  ].filter(Boolean).join("\n");
}
