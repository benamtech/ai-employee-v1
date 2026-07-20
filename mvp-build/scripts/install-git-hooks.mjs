#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const root = git("rev-parse", "--show-toplevel");
const gitDirRaw = git("rev-parse", "--git-dir");
const gitDir = gitDirRaw.startsWith("/") ? gitDirRaw : join(root, gitDirRaw);
const hooksDir = join(gitDir, "hooks");
await mkdir(hooksDir, { recursive: true });

const hooks = {
  "pre-commit": `#!/usr/bin/env sh
set -eu
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/mvp-build"
echo "AMTECH pre-commit: repository governance quick gate"
npm run repo:verify:quick
`,
  "pre-push": `#!/usr/bin/env sh
set -eu
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/mvp-build"
echo "AMTECH pre-push: repository governance full gate"
npm run repo:verify:full
`,
};

for (const [name, content] of Object.entries(hooks)) {
  const path = join(hooksDir, name);
  await writeFile(path, content, "utf8");
  await chmod(path, 0o755);
  console.log(`installed ${path}`);
}

console.log("✅ AMTECH local git hooks installed. CI remains authoritative.");
