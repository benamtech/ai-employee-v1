# Release-Adjacent And Post-Release UI Roadmap

Status: active roadmap  
Purpose: organize UI-focused work around and after the first normal-employee release

## Sequence Rule

The canonical normal-employee production gate comes first. The first provider-backed generative work
object is the immediate release-adjacent UX acceptance slice after that gate. Broader manipulation,
mobile, public, and visual-system expansion follows proven work and proof paths.

## Track 1: Trust And Proof

- Proof search and filters by customer, job, action, date, and connected account.
- Proof detail pages that show what Avery did, what the owner approved, and what external system confirmed.
- Better failure/repair states when connectors or provider calls fail.

## Track 2: Generative Work Objects

- Live provider-backed generated tables, forms, schedules, diffs, and media review surfaces.
- Stronger visual design for generated UI, aligned to the light Avery system.
- Owner-readable explanation of why each surface appeared and what action follows.
- Object-level action history and proof.

## Track 3: Direct Manipulation

- Attach customer inputs to jobs.
- Reorder estimate sections.
- Compare versions.
- Drag/drop documents or media into a work object.
- Convert a proof or customer reply into a follow-up task.

## Track 4: Mobile Job-Site Use

- Fast voice/text capture.
- Photo and document intake.
- Offline-tolerant drafts.
- One-handed approval/reply flows.

## Track 5: Public And Customer Surfaces

- Canonical public create/claim/login/account onboarding surfaces.
- Customer estimate portal.
- Public website work demonstrations and marketing materialization.
- Visitor-session isolation and deterministic HTML-to-PDF.

The public estimator is outdated and non-canonical. It may remain as a separated acquisition or
regression harness, but it is not a future flagship product surface and should not drive this roadmap.

## Track 6: Visual System And Accessibility

- Apply the Avery-first light system across public, admin, billing, portal, artifacts, and generated UI.
- Run contrast, keyboard, focus, reduced-motion, and screen-reader audits.
- Define icon, motion, layout, and typography rules that future agents can implement without guessing.
