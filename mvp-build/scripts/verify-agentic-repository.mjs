#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const requiredFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  'CODEGRAPH.md',
  'decision/trace010/task_state.json',
  'decision/trace010/generate_inventory.mjs',
  'decision/trace010/verify_inventory.mjs'
];
for (const path of requiredFiles) {
  try { await access(join(root, path)); }
  catch { errors.push(`missing agentic contract file: ${path}`); }
}

const agents = await readFile(join(root, 'AGENTS.md'), 'utf8');
const claude = await readFile(join(root, 'CLAUDE.md'), 'utf8');
const codegraph = await readFile(join(root, 'CODEGRAPH.md'), 'utf8');
const trace = JSON.parse(await readFile(join(root, 'decision/trace010/task_state.json'), 'utf8'));

for (const token of ['Observation', 'Hypothesis', 'Counterexample', 'Invariant', 'Candidate', 'Prediction', 'Test', 'Outcome']) {
  if (!agents.includes(token)) errors.push(`AGENTS.md missing typed reasoning node: ${token}`);
}
if (!claude.includes('Compatibility router')) errors.push('CLAUDE.md must remain a compatibility router');
if (!codegraph.trim()) errors.push('CODEGRAPH.md is empty');
if (!trace.starting_sha) errors.push('trace010 task_state missing starting_sha');

for (const forbidden of ['quantum proof', 'neural latent access', 'production proven by CI']) {
  if (agents.toLowerCase().includes(forbidden)) errors.push(`unsupported claim in AGENTS.md: ${forbidden}`);
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: requiredFiles }, null, 2));
