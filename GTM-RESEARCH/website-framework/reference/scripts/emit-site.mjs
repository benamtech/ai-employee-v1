import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { compileSite, generateSyntheticSite, generateVariantPlans } from "../dist/index.js";

const pageCount = Number(process.argv[2] ?? 2000);
const outputRoot = process.argv[3] ?? "generated";
rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
const source = generateSyntheticSite(pageCount);
const compiled = compileSite(source, 512);
for (const artifact of compiled.pages) {
  const target = join(outputRoot, artifact.page.route.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, artifact.html);
  if (artifact.instructionMarkdown) writeFileSync(join(dirname(target), "use.md"), artifact.instructionMarkdown);
}
writeFileSync(join(outputRoot, "sitemap.xml"), compiled.sitemapXml);
writeFileSync(join(outputRoot, "page-vectors.f32"), Buffer.from(compiled.packed.pageVectors.buffer));
writeFileSync(join(outputRoot, "graph-offsets.u32"), Buffer.from(compiled.packed.graphOffsets.buffer));
writeFileSync(join(outputRoot, "graph-targets.u32"), Buffer.from(compiled.packed.graphTargets.buffer));
writeFileSync(join(outputRoot, "site-manifest.json"), `${JSON.stringify({
  buildHash: compiled.buildHash,
  pageCount: compiled.pages.length,
  variants: generateVariantPlans(source, 3),
  pages: compiled.pages.map((artifact) => ({ id: artifact.page.id, route: artifact.page.route, sha256: artifact.sha256, dependencies: artifact.page.dependencyIds })),
}, null, 2)}\n`);
writeFileSync(join(outputRoot, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: geolocation=(), camera=(), microphone=()\n\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n\n/*.f32\n  Cache-Control: public, max-age=31536000, immutable\n");
console.log(JSON.stringify({ pageCount, buildHash: compiled.buildHash, outputRoot }, null, 2));
