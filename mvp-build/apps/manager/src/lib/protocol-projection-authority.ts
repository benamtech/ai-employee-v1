import type { SupabaseClient } from "@amtech/db";

export interface ProjectedProtocolAuthority {
  protocol_assignment_id?: unknown;
  protocol_authority_version?: unknown;
}

export type ProjectedProtocolAuthorityDecision =
  | { ok: true; authority_version: string | null }
  | {
      ok: false;
      status: 400 | 409;
      error:
        | "protocol_authority_incomplete"
        | "protocol_assignment_mismatch"
        | "protocol_authority_version_stale";
    };

function optionalText(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

export async function loadCurrentAssignmentAuthorityVersion(
  db: SupabaseClient,
  assignmentId: string,
): Promise<string | null> {
  const result = await db.from("authority_versions")
    .select("current_version")
    .eq("scope_type", "employee_assignment")
    .eq("scope_id", assignmentId)
    .is("revoked_at", null)
    .maybeSingle();
  if (result.error) throw result.error;
  const current = optionalText(result.data?.current_version);
  return current || null;
}

export async function validateProjectedProtocolAuthority(
  db: SupabaseClient,
  actualAssignmentId: string,
  projected: ProjectedProtocolAuthority,
): Promise<ProjectedProtocolAuthorityDecision> {
  const projectedAssignmentId = optionalText(projected.protocol_assignment_id);
  const projectedAuthorityVersion = optionalText(projected.protocol_authority_version);

  if (!projectedAssignmentId && !projectedAuthorityVersion) {
    return { ok: true, authority_version: null };
  }
  if (!projectedAssignmentId || !projectedAuthorityVersion) {
    return { ok: false, status: 400, error: "protocol_authority_incomplete" };
  }
  if (projectedAssignmentId !== actualAssignmentId) {
    return { ok: false, status: 409, error: "protocol_assignment_mismatch" };
  }

  const currentAuthorityVersion = await loadCurrentAssignmentAuthorityVersion(db, actualAssignmentId);
  if (!currentAuthorityVersion || currentAuthorityVersion !== projectedAuthorityVersion) {
    return { ok: false, status: 409, error: "protocol_authority_version_stale" };
  }
  return { ok: true, authority_version: currentAuthorityVersion };
}
