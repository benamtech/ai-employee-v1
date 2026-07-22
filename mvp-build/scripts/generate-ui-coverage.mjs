#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const factors = {
  surface: ["talk", "workspace", "review", "public_form", "boundless_website", "ui_lab_workbench", "ui_lab_preview"],
  adapter: ["owner_web", "public_form", "boundless_website"],
  scenario: ["website", "office", "personal-brain", "research", "contractor", "clothing-ops"],
  browser: ["chromium", "firefox", "webkit"],
  viewport: ["mobile", "tablet", "desktop", "responsive"],
  density: ["calm", "balanced", "dense"],
  runtime_state: ["initial", "active", "needs_you", "stalled", "recovering", "completed"],
  preset_state: ["unsaved", "dirty_draft", "clean_draft", "approved"],
};
const keys = Object.keys(factors);
const candidates = product(keys.map((key) => factors[key]))
  .map((values) => Object.fromEntries(keys.map((key, index) => [key, values[index]])))
  .filter(validCombination);

const requirements = new Set();
for (const item of candidates) {
  for (let left = 0; left < keys.length; left += 1) {
    for (let right = left + 1; right < keys.length; right += 1) {
      requirements.add(`2:${keys[left]}=${item[keys[left]]}|${keys[right]}=${item[keys[right]]}`);
    }
  }
  requirements.add(`3:surface=${item.surface}|browser=${item.browser}|runtime_state=${item.runtime_state}`);
  requirements.add(`3:adapter=${item.adapter}|scenario=${item.scenario}|preset_state=${item.preset_state}`);
}

function validCombination(item) {
  if (["talk", "workspace", "review"].includes(item.surface)) return item.adapter === "owner_web";
  if (item.surface === "public_form") return item.adapter === "public_form";
  if (item.surface === "boundless_website") return item.adapter === "boundless_website";
  return true;
}

function coveredBy(item) {
  const result = new Set();
  for (let left = 0; left < keys.length; left += 1) {
    for (let right = left + 1; right < keys.length; right += 1) {
      result.add(`2:${keys[left]}=${item[keys[left]]}|${keys[right]}=${item[keys[right]]}`);
    }
  }
  result.add(`3:surface=${item.surface}|browser=${item.browser}|runtime_state=${item.runtime_state}`);
  result.add(`3:adapter=${item.adapter}|scenario=${item.scenario}|preset_state=${item.preset_state}`);
  return result;
}

const candidateCoverage = candidates.map((item) => ({ item, coverage: coveredBy(item) }));
const uncovered = new Set(requirements);
const selected = [];
while (uncovered.size) {
  let best = null;
  for (const candidate of candidateCoverage) {
    let gain = 0;
    for (const entry of candidate.coverage) if (uncovered.has(entry)) gain += 1;
    const identity = keys.map((key) => candidate.item[key]).join("|");
    if (!best || gain > best.gain || (gain === best.gain && identity < best.identity)) {
      best = { ...candidate, gain, identity };
    }
  }
  if (!best || best.gain === 0) break;
  selected.push({ id: `UI-${String(selected.length + 1).padStart(3, "0")}`, ...best.item });
  for (const entry of best.coverage) uncovered.delete(entry);
}

const canonicalCases = JSON.stringify(selected);
const output = {
  schema: "amtech.ui-presentation-coverage.v2",
  method: "deterministic greedy constrained covering array",
  coverage: {
    pairwise: keys,
    three_way: [
      ["surface", "browser", "runtime_state"],
      ["adapter", "scenario", "preset_state"],
    ],
    constraints: [
      "talk/workspace/review require owner_web",
      "public_form surface requires public_form adapter",
      "boundless_website surface requires boundless_website adapter",
      "UI Lab workbench and preview may exercise every adapter",
    ],
    consequential_authority_states: "excluded; covered exhaustively by validation/ui-state-machine-cases.json",
    approved_presets: "every approved preset receives explicit browser smoke outside this covering array",
  },
  factors,
  unconstrained_combination_count: product(keys.map((key) => factors[key])).length,
  valid_combination_count: candidates.length,
  requirement_count: requirements.size,
  generated_case_count: selected.length,
  selected_case_digest_sha256: createHash("sha256").update(canonicalCases).digest("hex"),
  uncovered_combinations: [...uncovered].sort(),
  ...(process.argv.includes("--include-cases") ? { cases: selected } : {}),
  nonclaims: [
    "Generated combinations are test plans, not executed browser evidence.",
    "UI Lab cases remain fixture demonstrations even when production components render them.",
    "A green covering array does not establish aesthetic quality; human review remains required for promotion.",
    "Browser, accessibility, capacity, pilot, deployment, and production acceptance remain separate.",
  ],
};
const positional = process.argv.slice(2).find((value) => !value.startsWith("--"));
const out = resolve(positional ?? "validation/ui-presentation-coverage.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  status: uncovered.size ? "incomplete" : "ok",
  out,
  cases: selected.length,
  uncovered: uncovered.size,
  digest: output.selected_case_digest_sha256,
  cases_included: Boolean(output.cases),
}));
if (uncovered.size) process.exit(1);

function product(arrays) {
  return arrays.reduce((rows, values) => rows.flatMap((row, values) => values.map((value) => [...row, value])), [[]]);
}
