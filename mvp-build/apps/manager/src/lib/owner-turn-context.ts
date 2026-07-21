import type { SupabaseClient } from "@amtech/db";
import { OnboardingManifest } from "@amtech/shared";
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
  const { data: manifestRow } = await db
    .from("employee_manifests")
    .select("manifest,profile_package_key")
    .eq("employee_id", input.employee_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const parsed = OnboardingManifest.safeParse((manifestRow as { manifest?: unknown } | null)?.manifest);
  const context = parsed.success
    ? renderProfileContextMarkdown(buildProfileContext({
      packageKey: String((manifestRow as { profile_package_key?: string } | null)?.profile_package_key ?? "contractor_estimator"),
      manifest: parsed.data,
    }))
    : "";
  const channelLines = input.channel === "sms"
    ? [
      "Owner channel: SMS. Keep the reply short, useful, and limited to one question.",
      "This is an already verified, assignment-bound owner session. Do not ask for a code, password, or repeated identity challenge merely because the owner is texting.",
      "Interpret ordinary conversational language naturally; a reply may approve, reject, request edits, answer a question, or continue unrelated work.",
    ]
    : ["Owner channel: web. Be concise, but use enough business context to feel like their employee."];

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
    ...decisionLines,
    context ? `Business context:\n${clip(context)}` : "",
  ].filter(Boolean).join("\n");
}
