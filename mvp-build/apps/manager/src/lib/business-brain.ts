import type { SupabaseClient } from "@amtech/db";
import { compileAdaptiveConnectorPlan, OnboardingManifest } from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import { buildProfileContext } from "./profile-context.js";
import { orThrow } from "./db.js";

export const BUSINESS_BRAIN_RESOURCES = {
  brain: "amtech://manager/business-brain",
  facts: "amtech://manager/business-facts",
  connector_status: "amtech://manager/connector-status",
  work_queue: "amtech://manager/work-queue",
  artifacts: "amtech://manager/artifacts",
  approvals: "amtech://manager/approvals",
  capability_registry: "amtech://manager/capability-registry",
  runtime_health: "amtech://manager/runtime-health",
} as const;

export async function countRows(db: SupabaseClient, table: string, input: {
  account_id: string;
  employee_id: string;
}): Promise<number> {
  const result = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id);
  if (result.error) throw result.error;
  return Number((result as { count?: number | null }).count ?? 0);
}

export async function buildBusinessBrainIndex(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  snapshot?: EmployeeSnapshot;
}) {
  const employee = orThrow(
    await db
      .from("employees")
      .select("id,profile_package_key,status,profile_id")
      .eq("account_id", input.account_id)
      .eq("id", input.employee_id)
      .maybeSingle(),
    "business_brain.employee",
  ) as { id: string; profile_package_key?: string | null; status?: string | null; profile_id?: string | null } | null;
  if (!employee?.id) throw new Error("business_brain_employee_not_found");

  const manifestRow = orThrow(
    await db
      .from("employee_manifests")
      .select("manifest,profile_package_key")
      .eq("employee_id", input.employee_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "business_brain.manifest",
  ) as { manifest?: unknown; profile_package_key?: string | null } | null;

  const buildRow = orThrow(
    await db
      .from("employee_profile_builds")
      .select("generated_path,install_status,validation_status,package_key,updated_at")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "business_brain.profile_build",
  ) as { generated_path?: string | null; install_status?: string | null; validation_status?: string | null; package_key?: string | null; updated_at?: string | null } | null;

  const packageKey = String(
    buildRow?.package_key ??
    employee.profile_package_key ??
    manifestRow?.profile_package_key ??
    "contractor_estimator",
  );
  const parsedManifest = OnboardingManifest.safeParse(manifestRow?.manifest);
  const profileContext = parsedManifest.success
    ? buildProfileContext({ packageKey, manifest: parsedManifest.data })
    : null;
  const snapshot = input.snapshot;
  const factCount = await countRows(db, "business_brain_facts", input);

  const contextSlots = profileContext?.slots.map((slot) => ({
    key: slot.key,
    title: slot.title,
    fact_count: slot.facts.length,
    facts: slot.facts.slice(0, 8).map((fact) => ({
      key: fact.key,
      value: fact.value.length > 240 ? `${fact.value.slice(0, 237)}...` : fact.value,
      source: fact.source,
      confidence: fact.confidence,
    })),
  })) ?? [];

  const activationPlan = compileAdaptiveConnectorPlan(parsedManifest.success ? {
    business_kind: parsedManifest.data.business_kind,
    business_description: `${parsedManifest.data.business_display_name} ${parsedManifest.data.seven_question_answers?.business ?? ""}`,
    tools_mentioned: parsedManifest.data.tools_mentioned,
    top_workflows: parsedManifest.data.top_workflows,
    connected_connector_keys: (snapshot?.connectors ?? []).map((connector) => String(connector.connector_key || connector.provider)),
  } : {
    connected_connector_keys: (snapshot?.connectors ?? []).map((connector) => String(connector.connector_key || connector.provider)),
  });

  return {
    brain_index: {
      profile_package: packageKey,
      employee_status: employee.status ?? "unknown",
      context_slots: contextSlots,
      activation_plan: activationPlan,
      native_memory: {
        status: buildRow?.install_status === "installed" ? "rendered" : "pending",
        memory_md: "memories/MEMORY.md",
        user_md: "memories/USER.md",
        generated_path: buildRow?.generated_path ?? null,
        validation_status: buildRow?.validation_status ?? null,
      },
      live_state_pointers: [
        BUSINESS_BRAIN_RESOURCES.connector_status,
        BUSINESS_BRAIN_RESOURCES.work_queue,
        BUSINESS_BRAIN_RESOURCES.artifacts,
        BUSINESS_BRAIN_RESOURCES.approvals,
        BUSINESS_BRAIN_RESOURCES.capability_registry,
        BUSINESS_BRAIN_RESOURCES.runtime_health,
      ],
      recall: {
        session_search: "Use Hermes session_search for prior-turn recall before asking the owner to repeat.",
      },
    },
    resources: BUSINESS_BRAIN_RESOURCES,
    proof: {
      fact_count: factCount,
      connector_count: snapshot?.connectors.length ?? await countRows(db, "connector_accounts", input),
      artifact_count: snapshot?.artifacts.length ?? await countRows(db, "artifacts", input),
      open_approval_count: snapshot?.approvals.length ?? 0,
      work_queue_count: (snapshot?.tasks ?? []).length,
      capability_count: (snapshot?.capabilities ?? []).length,
      activation_recommendation_count: activationPlan.recommendations.filter((item) => item.recommendation_class === "activate_now" || item.recommendation_class === "high_gain").length,
    },
  };
}

export async function readBusinessFactsResource(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
}) {
  const facts = orThrow(
    await db
      .from("business_brain_facts")
      .select("id,fact_key,fact_value,category,source,confidence,updated_at")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .order("updated_at", { ascending: false })
      .limit(100),
    "business_brain.facts",
  );
  return { facts: facts ?? [] };
}
