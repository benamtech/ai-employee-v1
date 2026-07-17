import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildHyperAwareAgentContext, compileFrameworkManifest, deriveUiScaffoldPlan } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(process.argv[2] ?? resolve(here, "../../site-manifest.yaml"));
const destination = resolve(process.argv[3] ?? resolve(here, "../generated-manifest"));
const compiled = compileFrameworkManifest(readFileSync(manifestPath, "utf8"));
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });

for (const artifact of compiled.site.pages) {
  const directory = resolve(destination, artifact.page.route.replace(/^\//, ""));
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "index.html"), artifact.html);
  if (artifact.instructionMarkdown) writeFileSync(resolve(directory, "use.md"), artifact.instructionMarkdown);
}
writeFileSync(resolve(destination, "sitemap.xml"), compiled.site.sitemapXml);
writeFileSync(resolve(destination, "vector-space.json"), JSON.stringify({
  namespace: compiled.vectorSpace.namespace,
  symbolVersion: compiled.vectorSpace.symbolVersion,
  dimensions: compiled.vectorSpace.dimensions,
  axes: compiled.vectorSpace.axes,
  featureVocabulary: compiled.vectorSpace.featureVocabulary,
  pages: compiled.vectorSpace.pages.map((page) => ({
    pageId: page.pageId,
    profileIds: page.profileIds,
    prototypes: page.prototypes.map((prototype) => ({ id: prototype.id, featureAtoms: prototype.featureAtoms })),
  })),
  packed: {
    prototypeOffsets: Array.from(compiled.site.packed.prototypeOffsets),
    prototypeIds: compiled.site.packed.prototypeIds,
    prototypeCount: compiled.site.packed.prototypeIds.length,
    prototypeVectorFloats: compiled.site.packed.prototypeVectors.length,
  },
  spaceHash: compiled.vectorSpace.spaceHash,
}, null, 2));
writeFileSync(resolve(destination, "ui-scaffold.json"), JSON.stringify(deriveUiScaffoldPlan(compiled), null, 2));
writeFileSync(resolve(destination, "agent-context.json"), JSON.stringify(buildHyperAwareAgentContext(compiled), null, 2));
writeFileSync(resolve(destination, "build.json"), JSON.stringify({
  manifest: manifestPath,
  status: compiled.manifest.status,
  productionReady: compiled.manifest.production_ready,
  pages: compiled.site.pages.length,
  indexablePages: compiled.site.pages.filter((page) => page.page.indexable).length,
  prototypeCount: compiled.site.packed.prototypeIds.length,
  vectorIdentity: compiled.site.packed.vectorIdentity,
  coveragePolicy: compiled.manifest.agent_harness.coverage_policy,
  buildHash: compiled.site.buildHash,
  vectorSpaceHash: compiled.vectorSpace.spaceHash,
}, null, 2));
console.log(`Emitted ${compiled.site.pages.length} unified-manifest pages and ${compiled.site.packed.prototypeIds.length} prototypes to ${destination}`);
