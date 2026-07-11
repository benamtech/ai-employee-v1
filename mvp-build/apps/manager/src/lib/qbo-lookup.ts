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
  | { status: "needs_disambiguation"; candidates: QboEntityCandidate[] }
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

interface CacheEntry {
  fetchedAt: number;
  entities: QboEntityCandidate[];
}

const cache = new Map<string, CacheEntry>();

function cacheKey(connectorId: string, entityType: QboLookupEntityType): string {
  return `${connectorId}:${entityType}`;
}

async function loadEntities(
  config: QboClientConfig,
  connectorId: string,
  entityType: QboLookupEntityType,
): Promise<QboEntityCandidate[]> {
  const key = cacheKey(connectorId, entityType);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.entities;

  const nameField = NAME_FIELD[entityType];
  const page = await queryEntity(config, entityType, `select * from ${entityType} maxresults 1000`);
  const entities: QboEntityCandidate[] = page.entities
    .map((row) => ({ id: String((row as Record<string, unknown>).Id ?? ""), name: String((row as Record<string, unknown>)[nameField] ?? "") }))
    .filter((e) => e.id && e.name);
  cache.set(key, { fetchedAt: Date.now(), entities });
  return entities;
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
  const entities = await loadEntities(config, connectorId, entityType);
  const query = name.trim().toLowerCase();
  if (!query) return { status: "not_found" };

  const exact = entities.filter((e) => e.name.trim().toLowerCase() === query);
  if (exact.length === 1) return { status: "resolved", id: exact[0]!.id, name: exact[0]!.name };
  if (exact.length > 1) return { status: "needs_disambiguation", candidates: exact.slice(0, MAX_CANDIDATES) };

  const partial = entities.filter((e) => e.name.toLowerCase().includes(query));
  if (partial.length > 0) return { status: "needs_disambiguation", candidates: partial.slice(0, MAX_CANDIDATES) };

  return { status: "not_found" };
}

/** Test-only cache reset so unit tests don't leak entities across cases that
 *  reuse the same connector id. Not called from production code paths. */
export function clearQboLookupCacheForTests(): void {
  cache.clear();
}
