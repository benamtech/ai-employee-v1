import type { SupabaseClient } from "@amtech/db";
import { OnboardingManifest } from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import { buildProfileContext } from "./profile-context.js";

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
  return Number((result as { count?: number | null }).count ?? 0);
}

export async function buildBusinessBrainIndex(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  snapshot?: EmployeeSnapshot;
}) {
  const { data: employee } = await db
    .from("employees")
    .select("id,profile_package_key,status,profile_id")
    .eq("account_id", input.account_id)
    .eq("id", input.employee_id)
    .maybeSingle();
  const { data: manifestRow } = await db
    .from("employee_manifests")
    .select("manifest,profile_package_key")
    .eq("employee_id", input.employee_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: buildRow } = await db
    .from("employee_profile_builds")
    .select("generated_path,install_status,validation_status,package_key,updated_at")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const packageKey = String(
    (buildRow as { package_key?: string } | null)?.package_key ??
    (employee as { profile_package_key?: string } | null)?.profile_package_key ??
    (manifestRow as { profile_package_key?: string } | null)?.profile_package_key ??
    "contractor_estimator",
  );
  const parsedManifest = OnboardingManifest.safeParse((manifestRow as { manifest?: unknown } | null)?.manifest);
  const profileContext = parsedManifest.success
    ? buildProfileContext({ packageKey, manifest: parsedManifest.data })
    : null;
  const snapshot = input.snapshot;
  const factCount = await countRows(db, "business_brain_facts", input);

  const contextSlots = profileContext?.slots.map((slot) => ({
    key: slot.key,
    title: slot.title,
    fact_count: slot.facts.length,
  })) ?? [];

  return {
    brain_index: {
      profile_package: packageKey,
      employee_status: (employee as { status?: string } | null)?.status ?? "unknown",
      context_slots: contextSlots,
      native_memory: {
        status: (buildRow as { install_status?: string } | null)?.install_status === "installed" ? "rendered" : "pending",
        memory_md: "memories/MEMORY.md",
        user_md: "memories/USER.md",
        generated_path: (buildRow as { generated_path?: string | null } | null)?.generated_path ?? null,
        validation_status: (buildRow as { validation_status?: string | null } | null)?.validation_status ?? null,
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
    },
  };
}

export async function readBusinessFactsResource(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
}) {
  const { data } = await db
    .from("business_brain_facts")
    .select("id,fact_key,fact_value,category,source,confidence,updated_at")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .order("updated_at", { ascending: false })
    .limit(100);
  return { facts: data ?? [] };
}

