import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

export const ENGINE_VERSION = '1.0.0';

export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function stableStringify(value, space = 2) {
  return JSON.stringify(stableValue(value), null, space);
}

export function sha256Text(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function digestObject(value) {
  return sha256Text(stableStringify(value, 0));
}

export async function digestFile(path) {
  return sha256Text(await readFile(path));
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, `${stableStringify(value)}\n`, 'utf8');
  await rename(tmp, path);
}

export async function writeText(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, value, 'utf8');
  await rename(tmp, path);
}

export function runGit(root, args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFailure) return '';
    const stderr = error?.stderr?.toString?.() ?? '';
    throw new Error(`git ${args.join(' ')} failed: ${stderr || error.message}`);
  }
}

export function gitHead(root) {
  return runGit(root, ['rev-parse', 'HEAD']);
}

export function gitRoot(root) {
  return runGit(root, ['rev-parse', '--show-toplevel']);
}

export function gitTrackedFiles(root) {
  const output = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'buffer' });
  return output.toString('utf8').split('\0').filter(Boolean).sort();
}

export function gitStatus(root) {
  const output = execFileSync('git', ['-C', root, 'status', '--porcelain=v1', '-z'], { encoding: 'buffer' });
  const fields = output.toString('utf8').split('\0').filter(Boolean);
  const paths = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const status = field.slice(0, 2);
    let path = field.slice(3);
    if ((status.includes('R') || status.includes('C')) && fields[index + 1]) {
      path = fields[index + 1];
      index += 1;
    }
    paths.push({ status, path: normalizeRepoPath(path) });
  }
  return paths.sort((a, b) => a.path.localeCompare(b.path));
}

export function normalizeRepoPath(path) {
  return String(path).split(sep).join('/').replace(/^\.\//, '');
}

export function relativeRepoPath(root, path) {
  return normalizeRepoPath(relative(root, path));
}

export function resolveWithin(root, path) {
  const target = resolve(root, path);
  const normalizedRoot = `${resolve(root)}${sep}`;
  if (target !== resolve(root) && !target.startsWith(normalizedRoot)) {
    throw new Error(`path escapes repository root: ${path}`);
  }
  return target;
}

export function artifactEnvelope(schema, sourceSha, payload, provenance = {}) {
  const semantic = {
    schema,
    engine_version: ENGINE_VERSION,
    source_sha: sourceSha,
    provenance: stableValue(provenance),
    payload: stableValue(payload)
  };
  return {
    ...semantic,
    generated_at: new Date().toISOString(),
    content_digest: digestObject(semantic)
  };
}

export function verifyEnvelope(envelope, expectedSchema) {
  const errors = [];
  if (envelope?.schema !== expectedSchema) errors.push(`schema:${envelope?.schema ?? 'missing'}`);
  const semantic = {
    schema: envelope?.schema,
    engine_version: envelope?.engine_version,
    source_sha: envelope?.source_sha,
    provenance: stableValue(envelope?.provenance ?? {}),
    payload: stableValue(envelope?.payload ?? {})
  };
  const expected = digestObject(semantic);
  if (envelope?.content_digest !== expected) errors.push('content_digest_mismatch');
  return errors;
}

export function parseCli(argv) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const [rawKey, inline] = arg.slice(2).split('=', 2);
    if (inline !== undefined) {
      options[rawKey] = inline;
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }
  return { positionals, options };
}

export function asArray(value) {
  if (value === undefined || value === null || value === false) return [];
  return Array.isArray(value) ? value : [value];
}

export function tokenize(value) {
  return [...new Set(String(value).toLowerCase().match(/[a-z0-9][a-z0-9_.:/-]{1,}/g) ?? [])]
    .filter((token) => token.length >= 3)
    .sort();
}

export function validateIdentifier(value, label = 'identifier') {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(String(value))) {
    throw new Error(`${label} must match /^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/`);
  }
  return String(value);
}

export function runCommand(root, argv, { timeoutMs = 15 * 60_000 } = {}) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some((part) => typeof part !== 'string' || part.length === 0)) {
    throw new Error('verification command must be a nonempty argv array');
  }
  const started = Date.now();
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd: root,
    encoding: 'utf8',
    timeout: timeoutMs,
    shell: false,
    maxBuffer: 16 * 1024 * 1024
  });
  return {
    argv,
    status: result.status,
    signal: result.signal,
    duration_ms: Date.now() - started,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ok: result.status === 0 && !result.error,
    error: result.error ? String(result.error) : null
  };
}

export async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function mapBy(items, key) {
  return new Map(items.map((item) => [item[key], item]));
}

export function engineRoot(importMetaUrl) {
  return dirname(new URL(importMetaUrl).pathname);
}

export function absoluteFrom(root, path) {
  return isAbsolute(path) ? path : resolve(root, path);
}
