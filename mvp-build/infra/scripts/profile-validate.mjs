#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? process.cwd();
const required = ["SOUL.md", "config.yaml", "distribution.yaml"];
const missing = required.filter((file) => !existsSync(join(dir, file)));
if (missing.length) {
  console.error(`missing profile files: ${missing.join(", ")}`);
  process.exit(1);
}
const tokenPattern = /\{\{[A-Z_]+\}\}/;
function scan(dir) {
  const unresolved = [];
  for (const entry of readdirSync(dir)) {
    if (["node_modules", "dist", ".next"].includes(entry)) continue;
    const path = join(dir, entry);
    const s = statSync(path);
    if (s.isDirectory()) unresolved.push(...scan(path));
    else if (/\.(md|ya?ml|json|txt|EXAMPLE)$/.test(path) && !path.endsWith("README.md")) {
      const text = readFileSync(path, "utf8");
      if (tokenPattern.test(text)) unresolved.push(path);
    }
  }
  return unresolved;
}
const unresolved = scan(dir);
if (unresolved.length) {
  console.error(`unresolved template tokens: ${unresolved.join(", ")}`);
  process.exit(1);
}
console.log(`profile validation passed: ${dir}`);
