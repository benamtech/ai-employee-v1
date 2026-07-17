import { createHash } from "node:crypto";
import { chmod, lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const MASTER_KEY_NAMES = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "XAI_API_KEY",
  "XAI_API_TOKEN",
  "ORCHESTRATOR_API_KEY",
  "OPENROUTER_API_KEY",
];

async function walk(root