/**
 * Work Surface design tokens — the AMTECH layer.
 * Two text/background modes only: near-black ink on white, and white on AMTECH
 * red. Red accents white surfaces (labels, active borders, alerts, key CTAs);
 * everything else is ink, hairlines, and the light-gray wash. Corners are
 * sharp, borders are 1px, spacing sits on a 3px grid, there are no shadows.
 * Inter carries display/body text; IBM Plex Mono carries operational labels.
 */
export const tokens = {
  color: {
    bg: "#ffffff",
    surface: "#ffffff",
    surfaceMuted: "#f4f4f4",
    border: "rgba(10,10,10,0.10)",
    borderStrong: "rgba(10,10,10,0.15)",
    text: "#0a0a0a",
    textMuted: "rgba(10,10,10,0.62)",
    textFaint: "rgba(10,10,10,0.62)",
    accent: "#e11d2a", // AMTECH red — the only accent hue
    accentSoft: "#f4f4f4",
    success: "#0a0a0a", // completion is stated in ink + glyph, not a new hue
    successSoft: "#f4f4f4",
    warning: "#e11d2a", // "needs you" is red
    warningSoft: "#ffffff",
    danger: "#e11d2a",
    dangerSoft: "rgba(225,29,42,0.30)",
  },
  space: { xs: 3, sm: 6, md: 12, lg: 18, xl: 24, xxl: 36 },
  radius: { sm: 0, md: 0, lg: 0, pill: 0 },
  font: {
    family: "var(--font-inter), Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    mono: "var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    h1: 24,
    h2: 18,
    h3: 15,
    body: 15,
    small: 12,
    tiny: 9,
  },
  shadow: {
    card: "none",
    lift: "none",
  },
} as const;

/** Move-type accents (notify = calm, question = needs you, review = decision). */
export const moveStyle = {
  notify: { label: "Heads up", color: tokens.color.textMuted, soft: tokens.color.surfaceMuted, bar: tokens.color.borderStrong },
  question: { label: "Needs you", color: tokens.color.accent, soft: "#ffffff", bar: tokens.color.accent },
  review: { label: "Your call", color: tokens.color.text, soft: tokens.color.surfaceMuted, bar: tokens.color.text },
} as const;
