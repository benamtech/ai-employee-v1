import { sha256 } from "./core.js";
import type { CompiledFrameworkManifest } from "./manifest.js";
import type { PageIR, SemanticModuleIR } from "./framework.js";
import type { AgenticUiSitePlan, UiPageMetaprogram } from "./ui-metaprogramming.js";

export interface RenderedUiPage {
  pageId: string;
  route: string;
  html: string;
  htmlHash: string;
  threeContractJson: string | null;
}

export interface RenderedAgenticUiSite {
  standardId: string;
  planHash: string;
  css: string;
  cssHash: string;
  cssBytes: number;
  pages: RenderedUiPage[];
  siteHash: string;
}

export function renderAgenticUiSite(
  compiled: CompiledFrameworkManifest,
  plan: AgenticUiSitePlan,
): RenderedAgenticUiSite {
  const css = renderAmtechCss(plan);
  const cssBytes = new TextEncoder().encode(css).byteLength;
  if (cssBytes > plan.standard.performance.maxCriticalCssBytes) {
    throw new Error(`Critical CSS is ${cssBytes} bytes; budget is ${plan.standard.performance.maxCriticalCssBytes}`);
  }
  const pageById = new Map(compiled.site.pages.map((artifact) => [artifact.page.id, artifact.page]));
  const pages = plan.pages.map((pagePlan): RenderedUiPage => {
    const page = required(pageById, pagePlan.pageId, "compiled page");
    const html = renderPage(page, pagePlan, pageById, plan);
    const threeContractJson = pagePlan.threeScene ? stableJson(pagePlan.threeScene) : null;
    return { pageId: page.id, route: page.route, html, htmlHash: sha256(html), threeContractJson };
  });
  const cssHash = sha256(css);
  const siteHash = sha256(JSON.stringify({ planHash: plan.planHash, cssHash, pages: pages.map((page) => [page.pageId, page.htmlHash]) }));
  return { standardId: plan.standard.id, planHash: plan.planHash, css, cssHash, cssBytes, pages, siteHash };
}

export function renderAmtechCss(plan: AgenticUiSitePlan): string {
  const tier = plan.standard.browser.tier;
  return `@layer reset, tokens, base, layout, components, utilities;

@layer tokens {
  :root {
    color-scheme: only light;
    --amtech-ink: #111111;
    --amtech-white: #FFFFFF;
    --amtech-canvas: #F7F9FC;
    --amtech-red: #E11D2A;
    --amtech-blue: #2563EB;
    --amtech-cyan: #DFF6FF;
    --amtech-green: #168A57;
    --amtech-border: rgb(17 17 17 / 8%);
    --amtech-shadow: 0 18px 55px rgb(17 17 17 / 8%);
    --amtech-shadow-hover: 0 22px 62px rgb(17 17 17 / 11%);
    --amtech-radius-sm: 0.75rem;
    --amtech-radius-md: 1rem;
    --amtech-radius-lg: 1.5rem;
    --amtech-radius-pill: 999px;
    --amtech-space-1: 0.25rem;
    --amtech-space-2: 0.5rem;
    --amtech-space-3: 0.75rem;
    --amtech-space-4: 1rem;
    --amtech-space-6: 1.5rem;
    --amtech-space-8: 2rem;
    --amtech-space-12: 3rem;
    --amtech-space-16: 4rem;
    --amtech-space-24: 6rem;
    --amtech-content: 70rem;
    --amtech-measure: 68ch;
    --amtech-motion: 220ms;
    --amtech-ease: cubic-bezier(.2,.8,.2,1);
    --amtech-focus: 0 0 0 3px rgb(37 99 235 / 24%);
  }

  @supports (color: oklch(0.5 0.1 20)) {
    :root {
      --amtech-ink: oklch(0.178 0 0);
      --amtech-white: oklch(1 0 0);
      --amtech-canvas: oklch(0.982 0.005 255);
      --amtech-red: oklch(0.586 0.225 24.8);
      --amtech-blue: oklch(0.546 0.215 262.9);
      --amtech-cyan: oklch(0.955 0.035 222);
      --amtech-green: oklch(0.565 0.132 157);
      --amtech-border: color-mix(in oklch, var(--amtech-ink) 8%, transparent);
    }
  }
}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; scroll-padding-block-start: 5rem; background: var(--amtech-canvas); }
  body { margin: 0; min-inline-size: 20rem; }
  img, svg, video, canvas { display: block; max-inline-size: 100%; }
  button, input, textarea, select { font: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }
  h1, h2, h3, p, figure, blockquote, dl, dd { margin: 0; }
  ul, ol { margin-block: 0; }
}

@layer base {
  body {
    background:
      radial-gradient(circle at 12% 4%, rgb(223 246 255 / 76%), transparent 28rem),
      radial-gradient(circle at 88% 8%, rgb(225 29 42 / 6%), transparent 25rem),
      var(--amtech-canvas);
    color: var(--amtech-ink);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 1rem;
    line-height: 1.6;
    text-rendering: optimizeLegibility;
  }

  :where(h1, h2, h3) { line-height: 1.08; letter-spacing: -0.035em; text-wrap: balance; }
  h1 { max-inline-size: 18ch; font-size: clamp(2.55rem, 7vw, 5.75rem); font-weight: 780; }
  h2 { max-inline-size: 24ch; font-size: clamp(1.8rem, 4vw, 3.25rem); font-weight: 740; }
  h3 { font-size: clamp(1.1rem, 2vw, 1.35rem); font-weight: 720; letter-spacing: -0.015em; }
  p { max-inline-size: var(--amtech-measure); text-wrap: pretty; }
  a { color: inherit; text-underline-offset: 0.2em; }
  a:focus-visible, button:focus-visible, summary:focus-visible { outline: 0; box-shadow: var(--amtech-focus); }
  ::selection { background: rgb(223 246 255 / 90%); color: var(--amtech-ink); }
}

@layer layout {
  .amtech-site { min-block-size: 100dvh; }
  .amtech-shell { inline-size: min(100% - clamp(1.25rem, 5vw, 5rem), var(--amtech-content)); margin-inline: auto; }
  .amtech-main { padding-block: clamp(2rem, 6vw, 5rem) clamp(5rem, 10vw, 9rem); }
  .amtech-section {
    container-type: inline-size;
    container-name: amtech-section;
    padding-block: clamp(3.5rem, 8vw, 7rem);
    content-visibility: auto;
    contain-intrinsic-size: auto 46rem;
  }
  .amtech-section + .amtech-section { border-block-start: 1px solid var(--amtech-border); }
  .amtech-grid { display: grid; gap: clamp(1rem, 2.5cqi, 1.5rem); }
  .amtech-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .amtech-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .amtech-stack { display: grid; gap: clamp(1rem, 2.5cqi, 1.75rem); }
  .amtech-cluster { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
  .amtech-reading { max-inline-size: var(--amtech-measure); }

  @container amtech-section (inline-size < 48rem) {
    .amtech-grid--two, .amtech-grid--three { grid-template-columns: 1fr; }
  }
}

@layer components {
  .amtech-nav {
    position: sticky;
    inset-block-start: 0;
    z-index: 20;
    border-block-end: 1px solid var(--amtech-border);
    background: rgb(255 255 255 / 86%);
  }
  @supports (backdrop-filter: blur(1rem)) {
    .amtech-nav { background: rgb(255 255 255 / 74%); backdrop-filter: blur(1.5rem) saturate(1.15); }
  }
  .amtech-nav__inner { display: flex; align-items: center; justify-content: space-between; min-block-size: 4.5rem; }
  .amtech-brand { font-weight: 820; letter-spacing: -0.04em; text-decoration: none; }
  .amtech-brand::after { content: "."; color: var(--amtech-red); }

  .amtech-hero { padding-block: clamp(4rem, 11vw, 9rem); }
  .amtech-hero__grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(18rem, .75fr); gap: clamp(2rem, 7vw, 6rem); align-items: center; }
  .amtech-eyebrow { color: var(--amtech-red); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .75rem; font-weight: 760; letter-spacing: .13em; text-transform: uppercase; }
  .amtech-lede { margin-block-start: 1.5rem; max-inline-size: 58ch; font-size: clamp(1.08rem, 2vw, 1.35rem); color: rgb(17 17 17 / 72%); }
  .amtech-coordinate { align-self: stretch; padding: clamp(1.25rem, 3cqi, 2rem); border: 1px solid var(--amtech-border); border-radius: var(--amtech-radius-lg); background: rgb(255 255 255 / 78%); box-shadow: var(--amtech-shadow); }
  .amtech-coordinate dl { display: grid; gap: .8rem; }
  .amtech-coordinate div { display: grid; grid-template-columns: minmax(6rem, .65fr) 1.35fr; gap: 1rem; align-items: baseline; }
  .amtech-coordinate dt { color: rgb(17 17 17 / 52%); font-size: .75rem; font-weight: 720; letter-spacing: .08em; text-transform: uppercase; }
  .amtech-coordinate dd { font-size: .94rem; font-weight: 620; }

  .amtech-card { border: 1px solid var(--amtech-border); border-radius: var(--amtech-radius-lg); background: rgb(255 255 255 / 84%); box-shadow: var(--amtech-shadow); padding: clamp(1.25rem, 3.5cqi, 2rem); }
  .amtech-card[data-tone="proof"] { border-block-start: .25rem solid var(--amtech-blue); }
  .amtech-card[data-tone="success"] { border-block-start: .25rem solid var(--amtech-green); }
  .amtech-card[data-tone="action"] { border-block-start: .25rem solid var(--amtech-red); }
  .amtech-card__meta { margin-block-end: .75rem; color: rgb(17 17 17 / 52%); font-size: .78rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .amtech-card__body { display: grid; gap: .9rem; margin-block-start: 1rem; }

  .amtech-workflow { counter-reset: amtech-step; list-style: none; padding: 0; }
  .amtech-workflow > li { counter-increment: amtech-step; display: grid; grid-template-columns: 2.75rem 1fr; gap: 1rem; padding-block: 1.25rem; border-block-end: 1px solid var(--amtech-border); }
  .amtech-workflow > li::before { content: counter(amtech-step, decimal-leading-zero); display: grid; place-items: center; inline-size: 2.5rem; block-size: 2.5rem; border-radius: 50%; background: var(--amtech-cyan); color: var(--amtech-blue); font-weight: 780; }

  .amtech-table-wrap { overflow-x: auto; overscroll-behavior-inline: contain; border: 1px solid var(--amtech-border); border-radius: var(--amtech-radius-lg); background: var(--amtech-white); }
  .amtech-table { inline-size: 100%; min-inline-size: 42rem; border-collapse: collapse; }
  .amtech-table th, .amtech-table td { padding: 1rem 1.1rem; border-block-end: 1px solid var(--amtech-border); text-align: start; vertical-align: top; }
  .amtech-table th { background: var(--amtech-canvas); font-size: .78rem; letter-spacing: .07em; text-transform: uppercase; }

  .amtech-faq { display: grid; gap: .75rem; }
  .amtech-faq details { border: 1px solid var(--amtech-border); border-radius: var(--amtech-radius-md); background: var(--amtech-white); padding: 1rem 1.15rem; }
  .amtech-faq summary { cursor: pointer; font-weight: 720; }
  .amtech-faq details[open] summary { margin-block-end: .75rem; }

  .amtech-cta { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2rem; align-items: center; border-radius: var(--amtech-radius-lg); padding: clamp(1.5rem, 5vw, 3.25rem); background: linear-gradient(135deg, var(--amtech-white), var(--amtech-cyan)); border: 1px solid rgb(37 99 235 / 14%); box-shadow: var(--amtech-shadow); }
  .amtech-button { display: inline-flex; min-block-size: 3rem; align-items: center; justify-content: center; padding-inline: 1.25rem; border: 1px solid transparent; border-radius: var(--amtech-radius-pill); background: var(--amtech-red); color: var(--amtech-white); font-weight: 760; text-decoration: none; transition: transform var(--amtech-motion) var(--amtech-ease), box-shadow var(--amtech-motion) var(--amtech-ease); }

  .amtech-instruction { border-inline-start: .25rem solid var(--amtech-blue); padding: 1rem 1.25rem; background: rgb(223 246 255 / 48%); }
  .amtech-related ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: 1rem; list-style: none; padding: 0; }
  .amtech-related a { display: block; block-size: 100%; padding: 1.25rem; border: 1px solid var(--amtech-border); border-radius: var(--amtech-radius-md); background: var(--amtech-white); font-weight: 700; text-decoration: none; }

  .amtech-scene { container-type: inline-size; border: 1px solid var(--amtech-border); border-radius: var(--amtech-radius-lg); overflow: clip; background: var(--amtech-canvas); box-shadow: var(--amtech-shadow); }
  .amtech-scene__poster { aspect-ratio: 16 / 9; inline-size: 100%; object-fit: cover; }
  .amtech-scene figcaption { padding: 1rem 1.25rem; border-block-start: 1px solid var(--amtech-border); color: rgb(17 17 17 / 68%); font-size: .9rem; }
  .amtech-scene__activate { margin: 0 1.25rem 1.25rem; }

  @container amtech-section (inline-size < 52rem) {
    .amtech-hero__grid, .amtech-cta { grid-template-columns: 1fr; }
    .amtech-coordinate { order: 2; }
  }

  @media (hover: hover) {
    .amtech-card, .amtech-related a { transition: transform var(--amtech-motion) var(--amtech-ease), box-shadow var(--amtech-motion) var(--amtech-ease), border-color var(--amtech-motion) var(--amtech-ease); }
    .amtech-card:hover, .amtech-related a:hover { transform: translateY(-2px); border-color: rgb(37 99 235 / 22%); box-shadow: var(--amtech-shadow-hover); }
    .amtech-button:hover { transform: translateY(-1px); box-shadow: 0 .75rem 2rem rgb(225 29 42 / 20%); }
  }

  @media (pointer: coarse) {
    .amtech-button, .amtech-faq summary { min-block-size: 3.25rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  }

  @media (prefers-contrast: more) {
    :root { --amtech-border: rgb(17 17 17 / 26%); }
    .amtech-card, .amtech-coordinate, .amtech-table-wrap, .amtech-scene { box-shadow: none; }
  }

  @media (scripting: none) {
    .amtech-scene__activate { display: none; }
  }
}

@layer utilities {
  .amtech-visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
}

/* Browser feature tier: ${tier}. No dark-mode branch is emitted. */
`;
}

function renderPage(
  page: PageIR,
  pagePlan: UiPageMetaprogram,
  pageById: ReadonlyMap<string, PageIR>,
  plan: AgenticUiSitePlan,
): string {
  const robots = page.indexable ? "index,follow" : "noindex,nofollow";
  const pointer = page.instructionPointers[0]
    ? `<link rel="alternate" type="text/markdown" href="${escapeHtml(page.instructionPointers[0])}">`
    : "";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: page.canonicalUrl,
    mainEntity: { "@type": "Question", name: page.canonicalQuestion },
  }).replaceAll("<", "\\u003c");
  const modules = page.modules.map((module) => renderModule(module, pagePlan)).join("\n");
  const related = renderRelated(page, pageById);
  const coordinate = renderCoordinate(pagePlan.matrixCoordinate);
  const scene = pagePlan.threeScene ? renderScene(pagePlan) : "";
  return [
    "<!doctype html>",
    `<html lang="en" data-ui-standard="${escapeHtml(plan.standard.id)}" data-css-tier="${plan.standard.browser.tier}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(page.canonicalUrl)}">`,
    '<link rel="stylesheet" href="/assets/amtech-ui.css">',
    pointer,
    `<script type="application/ld+json">${schema}</script>`,
    "</head>",
    `<body data-page-id="${escapeHtml(page.id)}" data-page-plan="${escapeHtml(pagePlan.planHash)}">`,
    '<div class="amtech-site">',
    '<nav class="amtech-nav" aria-label="Primary"><div class="amtech-shell amtech-nav__inner"><a class="amtech-brand" href="/">AMTECH</a><a class="amtech-button" href="/create-ai-employee">Start free</a></div></nav>',
    '<main class="amtech-main">',
    '<header class="amtech-shell amtech-hero">',
    '<div class="amtech-hero__grid">',
    '<div class="amtech-stack">',
    '<p class="amtech-eyebrow">AI Employee · compiled for this operating context</p>',
    `<h1>${escapeHtml(page.canonicalQuestion)}</h1>`,
    `<p class="amtech-lede">${escapeHtml(page.description)}</p>`,
    '<div class="amtech-cluster"><a class="amtech-button" href="/create-ai-employee">Build my AI Employee</a></div>',
    '</div>',
    coordinate,
    '</div>',
    '</header>',
    scene,
    modules,
    related,
    "</main>",
    "</div>",
    "</body>",
    "</html>",
    "",
  ].filter(Boolean).join("\n");
}

function renderModule(module: SemanticModuleIR, pagePlan: UiPageMetaprogram): string {
  const component = pagePlan.components.find((candidate) => candidate.moduleId === module.id);
  const heading = module.heading ? `<h2>${escapeHtml(module.heading)}</h2>` : "";
  const paragraphs = module.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const objects = module.informationObjects;
  const content = (() => {
    switch (module.kind) {
      case "workflow":
        return `<ol class="amtech-workflow">${workflowItems(module).map((item) => `<li><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div></li>`).join("")}</ol>`;
      case "proof":
        return `<div class="amtech-grid amtech-grid--two">${cardItems(module).map((item) => renderCard(item.title, item.body, "proof")).join("")}</div>`;
      case "comparison":
        return renderComparison(module);
      case "faq":
        return `<div class="amtech-faq">${faqItems(module).map((item) => `<details><summary>${escapeHtml(item.title)}</summary><p>${escapeHtml(item.body)}</p></details>`).join("")}</div>`;
      case "cta":
        return `<div class="amtech-cta"><div class="amtech-stack">${heading}${paragraphs}</div><a class="amtech-button" href="/create-ai-employee">Start free</a></div>`;
      case "instruction":
        return `<aside class="amtech-instruction">${heading}${paragraphs}</aside>`;
      default:
        return `${heading}<div class="amtech-card__body">${paragraphs}${objects.map((item) => renderCard(item.title, item.body, item.kind === "field-note" ? "success" : "proof")).join("")}</div>`;
    }
  })();
  if (module.kind === "cta") return `<section class="amtech-shell amtech-section" data-module-kind="cta" data-layout-role="conversion">${content}</section>`;
  const tone = module.layoutRole === "proof" ? "proof" : module.layoutRole === "conversion" ? "action" : "neutral";
  return `<section class="amtech-shell amtech-section" data-module-id="${escapeHtml(module.id)}" data-module-kind="${module.kind}" data-layout-role="${module.layoutRole}" data-component-variant="${escapeHtml(component?.variant ?? "default")}"><div class="amtech-stack">${module.kind === "instruction" ? content : `${heading}<div class="amtech-card" data-tone="${tone}">${content.replace(heading, "")}</div>`}</div></section>`;
}

function renderCoordinate(coordinate: Record<string, string[]>): string {
  const items = Object.entries(coordinate).sort(([a], [b]) => a.localeCompare(b)).map(([dimension, values]) => `<div><dt>${escapeHtml(humanize(dimension))}</dt><dd>${values.map(humanize).map(escapeHtml).join(", ")}</dd></div>`).join("");
  return `<aside class="amtech-coordinate" aria-label="Page matrix coordinate"><p class="amtech-card__meta">Page coordinate</p><dl>${items}</dl></aside>`;
}

function renderScene(pagePlan: UiPageMetaprogram): string {
  const scene = pagePlan.threeScene;
  if (!scene) return "";
  const encodedSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene.posterSvg)}`;
  return `<section class="amtech-shell amtech-section" aria-labelledby="scene-${safeName(scene.id)}"><figure class="amtech-scene" data-three-contract="${escapeHtml(scene.id)}" data-three-contract-hash="${escapeHtml(scene.contractHash)}"><img class="amtech-scene__poster" src="${encodedSvg}" alt="${escapeHtml(scene.label)}" width="800" height="440" decoding="async"><figcaption id="scene-${safeName(scene.id)}">${escapeHtml(scene.description)}</figcaption><button class="amtech-button amtech-scene__activate" type="button" data-three-activate="${escapeHtml(scene.id)}">Explore the topology</button></figure></section>`;
}

function renderRelated(page: PageIR, pageById: ReadonlyMap<string, PageIR>): string {
  if (page.internalPageIds.length === 0) return "";
  const links = page.internalPageIds.map((id) => {
    const target = required(pageById, id, "related page");
    return `<li><a href="${escapeHtml(target.route)}">${escapeHtml(target.canonicalQuestion)}</a></li>`;
  }).join("");
  return `<nav class="amtech-shell amtech-section amtech-related" aria-label="Related pages"><div class="amtech-stack"><h2>Related operating questions</h2><ul>${links}</ul></div></nav>`;
}

function renderComparison(module: SemanticModuleIR): string {
  const items = cardItems(module);
  const rows = items.map((item, index) => `<tr><th scope="row">${escapeHtml(item.title)}</th><td>${escapeHtml(item.body)}</td><td>${index === 0 ? "Primary fit" : "Supporting consideration"}</td></tr>`).join("");
  return `<div class="amtech-table-wrap"><table class="amtech-table"><thead><tr><th>Decision dimension</th><th>Operational meaning</th><th>Role</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderCard(title: string, body: string, tone: "proof" | "success" | "action" | "neutral"): string {
  return `<article class="amtech-card" data-tone="${tone}"><h3>${escapeHtml(title)}</h3><div class="amtech-card__body"><p>${escapeHtml(body)}</p></div></article>`;
}

function workflowItems(module: SemanticModuleIR): { title: string; body: string }[] {
  const objects = cardItems(module);
  if (objects.length > 0) return objects;
  return module.paragraphs.map((body, index) => ({ title: `Step ${index + 1}`, body }));
}

function faqItems(module: SemanticModuleIR): { title: string; body: string }[] {
  const items = cardItems(module);
  if (items.length > 0) return items;
  return module.paragraphs.map((body, index) => ({ title: index === 0 ? "What is proven today?" : `Question ${index + 1}`, body }));
}

function cardItems(module: SemanticModuleIR): { title: string; body: string }[] {
  const objects = module.informationObjects.map((item) => ({ title: item.title, body: item.body }));
  if (objects.length > 0) return objects;
  return module.paragraphs.map((body, index) => ({ title: module.heading ?? `Detail ${index + 1}`, body }));
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function required<K, V>(map: ReadonlyMap<K, V>, key: K, context: string): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Missing ${context}: ${String(key)}`);
  return value;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
