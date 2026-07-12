import type { ProfileContext, ProfileContextFact, ProfileContextSlot } from "@amtech/shared";

const EMPTY = "_(learned as we go)_";

function confidenceRank(value?: string): number {
  if (value === "high") return 0;
  if (value === "medium" || !value) return 1;
  return 2;
}

function sortedSlots(context: ProfileContext): ProfileContextSlot[] {
  return context.slots
    .slice()
    .sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));
}

function sortedFacts(slot: ProfileContextSlot): ProfileContextFact[] {
  return slot.facts
    .slice()
    .filter((fact) => fact.value.trim())
    .sort((a, b) => confidenceRank(a.confidence) - confidenceRank(b.confidence) || a.key.localeCompare(b.key));
}

function lineFor(fact: ProfileContextFact): string {
  const confidence = fact.confidence && fact.confidence !== "high" ? ` (${fact.confidence} confidence)` : "";
  return `- ${fact.key}: ${fact.value}${confidence}`;
}

function clipped(lines: string[], limit: number): string {
  const kept: string[] = [];
  let chars = 0;
  for (const line of lines) {
    const next = chars + line.length + 1;
    if (next > limit) continue;
    kept.push(line);
    chars = next;
  }
  return kept.join("\n").trim();
}

function renderSections(context: ProfileContext, limit: number, options: { includePointers: boolean }): string {
  const lines: string[] = [
    `Profile package: ${context.package_key}`,
    `Context source: ${context.generated_from}`,
    "",
  ];

  for (const slot of sortedSlots(context)) {
    if (!options.includePointers && slot.key === "live_state_pointers") continue;
    const facts = sortedFacts(slot);
    if (!facts.length) continue;
    lines.push(`## ${slot.title}`);
    lines.push(...facts.map(lineFor));
    lines.push("");
  }

  if (options.includePointers && context.resource_pointers.length) {
    lines.push("## Resource pointers");
    lines.push(...context.resource_pointers.map((uri) => `- ${uri}`));
  }

  return clipped(lines, limit) || EMPTY;
}

export function renderSlotMarkdown(context: ProfileContext, slotKey: string): string {
  const slot = context.slots.find((s) => s.key === slotKey);
  if (!slot) return EMPTY;
  const facts = sortedFacts(slot);
  if (!facts.length) return EMPTY;
  return facts.map(lineFor).join("\n");
}

export function renderProfileContextMarkdown(context: ProfileContext): string {
  const lines: string[] = [];
  for (const slot of sortedSlots(context)) {
    const facts = sortedFacts(slot);
    if (!facts.length) continue;
    lines.push(`## ${slot.title}`);
    lines.push(...facts.map(lineFor));
    lines.push("");
  }
  return lines.join("\n").trim() || EMPTY;
}

export function buildNativeMemoryFiles(context: ProfileContext): { memory_md: string; user_md: string } {
  return {
    memory_md: renderSections(context, context.memory_limits.memory_chars, { includePointers: true }),
    user_md: renderSections(context, context.memory_limits.user_chars, { includePointers: false }),
  };
}

