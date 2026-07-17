import { writeFileSync } from "node:fs";
import { generateSyntheticSite, manifestFingerprint } from "../dist/index.js";

const pageCount = Number(process.argv[2] ?? 30);
if (!Number.isInteger(pageCount) || pageCount < 6) throw new Error("page count must be an integer >= 6");
const source = generateSyntheticSite(pageCount);
const arms = ["conventional", "graph", "hyperdimensional"];
const pages = source.pages.map((page, index) => ({
  pageId: page.id,
  route: page.route,
  arm: arms[index % arms.length],
  publishedAt: "TBD",
  opportunityId: `opportunity:${page.id}`,
  targetContextIds: [`context:${page.id}`],
  informationObjectIds: [`info:${String(index + 1).padStart(4, "0")}`],
  productionCostUsd: 0,
}));
const manifest = {
  experimentId: "hyper-targeted-field-cohort-v1",
  version: "1",
  observationStart: "TBD",
  observationEnd: "TBD",
  primaryMetric: "gross-profit-per-page",
  pages,
  exclusions: ["branded queries", "internal traffic", "bots", "spam leads"],
};
const output = { ...manifest, fingerprint: manifestFingerprint({ ...manifest, observationStart: "2026-08-01", observationEnd: "2026-10-01" }) };
writeFileSync("field-cohort.generated.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${pageCount}-page field cohort scaffold`);
