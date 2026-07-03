/**
 * Supabase/PostgREST result helpers.
 *
 * PostgREST calls return `{ data, error }`. Ignoring `error` silently turns a DB
 * fault into an empty read (which can masquerade as "not found" / an auth denial)
 * or a no-op write that still reports success — both are real correctness/security
 * bugs. Use these at every consequential call site so a DB fault fails loud.
 *
 * Telemetry-style best-effort writes (audit_log, feature_checks, usage_events,
 * runtime health snapshots) deliberately do NOT use `mustWrite`: a failed log must
 * not abort the owner-facing action it is recording. Those stay non-fatal by design.
 */

export interface DbResult<T> {
  data: T;
  error: { message: string; code?: string } | null;
}

/** Read helper: return `data`, throw on a real DB error (never swallow it as empty). */
export function orThrow<T>(res: DbResult<T>, where: string): T {
  if (res.error) throw new Error(`db_read_failed:${where}: ${res.error.message}`);
  return res.data;
}

/**
 * Consequential-write helper: await a mutation builder and throw on error so a
 * failed insert/update/delete is never silently treated as success. Returns the
 * rows the mutation surfaced (when `.select()` was chained), else `null`.
 */
export async function mustWrite<T = unknown>(
  res: DbResult<T> | PromiseLike<DbResult<T>>,
  where: string,
): Promise<T> {
  const settled = await res;
  if (settled.error) throw new Error(`db_write_failed:${where}: ${settled.error.message}`);
  return settled.data;
}

/** Postgres unique_violation. A concurrent insert that loses a unique-key race
 *  surfaces this, not a logic bug. */
export const PG_UNIQUE_VIOLATION = "23505";

/**
 * Insert that tolerates losing a unique-key race: returns `{ conflict: true }` on a
 * 23505 instead of throwing, so a duplicate that slips past an app-level pre-check
 * is handled as a duplicate (not a 500). Any other DB error still fails loud. Use
 * with a unique index as the backstop (e.g. inbound_events idempotency_key).
 */
export async function insertDedup(
  res: DbResult<unknown> | PromiseLike<DbResult<unknown>>,
  where: string,
): Promise<{ conflict: boolean }> {
  const settled = await res;
  if (settled.error) {
    if (settled.error.code === PG_UNIQUE_VIOLATION) return { conflict: true };
    throw new Error(`db_write_failed:${where}: ${settled.error.message}`);
  }
  return { conflict: false };
}
