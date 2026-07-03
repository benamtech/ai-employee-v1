/**
 * Work Surface design tokens (wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md).
 * A small, dependency-free token set so the surface reads like a calm coworker tool a
 * non-technical owner trusts — not a developer dashboard. Plain objects, no CSS framework.
 */
export const tokens = {
  color: {
    bg: "#f7f6f3", // warm paper, not stark white
    surface: "#ffffff",
    surfaceMuted: "#faf9f6",
    border: "#e6e3dc",
    borderStrong: "#d4d0c6",
    text: "#23211c",
    textMuted: "#6b6760",
    textFaint: "#94908899",
    accent: "#1f6feb", // trust blue — links/primary
    accentSoft: "#eaf1fe",
    success: "#1a7f4b",
    successSoft: "#e7f4ec",
    warning: "#8a6d1f",
    warningSoft: "#fbf3df",
    danger: "#b42318",
    dangerSoft: "#fbeae8",
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 10, lg: 14, pill: 999 },
  font: {
    family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    h1: 24, h2: 18, h3: 15, body: 15, small: 13, tiny: 11,
  },
  shadow: {
    card: "0 1px 2px rgba(35,33,28,0.05), 0 1px 1px rgba(35,33,28,0.04)",
    lift: "0 4px 14px rgba(35,33,28,0.08)",
  },
} as const;

/** Move-type accents (notify = calm, question = needs you, review = decision). */
export const moveStyle = {
  notify: { label: "Heads up", color: tokens.color.textMuted, soft: tokens.color.surfaceMuted, bar: tokens.color.borderStrong },
  question: { label: "Needs you", color: tokens.color.warning, soft: tokens.color.warningSoft, bar: tokens.color.warning },
  review: { label: "Your call", color: tokens.color.accent, soft: tokens.color.accentSoft, bar: tokens.color.accent },
} as const;
