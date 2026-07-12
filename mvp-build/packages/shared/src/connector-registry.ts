/**
 * CE-4 — connector-agnostic capability + custody model.
 *
 * The founder's definition of the business brain is a stream of events from
 * none / any / many connectors. Hermes natively registers any `mcp_servers` entry
 * as first-class tools, and AMTECH's event ingress is already generic
 * (`source: string`). The two things that were NOT connector-agnostic before CE-4:
 *
 *   1. Capability ROUTING was hardcoded per tool — `capability-registry.ts` routed
 *      by substring (email→gmail, invoice/deposit→stripe, quickbooks→qbo). A new
 *      connector needed a new code branch, not just data.
 *   2. Custody had no declarative home — every connector was implicitly
 *      Manager-mediated by being a Manager tool family.
 *
 * This module is the single declarative source both concerns derive from. It is a
 * pure data + resolver module (no DB, no Hermes, no model) so it lives in shared
 * and is consumed by `capability-registry.ts` (routing), `employee-stream.ts`
 * (connection surfaces), `profile-renderer.ts` (custody at render time), and
 * `agent-context.ts` (primer "what you can do" framing).
 *
 * Doctrine held: money / customer-facing / write connectors stay Manager-mediated
 * behind the approval gate + egress default-deny (the QuickBooks posture). Only
 * read-only connectors may be wired directly into the employee's `config.yaml`
 * `mcp_servers`. Unknown connectors DEFAULT-DENY to Manager-mediated.
 */

import type { CapabilityCategory } from "./materialization.js";

/**
 * How a connector's tools reach the employee:
 *  - `direct_mcp`       — safe to wire straight into config.yaml `mcp_servers`
 *                         (read-only; no money, no customer-facing sends, no writes).
 *  - `manager_mediated` — must go through the Manager (credential custody, approval
 *                         gate, audit, egress). The posture for Gmail/Stripe/QBO and
 *                         the DEFAULT for anything unrecognized.
 */
export type ConnectorCustody = "direct_mcp" | "manager_mediated";

/**
 * Declarative metadata for a connector, keyed by identity. `hints` are matched as
 * lowercase substrings against a connector's `provider` + `connector_key`, mirroring
 * `deriveConnectionSurfaces`' existing `providerHints` so surfaces and capabilities
 * can't drift. `writes`/`money`/`customer_facing` are the risk axes that DECIDE
 * custody — custody is derived from them, never hand-set to something unsafe.
 */
export interface ConnectorMeta {
  /** Stable connector identity (matches `connector_accounts.connector_key`/provider). */
  key: string;
  /** Owner-language label for surfaces/primer. */
  label: string;
  /** Substrings matched against provider + connector_key (lowercased). */
  hints: string[];
  /** Owner-facing capability category (reuses the existing union). */
  category: CapabilityCategory;
  /** True if the connector can write/change external state. */
  writes: boolean;
  /** True if the connector moves money. */
  money: boolean;
  /** True if the connector sends/changes customer-facing artifacts. */
  customer_facing: boolean;
  /** True if this connector is recognized (vs the generic default fallback). */
  known: boolean;
}

/**
 * The real connectors AMTECH ships today. All three are Manager-mediated: Gmail and
 * QuickBooks write / touch customers, Stripe moves money. They are here so ROUTING
 * (which connector owns a tool / status) and custody derive from one table instead
 * of substring branches. Read-only connectors (e.g. a maps or weather MCP) added
 * later declare `writes/money/customer_facing: false` and become `direct_mcp`.
 */
const KNOWN_CONNECTORS: ReadonlyArray<Omit<ConnectorMeta, "known">> = [
  {
    key: "gmail",
    label: "Email",
    hints: ["gmail", "email", "google-workspace"],
    category: "communication",
    writes: true,
    money: false,
    customer_facing: true,
  },
  {
    key: "stripe",
    label: "Payments",
    hints: ["stripe", "payment", "payments"],
    category: "money",
    writes: true,
    money: true,
    customer_facing: true,
  },
  {
    key: "quickbooks",
    label: "Accounting",
    hints: ["quickbooks", "qbo", "accounting", "intuit"],
    category: "accounting",
    writes: true,
    money: true,
    customer_facing: false,
  },
  {
    key: "reference_data",
    label: "Reference Data",
    hints: ["reference_data", "readonly_mcp", "reference-catalog", "read-only"],
    category: "research",
    writes: false,
    money: false,
    customer_facing: false,
  },
];

/**
 * Generic default for an unrecognized connector. DEFAULT-DENY: assume it writes and
 * keep it Manager-mediated until someone declares it read-only. `category: "system"`
 * puts it in the graph without pretending to know its domain.
 */
function genericMeta(providerOrKey: string): ConnectorMeta {
  return {
    key: providerOrKey || "connector",
    label: humanize(providerOrKey || "Connected system"),
    hints: providerOrKey ? [providerOrKey.toLowerCase()] : [],
    category: "system",
    writes: true,
    money: false,
    customer_facing: false,
    known: false,
  };
}

function humanize(value: string): string {
  const v = value.replace(/[_:-]+/g, " ").trim();
  return v.replace(/\b\w/g, (c) => c.toUpperCase()) || "Connected system";
}

/**
 * Custody is DERIVED from the risk axes, never asserted directly: a connector may go
 * direct-MCP only if it does not write, move money, or touch customers. This is the
 * single enforcement point — `profile-renderer.ts` and the capability graph both call
 * it, so a write/money connector is structurally incapable of a direct-MCP path.
 */
export function custodyFor(meta: Pick<ConnectorMeta, "writes" | "money" | "customer_facing">): ConnectorCustody {
  const safeReadOnly = !meta.writes && !meta.money && !meta.customer_facing;
  return safeReadOnly ? "direct_mcp" : "manager_mediated";
}

/** True iff this connector is allowed a direct config.yaml `mcp_servers` entry. */
export function connectorAllowsDirectMcp(meta: Pick<ConnectorMeta, "writes" | "money" | "customer_facing">): boolean {
  return custodyFor(meta) === "direct_mcp";
}

/**
 * Resolve connector metadata from a `provider` or `connector_key` (or free text),
 * matching `hints` as lowercase substrings. Unknown identifiers fall back to the
 * default-deny generic meta — so a brand-new MCP connector is representable without
 * any code change, and is safe by default.
 */
export function resolveConnectorMeta(providerOrKey: string | null | undefined): ConnectorMeta {
  const needle = String(providerOrKey ?? "").toLowerCase();
  if (needle) {
    for (const c of KNOWN_CONNECTORS) {
      if (c.hints.some((hint) => needle.includes(hint))) return { ...c, known: true };
    }
  }
  return genericMeta(String(providerOrKey ?? ""));
}

/** All recognized connectors (for surfaces/tests that enumerate the known set). */
export function knownConnectors(): ConnectorMeta[] {
  return KNOWN_CONNECTORS.map((c) => ({ ...c, known: true }));
}

/**
 * A connector a profile package/provisioner asks to wire DIRECTLY into the
 * employee's config.yaml `mcp_servers` (bypassing the Manager). Only read-only
 * connectors may do this; the risk axes decide, so a caller cannot smuggle a
 * write/money connector through by mislabeling it.
 */
export interface DirectMcpConnectorSpec {
  /** config.yaml `mcp_servers` key. */
  name: string;
  /** MCP server URL. */
  url: string;
  writes?: boolean;
  money?: boolean;
  customer_facing?: boolean;
}

/**
 * Filter a requested set of direct-MCP connectors down to the ones actually allowed
 * a direct path. DEFAULT-DENY enforcement point for render time: any connector that
 * writes / moves money / touches customers is refused (dropped) — it must go through
 * Manager mediation instead. Returns only the safe read-only connectors.
 */
export function renderableDirectMcpConnectors(specs: DirectMcpConnectorSpec[]): DirectMcpConnectorSpec[] {
  return specs.filter((s) =>
    connectorAllowsDirectMcp({ writes: !!s.writes, money: !!s.money, customer_facing: !!s.customer_facing }),
  );
}

// ---------------------------------------------------------------------------
// Operator-mode + business-type context policy — SEAM ONLY (CE-4).
//
// CE-4 leaves policy that varies the CE-1 primer emphasis, CE-2 compression
// defaults, and CE-3 rotation threshold by business type + operator mode. It does
// NOT build roles / delegated permissions — that is the deferred design in
// docs/roles-and-delegated-permissions-design.md. Everything here has today's
// behavior as its default, so wiring the seam changes nothing until a policy is
// deliberately supplied.
// ---------------------------------------------------------------------------

/** The vertical the employee serves. Extend as packages are added. */
export type BusinessType = "contractor" | "bookkeeper" | "generic";

/**
 * Who operates the business relative to the employee. `owner_plus_secretary`
 * interacts with the deferred roles design (a delegated user acts in-scope; risky
 * actions raise an owner approval) — the seam, not the implementation.
 */
export type OperatorMode = "solo_owner" | "owner_plus_secretary";

/**
 * Policy knobs that tune the context layer per business/operator. All optional;
 * absent knobs fall back to the CE-1/CE-2/CE-3 defaults already in code.
 */
export interface ContextPolicy {
  business_type: BusinessType;
  operator_mode: OperatorMode;
  /** One-line emphasis prepended to the CE-1 primer (e.g. what to lead with). */
  primer_emphasis?: string;
  /** CE-3 rotate ratio override (fraction of window). Default 0.40 in code. */
  rotate_ratio?: number;
}

const DEFAULT_POLICY: ContextPolicy = {
  business_type: "generic",
  operator_mode: "solo_owner",
};

/**
 * Resolve a context policy from a business type + operator mode. Kept intentionally
 * light: it sets a primer emphasis line and leaves rotate_ratio unset (so
 * `rotateAtTokens`' 0.40 default holds) unless a vertical needs otherwise. This is
 * where per-vertical tuning grows; it is a seam, so the defaults are today's behavior.
 */
export function resolveContextPolicy(input: {
  business_type?: BusinessType | string | null;
  operator_mode?: OperatorMode | string | null;
}): ContextPolicy {
  const businessType = normalizeBusinessType(input.business_type);
  const operatorMode = input.operator_mode === "owner_plus_secretary" ? "owner_plus_secretary" : "solo_owner";
  const policy: ContextPolicy = { ...DEFAULT_POLICY, business_type: businessType, operator_mode: operatorMode };
  if (businessType === "contractor") policy.primer_emphasis = "Lead with estimates, job status, and deposits.";
  else if (businessType === "bookkeeper") policy.primer_emphasis = "Lead with categorization, reconciliations, and month-close.";
  if (operatorMode === "owner_plus_secretary") {
    policy.primer_emphasis = `${policy.primer_emphasis ?? "Serve the owner."} A delegate may act in scope; risky actions still need owner approval.`;
  }
  return policy;
}

function normalizeBusinessType(value: BusinessType | string | null | undefined): BusinessType {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("contract") || v.includes("paint") || v.includes("landscap")) return "contractor";
  if (v.includes("book") || v.includes("account")) return "bookkeeper";
  return "generic";
}
