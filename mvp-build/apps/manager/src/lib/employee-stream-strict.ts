import type { SupabaseClient } from "@amtech/db";
import {
  buildEmployeeSnapshot as buildEmployeeSnapshotUnchecked,
  cursorFromSnapshot,
  fetchWorkEventsSince as fetchWorkEventsSinceUnchecked,
  type EmployeeSnapshot,
  type TupleCursor,
  type WorkEventDelta,
} from "./employee-stream.js";

interface SupabaseReadResult<T = unknown> {
  data: T;
  error: unknown;
}

function safeReadError(error: unknown): string {
  if (!error) return "query_failed";
  if (typeof error === "object" && "code" in error && typeof (error as { code?: unknown }).code === "string") {
    return String((error as { code: string }).code).slice(0, 80);
  }
  return "query_failed";
}

/**
 * Owner snapshots are authoritative read models. A failed query must never be
 * indistinguishable from a legitimate empty table, so every awaited fluent read
 * throws before `buildEmployeeSnapshot` can apply an empty-array fallback.
 */
export function requireSnapshotRead<T>(result: SupabaseReadResult<T>, label: string): SupabaseReadResult<T> {
  if (result.error) {
    throw new Error(`employee_snapshot_read_failed:${label}:${safeReadError(result.error)}`);
  }
  return result;
}

function strictBuilder<T extends object>(builder: T, label: string): T {
  return new Proxy(builder, {
    get(target, property) {
      if (property === "then") {
        return (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
          Promise.resolve(target)
            .then((result) => requireSnapshotRead(result as SupabaseReadResult, label))
            .then(onFulfilled, onRejected);
      }

      const value = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        const next = Reflect.apply(value, target, args) as unknown;
        return next && typeof next === "object"
          ? strictBuilder(next as object, label)
          : next;
      };
    },
  }) as T;
}

export function strictSnapshotClient(db: SupabaseClient): SupabaseClient {
  return new Proxy(db as object, {
    get(target, property) {
      if (property === "from") {
        return (table: string) => {
          const from = Reflect.get(target, "from", target) as (name: string) => object;
          return strictBuilder(Reflect.apply(from, target, [table]) as object, table);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as SupabaseClient;
}

export async function buildEmployeeSnapshotStrict(
  db: SupabaseClient,
  employeeId: string,
  accountId: string,
  explicitAssignmentId?: string | null,
): Promise<EmployeeSnapshot> {
  return buildEmployeeSnapshotUnchecked(strictSnapshotClient(db), employeeId, accountId, explicitAssignmentId);
}

export async function fetchWorkEventsSinceStrict(
  db: SupabaseClient,
  employeeId: string,
  accountId: string,
  cursor: TupleCursor | string,
  explicitAssignmentId?: string | null,
): Promise<WorkEventDelta> {
  return fetchWorkEventsSinceUnchecked(strictSnapshotClient(db), employeeId, accountId, cursor, explicitAssignmentId);
}

export { cursorFromSnapshot };
export type { EmployeeSnapshot, TupleCursor, WorkEventDelta };
