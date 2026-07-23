import { readFile, stat } from 'node:fs/promises';
import { extname, posix, resolve } from 'node:path';
import {
  artifactEnvelope,
  digestFile,
  fileExists,
  gitHead,
  gitRoot,
  gitTrackedFiles,
  normalizeRepoPath,
  relativeRepoPath,
  tokenize,
  uniqueSorted
} from '../lib/core.mjs';

const EXTRACTOR_VERSION = 'repository-facts.v1';
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.css', '.go', '.graphql', '.h', '.hpp', '.html', '.java', '.js', '.json', '.jsx',
  '.md', '.mjs', '.mts', '.py', '.rs', '.sh', '.sql', '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml'
]);
const LANGUAGE = {
  '.c': 'c', '.cc': 'cpp', '.cpp': 'cpp', '.css': 'css', '.go': 'go', '.graphql': 'graphql', '.h': 'c',
  '.hpp': 'cpp', '.html': 'html', '.java': 'java', '.js': 'javascript', '.json': 'json', '.jsx': 'javascript',
  '.md': 'markdown', '.mjs': 'javascript', '.mts': 'typescript', '.py': 'python', '.rs': 'rust', '.sh': 'shell',
  '.sql': 'sql', '.toml': 'toml', '.ts': 'typescript', '.tsx': 'typescript', '.txt': 'text', '.yaml': 'yaml', '.yml': 'yaml'
};

function entityId(kind, value) { return `${kind}:${value}`; }
function relationId(type, from, to, evidencePath, ordinal) { return `rel:${type}:${from}:${to}:${evidencePath}:${ordinal}`; }
function pathKind(path) {
  if (path.includes('/tests/') || /(?:^|\/)(?:test|tests|spec|specs)(?:\/|\.)/.test(path)) return 'test';
  if (path.startsWith('.github/workflows/')) return 'workflow';
  if (path.endsWith('package.json')) return 'package';
  if (path.endsWith('.md')) return 'document';
  if (path.includes('/migrations/') && path.endsWith('.sql')) return 'migration';
  if (/Dockerfile$/.test(path) || path.includes('/infra/deploy/')) return 'deployment';
  return 'source';
}
function lineOf(text, index) { return text.slice(0, index).split('\n').length; }
function addSymbol(symbols, filePath, kind, name, line) {
  const id = entityId('symbol', `${filePath}#${kind}:${name}`);
  if (!symbols.some((symbol) => symbol.id === id)) symbols.push({ id, file: filePath, kind, name, line });
  return id;
}
function collectSymbols(text, path, language, symbols) {
  const patterns = [];
  if (['javascript', 'typescript'].includes(language)) {
    patterns.push(
      ['function', /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g],
      ['class', /\b(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g],
      ['type', /\bexport\s+(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/g],
      ['binding', /\bexport\s+const\s+([A-Za-z_$][\w$]*)/g]
    );
  } else if (language === 'python') {
    patterns.push(['function', /^\s*def\s+([A-Za-z_][\w]*)/gm], ['class', /^\s*class\s+([A-Za-z_][\w]*)/gm]);
  } else if (language === 'go') {
    patterns.push(['function', /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_][\w]*)/gm], ['type', /^type\s+([A-Za-z_][\w]*)/gm]);
  } else if (language === 'rust') {
    patterns.push(['function', /\b(?:pub\s+)?fn\s+([A-Za-z_][\w]*)/g], ['type', /\b(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z_][\w]*)/g]);
  }
  for (const [kind, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) addSymbol(symbols, path, kind, match[1], lineOf(text, match.index ?? 0));
  }
}
function resolveImport(fromPath, specifier, tracked) {
  if (!specifier.startsWith('.')) return entityId('package', specifier);
  const base = posix.normalize(posix.join(posix.dirname(fromPath), specifier));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, `${base}.js`, `${base}.mjs`, `${base}.jsx`, `${base}.json`, `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}/index.mjs`];
  const found = candidates.find((candidate) => tracked.has(candidate));
  return entityId('file', found ?? base);
}
function collectImports(text, path, language, tracked, relations) {
  const specs = [];
  if (['javascript', 'typescript'].includes(language)) {
    const patterns = [/\b(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g, /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g, /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g];
    for (const pattern of patterns) for (const match of text.matchAll(pattern)) specs.push({ specifier: match[1], line: lineOf(text, match.index ?? 0) });
  } else if (language === 'python') {
    for (const match of text.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm)) specs.push({ specifier: match[1] ?? match[2], line: lineOf(text, match.index ?? 0) });
  }
  let ordinal = 0;
  for (const item of specs) {
    const from = entityId('file', path);
    const to = resolveImport(path, item.specifier, tracked);
    relations.push({ id: relationId('Imports', from, to, path, ordinal++), type: 'Imports', from, to, evidence: { path, line: item.line, extractor: EXTRACTOR_VERSION }, confidence: 'Observed' });
  }
}
function collectDocumentLinks(text, path, tracked, relations) {
  const matches = text.matchAll(/(?:`|\(|\[)([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.@-]+)+\.(?:md|json|mjs|js|ts|tsx|sql|yml|yaml))(?:`|\)|\])/g);
  let ordinal = 0;
  for (const match of matches) {
    const raw = match[1];
    const candidate = posix.normalize(posix.join(posix.dirname(path), raw));
    const target = tracked.has(raw) ? raw : tracked.has(candidate) ? candidate : null;
    if (!target) continue;
    const from = entityId('file', path);
    const to = entityId('file', target);
    relations.push({ id: relationId('References', from, to, path, ordinal++), type: 'References', from, to, evidence: { path, line: lineOf(text, match.index ?? 0), extractor: EXTRACTOR_VERSION }, confidence: 'Observed' });
  }
}
function flattenStrings(value, prefix = '$') {
  const output = [];
  if (typeof value === 'string') output.push({ pointer: prefix, value });
  else if (Array.isArray(value)) value.forEach((item, index) => output.push(...flattenStrings(item, `${prefix}/${index}`)));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) output.push(...flattenStrings(item, `${prefix}/${key}`));
  return output;
}
function collectAuthority(authority, path, tracked, relations, authorities) {
  const current = new Set();
  const historical = new Set(Array.isArray(authority?.historical) ? authority.historical : []);
  for (const item of flattenStrings(authority)) {
    const raw = item.value.replace(/\/$/, '');
    if (tracked.has(raw)) current.add(raw);
    else if (raw.startsWith('mvp-build/') && tracked.has(raw)) current.add(raw);
  }
  for (const target of current) {
    authorities.current.push({ path: target, source: path });
    relations.push({ id: relationId('CurrentAuthority', entityId('file', path), entityId('file', target), path, relations.length), type: 'CurrentAuthority', from: entityId('file', path), to: entityId('file', target), evidence: { path, pointer: '$', extractor: EXTRACTOR_VERSION }, confidence: 'Observed' });
  }
  for (const target of historical) authorities.historical.push({ path: target, source: path });
}
function extractCommandPaths(command, tracked) {
  const found = [];
  for (const token of String(command).match(/[A-Za-z0-9_.@/-]+\.(?:mjs|js|ts|tsx|py|sh|sql)/g) ?? []) {
    const normalized = normalizeRepoPath(token.replace(/^\.\//, ''));
    const direct = tracked.has(normalized) ? normalized : [...tracked].find((path) => path.endsWith(`/${normalized}`));
    if (direct) found.push(direct);
  }
  return uniqueSorted(found);
}
async function collectPackageScripts(text, path, tracked, entities, relations) {
  let pkg;
  try { pkg = JSON.parse(text); } catch { return; }
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    const scriptId = entityId('script', `${path}#${name}`);
    entities.push({ id: scriptId, kind: 'script', name, package: path, command: String(command) });
    for (const target of extractCommandPaths(command, tracked)) relations.push({ id: relationId('ExecutedBy', entityId('file', target), scriptId, path, relations.length), type: 'ExecutedBy', from: entityId('file', target), to: scriptId, evidence: { path, json_pointer: `/scripts/${name}`, extractor: EXTRACTOR_VERSION }, confidence: 'Observed' });
  }
}
function collectWorkflowCommands(text, path, tracked, entities, relations) {
  const workflowId = entityId('workflow', path);
  entities.push({ id: workflowId, kind: 'workflow', path });
  for (const match of text.matchAll(/^\s*run:\s*(.+)$/gm)) {
    for (const target of extractCommandPaths(match[1], tracked)) relations.push({ id: relationId('ExecutedBy', entityId('file', target), workflowId, path, relations.length), type: 'ExecutedBy', from: entityId('file', target), to: workflowId, evidence: { path, line: lineOf(text, match.index ?? 0), extractor: EXTRACTOR_VERSION }, confidence: 'Observed' });
  }
}

export async function extractRepositoryFacts({ root = process.cwd() } = {}) {
  const repositoryRoot = gitRoot(root);
  const sourceSha = gitHead(repositoryRoot);
  const paths = gitTrackedFiles(repositoryRoot);
  const tracked = new Set(paths);
  const files = [];
  const symbols = [];
  const entities = [];
  const relations = [];
  const authorities = { current: [], historical: [] };
  for (const path of paths) {
    const absolute = resolve(repositoryRoot, path);
    const info = await stat(absolute);
    const extension = extname(path).toLowerCase();
    const language = LANGUAGE[extension] ?? 'binary-or-unknown';
    const file = { id: entityId('file', path), path, digest: await digestFile(absolute), language, bytes: info.size, kind: pathKind(path) };
    files.push(file);
    if (!TEXT_EXTENSIONS.has(extension) || info.size > MAX_TEXT_BYTES) continue;
    const text = await readFile(absolute, 'utf8');
    collectSymbols(text, path, language, symbols);
    collectImports(text, path, language, tracked, relations);
    if (language === 'markdown') collectDocumentLinks(text, path, tracked, relations);
    if (path.endsWith('package.json')) await collectPackageScripts(text, path, tracked, entities, relations);
    if (path.startsWith('.github/workflows/')) collectWorkflowCommands(text, path, tracked, entities, relations);
    if (path === 'mvp-build/authority-map.json' || path.endsWith('/authority-map.json')) {
      try { collectAuthority(JSON.parse(text), path, tracked, relations, authorities); } catch { }
    }
  }
  for (const symbol of symbols) {
    entities.push(symbol);
    relations.push({ id: relationId('Defines', entityId('file', symbol.file), symbol.id, symbol.file, symbol.line), type: 'Defines', from: entityId('file', symbol.file), to: symbol.id, evidence: { path: symbol.file, line: symbol.line, extractor: EXTRACTOR_VERSION }, confidence: 'Observed' });
  }
  const testFiles = new Set(files.filter((file) => file.kind === 'test').map((file) => file.id));
  for (const relation of [...relations]) {
    if (relation.type === 'Imports' && testFiles.has(relation.from) && relation.to.startsWith('file:')) relations.push({ id: relationId('VerifiedBy', relation.to, relation.from, relation.evidence.path, relations.length), type: 'VerifiedBy', from: relation.to, to: relation.from, evidence: relation.evidence, confidence: 'Inferred' });
  }
  const payload = {
    repository_root: '.',
    requested_root: relativeRepoPath(repositoryRoot, resolve(root)) || '.',
    extractor_version: EXTRACTOR_VERSION,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    entities: entities.sort((a, b) => a.id.localeCompare(b.id)),
    relations: relations.sort((a, b) => a.id.localeCompare(b.id)),
    authorities: { current: authorities.current.sort((a, b) => a.path.localeCompare(b.path)), historical: authorities.historical.sort((a, b) => a.path.localeCompare(b.path)) },
    vocabulary: { file_tokens: Object.fromEntries(files.map((file) => [file.id, tokenize(file.path)])) },
    counts: { files: files.length, entities: entities.length, symbols: symbols.length, relations: relations.length }
  };
  return artifactEnvelope('repo.fact.v1', sourceSha, payload, { extractor: 'decision/engine/extract/repository-facts.mjs', extractor_version: EXTRACTOR_VERSION, exact_git_sha: sourceSha });
}

export async function assertRepositoryFactsFidelity(facts, { root = process.cwd() } = {}) {
  const errors = [];
  const repositoryRoot = gitRoot(root);
  const tracked = gitTrackedFiles(repositoryRoot);
  const represented = facts?.payload?.files?.map((file) => file.path) ?? [];
  const missing = tracked.filter((path) => !represented.includes(path));
  const extra = represented.filter((path) => !tracked.includes(path));
  if (missing.length) errors.push(`missing_tracked_files:${missing.slice(0, 20).join(',')}`);
  if (extra.length) errors.push(`untracked_represented_files:${extra.slice(0, 20).join(',')}`);
  if (facts?.source_sha !== gitHead(repositoryRoot)) errors.push('source_sha_mismatch');
  for (const file of facts?.payload?.files ?? []) {
    const absolute = resolve(repositoryRoot, file.path);
    if (!(await fileExists(absolute))) { errors.push(`missing_file:${file.path}`); continue; }
    if ((await digestFile(absolute)) !== file.digest) errors.push(`digest_mismatch:${file.path}`);
  }
  return { ok: errors.length === 0, errors, checked_files: represented.length };
}
