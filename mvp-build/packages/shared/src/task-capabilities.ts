import type { CapabilityCategory } from "./materialization.js";

export type ToolCapabilityTransport = "manager_mcp" | "direct_mcp" | "runtime_native";
export type ToolCapabilityAvailability =
  | "ready"
  | "approval_gated"
  | "needs_connection"
  | "unverified"
  | "degraded"
  | "unavailable";
export type ToolCapabilityRisk = "read" | "write" | "money" | "customer_facing" | "unknown";
export type ToolCapabilityEvidenceLevel = "live_proof" | "control_plane_contract" | "runtime_report" | "advertised_only";

export interface ToolCapabilityEvidenceSummary {
  level: ToolCapabilityEvidenceLevel;
  checked_at?: string | null;
  report_id?: string | null;
  failed_dimensions?: string[];
  source_refs: string[];
}

/**
 * Owner-safe descriptor for one capability regardless of whether it comes from
 * AMTECH's Manager MCP server, a direct read-only MCP server, or a Hermes-native
 * toolset. This is presentation/discovery data only; it never grants execution.
 */
export interface ToolCapabilityDescriptor {
  id: string;
  capability_key: string;
  server_id: string;
  server_label: string;
  transport: ToolCapabilityTransport;
  tool_name: string;
  label: string;
  summary: string;
  category: CapabilityCategory;
  availability: ToolCapabilityAvailability;
  can_run_now: boolean;
  read_only: boolean;
  risk: ToolCapabilityRisk;
  requires_approval: boolean;
  setup_requirement?: string | null;
  connector_id?: string | null;
  evidence: ToolCapabilityEvidenceSummary;
}

export interface TaskCapabilityInput {
  id: string;
  title: string;
  summary?: string | null;
  type?: string | null;
  domain?: string | null;
}

export interface TaskCapabilityMatch {
  task_id: string;
  loop_id: string;
  capability_id: string;
  role: "primary" | "supporting" | "blocked";
  score: number;
  rationale: string;
  suggested_prompt: string;
}

export interface ToolCapabilityCatalog {
  version: 1;
  generated_at: string;
  assignment_id: string;
  effective_report_id?: string | null;
  capabilities: ToolCapabilityDescriptor[];
  task_matches: TaskCapabilityMatch[];
}

const DOMAIN_CATEGORIES: Record<string, CapabilityCategory[]> = {
  customer: ["communication", "office", "documents"],
  commerce: ["money", "communication", "office", "documents"],
  finance: ["accounting", "money", "documents", "office"],
  growth: ["research", "communication", "documents", "automation"],
  operations: ["office", "automation", "documents", "system"],
  research: ["research", "documents", "system"],
  people: ["communication", "office", "automation"],
  system: ["system", "automation", "research"],
  custom: ["office", "documents", "research", "automation"],
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "with",
  "work", "business", "employee", "customer", "current", "manage", "management", "use", "using",
]);

function tokens(value: string): Set<string> {
  return new Set(value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token)));
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(1, Math.min(left.size, right.size));
}

function inferredDomain(task: TaskCapabilityInput): string {
  if (task.domain && DOMAIN_CATEGORIES[task.domain]) return task.domain;
  const text = `${task.type ?? ""} ${task.title} ${task.summary ?? ""}`.toLowerCase();
  if (/invoice|payment|deposit|revenue|commerce|order/.test(text)) return "commerce";
  if (/bookkeep|account|reconcil|expense|bill|profit|balance|receivable|payable/.test(text)) return "finance";
  if (/lead|campaign|seo|market|content|website|research/.test(text)) return "growth";
  if (/email|client|customer|follow.?up|reply/.test(text)) return "customer";
  if (/runtime|connector|integration|system|repair/.test(text)) return "system";
  if (/schedule|job|estimate|project|crew|site|office/.test(text)) return "operations";
  return "custom";
}

function availabilityWeight(value: ToolCapabilityAvailability): number {
  if (value === "ready") return 0.14;
  if (value === "approval_gated") return 0.11;
  if (value === "degraded") return 0.03;
  return -0.08;
}

function rationale(task: TaskCapabilityInput, capability: ToolCapabilityDescriptor, categoryMatch: number, lexical: number): string {
  const state = capability.availability === "approval_gated"
    ? "available with owner approval"
    : capability.availability === "ready"
      ? "ready now"
      : capability.availability === "needs_connection"
        ? "relevant after its connection is repaired"
        : capability.availability === "unverified"
          ? "relevant but not live-proved"
          : `${capability.availability.replace(/_/g, " ")}`;
  const fit = lexical >= 0.25
    ? `Its description directly overlaps this work.`
    : categoryMatch > 0
      ? `It supports the ${inferredDomain(task)} domain.`
      : `It can support a bounded part of the outcome.`;
  return `${capability.label} is ${state}. ${fit}`;
}

/**
 * Deterministic task-to-capability ranking. It never invokes a model, calls a
 * tool, or changes authority. The result is stable owner guidance and can be
 * rendered by any client that consumes the shared read model.
 */
export function matchTaskCapabilities(
  tasks: TaskCapabilityInput[],
  capabilities: ToolCapabilityDescriptor[],
  limitPerTask = 5,
): TaskCapabilityMatch[] {
  const out: TaskCapabilityMatch[] = [];
  for (const task of tasks) {
    const domain = inferredDomain(task);
    const preferred = DOMAIN_CATEGORIES[domain] ?? DOMAIN_CATEGORIES.custom;
    const taskTokens = tokens(`${task.type ?? ""} ${task.title} ${task.summary ?? ""} ${domain}`);
    const ranked = capabilities.map((capability) => {
      const capabilityTokens = tokens(`${capability.tool_name} ${capability.label} ${capability.summary} ${capability.category}`);
      const lexical = overlap(taskTokens, capabilityTokens);
      const categoryIndex = preferred.indexOf(capability.category);
      const categoryScore = categoryIndex < 0 ? 0 : Math.max(0.08, 0.34 - categoryIndex * 0.07);
      const score = Math.max(0, Math.min(1, categoryScore + lexical * 0.48 + availabilityWeight(capability.availability)));
      return { capability, score, lexical, categoryScore };
    })
      .filter((item) => item.score >= 0.13)
      .sort((a, b) => b.score - a.score || a.capability.label.localeCompare(b.capability.label))
      .slice(0, Math.max(1, limitPerTask));

    for (const item of ranked) {
      const blocked = !item.capability.can_run_now;
      out.push({
        task_id: task.id,
        loop_id: `loop:${task.id}`,
        capability_id: item.capability.id,
        role: blocked ? "blocked" : item.score >= 0.55 ? "primary" : "supporting",
        score: Number(item.score.toFixed(3)),
        rationale: rationale(task, item.capability, item.categoryScore, item.lexical),
        suggested_prompt: blocked
          ? `For ${task.title}, explain what is needed before ${item.capability.label.toLowerCase()} can be used, then continue with the safest available alternative.`
          : `For ${task.title}, use ${item.capability.label.toLowerCase()} where it materially improves the outcome, and show the resulting evidence.`,
      });
    }
  }
  return out;
}
