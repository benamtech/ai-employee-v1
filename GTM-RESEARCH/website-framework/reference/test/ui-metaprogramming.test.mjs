import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  compileAgenticUiSitePlan,
  compileFrameworkManifest,
  createAmtechUiStandard,
  evaluateCssFeatureChecklist,
  parseFrameworkManifest,
  renderAgenticUiSite,
  resolveBrowserTargets,
  validateAgenticUiSitePlan,
  validateAmtechUiStandard,
} from "../dist/index.js";

const manifestText = readFileSync(new URL("../../site-manifest.yaml", import.meta.url), "utf8");
const browserslistRcText = readFileSync(new URL("../../.browserslistrc", import.meta.url), "utf8");

function compileUi(manifest = manifestText) {
  const compiled = compileFrameworkManifest(manifest);
  const browser = resolveBrowserTargets({ browserslistRcText });
  const plan = compileAgenticUiSitePlan(compiled, browser, "ui-scaffold");
  validateAgenticUiSitePlan(plan);
  return { compiled, browser, plan, rendered: renderAgenticUiSite(compiled, plan) };
}

test("browser contract resolves before CSS and maps to Tier 2", () => {
  const browser = resolveBrowserTargets({ browserslistRcText });
  assert.equal(browser.source, ".browserslistrc");
  assert.equal(browser.tier, 2);
  assert.equal(browser.floors.chrome, 111);
  assert.equal(browser.floors.safari, 16.4);
  const standard = createAmtechUiStandard(browser);
  assert.deepEqual(validateAmtechUiStandard(standard), []);
  const checklist = evaluateCssFeatureChecklist(browser, { prohibitedFeatureIds: ["light-dark"] });
  assert.equal(checklist.total, 57);
  assert.equal(checklist.decisions.find((item) => item.id === "light-dark")?.disposition, "prohibited");
});

test("page matrix and vector geometry deterministically derive the UI plan", () => {
  const first = compileUi();
  assert.equal(first.plan.pages.length, 2);
  assert.ok(Object.values(first.plan.moduleCoverage).every((count) => count > 0));
  assert.ok(Object.values(first.plan.layoutRoleCoverage).every((count) => count > 0));
  assert.ok(first.plan.pages.every((page) => Object.keys(page.matrixCoordinate).length >= 7));
  assert.ok(first.plan.pages.every((page) => page.vectorPrototypeIds.length > 0));
  const parsed = parseFrameworkManifest(manifestText);
  const reordered = { ...parsed, modules: [...parsed.modules].reverse(), pages: [...parsed.pages].reverse(), information_objects: [...parsed.information_objects].reverse() };
  const secondCompiled = compileFrameworkManifest(reordered);
  const secondPlan = compileAgenticUiSitePlan(secondCompiled, first.browser, "ui-scaffold");
  validateAgenticUiSitePlan(secondPlan);
  assert.equal(secondPlan.planHash, first.plan.planHash);
});

test("AMTECH renderer emits complete noindex HTML with modern Tier 2 CSS and zero canonical JS", () => {
  const { rendered } = compileUi();
  assert.equal(rendered.pages.length, 2);
  assert.ok(rendered.css.includes("@layer reset, tokens, base, layout, components, utilities"));
  assert.ok(rendered.css.includes("oklch("));
  assert.ok(rendered.css.includes("container-type: inline-size"));
  assert.ok(rendered.css.includes("content-visibility: auto"));
  assert.ok(rendered.css.includes("prefers-reduced-motion"));
  assert.equal(rendered.css.includes("prefers-color-scheme: dark"), false);
  assert.ok(rendered.cssBytes < 24_000);
  for (const page of rendered.pages) {
    assert.ok(page.html.includes('name="robots" content="noindex,nofollow"'));
    assert.ok(page.html.includes('type="application/ld+json"'));
    assert.ok(page.html.includes('href="/assets/amtech-ui.css"'));
    assert.equal(/<script(?![^>]*application\/ld\+json)/.test(page.html), false);
    assert.ok(page.html.includes("data-page-plan="));
    assert.ok(page.html.includes("Page coordinate"));
  }
});

test("optional 3D is poster-first, demand-rendered, bounded, and non-canonical", () => {
  const { plan, rendered } = compileUi();
  const pagesWithScenes = plan.pages.filter((page) => page.threeScene);
  assert.equal(pagesWithScenes.length, 1);
  const scene = pagesWithScenes[0].threeScene;
  assert.ok(scene);
  assert.equal(scene.interaction.frameloop, "demand");
  assert.equal(scene.interaction.requiresUserActivation, true);
  assert.equal(scene.contentPolicy.canonicalContentInsideScene, false);
  assert.equal(scene.performance.postprocessing, false);
  assert.equal(scene.performance.wasm, "disabled-until-benchmark-win");
  const emitted = rendered.pages.find((page) => page.pageId === pagesWithScenes[0].pageId);
  assert.ok(emitted?.html.includes("amtech-scene__poster"));
  assert.ok(emitted?.threeContractJson);
});
