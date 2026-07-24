#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, watchFile, unwatchFile } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const variantsRoot = join(root, "apps", "web", "ui-variants");
const registryPath = join(root, "apps", "web", "app", "_components", "ui-variant", "registry.generated.ts");
const command = process.argv[2] ?? "doctor";
const target = process.argv[3];
const slugPattern = /^[a-z][a-z0-9-]{1,62}[a-z0-9]$/;

if (command === "new") scaffold(requiredSlug(target));
else if (command === "validate") validateCommand(target);
else if (command === "generate") generateRegistry(true);
else if (command === "watch") watchRegistry();
else if (command === "list") listVariants();
else if (command === "prompt") printPrompt(requiredSlug(target));
else if (command === "doctor") doctor();
else fail(`unknown_ui_variant_command:${command}`);

function variantDirectories() {
  if (!existsSync(variantsRoot)) return [];
  return readdirSync(variantsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(variantsRoot, entry.name, "variant.json")))
    .map((entry) => entry.name)
    .sort();
}

function readManifest(slug) {
  const path = join(variantsRoot, slug, "variant.json");
  let value;
  try { value = JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { fail(`invalid_variant_manifest_json:${slug}:${error instanceof Error ? error.message : error}`); }
  return value;
}

function validateCommand(slug) {
  const slugs = slug ? [requiredSlug(slug)] : variantDirectories();
  if (!slugs.length) fail("no_ui_variants_found");
  for (const item of slugs) validateVariant(item);
  process.stdout.write(`UI variant validation PASS: ${slugs.length} variant(s)\n`);
}

function validateVariant(slug) {
  const dir = join(variantsRoot, slug);
  const manifest = readManifest(slug);
  const errors = [];
  if (manifest.schema !== "amtech.ui-variant.v1") errors.push("schema_must_be_amtech.ui-variant.v1");
  if (manifest.id !== slug || !slugPattern.test(String(manifest.id ?? ""))) errors.push("manifest_id_must_match_folder_slug");
  if (manifest.contract_version !== 1) errors.push("contract_version_must_be_1");
  if (manifest.entry !== "./index.tsx") errors.push("entry_must_be_./index.tsx");
  if (!Array.isArray(manifest.supported_adapters) || !manifest.supported_adapters.length) errors.push("supported_adapters_required");
  if (!manifest.capabilities || !Array.isArray(manifest.capabilities.required) || !Array.isArray(manifest.capabilities.optional) || !Array.isArray(manifest.capabilities.intentionally_omitted)) errors.push("capability_declaration_required");
  if (!manifest.performance?.containment || !manifest.production?.eligibility) errors.push("performance_and_production_policy_required");
  const dependencies = new Set(manifest.dependencies ?? []);
  dependencies.add("react");
  const files = walk(dir).filter((path) => /\.(?:ts|tsx|js|jsx|mjs|css)$/.test(path));
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(source)) errors.push(`${rel(file)}:network_access_forbidden`);
    if (/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(source)) errors.push(`${rel(file)}:ambient_storage_forbidden_use_host_intents`);
    // A variant renders a bounded typed model. It never injects markup, evaluates code, reads
    // ambient credentials or environment, or names a product route directly (HIP-7.4).
    if (/\bdangerouslySetInnerHTML\b/.test(source)) errors.push(`${rel(file)}:raw_markup_injection_forbidden`);
    if (/\bnew\s+Function\s*\(|(?<![.\w])eval\s*\(/.test(source)) errors.push(`${rel(file)}:dynamic_code_evaluation_forbidden`);
    if (/\bdocument\s*\.\s*cookie\b/.test(source)) errors.push(`${rel(file)}:ambient_credential_access_forbidden`);
    if (/\bprocess\s*\.\s*env\b/.test(source)) errors.push(`${rel(file)}:environment_access_forbidden`);
    if (/["'`]\/api\//.test(source)) errors.push(`${rel(file)}:product_route_reference_forbidden_use_host_intents`);
    if (/\bnew\s+Worker\b/.test(source) && !(manifest.runtime_features ?? []).includes("web_worker")) errors.push(`${rel(file)}:worker_feature_not_declared`);
    if (/\bWebAssembly\b/.test(source) && !(manifest.runtime_features ?? []).includes("wasm")) errors.push(`${rel(file)}:wasm_feature_not_declared`);
    for (const specifier of importSpecifiers(source)) {
      if (specifier === "../contract" || specifier === "../contract.ts") continue;
      if (specifier.startsWith(".")) {
        const resolved = resolve(dirname(file), specifier);
        if (!(resolved === dir || resolved.startsWith(`${dir}${sep}`))) errors.push(`${rel(file)}:relative_import_escapes_variant:${specifier}`);
        continue;
      }
      if (specifier.startsWith("node:") || ["fs", "path", "child_process", "net", "http", "https"].includes(specifier)) errors.push(`${rel(file)}:node_runtime_import_forbidden:${specifier}`);
      else {
        const packageName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
        if (!dependencies.has(packageName)) errors.push(`${rel(file)}:undeclared_dependency:${packageName}`);
      }
    }
  }
  if (!existsSync(join(dir, "index.tsx"))) errors.push("index.tsx_required");
  if (errors.length) fail(`ui_variant_invalid:${slug}\n- ${errors.join("\n- ")}`);
  return manifest;
}

function generateRegistry(write) {
  const entries = variantDirectories().map((slug) => ({ slug, manifest: validateVariant(slug) }));
  if (!entries.some((entry) => entry.slug === "reference-client")) fail("reference-client_variant_required");
  const imports = entries.map(({ slug }, index) => `import manifest${index} from "../../../ui-variants/${slug}/variant.json";`).join("\n");
  const rows = entries.map(({ slug }, index) => `  ${JSON.stringify(slug)}: { manifest: manifest${index} as UiVariantManifest, Component: lazy(() => import("../../../ui-variants/${slug}/index")) },`).join("\n");
  const output = `/* GENERATED by scripts/ui-variant.mjs. Do not edit by hand. */\nimport { lazy } from "react";\nimport type { UiVariantManifest } from "@amtech/shared";\n${imports}\n\nexport const UI_VARIANT_REGISTRY = {\n${rows}\n} as const;\n\nexport type UiVariantRegistryId = keyof typeof UI_VARIANT_REGISTRY;\nexport const UI_VARIANT_IDS = Object.keys(UI_VARIANT_REGISTRY) as UiVariantRegistryId[];\nexport function isUiVariantRegistryId(value: string): value is UiVariantRegistryId { return value in UI_VARIANT_REGISTRY; }\n`;
  if (write) { mkdirSync(dirname(registryPath), { recursive: true }); writeFileSync(registryPath, output); process.stdout.write(`Generated ${rel(registryPath)} with ${entries.length} literal lazy imports.\n`); }
  return output;
}

function scaffold(slug) {
  const dir = join(variantsRoot, slug);
  if (existsSync(dir)) fail(`ui_variant_already_exists:${slug}`);
  mkdirSync(join(dir, ".cursor", "rules"), { recursive: true });
  const title = titleCase(slug);
  writeFileSync(join(dir, "variant.json"), JSON.stringify({ schema:"amtech.ui-variant.v1", id:slug, name:title, summary:`Experimental employee experience for ${title}.`, contract_version:1, entry:"./index.tsx", status:"experiment", supported_adapters:["owner_web"], capabilities:{ required:["identity","runtime","work"], optional:["context","conversation","attention","waiting","changes","connections","capabilities","evidence","outputs","intents","fixture_metadata","reference_client","presentation"], intentionally_omitted:[] }, runtime_features:["dom","css","svg"], dependencies:["react"], isolation:"host_contained", performance:{ containment:"layout_paint_style", content_visibility:"visible", initial_render:"lazy" }, production:{ eligibility:"lab_only", requires_reference_client:false }, tags:["experiment"] }, null, 2) + "\n");
  writeFileSync(join(dir, "index.tsx"), `"use client";\n\nimport { defineUiVariant } from "../contract";\nimport styles from "./styles.module.css";\n\nexport default defineUiVariant(function ${identifier(title)}Variant({ model, slots }) {\n  return (\n    <main className={styles.root}>\n      <p className={styles.eyebrow}>{model.runtime.status}</p>\n      <h1>{model.identity.employee_name}</h1>\n      <p>{model.runtime.summary}</p>\n      <section>{model.work.loops.map((loop) => <article key={loop.id}><strong>{loop.title}</strong><span>{loop.state}</span></article>)}</section>\n      <details><summary>Production reference client</summary>{slots.reference_client}</details>\n    </main>\n  );\n});\n`);
  writeFileSync(join(dir, "styles.module.css"), `.root{min-height:100dvh;padding:clamp(24px,6vw,72px);background:#f7f7f5;color:#171717;font-family:ui-sans-serif,system-ui}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:11px}.root h1{font-size:clamp(48px,9vw,112px);line-height:.85;letter-spacing:-.06em}.root section{display:grid;gap:12px;margin:40px 0}.root article{display:flex;justify-content:space-between;gap:20px;padding:18px;border:1px solid #d7d7d2;background:#fff}\n`);
  const instructions = localInstructions(slug, title);
  writeFileSync(join(dir, "instructions.md"), instructions);
  writeFileSync(join(dir, "AGENTS.md"), `# ${title} agent boundary\n\n${instructions}\n`);
  writeFileSync(join(dir, "CLAUDE.md"), `# ${title} Claude Code context\n\n@instructions.md\n\nRead ../../../../UI_LAB_AGENT_ONBOARDING.md when broader context is needed.\n`);
  writeFileSync(join(dir, ".cursor", "rules", "ui-variant.mdc"), `---\ndescription: AMTECH UI variant folder boundary\nglobs: "**/*"\nalwaysApply: true\n---\n\n${instructions}\n`);
  writeFileSync(join(dir, "TASK.md"), `# Design task\n\nDescribe the visual or interaction outcome here. Include references, audiences, required scenarios, and anything that must not change.\n`);
  generateRegistry(true);
  process.stdout.write(`Created ${rel(dir)}.\nNext: node scripts/ui-variant-collaborator.mjs ${slug} --agent claude\n`);
}

function localInstructions(slug, title) {
  return `You are designing **${title}**, an AMTECH UI variant.\n\n## Hard write boundary\n- You may edit only files inside \`apps/web/ui-variants/${slug}/\`.\n- You may read the repository for context.\n- Never edit routes, shared contracts, generated registries, fixtures, tests, package files, or other variants.\n- Do not add dependencies. Ask the host maintainer to approve them through \`variant.json\`.\n\n## Product boundary\n- Capability and information fidelity to the Web client is required; visual resemblance is not.\n- The neutral model arrives as \`model\`; bounded actions go through \`dispatchIntent\`; the existing production UI is available as \`slots.reference_client\`.\n- Never fetch data, access ambient storage, fabricate capabilities, or bypass the intent bridge.\n- Radical React, CSS, SVG, Canvas, Worker, and WASM experiments are allowed only when declared in \`variant.json\`.\n\n## Loop\n1. Read \`TASK.md\`, \`variant.json\`, \`../contract.ts\`, and the current files.\n2. Keep UI Lab running.\n3. Make one coherent visual hypothesis at a time.\n4. Check desktop and mobile plus active, waiting, stalled, recovery, and empty states relevant to the design.\n5. Run \`node ../../../../scripts/ui-variant.mjs validate ${slug}\`.\n6. Report changed files, tested states, remaining uncertainty, and do not promote or assign the variant.\n`;
}

function doctor() {
  validateCommand();
  const expected = generateRegistry(false);
  if (!existsSync(registryPath) || readFileSync(registryPath, "utf8") !== expected) fail("ui_variant_registry_stale:run_node_scripts/ui-variant.mjs_generate");
  for (const required of ["packages/shared/src/ui-variant.ts", "apps/web/ui-variants/contract.ts", "apps/web/app/_components/ui-variant/UiVariantHost.tsx"]) if (!existsSync(join(root, required))) fail(`ui_variant_required_path_missing:${required}`);
  process.stdout.write(`UI variant doctor PASS: ${variantDirectories().length} folders, registry current, contract present.\n`);
}

function watchRegistry() {
  let digest = snapshot();
  const tick = () => {
    const next = snapshot();
    if (next !== digest) { digest = next; try { generateRegistry(true); } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : error}\n`); } }
  };
  const timer = setInterval(tick, 700);
  process.stdout.write(`Watching ${rel(variantsRoot)} for manifest and entry changes. Ctrl+C to stop.\n`);
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { clearInterval(timer); process.exit(0); });
}

function snapshot() {
  return variantDirectories().flatMap((slug) => ["variant.json", "index.tsx"].map((name) => join(variantsRoot, slug, name))).map((path) => `${path}:${existsSync(path) ? statSync(path).mtimeMs : 0}`).join("|");
}

function listVariants() { for (const slug of variantDirectories()) { const manifest = readManifest(slug); process.stdout.write(`${slug}\t${manifest.status}\t${manifest.name}\t${manifest.production?.eligibility}\n`); } }
function printPrompt(slug) { if (!existsSync(join(variantsRoot, slug))) fail(`ui_variant_not_found:${slug}`); process.stdout.write(`Read instructions.md, TASK.md, variant.json, and ../contract.ts. Work only inside this folder. Build the requested employee experience without preserving the production client's appearance or layout. Preserve capability and information fidelity through the neutral model and bounded intents. Use slots.reference_client only when it improves the design. Validate with: node ../../../../scripts/ui-variant.mjs validate ${slug}\n`); }
function requiredSlug(value) { if (!value || !slugPattern.test(value)) fail("variant_slug_required_lowercase_kebab_case_3_to_64_chars"); return value; }
function walk(dir) { return readdirSync(dir, { withFileTypes:true }).flatMap((entry) => { const path=join(dir,entry.name); return entry.isDirectory() ? walk(path) : [path]; }); }
function importSpecifiers(source) { const found=[]; const pattern=/(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g; for (const match of source.matchAll(pattern)) found.push(match[1] ?? match[2]); return found; }
function rel(path) { return relative(root,path).split(sep).join("/"); }
function titleCase(value) { return value.split("-").map((part) => part.charAt(0).toUpperCase()+part.slice(1)).join(" "); }
function identifier(value) { return value.replace(/[^a-zA-Z0-9]+/g, "").replace(/^([0-9])/, "_$1"); }
function fail(message) { throw new Error(message); }
