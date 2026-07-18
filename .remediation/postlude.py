# CI artifact export bridge appended to the generated remediation script.
export_script = r'''
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const base = process.env.AMTECH_REMEDIATION_BASE_SHA ?? "571ab08bbf7c84071ee97da1a71d89027618597f";
const names = execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMRT", base, "--"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((name) => !name.startsWith(".remediation/") && name !== ".github/workflows/remediation-bootstrap.yml");
if (!names.length) throw new Error("no remediation files to export");
const archive = "/tmp/amtech-phase2-remediation.tgz";
execFileSync("tar", ["-czf", archive, "--", ...names], { stdio: "inherit" });
const encoded = readFileSync(archive).toString("base64");
console.log("REMEDIATION_ARTIFACT_BASE64_BEGIN");
for (let i = 0; i < encoded.length; i += 120) console.log(encoded.slice(i, i + 120));
console.log("REMEDIATION_ARTIFACT_BASE64_END");
writeFileSync("/tmp/amtech-phase2-remediation-files.json", JSON.stringify({ base, files: names }, null, 2));
console.log(`remediation_exported:${JSON.stringify({ files: names.length, archive })}`);
'''
write("mvp-build/infra/scripts/acceptance/export-phase2-remediation.mjs", export_script)
pkg_path = ROOT / "mvp-build/package.json"
pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
pkg["scripts"].pop("preinstall", None)
pkg["scripts"]["db:verify:worker-migrations"] = "node infra/scripts/acceptance/verify-worker-migrations.mjs && node infra/scripts/acceptance/verify-phase2-remediation.mjs && node infra/scripts/acceptance/export-phase2-remediation.mjs"
pkg["scripts"]["test:worker-migrations"] = "vitest run --config vitest.integration.config.ts tests/integration/worker-migrations.test.ts tests/integration/phase2-remediation.test.ts"
pkg_path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
print("PATCHED mvp-build/package.json CI bridge")
