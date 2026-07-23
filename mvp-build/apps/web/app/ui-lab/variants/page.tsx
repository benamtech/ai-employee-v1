import Link from "next/link";
import { notFound } from "next/navigation";
import { uiFixtureMode } from "../../_lib/ui-fixtures";
import { FIXTURE_SCENARIOS } from "../../agent/[employeeId]/fixture-runtime";
import { UI_VARIANT_REGISTRY } from "../../_components/ui-variant/registry.generated";

export const metadata = { title: "UI Variant Gallery — AMTECH" };

export default function UiVariantGalleryPage() {
  if (!uiFixtureMode()) notFound();
  return (
    <main className="variant-gallery">
      <style>{CSS}</style>
      <header><p>Filesystem-first employee experiences</p><h1>UI Variant Gallery</h1><span>Capability-faithful to the AMTECH Web client, unconstrained by its appearance or layout.</span></header>
      <section>
        {Object.values(UI_VARIANT_REGISTRY).map(({ manifest }) => (
          <article key={manifest.id}>
            <small>{manifest.status} · {manifest.production.eligibility}</small>
            <h2>{manifest.name}</h2>
            <p>{manifest.summary}</p>
            <div>{manifest.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <nav>{FIXTURE_SCENARIOS.map((scenario) => <Link key={scenario.id} href={`/ui-lab/variant/${manifest.id}/${scenario.id}`}>{scenario.shortLabel}</Link>)}</nav>
          </article>
        ))}
      </section>
    </main>
  );
}

const CSS = `.variant-gallery{min-height:100dvh;padding:clamp(24px,6vw,80px);background:#0b0d12;color:#f5f7fb;font-family:ui-sans-serif,system-ui}.variant-gallery>header{max-width:980px;margin:0 auto 50px}.variant-gallery>header p{color:#ff5362;text-transform:uppercase;font-weight:850;letter-spacing:.12em;font-size:11px}.variant-gallery h1{font-size:clamp(48px,9vw,104px);line-height:.85;letter-spacing:-.065em;margin:12px 0 24px}.variant-gallery>header span{font-size:19px;line-height:1.6;color:#aeb5c3}.variant-gallery>section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:18px;max-width:1240px;margin:auto}.variant-gallery article{display:grid;align-content:start;gap:14px;min-height:340px;padding:24px;border:1px solid #2b303a;background:#131720}.variant-gallery article small{color:#7ef0b1;text-transform:uppercase;font-weight:850;letter-spacing:.1em}.variant-gallery h2{font-size:30px;margin:0}.variant-gallery article p{color:#aeb5c3;line-height:1.55}.variant-gallery article>div{display:flex;gap:6px;flex-wrap:wrap}.variant-gallery article>div span{padding:5px 8px;background:#232936;font-size:10px;text-transform:uppercase}.variant-gallery nav{display:flex;gap:7px;flex-wrap:wrap;margin-top:auto;padding-top:20px}.variant-gallery a{padding:8px 10px;background:#f5f7fb;color:#11141a;text-decoration:none;font-size:11px;font-weight:850}`;
