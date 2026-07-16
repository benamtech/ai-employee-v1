import type { SupabaseClient } from "@amtech/db";
import { OnboardingManifest } from "@amtech/shared";
import { buildProfileContext } from "./profile-context.js";
import { renderProfileContextMarkdown } from "./memory-seed.js";

function clip(text: string, max = 1800): string {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  return clean.length <= max ? clean : clean.slice(0, max).replace(/\s+\S*$/, "");
}

export async function buildOwnerTurnSystemMessage(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  channel: "sms" | "web";
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
  const channelLine = input.channel === "sms"
    ? "Owner channel: SMS. Keep the reply short, useful, and limited to one question."
    : "Owner channel: web. Be concise, but use enough business context to feel like their employee.";
  return [
    "Owner chat hot path: answer as the live Hermes-backed employee, not a setup router.",
    "First contact: give a light orientation only if useful, then move to one practical next step.",
    channelLine,
    "Do the work where you can. Ask before customer-facing sends, money movement, or destructive changes.",
    context ? `Business context:\n${clip(context)}` : "",
  ].join("\n");
}
