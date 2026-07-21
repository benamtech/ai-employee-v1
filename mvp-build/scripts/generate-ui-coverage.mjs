#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const factors = {
  surface: ["talk", "workspace", "review", "mcp_apps", "operator", "ui_lab"],
  browser: ["chromium", "firefox", "webkit"],
  viewport: ["mobile", "tablet", "desktop"],
  density: ["calm", "balanced", "dense"],
  network: ["online", "slow", "offline", "reconnecting"],
};
const keys = Object.keys(factors);
const candidates = product(keys.map((key) => factors[key])).map((values) => Object.fromEntries(keys.map((key, index) => [key, values[index]])));

const requirements = new Set();
for (let left = 0; left < keys.length; left += 1) {
  for (let right = left + 1; right < keys.length; right += 1) {
    for (const a of factors[keys[left]]) for (const b of factors[keys[right]]) {
      requirements.add(`2:${keys[left]}=${a}|${keys[right]}=${b}`);
    }
  }
}
for (const surface of factors.surface) for (const browser of factors.browser) for (const network of factors.network) {
  requirements.add(`3:surface=${surface}|browser=${browser}|network=${network}`);
}

function coveredBy(item) {
  const result = new Set();
  for (let left = 0; left < keys.length; left += 1) {
    for (let right = left + 1; right < keys.length; right += 1) {
      result.add(`2:${keys[left]}=${item[keys[left]]}|${keys[right]}=${item[keys[right]]}`);
    }
  }
  result.add(`3:surface=${item.surface}|browser=${item.browser}|network=${item.network}`);
  return result;
}

const uncovered = new Set(requirements);
const selected = [];
while (uncovered.size) {
  let best = null;
  for (const item of candidates) {
    const cover = [...coveredBy(item)].filter((entry) => uncovered.has(entry));
    const identity = keys.map((key) => item[key]).join("|");
    const candidate = { item, cover, identity };
    if (!best || cover.length > best.cover.length || (cover.length === best.cover.length && identity < best.identity)) best = candidate;
  }
  if (!best || !best.cover.length) break;
  selected.push({ id: `UI-${String(selected.length + 1).padStart(3, "0")}`, ...best.item });
  for (const entry of best.cover) uncovered.delete(entry);
}

const output = {
  schema: "amtech.ui-presentation-coverage.v1",
  method: "deterministic greedy constrained covering array",
  coverage: {
    pairwise: keys,
    three_way: ["surface", "browser", "network"],
    consequential_authority_states: "excluded; covered exhaustively by validation/ui-state-machine-cases.json",
  },
  factors,
  valid_combination_count: candidates.length,
  generated_case_count: selected.length,
  cases: selected,
  uncovered_combinations: [...uncovered].sort(),
  nonclaims: [
    "Generated combinations are test plans, not executed browser evidence.",
    "UI Lab cases remain fixture demonstrations.",
    "Browser, accessibility, capacity, pilot, deployment, and production acceptance remain separate.",
  ],
};
const out = resolve(process.argv[2] ?? "validation/ui-presentation-coverage.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: uncovered.size ? "incomplete" : "ok", out, cases: selected.length, uncovered: uncovered.size }));
if (uncovered.size) process.exit(1);

function product(arrays) {
  return arrays.reduce((rows, values) => rows.flatMap((row) => values.map((value) => [...row, value])), [[]]);
}
