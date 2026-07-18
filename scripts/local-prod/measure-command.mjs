#!/usr/bin/env node
import { runMeasured } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node scripts/local-prod/measure-command.mjs <label> <budget-seconds> <max-rss-mb> -- <command> [args...]");
  process.exit(0);
}
const separator = process.argv.indexOf("--");
if (separator < 5) {
  console.error("label, budget-seconds, max-rss-mb, and -- command are required");
  process.exit(2);
}
const label = process.argv[2];
const budgetSeconds = Number(process.argv[3]);
const maxRssMb = Number(process.argv[4]);
const [command, ...args] = process.argv.slice(separator + 1);
if (!label || !command || !Number.isFinite(budgetSeconds) || !Number.isFinite(maxRssMb)) process.exit(2);
await runMeasured({ label, command, args, budgetSeconds, maxRssMb });
