/**
 * Work Surface compatibility tokens. The current adaptive owner surface uses the
 * canonical AMTECH globals; these values remain for legacy descriptor cards.
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
    accent: "#e11d2a",
    accentSoft: "#f4f4f4",
    success: "#0a0a0a",
    successSoft: "#f4f4f4",
    warning: "#e11d2a",
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

/**
 * Presentation grammar only. `observe` is quiet ambient state, `notify` is a
 * deliberate heads-up, and question/review are owner-attention moves.
 */
export const moveStyle = {
  observe: { label: "Observed", color: tokens.color.textMuted, soft: tokens.color.surfaceMuted, bar: tokens.color.border },
  notify: { label: "Heads up", color: tokens.color.textMuted, soft: tokens.color.surfaceMuted, bar: tokens.color.borderStrong },
  question: { label: "Needs you", color: tokens.color.accent, soft: "#ffffff", bar: tokens.color.accent },
  review: { label: "Your call", color: tokens.color.text, soft: tokens.color.surfaceMuted, bar: tokens.color.text },
} as const;
