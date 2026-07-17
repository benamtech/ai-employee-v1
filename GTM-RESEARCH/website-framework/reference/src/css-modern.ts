import type { BrowserTargetReport, BrowserTier } from "./browser-targets.js";

export type CssFeatureCategory =
  | "color-theming"
  | "layout-sizing"
  | "selectors-logic"
  | "animation"
  | "typography"
  | "positioning"
  | "visual-effects"
  | "component-patterns"
  | "architecture"
  | "experimental";

export type CssFeatureDisposition = "native" | "guarded" | "skipped" | "prohibited";

export interface CssFeatureRule {
  id: string;
  category: CssFeatureCategory;
  label: string;
  nativeThroughTier: BrowserTier;
  experimental?: boolean;
}

export interface CssFeatureDecision extends CssFeatureRule {
  disposition: CssFeatureDisposition;
  reason: string;
}

export interface CssFeaturePolicy {
  prohibitedFeatureIds?: readonly string[];
  forceGuardFeatureIds?: readonly string[];
}

export interface CssChecklistReport {
  browserReportId: string;
  tier: BrowserTier;
  total: number;
  nativeCount: number;
  guardedCount: number;
  skippedCount: number;
  prohibitedCount: number;
  decisions: CssFeatureDecision[];
}

export const CSS_MODERN_FEATURES: readonly CssFeatureRule[] = [
  rule("custom-properties", "color-theming", "CSS custom properties", 4),
  rule("oklch", "color-theming", "OKLCH colors", 2),
  rule("color-mix", "color-theming", "color-mix()", 2),
  rule("relative-color", "color-theming", "Relative color syntax", 1),
  rule("light-dark", "color-theming", "light-dark()", 1),
  rule("accent-color", "color-theming", "accent-color", 2),

  rule("clamp", "layout-sizing", "clamp()", 2),
  rule("min-max", "layout-sizing", "min() and max()", 2),
  rule("css-math-functions", "layout-sizing", "round(), mod(), abs(), sign()", 1),
  rule("dynamic-viewport", "layout-sizing", "svh, dvh, and lvh", 2),
  rule("container-queries", "layout-sizing", "Container queries", 2),
  rule("subgrid", "layout-sizing", "Subgrid", 2),
  rule("aspect-ratio", "layout-sizing", "aspect-ratio", 2),
  rule("field-sizing", "layout-sizing", "field-sizing: content", 1),
  rule("margin-trim", "layout-sizing", "margin-trim", 1),

  rule("has-selector", "selectors-logic", ":has()", 2),
  rule("is-where", "selectors-logic", ":is() and :where()", 2),
  rule("cascade-layers", "selectors-logic", "@layer", 2),
  rule("scope", "selectors-logic", "@scope", 1),
  rule("css-nesting", "selectors-logic", "CSS nesting", 2),

  rule("scroll-driven-animation", "animation", "Scroll-driven animation", 1),
  rule("starting-style", "animation", "@starting-style", 2),
  rule("transition-behavior", "animation", "transition-behavior: allow-discrete", 2),
  rule("view-transitions", "animation", "View transitions", 2),
  rule("offset-path", "animation", "offset-path", 2),
  rule("interpolate-size", "animation", "interpolate-size: allow-keywords", 0, true),
  rule("reduced-motion", "animation", "prefers-reduced-motion", 4),

  rule("text-wrap-balance", "typography", "text-wrap: balance", 2),
  rule("text-wrap-pretty", "typography", "text-wrap: pretty", 1),
  rule("font-relative-units", "typography", "cap, lh, and rex units", 2),
  rule("font-size-adjust", "typography", "@font-face size-adjust", 2),
  rule("marker", "typography", "::marker", 2),
  rule("css-counters", "typography", "CSS counters", 2),

  rule("inset", "positioning", "inset shorthand", 2),
  rule("logical-properties", "positioning", "Logical properties", 2),
  rule("scroll-offset", "positioning", "scroll-margin and scroll-padding", 2),
  rule("anchor-positioning", "positioning", "Anchor positioning", 1),

  rule("backdrop-filter", "visual-effects", "backdrop-filter", 2),
  rule("blend-isolation", "visual-effects", "mix-blend-mode and isolation", 2),
  rule("clip-path", "visual-effects", "clip-path", 2),
  rule("gradient-borders", "visual-effects", "Gradient border techniques", 2),

  rule("safe-area", "component-patterns", "Safe-area environment variables", 2),
  rule("standard-scrollbars", "component-patterns", "scrollbar-color and scrollbar-width", 2),
  rule("overscroll-behavior", "component-patterns", "overscroll-behavior", 2),
  rule("smooth-scroll", "component-patterns", "scroll-behavior with motion guard", 2),
  rule("scroll-snap", "component-patterns", "scroll snap", 2),
  rule("hover-capability", "component-patterns", "hover capability media query", 2),
  rule("coarse-pointer", "component-patterns", "coarse pointer media query", 2),
  rule("scripting-none", "component-patterns", "scripting: none media query", 1),
  rule("prefers-contrast", "component-patterns", "prefers-contrast", 2),

  rule("typed-property", "architecture", "@property", 2),
  rule("content-visibility", "architecture", "content-visibility: auto", 2),
  rule("dialog-backdrop", "architecture", "::backdrop", 2),
  rule("popover-open", "architecture", ":popover-open", 1),

  rule("masonry", "experimental", "Native masonry", 0, true),
  rule("css-if", "experimental", "CSS if()", 0, true),
  rule("css-function", "experimental", "CSS @function", 0, true),
] as const;

if (CSS_MODERN_FEATURES.length !== 57) {
  throw new Error(`CSS feature checklist must contain exactly 57 items; found ${CSS_MODERN_FEATURES.length}`);
}

export function evaluateCssFeatureChecklist(
  browser: BrowserTargetReport,
  policy: CssFeaturePolicy = {},
): CssChecklistReport {
  const prohibited = new Set(policy.prohibitedFeatureIds ?? []);
  const forceGuard = new Set(policy.forceGuardFeatureIds ?? []);
  const decisions = CSS_MODERN_FEATURES.map((feature): CssFeatureDecision => {
    if (prohibited.has(feature.id)) {
      return { ...feature, disposition: "prohibited", reason: "Prohibited by the active design-system policy." };
    }
    if (forceGuard.has(feature.id)) {
      return { ...feature, disposition: "guarded", reason: "The design system requires an explicit @supports fallback." };
    }
    if (feature.experimental) {
      return browser.tier === 0
        ? { ...feature, disposition: "guarded", reason: "Experimental feature allowed only behind @supports." }
        : { ...feature, disposition: "skipped", reason: "Experimental feature is outside the active browser tier." };
    }
    if (browser.tier <= feature.nativeThroughTier) {
      return { ...feature, disposition: "native", reason: `Native for Tier ${browser.tier} targets.` };
    }
    if (browser.tier === feature.nativeThroughTier + 1) {
      return { ...feature, disposition: "guarded", reason: `Progressive enhancement for Tier ${browser.tier}.` };
    }
    return { ...feature, disposition: "skipped", reason: `Not safe enough for Tier ${browser.tier}.` };
  });
  return {
    browserReportId: browser.reportId,
    tier: browser.tier,
    total: decisions.length,
    nativeCount: decisions.filter((item) => item.disposition === "native").length,
    guardedCount: decisions.filter((item) => item.disposition === "guarded").length,
    skippedCount: decisions.filter((item) => item.disposition === "skipped").length,
    prohibitedCount: decisions.filter((item) => item.disposition === "prohibited").length,
    decisions,
  };
}

export function assertCssChecklist(report: CssChecklistReport): void {
  if (report.total !== 57) throw new Error("CSS checklist cardinality changed");
  if (report.decisions.some((decision) => !decision.reason.trim())) throw new Error("Every CSS feature decision requires a reason");
}

function rule(
  id: string,
  category: CssFeatureCategory,
  label: string,
  nativeThroughTier: BrowserTier,
  experimental = false,
): CssFeatureRule {
  return { id, category, label, nativeThroughTier, ...(experimental ? { experimental: true } : {}) };
}
