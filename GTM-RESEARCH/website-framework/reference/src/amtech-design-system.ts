import { DESIGN_CAPABILITIES, type DesignCapability } from "./benchmark.js";
import type { BrowserTargetReport } from "./browser-targets.js";
import { evaluateCssFeatureChecklist, type CssChecklistReport } from "./css-modern.js";
import { createReferenceDesignContract, type DesignSystemContract, type LayoutRole, type ModuleKind } from "./framework.js";

export type UiLayoutArchetype = "editorial" | "workflow-led" | "proof-led" | "comparison-led" | "utility-led";
export type UiDensity = "compact" | "balanced" | "deep";

export interface AmtechColorToken {
  name: "ink" | "white" | "canvas" | "red" | "blue" | "cyan" | "green";
  hex: string;
  oklch: string;
  role: string;
}

export interface AmtechThreePolicy {
  enabled: true;
  canonicalContentInsideScene: false;
  requiresStaticPoster: true;
  requiresUserActivation: true;
  frameloop: "demand";
  maxScenesPerPage: 1;
  maxDpr: number;
  mobileMaxDpr: number;
  maxDrawCalls: number;
  desktopTriangleBudget: number;
  mobileTriangleBudget: number;
  allowPostprocessingByDefault: false;
  wasmPolicy: "benchmark-only";
}

export interface AgenticUiStandard {
  id: string;
  browser: BrowserTargetReport;
  designContract: DesignSystemContract;
  colors: AmtechColorToken[];
  forbiddenColorWords: string[];
  cssChecklist: CssChecklistReport;
  archetypes: Record<UiLayoutArchetype, { description: string; preferredRoles: LayoutRole[] }>;
  densities: Record<UiDensity, { maxMeasureCh: number; sectionGapRem: number; cardGapRem: number }>;
  performance: {
    canonicalJavascriptBytes: 0;
    maxCriticalCssBytes: number;
    maxInlineStyleBytes: 0;
    targetLcpMs: number;
    targetInpMs: number;
    targetCls: number;
  };
  three: AmtechThreePolicy;
}

export function createAmtechUiStandard(browser: BrowserTargetReport): AgenticUiStandard {
  const designContract = createAmtechDesignContract();
  const cssChecklist = evaluateCssFeatureChecklist(browser, {
    prohibitedFeatureIds: ["light-dark", "masonry", "css-if", "css-function"],
    forceGuardFeatureIds: ["relative-color", "scroll-driven-animation", "anchor-positioning", "scope", "field-sizing", "margin-trim", "popover-open"],
  });
  return {
    id: `amtech-agentic-ui-v1-${browser.reportId}`,
    browser,
    designContract,
    colors: [
      { name: "ink", hex: "#111111", oklch: "oklch(0.178 0 0)", role: "Primary text and high-contrast structure" },
      { name: "white", hex: "#FFFFFF", oklch: "oklch(1 0 0)", role: "Base surface" },
      { name: "canvas", hex: "#F7F9FC", oklch: "oklch(0.982 0.005 255)", role: "Page canvas and quiet container" },
      { name: "red", hex: "#E11D2A", oklch: "oklch(0.586 0.225 24.8)", role: "Brand and primary action" },
      { name: "blue", hex: "#2563EB", oklch: "oklch(0.546 0.215 262.9)", role: "Systems and information" },
      { name: "cyan", hex: "#DFF6FF", oklch: "oklch(0.955 0.035 222)", role: "Cool emphasis" },
      { name: "green", hex: "#168A57", oklch: "oklch(0.565 0.132 157)", role: "Verified and successful state" },
    ],
    forbiddenColorWords: ["orange", "gold", "beige", "purple-gradient", "rainbow", "dark-mode"],
    cssChecklist,
    archetypes: {
      editorial: { description: "Long-form explanation with calm proof interruptions.", preferredRoles: ["lead", "support", "proof", "conversion"] },
      "workflow-led": { description: "Request-to-result sequence with operational proof and an explicit next action.", preferredRoles: ["lead", "support", "proof", "decision", "conversion"] },
      "proof-led": { description: "Evidence, controls, limitations, and progressive technical disclosure lead the page.", preferredRoles: ["lead", "proof", "decision", "support", "conversion"] },
      "comparison-led": { description: "Decision criteria and trade-offs lead before workflow detail.", preferredRoles: ["lead", "decision", "proof", "support", "conversion"] },
      "utility-led": { description: "A calculator, diagram, or interactive utility leads while canonical text remains complete.", preferredRoles: ["lead", "decision", "proof", "support", "conversion"] },
    },
    densities: {
      compact: { maxMeasureCh: 62, sectionGapRem: 4, cardGapRem: 1 },
      balanced: { maxMeasureCh: 68, sectionGapRem: 5.5, cardGapRem: 1.25 },
      deep: { maxMeasureCh: 74, sectionGapRem: 7, cardGapRem: 1.5 },
    },
    performance: {
      canonicalJavascriptBytes: 0,
      maxCriticalCssBytes: 24_000,
      maxInlineStyleBytes: 0,
      targetLcpMs: 1_800,
      targetInpMs: 100,
      targetCls: 0.05,
    },
    three: {
      enabled: true,
      canonicalContentInsideScene: false,
      requiresStaticPoster: true,
      requiresUserActivation: true,
      frameloop: "demand",
      maxScenesPerPage: 1,
      maxDpr: 1.5,
      mobileMaxDpr: 1,
      maxDrawCalls: 40,
      desktopTriangleBudget: 80_000,
      mobileTriangleBudget: 20_000,
      allowPostprocessingByDefault: false,
      wasmPolicy: "benchmark-only",
    },
  };
}

export function createAmtechDesignContract(): DesignSystemContract {
  const base = createReferenceDesignContract();
  const componentRoles: Record<ModuleKind, LayoutRole[]> = {
    hero: ["lead"],
    answer: ["lead", "support"],
    workflow: ["support", "proof"],
    proof: ["proof", "decision"],
    comparison: ["decision"],
    faq: ["support"],
    cta: ["conversion"],
    instruction: ["support"],
  };
  return {
    id: "amtech-clean-operational-v1.1",
    capabilities: [...DESIGN_CAPABILITIES],
    components: base.components.map((component) => ({
      ...component,
      supportedLayoutRoles: componentRoles[component.kind],
      capabilities: capabilitiesFor(component.kind),
    })),
    tokens: {
      spacingScale: [4, 8, 12, 16, 24, 32, 48, 64, 88, 112],
      typeScale: [12, 14, 16, 18, 22, 28, 40, 56, 72],
      radii: [0, 12, 16, 20, 24, 999],
      maxContentWidths: [680, 1120, 1440],
    },
  };
}

export function validateAmtechUiStandard(standard: AgenticUiStandard): string[] {
  const errors: string[] = [];
  if (standard.colors.length !== 7) errors.push("AMTECH palette must contain exactly seven canonical tokens");
  if (standard.colors.some((token) => !/^#[0-9A-F]{6}$/.test(token.hex))) errors.push("Every color requires an uppercase six-digit hex fallback");
  if (standard.colors.some((token) => !token.oklch.startsWith("oklch("))) errors.push("Every color requires an OKLCH value");
  if (standard.cssChecklist.total !== 57) errors.push("Modern CSS checklist must contain 57 decisions");
  if (standard.performance.canonicalJavascriptBytes !== 0) errors.push("Canonical page rendering must not require JavaScript");
  if (!standard.three.requiresStaticPoster || !standard.three.requiresUserActivation) errors.push("3D requires poster-first user-activated progressive enhancement");
  if (standard.three.frameloop !== "demand") errors.push("3D scenes must use demand rendering");
  if (standard.three.maxScenesPerPage !== 1) errors.push("Only one WebGL scene is permitted per page");
  if (standard.three.wasmPolicy !== "benchmark-only") errors.push("Wasm cannot be mandatory for UI rendering without measured benefit");
  return errors;
}

function capabilitiesFor(kind: ModuleKind): DesignCapability[] {
  const common: DesignCapability[] = ["semantic-hierarchy", "responsive-grid", "mobile-priority", "reduced-motion"];
  switch (kind) {
    case "hero": return common;
    case "answer": return [...common, "long-form-reading", "structured-data-visible"];
    case "workflow": return [...common, "workflow-steps"];
    case "proof": return [...common, "evidence-dense", "progressive-disclosure", "structured-data-visible"];
    case "comparison": return [...common, "comparison-table"];
    case "faq": return [...common, "progressive-disclosure", "long-form-reading"];
    case "cta": return [...common, "conversion-panel"];
    case "instruction": return [...common, "instruction-pointer"];
  }
}
