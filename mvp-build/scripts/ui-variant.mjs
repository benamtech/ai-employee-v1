#!/usr/bin/env node
import { spawn } from "node:child_process";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const variantsRoot = join(root, "apps", "web", "ui-variants");
const registryPath = join(variantsRoot, "registry.generated.ts");
const [command = "help", rawSlug, ...flags] = process.argv.slice(2);
const slug = rawSlug ? normalizeSlug(rawSlug) : "";

if (command === "new") await createVariant(slug);
else if (command === "validate") await validateAll(slug || undefined, flags.includes("--scope"));
else if (command === "generate") await generateRegistry();
else if (command === "watch") await watchVariants();
else if (command === "doctor") await doctor();
else if (command === "prompt") await printPrompt(slug);
else if (command === "agent") await launchAgent(slug, flags);
else printHelp();

async function doctor() {
  assertNode();
  await access(join(root, "package.json"));
  await access(variantsRoot);
  await validateAll();
  const generated = await renderRegistry(await readVariants());
  const current = await readFile(registryPath, "utf8");
  if (current !== generated) throw new Error("ui_variant_registry_stale:run_npm_run_ui:variant:generate");
  console.log(`UI variant doctor PASS: ${variantsRoot}`);
}

async function createVariant(id) {
  if (!id) throw new Error("usage:npm run ui:variant:new -- <slug>");
  const directory = join(variantsRoot, id);
  try { await access(directory); throw new Error(`ui_variant_exists:${id}`); } catch (error) { if (!String(error).includes("ENOENT")) throw error; }
  await mkdir(join(directory, "components"), { recursive: true });
  await mkdir(join(directory, "assets"), { recursive: true });
  const title = titleCase(id);
  await writeFile(join(directory, "variant.json"), `${JSON.stringify({
    schema: "amtech.ui-variant.v1", id, name: title, description: `Experimental employee experience variant: ${title}.`, contract_version: 1,
    entry: "index.tsx", conformance: "web_client_capable", status: "experiment",
    adapters: ["owner_web"], capabilities: ["conversation", "work", "attention", "approvals", "connections", "evidence", "outputs"],
    intentionally_omitted: [], features: [], packages: [],
  }, null, 2)}\n`);
  await writeFile(join(directory, "index.tsx"), scaffoldComponent(title, id));
  await writeFile(join(directory, "instructions.md"), instructions(id, title));
  await writeFile(join(directory, "AGENTS.md"), agentRules(id));
  await generateRegistry();
  console.log(`Created ${relative(root, directory)}\nNext: npm run ui:collab -- ${id} --agent claude`);
}

async function validateAll(only, scopeCheck = false) {
  const variants = await readVariants();
  const selected = only ? variants.filter((item) => item.manifest.id === only) : variants;
  if (only && !selected.length) throw new Error(`ui_variant_not_found:${only}`);
  for (const item of selected) await validateVariant(item);
  if (scopeCheck && only) assertGitScope(only);
  console.log(`UI variant validation PASS: ${selected.map((item) => item.manifest.id).join(", ") || "none"}`);
}

async function validateVariant({ directory, manifest }) {
  const errors = [];
  if (manifest.schema !== "amtech.ui-variant.v1") errors.push("schema");
  if (!/^[a-z][a-z0-9-]{1,62}[a-z0-9]$/.test(manifest.id)) errors.push("id");
  if (manifest.id !== directory.split(sep).at(-1)) errors.push("folder_id_mismatch");
  if (manifest.contract_version !== 1) errors.push("contract_version");
  if (manifest.entry !== "index.tsx") errors.push("entry");
  if (!Array.isArray(manifest.adapters) || !manifest.adapters.length) errors.push("adapters");
  for (const key of ["capabilities", "intentionally_omitted", "features", "packages"]) if (!Array.isArray(manifest[key])) errors.push(key);
  const files = await walk(directory);
  for (const file of files.filter((path) => /\.[cm]?[jt]sx?$/.test(path))) {
    const source = await readFile(file, "utf8");
    for (const specifier of importSpecifiers(source)) {
      if (specifier.startsWith(".")) {
        const target = resolve(dirname(file), specifier);
        if (!isInside(directory, target)) errors.push(`escaping_import:${relative(directory, file)}:${specifier}`);
      } else if (specifier !== "react" && specifier !== "@amtech/shared" && !manifest.packages.includes(packageRoot(specifier))) {
        errors.push(`undeclared_package:${relative(directory, file)}:${specifier}`);
      }
    }
    for (const forbidden of ["fetch(", "XMLHttpRequest", "WebSocket(", "node:fs", "node:child_process", "process.env", "localStorage", "sessionStorage"]) {
      if (source.includes(forbidden)) errors.push(`forbidden_runtime:${relative(directory, file)}:${forbidden}`);
    }
  }
  if (errors.length) throw new Error(`ui_variant_invalid:${manifest.id}:${[...new Set(errors)].join(",")}`);
}

async function generateRegistry() {
  const variants = await readVariants();
  for (const item of variants) await validateVariant(item);
  await writeFile(registryPath, await renderRegistry(variants));
  console.log(`Generated ${relative(root, registryPath)} (${variants.length} variants)`);
}

async function renderRegistry(variants) {
  const manifests = variants.map((item) => item.manifest);
  const imports = variants.map((item) => `  ${JSON.stringify(item.manifest.id)}: lazy(() => import(${JSON.stringify(`./${item.manifest.id}/index`)})),`).join("\n");
  return `/* AUTO-GENERATED by scripts/ui-variant.mjs. Do not edit by hand. */\nimport { lazy } from \"react\";\nimport type { UiVariantManifest } from \"@amtech/shared\";\n\nexport const UI_VARIANT_MANIFESTS = ${JSON.stringify(manifests, null, 2)} as const satisfies readonly UiVariantManifest[];\n\nexport type UiVariantRegistryId = typeof UI_VARIANT_MANIFESTS[number][\"id\"];\n\nexport const UI_VARIANT_LOADERS = {\n${imports}\n} as const;\n\nexport function uiVariantManifest(id: string | null | undefined): UiVariantManifest | null {\n  return UI_VARIANT_MANIFESTS.find((item) => item.id === id) ?? null;\n}\n`;
}

async function watchVariants() {
  await generateRegistry();
  console.log("Watching UI variant folders…");
  let snapshot = await fingerprint();
  setInterval(async () => {
    const next = await fingerprint();
    if (next === snapshot) return;
    snapshot = next;
    try { await generateRegistry(); } catch (error) { console.error(String(error)); }
  }, 700);
  await new Promise(() => {});
}

async function launchAgent(id, flags) {
  if (!id) throw new Error("usage:npm run ui:variant:agent -- <slug> --agent <claude|codex|cursor>");
  await validateAll(id);
  const agentIndex = flags.indexOf("--agent");
  const agent = agentIndex >= 0 ? flags[agentIndex + 1] : "claude";
  const command = agent === "cursor" ? "cursor-agent" : agent;
  const cwd = join(variantsRoot, id);
  console.log(await buildPrompt(id));
  const child = spawn(command, [], { cwd, stdio: "inherit", env: { ...process.env, AMTECH_UI_VARIANT: id } });
  child.on("exit", (code) => process.exit(code ?? 0));
}

async function printPrompt(id) { console.log(await buildPrompt(id)); }
async function buildPrompt(id) {
  if (!id) throw new Error("usage:npm run ui:variant:prompt -- <slug>");
  const manifest = JSON.parse(await readFile(join(variantsRoot, id, "variant.json"), "utf8"));
  return `Read AGENTS.md and instructions.md in the current folder. You are designing AMTECH UI variant ${id}. You may edit only this folder. The running UI Lab route is http://127.0.0.1:3000/ui-lab/clothing-ops?variant=${id}. Preserve the neutral EmployeeExperienceModel contract; do not imitate the production Web-client appearance unless explicitly desired. Build a coherent, accessible experience for desktop and mobile. Use local React/CSS/assets, @amtech/shared types, and only manifest-declared packages. Run npm run ui:variant:validate -- ${id} --scope before stopping. Manifest: ${JSON.stringify(manifest)}.`;
}

function assertGitScope(id) {
  const output = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8" }).trim();
  const allowed = `mvp-build/apps/web/ui-variants/${id}/`;
  const violations = output.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).split(" -> ").at(-1)).filter((path) => path && !path.startsWith(allowed) && path !== "mvp-build/apps/web/ui-variants/registry.generated.ts");
  if (violations.length) throw new Error(`ui_variant_scope_violation:${violations.join(",")}`);
}

async function readVariants() {
  await mkdir(variantsRoot, { recursive: true });
  const entries = await readdir(variantsRoot, { withFileTypes: true });
  const result = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const directory = join(variantsRoot, entry.name);
    try { result.push({ directory, manifest: JSON.parse(await readFile(join(directory, "variant.json"), "utf8")) }); } catch (error) { throw new Error(`ui_variant_manifest_unreadable:${entry.name}:${error}`); }
  }
  return result;
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path)); else result.push(path);
  }
  return result;
}

async function fingerprint() {
  const files = (await walk(variantsRoot)).filter((path) => path !== registryPath).sort();
  const parts = [];
  for (const file of files) { const info = await stat(file); parts.push(`${file}:${info.size}:${info.mtimeMs}`); }
  return parts.join("|");
}

function importSpecifiers(source) {
  return [...source.matchAll(/(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g), ...source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((match) => match[1]);
}
function packageRoot(value) { return value.startsWith("@") ? value.split("/").slice(0, 2).join("/") : value.split("/")[0]; }
function isInside(parent, child) { const rel = relative(parent, child); return rel === "" || (!rel.startsWith("..") && !rel.includes(`${sep}..${sep}`)); }
function normalizeSlug(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function titleCase(value) { return value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "); }
function assertNode() { if (Number(process.versions.node.split(".")[0]) < 20) throw new Error("ui_variant_requires_node_20"); }
function printHelp() { console.log("ui-variant: new|validate|generate|watch|doctor|prompt|agent"); }
function scaffoldComponent(title, id) { return `"use client";\n\nimport type { UiVariantRenderProps } from "@amtech/shared";\n\nexport default function Variant({ model, dispatch }: UiVariantRenderProps) {\n  return <main data-variant-id=${JSON.stringify(id)}><h1>${title}</h1><p>{model.runtime.summary}</p><button onClick={() => void dispatch({ type: "send_message", body: "Give me an update." })}>Ask employee</button></main>;\n}\n`; }
function instructions(id, title) { return `# ${title}\n\nEdit only this directory. This variant receives the neutral EmployeeExperienceModel and may look completely unlike the standard Web client. Preserve capability fidelity, accessibility, responsive behavior, and bounded intent dispatch. Preview: http://127.0.0.1:3000/ui-lab/clothing-ops?variant=${id}\n`; }
function agentRules(id) { return `# UI Variant Agent Boundary\n\nYou may modify only apps/web/ui-variants/${id}/. Read outside files only for context. Do not edit routes, shared contracts, scripts, generated registries, presets, assignments, or production components. Do not use network or storage APIs from the variant. Run \`npm run ui:variant:validate -- ${id} --scope\` from mvp-build before stopping.\n`; }
