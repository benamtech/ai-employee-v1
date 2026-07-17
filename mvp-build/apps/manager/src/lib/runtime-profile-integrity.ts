import { createHash } from "node:crypto";
import { chmod, lstat, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const MASTER_KEY_NAMES = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "XAI_API_KEY",
  "XAI_API_TOKEN",
  "ORCHESTRATOR_API_KEY",
  "OPENROUTER_API_KEY",
  "FAL_KEY",
  "ELEVENLABS_API_KEY",
  "BROWSERBASE_API_KEY",
] as const;

async function walk(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(root, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function configuredMasterSecrets(): string[] {
  return MASTER_KEY_NAMES
    .map((name) => process.env[name])
    .filter((value): value is string => Boolean(value && value.length >= 8));
}

export async function assertNoMasterProviderKeys(root: string): Promise<void> {
  const files = await walk(root);
  const forbiddenValues = configuredMasterSecrets();
  const violations: string[] = [];

  for (const file of files) {
    const stat = await lstat(file);
    if (!stat.isFile() || stat.size > 2_000_000) continue;
    let text: string;
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }

    for (const name of MASTER_KEY_NAMES) {
      const assignmentPattern = new RegExp(`(?:^|\\n)\\s*${name}\\s*[:=]\\s*[^\\s#]+`, "i");
      if (assignmentPattern.test(text)) violations.push(`${relative(root, file)} contains ${name}`);
    }
    for (const secret of forbiddenValues) {
      if (text.includes(secret)) violations.push(`${relative(root, file)} contains configured master secret value`);
    }
  }

  if (violations.length > 0) {
    throw new Error(`Rendered runtime profile contains forbidden provider credentials: ${[...new Set(violations)].join(", ")}`);
  }
}

export async function computeProfileChecksum(root: string): Promise<string> {
  const hash = createHash("sha256");
  for (const file of await walk(root)) {
    const stat = await lstat(file);
    if (!stat.isFile()) continue;
    hash.update(relative(root, file));
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function makeProfileTreeReadOnly(root: string): Promise<void> {
  const files = await walk(root);
  for (const file of files) await chmod(file, 0o440);

  const directories = new Set<string>([root]);
  for (const file of files) {
    let cursor = file.slice(0, file.lastIndexOf("/"));
    while (cursor.startsWith(root)) {
      directories.add(cursor);
      if (cursor === root) break;
      cursor = cursor.slice(0, cursor.lastIndexOf("/"));
    }
  }
  for (const directory of [...directories].sort((a, b) => b.length - a.length)) {
    await chmod(directory, 0o550);
  }
}
