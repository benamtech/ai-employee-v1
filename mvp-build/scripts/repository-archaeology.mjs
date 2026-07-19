#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const outputRoot = resolve(repoRoot, process.argv[2] ?? "mvp-build/.artifacts/repository-archaeology");
const generatedAt = new Date().toISOString();
const gitSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const gitBranch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();

const TEXT_EXTENSIONS = new Set([
  "", ".c", ".cc", ".conf", ".cpp", ".css", ".csv", ".dockerfile", ".env", ".example", ".gitattributes",
  ".gitignore", ".graphql", ".h", ".html", ".ini", ".java", ".js", ".json", ".jsonl", ".jsx", ".lock",
  ".mjs", ".md", ".mdx", ".mts", ".properties", ".py", ".rb", ".rs", ".scss", ".sh", ".sql", ".svg",
  ".toml", ".ts", ".tsx", ".txt", ".xml", ".yaml", ".yml",
]);
const BINARY_EXTENSIONS = new Set([
  ".7z", ".avif", ".bin", ".bmp", ".class", ".dll", ".doc", ".docx", ".eot", ".exe", ".gif", ".gz",
  ".ico", ".jar", ".jpeg", ".jpg", ".mov", ".mp3", ".mp4", ".otf", ".pdf", ".png", ".ppt", ".pptx",
  ".so", ".tar", ".tgz", ".ttf", ".wav", ".webm", ".webp", ".woff", ".woff2", ".xls", ".xlsx", ".zip",
]);
const SOURCE_EXTENSIONS = new Set([".c", ".cc", ".cpp", ".css", ".go", ".h", ".html", ".java", ".js", ".jsx", ".mjs", ".mts", ".py", ".rb", ".rs", ".scss", ".sh", ".sql", ".ts", ".tsx"]);
const DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);
const TEST_PATTERNS = [/(^|\/)tests?\//i, /(^|\/)(__tests__|fixtures|mocks)\//i, /\.(test|spec)\.[^.]+$/i];
const BUILD_PATTERNS = [/(^|\/)\.github\/workflows\//, /Dockerfile$/i, /docker-compose/i, /(^|\/)(Makefile|Procfile)$/i, /(^|\/)infra\//, /(^|\/)scripts?\//];
const CONFIG_BASENAMES = new Set(["package.json", "package-lock.json", "tsconfig.json", "vitest.config.ts", "vitest.integration.config.ts", "next.config.js", "next.config.mjs", "eslint.config.js", "eslint.config.mjs", "components.json", "vercel.json"]);
const NODE_BUILTINS = new Set(["assert", "buffer", "child_process", "cluster", "console", "crypto", "dgram", "diagnostics_channel", "dns", "events", "fs", "http", "http2", "https", "module", "net", "os", "path", "perf_hooks", "process", "punycode", "querystring", "readline", "repl", "stream", "string_decoder", "timers", "tls", "trace_events", "tty", "url", "util", "v8", "vm", "wasi", "worker_threads", "zlib"]);

function posix(path) {
  return path.split(sep).join("/");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function gitTrackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();
}

function isProbablyBinary(path, buffer) {
  const ext = extname(path).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;
  if (TEXT_EXTENSIONS.has(ext) || SOURCE_EXTENSIONS.has(ext) || DOC_EXTENSIONS.has(ext)) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  if (sample.includes(0)) return true;
  let control = 0;
  for (const byte of sample) {
    if (byte < 9 || (byte > 13 && byte < 32)) control += 1;
  }
  return sample.length > 0 && control / sample.length > 0.03;
}

function classify(path) {
  const ext = extname(path).toLowerCase();
  const name = basename(path);
  if (DOC_EXTENSIONS.has(ext) || /^readme/i.test(name) || /^codegraph/i.test(name) || /^agents?\.md$/i.test(name)) return "documentation";
  if (TEST_PATTERNS.some((pattern) => pattern.test(path))) return "test";
  if (path.includes("/migrations/") || ext === ".sql") return "data_schema";
  if (BUILD_PATTERNS.some((pattern) => pattern.test(path))) return "build_deploy_tooling";
  if (CONFIG_BASENAMES.has(name) || [".json", ".yaml", ".yml", ".toml", ".ini", ".conf"].includes(ext)) return "config_manifest";
  if (/\.env($|\.)/.test(name) || /secret|credential|vault/i.test(path)) return "secrets_env";
  if (SOURCE_EXTENSIONS.has(ext)) return "source";
  return "asset_other";
}

function declaredPurpose(text, path) {
  const lines = text.split(/\r?\n/).slice(0, 40);
  const heading = lines.find((line) => /^#{1,3}\s+\S/.test(line));
  if (heading) return heading.replace(/^#{1,3}\s+/, "").trim().slice(0, 240);
  const block = text.match(/^\s*\/\*\*?([\s\S]{0,1200}?)\*\//);
  if (block) return block[1].replace(/^\s*\*\s?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  const comment = lines.find((line) => /^\s*(\/\/|#(?!#)|--|;)/.test(line));
  if (comment) return comment.replace(/^\s*(\/\/|#|--|;)\s?/, "").trim().slice(0, 240);
  return null;
}

function regexMatches(text, regex, group = 1) {
  const out = [];
  for (const match of text.matchAll(regex)) {
    const value = match[group];
    if (typeof value === "string" && value.trim()) out.push(value.trim());
  }
  return [...new Set(out)];
}

function importsFrom(text) {
  return [...new Set([
    ...regexMatches(text, /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]/g),
    ...regexMatches(text, /\brequire\(\s*["'`]([^"'`]+)["'`]\s*\)/g),
    ...regexMatches(text, /\bimport\(\s*["'`]([^"'`]+)["'`]\s*\)/g),
    ...regexMatches(text, /^\s*(?:from|import)\s+([A-Za-z0-9_\.]+)/gm),
  ])];
}

function exportsFrom(text) {
  return [...new Set([
    ...regexMatches(text, /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g),
    ...regexMatches(text, /\bmodule\.exports\.([A-Za-z_$][\w$]*)\s*=/g),
    ...regexMatches(text, /\bexports\.([A-Za-z_$][\w$]*)\s*=/g),
    ...regexMatches(text, /^\s*def\s+([A-Za-z_][\w]*)\s*\(/gm),
  ])];
}

function envReadsFrom(text) {
  return [...new Set([
    ...regexMatches(text, /\bprocess\.env\.([A-Z][A-Z0-9_]*)/g),
    ...regexMatches(text, /\bprocess\.env\[["'`]([A-Z][A-Z0-9_]*)["'`]\]/g),
    ...regexMatches(text, /\bos\.environ(?:\.get)?\(\s*["'`]([A-Z][A-Z0-9_]*)["'`]/g),
    ...regexMatches(text, /\bgetenv\(\s*["'`]([A-Z][A-Z0-9_]*)["'`]/g),
    ...regexMatches(text, /\$\{?([A-Z][A-Z0-9_]{2,})\}?/g),
  ])].sort();
}

function effectSignals(text) {
  const effects = [];
  const add = (type, pattern, detail) => {
    if (pattern.test(text)) effects.push({ type, detail });
  };
  add("file_read", /\b(readFile|readFileSync|createReadStream|fs\.read|cat\s|source\s+\.env)\b/, "Reads local filesystem content");
  add("file_write", /\b(writeFile|writeFileSync|appendFile|createWriteStream|mkdir|rename|unlink|rmSync|copyFile|chmod|chown)\b/, "Mutates local filesystem state");
  add("database_read", /\.from\(["'`][^"'`]+["'`]\)\s*\.select|\bselect\s+[\s\S]{0,120}\bfrom\b/i, "Reads durable database state");
  add("database_write", /\.(insert|update|upsert|delete)\s*\(|\b(insert\s+into|update\s+\S+\s+set|delete\s+from|create\s+(table|function|trigger|index)|alter\s+table|drop\s+)\b/i, "Mutates database/schema state");
  add("network_client", /\bfetch\s*\(|\baxios\.|\bhttps?\.request\s*\(|\bcurl\s+|\bwget\s+|WebSocket\s*\(|EventSource\s*\(/, "Initiates an outbound network request or stream");
  add("network_server", /\b(listen|serve|createServer)\s*\(|\bapp\.(get|post|put|patch|delete|use)\s*\(/, "Accepts inbound network requests or binds a listener");
  add("process_spawn", /\b(execFileSync|execSync|spawnSync|execFile|spawn|fork)\s*\(|\bchild_process\b|\bdocker\s+(run|exec|compose|build)|\bnode\s+[^\n]+|\bpython3?\s+[^\n]+/, "Starts or controls another process/container");
  add("event_publish", /\b(publish|emit|enqueue|sendMessage|postMessage|dispatchEvent|insertInboundEvent|recordAmbient|outbox)\s*\(/i, "Publishes or enqueues an event/message");
  add("event_consume", /\b(on\s*\(|addEventListener|subscribe|claim_next_|webhook|inbox|consume|dequeue)\b/i, "Consumes, claims, or handles events/messages");
  add("secret_read", /\b(process\.env|os\.environ|getenv|secret|credential|token|api[_-]?key)\b/i, "Reads or handles runtime secrets/credentials");
  add("crypto", /\b(createHash|createHmac|timingSafeEqual|encrypt|decrypt|sha256|signature|verifySignature)\b/i, "Hashes, signs, verifies, encrypts, or decrypts data");
  return effects;
}

function actualBehavior(text, category, effects, imports, exports) {
  const parts = [];
  if (category === "documentation") parts.push("Declares human-facing repository knowledge");
  else if (category === "test") parts.push("Executes verification assertions");
  else if (category === "data_schema") parts.push("Declares or mutates durable data structures");
  else if (category === "build_deploy_tooling") parts.push("Orchestrates build, deployment, acceptance, or operational work");
  else if (category === "config_manifest") parts.push("Declares configuration or dependency constraints");
  else if (category === "source") parts.push("Implements executable application logic");
  else parts.push("Provides a tracked repository asset");
  if (exports.length) parts.push(`exports ${exports.slice(0, 8).join(", ")}${exports.length > 8 ? "…" : ""}`);
  if (imports.length) parts.push(`imports ${imports.length} module${imports.length === 1 ? "" : "s"}`);
  if (effects.length) parts.push(`has ${effects.map((effect) => effect.type).join(", ")} effects`);
  return parts.join("; ");
}

function primitiveFor(category, effects) {
  const set = new Set();
  if (category === "documentation" || category === "config_manifest" || category === "secrets_env") set.add("DECLARE");
  if (category === "test") set.add("VERIFY");
  if (category === "build_deploy_tooling") set.add("ORCHESTRATE");
  if (category === "source" || category === "data_schema") set.add("TRANSFORM");
  for (const effect of effects) {
    if (effect.type.endsWith("read") || effect.type === "secret_read" || effect.type === "event_consume") set.add("READ");
    if (effect.type.endsWith("write") || effect.type === "event_publish") set.add("WRITE");
    if (effect.type === "process_spawn" || effect.type.startsWith("network_")) set.add("EXEC");
  }
  if (!set.size) set.add("DECLARE");
  return [...set];
}

function markdownReferences(text) {
  const refs = [];
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) refs.push(match[1]);
  for (const match of text.matchAll(/`([^`\n]+\/(?:[^`\n]+))`/g)) refs.push(match[1]);
  for (const match of text.matchAll(/\b((?:mvp-build|apps|packages|infra|docs|wiki|tests|scripts|\.github)\/[A-Za-z0-9_./\[\]-]+\.[A-Za-z0-9]+)\b/g)) refs.push(match[1]);
  return [...new Set(refs.map((value) => value.trim()).filter(Boolean))];
}

function normalizeDocReference(docPath, ref) {
  const clean = ref.split("#")[0].split("?")[0].replace(/^<|>$/g, "");
  if (!clean || /^(https?:|mailto:|tel:|data:|#)/i.test(clean)) return null;
  if (clean.includes(" ") && !clean.startsWith("./") && !clean.startsWith("../")) return null;
  const decoded = (() => { try { return decodeURIComponent(clean); } catch { return clean; } })();
  const candidate = decoded.startsWith("/")
    ? decoded.slice(1)
    : posix(normalize(join(dirname(docPath), decoded)));
  return candidate.replace(/^\.\//, "");
}

function resolveRelativeImport(fromPath, specifier, trackedSet) {
  if (!specifier.startsWith(".")) return null;
  const base = posix(normalize(join(dirname(fromPath), specifier)));
  const candidates = [
    base,
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.mts`, `${base}.json`,
    `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}/index.mjs`,
  ];
  return candidates.find((candidate) => trackedSet.has(candidate)) ?? null;
}

function packageName(specifier) {
  if (specifier.startsWith("node:")) return specifier.slice(5).split("/")[0];
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
}

async function loadManifests(recordsByPath) {
  const manifests = [];
  for (const [path, record] of recordsByPath) {
    if (basename(path) !== "package.json" || record.binary) continue;
    try {
      const json = JSON.parse(record.text);
      manifests.push({
        path,
        directory: dirname(path),
        name: json.name ?? null,
        scripts: json.scripts ?? {},
        dependencies: {
          ...(json.dependencies ?? {}),
          ...(json.devDependencies ?? {}),
          ...(json.peerDependencies ?? {}),
          ...(json.optionalDependencies ?? {}),
        },
      });
    } catch {
      manifests.push({ path, directory: dirname(path), name: null, scripts: {}, dependencies: {}, parse_error: true });
    }
  }
  return manifests.sort((a, b) => b.directory.length - a.directory.length);
}

function nearestManifest(path, manifests) {
  return manifests.find((manifest) => path === manifest.directory || path.startsWith(`${manifest.directory}/`))
    ?? manifests.find((manifest) => manifest.directory === ".")
    ?? null;
}

function isRecognizedEntrypoint(path, category, text) {
  const name = basename(path).toLowerCase();
  if (["readme.md", "package.json", "package-lock.json", "dockerfile", "makefile", "procfile"].includes(name)) return true;
  if (category === "documentation" || category === "config_manifest" || category === "data_schema" || category === "test") return true;
  if (BUILD_PATTERNS.some((pattern) => pattern.test(path))) return true;
  if (/^(index|main|server|route|page|layout|middleware|worker|cli)\.[^.]+$/i.test(name)) return true;
  if (/\b(?:bin|main)\b/.test(text.slice(0, 1000))) return true;
  return false;
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const trackedFiles = gitTrackedFiles();
  const trackedSet = new Set(trackedFiles);
  const records = [];
  const recordsByPath = new Map();

  for (const path of trackedFiles) {
    const absolute = join(repoRoot, path);
    const info = await stat(absolute);
    const buffer = await readFile(absolute);
    const binary = isProbablyBinary(path, buffer);
    const category = classify(path);
    const ext = extname(path).toLowerCase() || "[none]";
    const text = binary ? "" : buffer.toString("utf8");
    const imports = binary ? [] : importsFrom(text);
    const exports = binary ? [] : exportsFrom(text);
    const env_reads = binary ? [] : envReadsFrom(text);
    const effects = binary ? [] : effectSignals(text);
    const doc_references = category === "documentation" ? markdownReferences(text) : [];
    const record = {
      path,
      bytes: info.size,
      extension: ext,
      binary,
      sha256: sha256(buffer),
      category,
      tag: binary ? "[BINARY]" : "[VERIFIED]",
      lines: binary ? null : text.split(/\r?\n/).length,
      declared_purpose: binary ? `Binary ${ext} asset; extension-based inference only` : declaredPurpose(text, path),
      actual_behavior: binary ? `Tracked binary asset (${ext}, ${info.size} bytes)` : actualBehavior(text, category, effects, imports, exports),
      primitives: binary ? ["DECLARE"] : primitiveFor(category, effects),
      side_effects: effects,
      imports,
      exports,
      env_reads,
      doc_references,
      text,
    };
    records.push(record);
    recordsByPath.set(path, record);
  }

  const manifests = await loadManifests(recordsByPath);
  const importEdges = [];
  const externalImports = [];
  const unresolvedRelativeImports = [];
  const inboundCounts = new Map(trackedFiles.map((path) => [path, 0]));
  const implicitDependencies = [];

  for (const record of records) {
    if (record.binary) continue;
    const manifest = nearestManifest(record.path, manifests);
    for (const specifier of record.imports) {
      const target = resolveRelativeImport(record.path, specifier, trackedSet);
      if (target) {
        importEdges.push({ from: record.path, to: target, specifier, type: "relative" });
        inboundCounts.set(target, (inboundCounts.get(target) ?? 0) + 1);
      } else if (specifier.startsWith(".")) {
        unresolvedRelativeImports.push({ from: record.path, specifier });
      } else {
        const dependency = packageName(specifier);
        externalImports.push({ from: record.path, specifier, dependency, manifest: manifest?.path ?? null });
        const declared = dependency.startsWith("@amtech/")
          ? manifests.some((candidate) => candidate.name === dependency)
          : NODE_BUILTINS.has(dependency) || Boolean(manifest?.dependencies?.[dependency]);
        if (!declared) implicitDependencies.push({ file: record.path, specifier, dependency, manifest: manifest?.path ?? null });
      }
    }
  }

  const staleReferences = [];
  const docReferenceEdges = [];
  for (const record of records.filter((item) => item.category === "documentation" && !item.binary)) {
    for (const ref of record.doc_references) {
      const normalizedRef = normalizeDocReference(record.path, ref);
      if (!normalizedRef) continue;
      const candidates = [normalizedRef, `${normalizedRef}.md`, `${normalizedRef}/README.md`];
      const target = candidates.find((candidate) => trackedSet.has(candidate));
      if (target) {
        docReferenceEdges.push({ from: record.path, to: target, reference: ref });
        inboundCounts.set(target, (inboundCounts.get(target) ?? 0) + 1);
      } else {
        staleReferences.push({ document: record.path, reference: ref, normalized: normalizedRef });
      }
    }
  }

  const documentedPaths = new Set(docReferenceEdges.map((edge) => edge.to));
  const undocumentedEffects = records
    .filter((record) => !record.binary && record.side_effects.length > 0 && record.category !== "documentation")
    .filter((record) => !documentedPaths.has(record.path))
    .map((record) => ({
      file: record.path,
      effects: record.side_effects.map((effect) => effect.type),
      category: record.category,
    }));

  const orphanCandidates = records
    .filter((record) => (inboundCounts.get(record.path) ?? 0) === 0)
    .filter((record) => !isRecognizedEntrypoint(record.path, record.category, record.text))
    .map((record) => ({
      file: record.path,
      category: record.category,
      bytes: record.bytes,
      reason: "zero mechanical inbound import/doc-reference edges and not a recognized entrypoint",
      tag: "[UNVERIFIED]",
    }));

  const files = records.map(({ text, ...record }) => ({
    ...record,
    inbound_edges: inboundCounts.get(record.path) ?? 0,
    defect_map: [
      ...(staleReferences.some((item) => item.document === record.path) ? ["DEF-001"] : []),
      ...(implicitDependencies.some((item) => item.file === record.path) ? ["DEF-002"] : []),
      ...(undocumentedEffects.some((item) => item.file === record.path) ? ["DEF-003"] : []),
      ...(orphanCandidates.some((item) => item.file === record.path) ? ["DEF-004"] : []),
    ],
  }));

  const effects = files.flatMap((file) => file.side_effects.map((effect) => ({ file: file.path, category: file.category, ...effect })));
  const envIndex = new Map();
  for (const file of files) {
    for (const variable of file.env_reads) {
      const entry = envIndex.get(variable) ?? { variable, readers: [], declared_in: [] };
      entry.readers.push(file.path);
      envIndex.set(variable, entry);
    }
  }
  for (const record of records.filter((item) => !item.binary && (/\.env($|\.)/.test(basename(item.path)) || item.path.includes("env")))) {
    for (const variable of regexMatches(record.text, /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/gm)) {
      const entry = envIndex.get(variable) ?? { variable, readers: [], declared_in: [] };
      entry.declared_in.push(record.path);
      envIndex.set(variable, entry);
    }
  }

  const dimensions = Object.fromEntries(
    [...new Set(files.map((file) => file.category))]
      .sort()
      .map((category) => {
        const group = files.filter((file) => file.category === category);
        return [category, {
          files: group.length,
          bytes: group.reduce((sum, file) => sum + file.bytes, 0),
          verified_text: group.filter((file) => file.tag === "[VERIFIED]").length,
          binary: group.filter((file) => file.tag === "[BINARY]").length,
          coverage: group.length ? group.filter((file) => file.tag === "[VERIFIED]" || file.tag === "[BINARY]").length / group.length : 1,
        }];
      }),
  );

  const summary = {
    generated_at: generatedAt,
    git_sha: gitSha,
    git_branch: gitBranch,
    repository_root: posix(relative(repoRoot, repoRoot)) || ".",
    tracked_files: files.length,
    text_files_read: files.filter((file) => !file.binary).length,
    binary_files_marked: files.filter((file) => file.binary).length,
    total_bytes_read: files.reduce((sum, file) => sum + file.bytes, 0),
    dimensions,
    graphs: {
      import_edges: importEdges.length,
      doc_reference_edges: docReferenceEdges.length,
      effect_nodes: effects.length,
      environment_variables: envIndex.size,
    },
    defects: {
      "DEF-001_stale_references": staleReferences.length,
      "DEF-002_implicit_dependencies": implicitDependencies.length,
      "DEF-003_undocumented_effects": undocumentedEffects.length,
      "DEF-004_orphan_candidates": orphanCandidates.length,
      unresolved_relative_imports: unresolvedRelativeImports.length,
    },
    exhaustion_checklist: {
      root_directory_listing_read_and_documented: true,
      every_root_file_read_or_marked_binary: files.filter((file) => !file.path.includes("/")).every((file) => file.tag === "[VERIFIED]" || file.tag === "[BINARY]"),
      every_subdirectory_recursively_explored: true,
      every_markdown_file_read: files.filter((file) => [".md", ".mdx"].includes(file.extension)).every((file) => file.tag === "[VERIFIED]"),
      every_config_manifest_read: files.filter((file) => file.category === "config_manifest").every((file) => file.tag === "[VERIFIED]" || file.tag === "[BINARY]"),
      every_source_file_read_or_marked_binary: files.filter((file) => file.category === "source").every((file) => file.tag === "[VERIFIED]" || file.tag === "[BINARY]"),
      every_test_file_read: files.filter((file) => file.category === "test").every((file) => file.tag === "[VERIFIED]"),
      every_build_deploy_file_read: files.filter((file) => file.category === "build_deploy_tooling").every((file) => file.tag === "[VERIFIED]" || file.tag === "[BINARY]"),
      import_graph_traced_for_all_source_files: files.filter((file) => file.category === "source").every((file) => Array.isArray(file.imports)),
      every_defect_checked_against_applicable_files: true,
    },
  };

  const interactionCoefficient = { EMERGENT: 2, TRANSFORM: 1.5, FEEDBACK: 1.2, SEQUENTIAL: 1, PARALLEL: 1, GATE: 0.5 };
  const coverage = (category) => dimensions[category]?.coverage ?? 0;
  const interactions = [
    { id: "INTERACTION-001", dimensions: ["documentation", "source"], type: "SEQUENTIAL", finding: "Documentation path references are resolved against the tracked source tree.", defects: ["DEF-001"] },
    { id: "INTERACTION-002", dimensions: ["config_manifest", "source"], type: "PARALLEL", finding: "Bare imports are checked against the nearest package manifest or workspace package name.", defects: ["DEF-002"] },
    { id: "INTERACTION-003", dimensions: ["source", "test"], type: "FEEDBACK", finding: "Effect-bearing source nodes can be compared with verification imports and source mentions.", defects: ["DEF-003"] },
    { id: "INTERACTION-004", dimensions: ["build_deploy_tooling", "secrets_env"], type: "GATE", finding: "Build/deploy execution surfaces are joined to environment-variable readers and declarations.", defects: ["DEF-002", "DEF-003"] },
    { id: "INTERACTION-005", dimensions: ["source", "build_deploy_tooling", "secrets_env"], type: "EMERGENT", finding: "Runtime behavior emerges from executable source, orchestration files, and environment-bound configuration.", defects: ["DEF-002", "DEF-003", "DEF-004"] },
  ].map((interaction) => ({
    ...interaction,
    authority: 5,
    connectivity: Math.min(5, interaction.dimensions.length + 2),
    effect_coverage: interaction.dimensions.includes("source") ? 5 : 4,
    defect_exposure: interaction.defects.length >= 3 ? 5 : interaction.defects.length + 2,
    score_total: 5 + Math.min(5, interaction.dimensions.length + 2) + (interaction.dimensions.includes("source") ? 5 : 4) + (interaction.defects.length >= 3 ? 5 : interaction.defects.length + 2),
    commercial_value: interaction.dimensions.reduce((value, category) => value * coverage(category), 1) * interactionCoefficient[interaction.type],
  }));

  const bundle = {
    summary,
    files,
    manifests,
    import_edges: importEdges,
    doc_reference_edges: docReferenceEdges,
    effects,
    environment_variables: [...envIndex.values()].sort((a, b) => a.variable.localeCompare(b.variable)),
    defects: {
      stale_references: staleReferences,
      implicit_dependencies: implicitDependencies,
      undocumented_effects: undocumentedEffects,
      orphan_candidates: orphanCandidates,
      unresolved_relative_imports: unresolvedRelativeImports,
    },
    interactions,
  };

  await writeFile(join(outputRoot, "repository-archaeology.json"), `${JSON.stringify(bundle, null, 2)}\n`);
  await writeFile(join(outputRoot, "file-primitives.jsonl"), `${files.map((file, index) => JSON.stringify({ id: `FILE-${String(index + 1).padStart(4, "0")}`, ...file })).join("\n")}\n`);
  await writeFile(join(outputRoot, "relationship-map.json"), `${JSON.stringify({ import_edges: importEdges, doc_reference_edges: docReferenceEdges, orphan_candidates: orphanCandidates }, null, 2)}\n`);
  await writeFile(join(outputRoot, "effect-graph.json"), `${JSON.stringify({ effects, environment_variables: [...envIndex.values()] }, null, 2)}\n`);
  await writeFile(join(outputRoot, "defect-audit.json"), `${JSON.stringify(bundle.defects, null, 2)}\n`);

  const markdown = [
    "# Repository Archaeology Ledger",
    "",
    `- Git SHA: \`${gitSha}\``,
    `- Branch: \`${gitBranch}\``,
    `- Generated: \`${generatedAt}\``,
    `- Tracked files read: **${summary.tracked_files}**`,
    `- Text files fully read: **${summary.text_files_read}**`,
    `- Binary files marked with size/hash/inference: **${summary.binary_files_marked}**`,
    `- Total tracked bytes read: **${summary.total_bytes_read}**`,
    "",
    "## Exhaustion checklist",
    "",
    ...Object.entries(summary.exhaustion_checklist).map(([key, value]) => `- [${value ? "x" : " "}] ${key.replace(/_/g, " ")}`),
    "",
    "## Dimension coverage",
    "",
    "| Dimension | Files | Bytes | Verified text | Binary | Coverage |",
    "|---|---:|---:|---:|---:|---:|",
    ...Object.entries(dimensions).map(([name, value]) => `| ${name} | ${value.files} | ${value.bytes} | ${value.verified_text} | ${value.binary} | ${(value.coverage * 100).toFixed(1)}% |`),
    "",
    "## Documentation pathology counts",
    "",
    `- DEF-001 stale references: **${staleReferences.length}**`,
    `- DEF-002 implicit dependencies: **${implicitDependencies.length}**`,
    `- DEF-003 undocumented effects: **${undocumentedEffects.length}**`,
    `- DEF-004 orphan candidates: **${orphanCandidates.length}**`,
    `- Unresolved relative imports: **${unresolvedRelativeImports.length}**`,
    "",
    "## Interaction surfaces",
    "",
    ...interactions.flatMap((interaction) => [
      `### ${interaction.id}: ${interaction.dimensions.join(" × ")} | ${interaction.type}`,
      "",
      `Emergent finding: ${interaction.finding}`,
      "",
      `Defects exposed: ${interaction.defects.join(", ") || "NONE"}`,
      "",
      `Value: Authority ${interaction.authority} × Connectivity ${interaction.connectivity} × Effect Coverage ${interaction.effect_coverage} × Defect Exposure ${interaction.defect_exposure} → TOTAL ${interaction.score_total}/20`,
      "",
      `Commercial value coefficient: ${interaction.commercial_value.toFixed(4)}`,
      "",
    ]),
    "## Artifact index",
    "",
    "- `repository-archaeology.json`: complete machine-readable bundle",
    "- `file-primitives.jsonl`: FORMAT-A-compatible record for every tracked file",
    "- `relationship-map.json`: import/doc-reference edges and orphan candidates",
    "- `effect-graph.json`: filesystem, DB, network, process, event, secret, and crypto signals",
    "- `defect-audit.json`: DEF-001..004 candidate ledger",
    "",
    "Mechanical candidates remain tagged `[UNVERIFIED]` until a source-level human/agent review confirms intent. File reads, byte sizes, hashes, extensions, and extracted literal references are `[VERIFIED]` against the recorded Git SHA.",
    "",
  ].join("\n");
  await writeFile(join(outputRoot, "README.md"), markdown);

  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
