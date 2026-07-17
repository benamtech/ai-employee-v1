import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  compileFrameworkManifest,
  resolveBrowserTargets,
  assertAmtechBrowserBaseline,
  compileAgenticUiSitePlan,
  validateAgenticUiSitePlan,
  renderAgenticUiSite,
} from "../dist/index.js";

const manifestPath = resolve(process.argv[2] ?? "../site-manifest.yaml");
const outputRoot = resolve(process.argv[3] ?? "generated-ui");
const browserslistPath = resolve(process.argv[4] ?? "../.browserslistrc");
const [manifestText, browserslistRcText] = await Promise.all([
  readFile(manifestPath, "utf8"),
  readFile(browserslistPath, "utf8"),
]);
const compiled = compileFrameworkManifest(manifestText);
const browser = resolveBrowserTargets({ browserslistRcText });
assertAmtechBrowserBaseline(browser);
const plan = compileAgenticUiSitePlan(compiled, browser, "ui-scaffold");
validateAgenticUiSitePlan(plan);
const rendered = renderAgenticUiSite(compiled, plan);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(join(outputRoot, "assets"), { recursive: true });
await writeFile(join(outputRoot, "assets", "amtech-ui.css"), rendered.css);
await writeJson(join(outputRoot, "ui-plan.json"), plan);
await writeJson(join(outputRoot, "browser-targets.json"), browser);
await writeJson(join(outputRoot, "css-checklist.json"), plan.standard.cssChecklist);
await writeJson(join(outputRoot, "build.json"), {
  standardId: rendered.standardId,
  planHash: rendered.planHash,
  cssHash: rendered.cssHash,
  cssBytes: rendered.cssBytes,
  siteHash: rendered.siteHash,
  pages: rendered.pages.map((page) => ({ pageId: page.pageId, route: page.route, htmlHash: page.htmlHash })),
});
for (const page of rendered.pages) {
  const directory = join(outputRoot, routeDirectory(page.route));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), page.html);
  if (page.threeContractJson) await writeFile(join(directory, "three-scene.json"), page.threeContractJson);
}
console.log(JSON.stringify({
  profile: plan.scaffoldProfileId,
  browserTier: browser.tier,
  pageCount: rendered.pages.length,
  cssBytes: rendered.cssBytes,
  siteHash: rendered.siteHash,
}, null, 2));

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function routeDirectory(route) {
  const clean = route.replace(/^\/+|\/+$/g, "");
  return clean || ".";
}
