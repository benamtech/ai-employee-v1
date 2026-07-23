#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, open, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  UiLabAssignmentRegistry,
  UiLabPreset,
  UiLabPresetId,
  UiLabPresetRef,
  formatUiLabPresetRef,
  parseUiLabPresetRef,
  uiLabPresetFilename,
} from "../packages/shared/dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..");
export const PRESET_ROOT = join(ROOT, "ui-lab", "presets");
export const ASSIGNMENTS_PATH = join(ROOT, "ui-lab", "assignments.json");
export const GENERATED_PATH = join(ROOT, "packages", "shared", "src", "ui-lab-runtime-registry.generated.ts");
const PRESET_FILE = /^v([0-9]{4})\.json$/;

export async function loadPresetRegistry() {
  const presets = [];
  let ids = [];
  try {
    ids = await readdir(PRESET_ROOT);
  } catch (error) {
    if (error?.code === "ENOENT") return { presets, byRef: new Map() };
    throw error;
  }
  for (const rawId of ids.sort()) {
    const id = UiLabPresetId.safeParse(rawId);
    if (!id.success) throw new Error(`invalid_preset_directory:${rawId}`);
    const directory = join(PRESET_ROOT, rawId);
    const files = (await readdir(directory)).filter((name) => PRESET_FILE.test(name)).sort();
    let expectedVersion = 1;
    for (const file of files) {
      const version = Number(PRESET_FILE.exec(file)?.[1]);
      if (version !== expectedVersion) throw new Error(`preset_version_gap:${rawId}:expected_${expectedVersion}:actual_${version}`);
      const preset = UiLabPreset.parse(JSON.parse(await readFile(join(directory, file), "utf8")));
      if (preset.id !== rawId || preset.version !== version) throw new Error(`preset_path_payload_mismatch:${rawId}/${file}`);
      if (preset.preset_ref !== formatUiLabPresetRef(rawId, version)) throw new Error(`preset_ref_mismatch:${rawId}/${file}`);
      if (version > 1 && preset.parent_ref !== formatUiLabPresetRef(rawId, version - 1)) {
        throw new Error(`preset_parent_chain_mismatch:${preset.preset_ref}`);
      }
      presets.push(preset);
      expectedVersion += 1;
    }
  }
  const byRef = new Map();
  for (const preset of presets) {
    if (byRef.has(preset.preset_ref)) throw new Error(`duplicate_preset_ref:${preset.preset_ref}`);
    byRef.set(preset.preset_ref, preset);
  }
  return { presets, byRef };
}

export async function loadAssignments() {
  return UiLabAssignmentRegistry.parse(JSON.parse(await readFile(ASSIGNMENTS_PATH, "utf8")));
}

export async function validateRegistry({ requireGeneratedParity = true } = {}) {
  const { presets, byRef } = await loadPresetRegistry();
  const assignments = await loadAssignments();
  const selectorClaims = new Map();

  for (const assignment of assignments.assignments) {
    const preset = byRef.get(assignment.preset_ref);
    if (!preset) throw new Error(`assignment_preset_missing:${assignment.preset_ref}`);
    if (preset.status !== "approved") throw new Error(`assignment_preset_not_approved:${assignment.preset_ref}:${preset.status}`);
    if (!preset.source.reproducible || preset.source.dirty || !preset.source.git_sha) {
      throw new Error(`assignment_preset_not_reproducible:${assignment.preset_ref}`);
    }
    if (preset.adapter_key !== assignment.adapter_key) throw new Error(`assignment_adapter_mismatch:${assignment.preset_ref}`);
    const selectors = [
      ...assignment.profile_keys.map((value) => `profile:${normalize(value)}`),
      ...assignment.employee_types.map((value) => `employee:${normalize(value)}`),
      ...assignment.business_kinds.map((value) => `business:${normalize(value)}`),
    ];
    if (selectors.length === 0) throw new Error(`assignment_has_no_selector:${assignment.preset_ref}`);
    for (const selector of selectors) {
      const key = `${assignment.adapter_key}:${selector}`;
      const prior = selectorClaims.get(key);
      if (prior) throw new Error(`assignment_selector_collision:${key}:${prior}:${assignment.preset_ref}`);
      selectorClaims.set(key, assignment.preset_ref);
    }
  }

  const generated = renderRuntimeRegistry(assignments, byRef);
  if (requireGeneratedParity) {
    const actual = await readFile(GENERATED_PATH, "utf8");
    if (actual !== generated) throw new Error("generated_runtime_registry_stale:run_ui_lab_generate");
  }

  return {
    status: "PASS",
    preset_count: presets.length,
    approved_count: presets.filter((preset) => preset.status === "approved").length,
    assignment_count: assignments.assignments.length,
    generated_digest: digest(generated),
  };
}

export function renderRuntimeRegistry(assignments, byRef) {
  const rows = assignments.assignments
    .map((assignment) => {
      const preset = byRef.get(assignment.preset_ref);
      if (!preset) throw new Error(`assignment_preset_missing:${assignment.preset_ref}`);
      return {
        preset_ref: assignment.preset_ref,
        adapter_key: assignment.adapter_key,
        profile_keys: [...assignment.profile_keys].sort(),
        business_kinds: [...assignment.business_kinds].sort(),
        employee_types: [...assignment.employee_types].sort(),
        priority: assignment.priority,
        presentation: preset.presentation,
      };
    })
    .sort((left, right) => left.priority - right.priority || left.preset_ref.localeCompare(right.preset_ref));
  const canonical = JSON.stringify(rows);
  return `/**\n * GENERATED by scripts/ui-lab-registry.mjs.\n * Do not edit by hand. The canonical inputs are ui-lab/presets/** and\n * ui-lab/assignments.json.\n */\nexport const APPROVED_UI_PRESET_ASSIGNMENTS = ${JSON.stringify(rows, null, 2)} as const;\n\nexport const UI_LAB_RUNTIME_REGISTRY_DIGEST = ${JSON.stringify(digest(canonical))};\n`;
}

export async function generateRuntimeRegistry() {
  const { byRef } = await loadPresetRegistry();
  const assignments = await loadAssignments();
  const generated = renderRuntimeRegistry(assignments, byRef);
  await writeFile(GENERATED_PATH, generated, "utf8");
  return validateRegistry();
}

export async function promotePreset(ref, options) {
  UiLabPresetRef.parse(ref);
  assertCleanGit();
  const evidence = await loadEvidence(options.evidence);
  const currentSha = git(["rev-parse", "HEAD"]);
  if (evidence.git_sha !== currentSha) throw new Error(`evidence_sha_mismatch:${evidence.git_sha}:${currentSha}`);
  if (evidence.status !== "PASS") throw new Error(`evidence_not_passing:${evidence.status}`);
  if (!options.reviewer) throw new Error("reviewer_required");

  const { presets, byRef } = await loadPresetRegistry();
  const source = byRef.get(ref);
  if (!source) throw new Error(`preset_not_found:${ref}`);
  const sameId = presets.filter((preset) => preset.id === source.id);
  const version = Math.max(...sameId.map((preset) => preset.version)) + 1;
  const targets = {
    profile_keys: unique(options.profile.length ? options.profile : source.targets.profile_keys),
    business_kinds: unique(options.businessKind.length ? options.businessKind : source.targets.business_kinds),
    employee_types: unique(options.employeeType.length ? options.employeeType : source.targets.employee_types),
  };
  if (![...targets.profile_keys, ...targets.business_kinds, ...targets.employee_types].length) {
    throw new Error("promotion_requires_at_least_one_target_selector");
  }
  const now = new Date().toISOString();
  const promoted = UiLabPreset.parse({
    ...source,
    version,
    preset_ref: formatUiLabPresetRef(source.id, version),
    parent_ref: formatUiLabPresetRef(source.id, version - 1),
    status: "approved",
    targets,
    source: {
      git_sha: currentSha,
      git_branch: git(["branch", "--show-current"]) || null,
      dirty: false,
      changed_paths: [],
      reproducible: true,
      captured_at: now,
      captured_by: options.reviewer,
    },
    human_review: {
      reviewer: options.reviewer,
      reviewed_at: now,
      decision: "approve",
      validation_run: relative(ROOT, resolve(options.evidence)),
      ...(options.notes ? { notes: options.notes } : {}),
    },
  });

  const directory = join(PRESET_ROOT, promoted.id);
  await mkdir(directory, { recursive: true });
  await writeExclusive(join(directory, uiLabPresetFilename(promoted.version)), promoted);

  const registry = await loadAssignments();
  const nextAssignments = removeSelectorCollisions(registry.assignments, promoted.adapter_key, targets);
  nextAssignments.push({
    preset_ref: promoted.preset_ref,
    adapter_key: promoted.adapter_key,
    ...targets,
    priority: Number.isInteger(options.priority) ? options.priority : 100,
    assigned_at: now,
    assigned_by: options.reviewer,
  });
  await writeFile(ASSIGNMENTS_PATH, `${JSON.stringify({ ...registry, assignments: nextAssignments }, null, 2)}\n`, "utf8");
  await generateRuntimeRegistry();
  return promoted;
}

export async function assignPreset(ref, options) {
  UiLabPresetRef.parse(ref);
  assertCleanGit();
  const { byRef } = await loadPresetRegistry();
  const preset = byRef.get(ref);
  if (!preset) throw new Error(`preset_not_found:${ref}`);
  if (preset.status !== "approved") throw new Error(`preset_not_approved:${ref}`);
  if (!preset.source.reproducible || preset.source.dirty) throw new Error(`preset_not_reproducible:${ref}`);
  if (!options.reviewer) throw new Error("reviewer_required");
  const targets = {
    profile_keys: unique(options.profile.length ? options.profile : preset.targets.profile_keys),
    business_kinds: unique(options.businessKind.length ? options.businessKind : preset.targets.business_kinds),
    employee_types: unique(options.employeeType.length ? options.employeeType : preset.targets.employee_types),
  };
  if (![...targets.profile_keys, ...targets.business_kinds, ...targets.employee_types].length) throw new Error("assignment_requires_selector");
  const registry = await loadAssignments();
  const assignments = removeSelectorCollisions(registry.assignments, preset.adapter_key, targets);
  assignments.push({
    preset_ref: preset.preset_ref,
    adapter_key: preset.adapter_key,
    ...targets,
    priority: Number.isInteger(options.priority) ? options.priority : 100,
    assigned_at: new Date().toISOString(),
    assigned_by: options.reviewer,
  });
  await writeFile(ASSIGNMENTS_PATH, `${JSON.stringify({ ...registry, assignments }, null, 2)}\n`, "utf8");
  return generateRuntimeRegistry();
}

function removeSelectorCollisions(assignments, adapterKey, targets) {
  const profiles = new Set(targets.profile_keys.map(normalize));
  const businesses = new Set(targets.business_kinds.map(normalize));
  const employees = new Set(targets.employee_types.map(normalize));
  return assignments.map((assignment) => assignment.adapter_key !== adapterKey ? assignment : ({
    ...assignment,
    profile_keys: assignment.profile_keys.filter((value) => !profiles.has(normalize(value))),
    business_kinds: assignment.business_kinds.filter((value) => !businesses.has(normalize(value))),
    employee_types: assignment.employee_types.filter((value) => !employees.has(normalize(value))),
  })).filter((assignment) => assignment.profile_keys.length || assignment.business_kinds.length || assignment.employee_types.length);
}

async function loadEvidence(path) {
  if (!path) throw new Error("promotion_evidence_required");
  await access(resolve(path), fsConstants.R_OK);
  const evidence = JSON.parse(await readFile(resolve(path), "utf8"));
  if (evidence?.schema !== "amtech.ui-lab-evidence.v1") throw new Error("invalid_ui_lab_evidence_schema");
  if (!/^[0-9a-f]{40}$/.test(evidence.git_sha ?? "")) throw new Error("invalid_ui_lab_evidence_sha");
  return evidence;
}

async function writeExclusive(path, value) {
  const handle = await open(path, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function assertCleanGit() {
  const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
  if (status) throw new Error(`promotion_requires_clean_git_worktree:${status.split(/\r?\n/).map((line) => line.slice(3)).join(",")}`);
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function unique(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function parseOptions(args) {
  const options = { reviewer: "", evidence: "", notes: "", priority: 100, profile: [], businessKind: [], employeeType: [] };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--reviewer") options.reviewer = value ?? "";
    else if (flag === "--evidence") options.evidence = value ?? "";
    else if (flag === "--notes") options.notes = value ?? "";
    else if (flag === "--priority") options.priority = Number(value ?? 100);
    else if (flag === "--profile") options.profile.push(value ?? "");
    else if (flag === "--business-kind") options.businessKind.push(value ?? "");
    else if (flag === "--employee-type") options.employeeType.push(value ?? "");
    else throw new Error(`unknown_option:${flag}`);
    index += 1;
  }
  return options;
}

async function main() {
  const [command = "validate", ref, ...rest] = process.argv.slice(2);
  if (command === "validate") {
    process.stdout.write(`${JSON.stringify(await validateRegistry(), null, 2)}\n`);
    return;
  }
  if (command === "generate") {
    process.stdout.write(`${JSON.stringify(await generateRuntimeRegistry(), null, 2)}\n`);
    return;
  }
  if (command === "list") {
    const { presets } = await loadPresetRegistry();
    process.stdout.write(`${JSON.stringify(presets.map(({ preset_ref, display_name, status, adapter_key, scenario_id, source, targets }) => ({ preset_ref, display_name, status, adapter_key, scenario_id, reproducible: source.reproducible, targets })), null, 2)}\n`);
    return;
  }
  if (command === "show") {
    const { byRef } = await loadPresetRegistry();
    process.stdout.write(`${JSON.stringify(byRef.get(UiLabPresetRef.parse(ref)), null, 2)}\n`);
    return;
  }
  if (command === "promote") {
    const preset = await promotePreset(UiLabPresetRef.parse(ref), parseOptions(rest));
    process.stdout.write(`${JSON.stringify({ status: "PROMOTED", preset_ref: preset.preset_ref }, null, 2)}\n`);
    return;
  }
  if (command === "assign") {
    process.stdout.write(`${JSON.stringify(await assignPreset(UiLabPresetRef.parse(ref), parseOptions(rest)), null, 2)}\n`);
    return;
  }
  throw new Error(`unknown_ui_lab_registry_command:${command}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
