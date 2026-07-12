# Polish pass: mobile preview bottom sheet, real estimate document, front-door SMS demo

Date: 2026-07-12 03:00

Status: source-wired

Scope: One improvement pass over the restyled UI, targeting the two gaps the handoff ranks highest (mobile review ergonomics, the estimate document as the sold deliverable) plus front-door persuasion and small composition fixes.

## What changed

- **Mobile preview → bottom sheet** (`AgentClient.tsx`): on ≤760px the preview pane is hidden until work is selected, then renders as a fixed bottom sheet (66vh, 3px ink top rule, `env(safe-area-inset-bottom)` padding) with a mono `Close ✕` control (`PreviewPane` gained an `onClose`; desktop unchanged — the close button is CSS-hidden there). Open/close verified programmatically.
- **Estimate document** (`output/[artifactId]/route.ts` fixture branch): now a real contractor deliverable — Brightside Painting Co letterhead (red-period wordmark, mono sub), red ESTIMATE mark with No./date/validity, prepared-for/job columns, line items with a 3px ink total rule, an ASSUMPTIONS line, a red-flagged PLEASE CONFIRM row (the product's line-item/low-confidence-flag doctrine, visible), and a mono terms footer carrying approval provenance ("prepared by your AI employee, sent only after owner approval"). Variant headings moved into each branch (shell no longer duplicates an h1/intro).
- **Front-door SMS demo strip** (`page.tsx` new `.fd-demo` section): a four-line exchange — owner text → employee reply with a red `HELD FOR YOUR OK` tag → "yes send it" → mono receipt line — the entire product gesture shown, not described.
- **Details:** Daily Brief kicker now carries the date (`suppressHydrationWarning`); last stat cell no longer paints a trailing hairline; employee chat messages get a 3px ink voice bar (owner stays wash).
- **(addendum 03:50) Pixel icons on the front-door feature cells** (`page.tsx` `PixelIcon` + `PIXEL_ICONS`): hand-drawn 12×12 pixel maps rendered as crisp inline-SVG rects at 36px — phone with red unread block (TEXT IT), shield with red check (IT ASKS FIRST), receipt with red paid stamp + zigzag tear (PROOF AFTER). Ink + single red accent, `crispEdges`, no icon library. Admin fixture import also made static (dynamic `import("./fixtures")` chunks can 404 on long-running dev servers, hanging the dashboard). Typecheck/lint clean.

## Current status / verification

- `source-wired`, fixture-proven. Gates: typecheck 0 errors, lint 0 errors, unit 518/518, build pass, `ui:test` pass. Eyes-on screenshots: estimate document, mobile sheet open (approval card inside), front-door demo strip.

## Carry-forward / next

- The estimate-document design is now the concrete template for the Manager-side `artifact-view.ts` treatment (letterhead/total-rule/assumptions/flag/terms) — port when Manager-side work is authorized, alongside the MCP-UI `ui-resources.ts` port (design target from the 02:35 handoff).
- Consider the same bottom-sheet pattern for the tablet range (761–1100px) where the preview currently stacks below content.
