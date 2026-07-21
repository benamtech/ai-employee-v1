#!/usr/bin/env node
import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const errors = [];

const required = ['build', 'test:unit', 'repo:agentic:check', 'repo:verify:full', 'repo:merge:check'];
for (const name of required) if (!pkg.scripts?.[name]) errors.push(`missing script: ${name}`);

if (pkg.scripts?.build !== 'npm run build --workspaces --if-present') {
  errors.push('build must execute every workspace build script via npm workspaces');
}

const workspacePatterns = pkg.workspaces ?? [];
const workspacePackages = [];
const ignoredNonPackages = [];
for (const pattern of workspacePatterns) {
  if (!pattern.endsWith('/*')) {
    errors.push(`unsupported workspace pattern for verifier: ${pattern}`);
    continue;
  }
  const parentRel = pattern.slice(0, -2);
  const parent = join(root, parentRel);
  for (const entry of await readdir(parent, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packagePath = join(parent, entry.name, 'package.json');
    try {
      await access(packagePath);
    } catch {
      ignoredNonPackages.push(`${parentRel}/${entry.name}`);
      continue;
    }
    try {
      const child = JSON.parse(await readFile(packagePath, 'utf8'));
      workspacePackages.push({ path: `${parentRel}/${entry.name}`, name: child.name, build: child.scripts?.build ?? null });
    } catch {
      errors.push(`invalid workspace package.json: ${parentRel}/${entry.name}`);
    }
  }
}

if (workspacePackages.length === 0) errors.push('no workspace packages discovered');
for (const workspace of workspacePackages) {
  if (!workspace.name) errors.push(`workspace missing name: ${workspace.path}`);
}

const buildBearing = workspacePackages.filter((workspace) => workspace.build);
if (buildBearing.length === 0) errors.push('no build-bearing workspaces discovered');

const merge = pkg.scripts?.['repo:merge:check'] ?? '';
for (const command of ['npm run repo:verify:full', 'npm run test:unit', 'npm run build']) {
  if (!merge.includes(command)) errors.push(`repo:merge:check does not include: ${command}`);
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors, workspacePackages, buildBearing, ignoredNonPackages }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, workspacePackages, buildBearing, ignoredNonPackages }, null, 2));
