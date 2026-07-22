import { execFileSync } from "node:child_process";
import { open, readFile, readdir, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  UiLabPreset,
  UiLabPresetId,
  UiLabPresetSummary,
  UiLabSavePresetRequest,
  formatUiLabPresetRef,
  uiLabPresetFilename,
  type UiLabPreset as UiLabPresetValue,
  type UiLabPresetSummary as UiLabPresetSummaryValue,
  type UiLabSavePresetRequest as UiLabSavePresetRequestValue,
  type UiLabSourceProvenance,
} from "@amtech/shared";

const PRESET_FILE = /^v([0-9]{4})\.json$/;

export interface UiLabRegistrySnapshot {
  presets: UiLabPresetSummaryValue[];
  write_enabled: boolean;
  source: UiLabSourceProvenance;
}

export function resolveMvpBuildRoot(start = process.cwd()): string {
  let current = resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      const pkg = JSON.parse(execFileSync(process.execPath, ["-e", `process.stdout.write(require("fs").readFileSync(${JSON.stringify(join(current, "package.json"))},"utf8"))`], { encoding: "utf8" }));
      if (pkg?.name === "amtech-mvp") return current;
    } catch {
      // Keep walking toward the repository root.
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(`ui_lab_mvp_root_not_found:${start}`);
}

export function uiLabPresetRoot(root = resolveMvpBuildRoot()): string {
  return join(root, "ui-lab", "presets");
}

export async function listUiLabPresets(root = resolveMvpBuildRoot()): Promise<UiLabPresetValue[]> {
  const presetRoot = uiLabPresetRoot(root);
  let ids: string[] = [];
  try {
    ids = await readdir(presetRoot);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const presets: UiLabPresetValue[] = [];
  for (const rawId of ids.sort()) {
    const id = UiLabPresetId.safeParse(rawId);
    if (!id.success) continue;
    const directory = join(presetRoot, id.data);
    let files: string[] = [];
    try {
      files = await readdir(directory);
    } catch {
      continue;
    }
    for (const file of files.sort()) {
      const match = PRESET_FILE.exec(file);
      if (!match) continue;
      const parsed = UiLabPreset.parse(JSON.parse(await readFile(join(directory, file), "utf8")));
      const pathVersion = Number(match[1]);
      if (parsed.id !== id.data || parsed.version !== pathVersion) {
        throw new Error(`ui_lab_preset_path_payload_mismatch:${rawId}/${file}`);
      }
      if (parsed.preset_ref !== formatUiLabPresetRef(parsed.id, parsed.version)) {
        throw new Error(`ui_lab_preset_ref_mismatch:${rawId}/${file}`);
      }
      presets.push(parsed);
    }
  }
  return presets.sort((left, right) => left.id.localeCompare(right.id) || right.version - left.version);
}

export async function uiLabRegistrySnapshot(writeEnabled: boolean): Promise<UiLabRegistrySnapshot> {
  const root = resolveMvpBuildRoot();
  const presets = await listUiLabPresets(root);
  return {
    presets: presets.map((preset) => UiLabPresetSummary.parse(preset)),
    write_enabled: writeEnabled,
    source: readGitProvenance(root),
  };
}

export async function saveUiLabDraft(
  input: UiLabSavePresetRequestValue,
  root = resolveMvpBuildRoot(),
): Promise<UiLabPresetValue> {
  const request = UiLabSavePresetRequest.parse(input);
  const all = await listUiLabPresets(root);
  const existing = all.filter((preset) => preset.id === request.id);
  const version = existing.reduce((maximum, preset) => Math.max(maximum, preset.version), 0) + 1;
  const parent = existing.sort((left, right) => right.version - left.version)[0];
  const source = readGitProvenance(root, request.captured_by);
  const preset = UiLabPreset.parse({
    schema: "amtech.ui-lab-preset.v1",
    id: request.id,
    version,
    preset_ref: formatUiLabPresetRef(request.id, version),
    display_name: request.display_name,
    description: request.description,
    status: "draft",
    ...(parent ? { parent_ref: parent.preset_ref } : {}),
    scenario_id: request.scenario_id,
    adapter_key: request.adapter_key,
    presentation: request.presentation,
    targets: request.targets ?? { profile_keys: [], business_kinds: [], employee_types: [] },
    review_viewports: request.review_viewports ?? ["desktop", "mobile"],
    tags: request.tags ?? [],
    ...(request.notes ? { notes: request.notes } : {}),
    source,
  });

  const directory = join(uiLabPresetRoot(root), preset.id);
  await mkdir(directory, { recursive: true });
  const path = join(directory, uiLabPresetFilename(version));
  const handle = await open(path, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(preset, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  return preset;
}

export function readGitProvenance(root = resolveMvpBuildRoot(), capturedBy?: string): UiLabSourceProvenance {
  const git = (args: string[]) => {
    try {
      return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return "";
    }
  };
  const gitSha = git(["rev-parse", "HEAD"]);
  const branch = git(["branch", "--show-current"]);
  const status = git(["status", "--porcelain=v1", "--untracked-files=all"]);
  const changedPaths = status
    ? status.split(/\r?\n/).map((line) => line.slice(3).split(" -> ").at(-1)?.trim() ?? "").filter(Boolean)
    : [];
  const dirty = changedPaths.length > 0;
  return {
    git_sha: /^[0-9a-f]{40}$/.test(gitSha) ? gitSha : null,
    git_branch: branch || null,
    dirty,
    changed_paths: changedPaths,
    reproducible: Boolean(/^[0-9a-f]{40}$/.test(gitSha) && !dirty),
    captured_at: new Date().toISOString(),
    ...(capturedBy ? { captured_by: capturedBy } : {}),
  };
}
