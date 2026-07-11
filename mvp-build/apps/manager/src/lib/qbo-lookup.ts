/**
 * QuickBooks Online entity resolution — the employee refers to entities by
 * name ("Sherwin-Williams", "Materials Expense"), never by internal QBO id.
 * TTL-cached per-connector name maps for Customer, Vendor, Account, Item,
 * Class, Department. Unlike laf-rge/quickbooks-mcp's partial-match fallback
 * (which can silently pick a wrong entity), an ambiguous or zero-match name
 * ALWAYS returns a structured `needs_disambiguation`/`not_found` result —
 * never a best-guess pick. See quickbooks-connector-architecture.md §2.
 */
import { queryEntity, type QboClientConfig } from "./qbo-client.js";

export type QboLookupEntityType = "Customer" | "Vendor" | "Account" | "Item" | "Class" | "Department";

export interface QboEntityCandidate {
  id: string;
  name: string;
}

export type QboLookupResult =
  | { status: "resolved"; id: string; name: string }
  | { status: "needs_disambiguation"; candidates: QboEntityCandidate[]; truncated?: boolean; returned_count?: number; total_count?: number }
  | { status: "lookup_truncated"; returned_count: number; total_count: number }
  | { status: "not_found" };

const NAME_FIELD: Record<QboLookupEntityType, string> = {
  Customer: "DisplayName",
  Vendor: "DisplayName",
  Account: "Name",
  Item: "Name",
  Class: "Name",
  Department: "Name",
};

const TTL_MS = 5 * 60 * 1000;
const MAX_CANDIDATES = 10;
const MAX_CACHE_ENTRIES = 120;
const QBO_LOOKUP_PAGE_SIZE = 1000;

interface CacheEntry {
  fetchedAt: number;
  entities: QboEntityCandidate[];
  returnedCount: number;
  totalCount: number;
  truncated: boolean;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(connectorId: string, entityType: QboLookupEntityType): string {
  return `${connectorId}:${entityType}`;
}

async function loadEntities(
  config: QboClientConfig,
  connectorId: string,
  entityType: QboLookupEntityType,
): Promise<CacheEntry> {
  const key = cacheKey(connectorId, entityType);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;

  const nameField = NAME_FIELD[entityType];
  const page = await queryEntity(config, entityType, `select * from ${entityType} maxresults 1000`);
  const entities: QboEntityCandidate[] = page.entities
    .map((row) => ({ id: String((row as Record<string, unknown>).Id ?? ""), name: String((row as Record<string, unknown>)[nameField] ?? "") }))
    .filter((e) => e.id && e.name);
  const entry: CacheEntry = {
    fetchedAt: Date.now(),
    entities,
    returnedCount: page.entities.length,
    totalCount: page.count,
    truncated: page.count > page.entities.length || page.entities.length >= QBO_LOOKUP_PAGE_SIZE,
  };
  cache.set(key, entry);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (!oldest) break;
    cache.delete(oldest);
  }
  return entry;
}

/**
 * Resolve a QBO entity by name. Exact (case-insensitive, trimmed) match
 * resolves directly. No exact match falls back to a partial (substring)
 * match set, offered as disambiguation candidates — NEVER auto-picked. Zero
 * candidates of either kind returns `not_found`.
 */
export async function resolveQboEntity(
  config: QboClientConfig,
  connectorId: string,
  entityType: QboLookupEntityType,
  name: string,
): Promise<QboLookupResult> {
  const entry = await loadEntities(config, connectorId, entityType);
  const entities = entry.entities;
  const query = name.trim().toLowerCase();
  if (!query) return { status: "not_found" };

  const exact = entities.filter((e) => e.name.trim().toLowerCase() === query);
  if (entry.truncated && exact.length > 0) {
    return {
      status: "needs_disambiguation",
      candidates: exact.slice(0, MAX_CANDIDATES),
      truncated: true,
      returned_count: entry.returnedCount,
      total_count: entry.totalCount,
    };
  }
  if (exact.length === 1) return { status: "resolved", id: exact[0]!.id, name: exact[0]!.name };
  if (exact.length > 1) return { status: "needs_disambiguation", candidates: exact.slice(0, MAX_CANDIDATES) };

  const partial = entities.filter((e) => e.name.toLowerCase().includes(query));
  if (partial.length > 0) {
    return {
      status: "needs_disambiguation",
      candidates: partial.slice(0, MAX_CANDIDATES),
      ...(entry.truncated ? { truncated: true, returned_count: entry.returnedCount, total_count: entry.totalCount } : {}),
    };
  }

  if (entry.truncated) {
    return { status: "lookup_truncated", returned_count: entry.returnedCount, total_count: entry.totalCount };
  }

  return { status: "not_found" };
}

/** Test-only cache reset so unit tests don't leak entities across cases that
 *  reuse the same connector id. Not called from production code paths. */
export function clearQboLookupCacheForTests(): void {
  cache.clear();
}
