# Experiments And Future Surfaces

Status: active design backlog

Purpose: separate what needs real design work **now, for the first paying trial**, from ideas that
are genuinely speculative and should not be prioritized yet. Despite this file's name, most of what's
in it is not "future" — read the note below before assuming anything here can wait.

**Important framing note:** artifact/document preview quality, photo/media previews, and the signed
mobile Review page are **not future work** — a real paying customer's first estimate/report/photo will
render through exactly these surfaces. If your job is UI/design, this is core, near-term scope, not a
backlog to defer. The genuinely-later/speculative material in this file is narrower: order-cart
actions, generated video, voice-call summaries, desktop clients, and similar not-yet-real product
lines. Each section below says explicitly which bucket it's in.

The most important surface right now is the web Work Surface, closely followed by the artifact/
document preview rendering and the signed mobile Review page — both of those are what a real customer
actually looks at during a trial. SMS, signed links, and future desktop/admin/customer views should be
designed as renderers of the same underlying work, not as separate apps.

## Priority Order

**Needed now, for the first paying trial:**

1. **Web client.** Make the employee desk understandable, polished, responsive, and useful with the data we already have.
2. **Artifact/document preview quality.** The estimate/report a customer sees renders through `renderArtifactHtml()`/`WorkResource.body_html` today as a clean but generic auto-formatted table — this is the actual deliverable being sold and deserves real design attention, not deferral. See "Media And Artifact Preview Ideas" below.
3. **Mobile Review page polish.** The signed-link path (`/agent/[employeeId]/review`, `ReviewClient.tsx`) exists and renders a real `WorkResource` with sticky actions, inline media/document preview, and receipts — this is what an owner opens straight from a text, so it needs to feel native and trustworthy on a phone now, not "eventually."
4. **SMS copy/action grammar.** SMS carries a grammar-aware summary plus the signed preview link (`work-events.ts`); it should summarize and route to preview/actions, not try to cram the whole app into text.

**Reasonable near-term, once the above is solid:**

5. **Admin console polish.** The Admin console (`/admin`, `AdminClient.tsx`) exists and consumes account/employee/readiness/support-action contracts — it needs visual/UX polish and an inline `WorkResource` preview, but it's operator-facing, not something a trial customer sees.

**Genuinely later — do not prioritize:**

6. **Thumbnail/poster/OG-image generation pipeline.** `WorkResource`'s `media`/`body_html`/`open_url` fields already unify document/media rendering; what's missing is auto-generating thumbnails/posters/screenshots for SMS link previews. Design for it (don't block on it), but it's not required for a trial customer to use the product.
7. **Order carts, generated video, voice-call summaries, desktop clients** — genuinely speculative product surfaces; see "Experimental Resource Types To Keep In Mind" below.

## Web Client Experiments To Explore Now

These are reasonable near-term UI explorations:

- Richer right preview rail:
  - tabs for Overview, Preview, Proof, Activity, Actions;
  - full-height artifact preview where possible;
  - sticky approval/action controls for risky work;
  - compact provenance without raw provider payloads.
- Better work timeline:
  - separate messages, progress, approvals, and receipts visually;
  - collapse low-value progress;
  - make "waiting for you" impossible to miss;
  - show completed proof quietly.
- Output library:
  - filter by type: document, invoice, message, image, video, report, generic;
  - status filters: draft, ready, needs review, sent, failed;
  - thumbnail/list/detail modes;
  - clear "open", "copy link", "download", "send/review" affordances.
- Task progress:
  - progress as business steps, not tool logs;
  - "checking price sheet", "drafting estimate", "waiting for owner", "sent";
  - active/in-progress state that does not require watching chat.
- Abilities/connected state:
  - ability cards grouped by work type: communicate, estimate, collect money, schedule, research, create media, manage files;
  - each state says ready, needs connection, needs info, degraded, or policy-gated;
  - setup/repair buttons where routes exist.
  - **Connected now renders generic `ConnectionSurface` cards** (Email/Payments/Accounting/Files/Calendar/Store/custom) before raw connector rows — design the connected-business card, not a per-provider (Gmail/Stripe/QBO) layout. A new connector should light up a generic card, not a bespoke branch. See `data-catalog.md` §4.5.
- Resurfacing ("come back to this"):
  - `Today`/`Daily Brief` attention now comes from `ResurfaceItem`s (approvals, questions, failures, due reminders, connector/runtime attention, high-priority envelopes), not provider-specific counts.
  - **Concrete near-term step:** give `resurface_items` a signed preview/action link so SMS can carry the same "come back to this" item as the web `Today` — the resurfacing analog of the existing signed Review path. This is the most likely next slice; design the SMS "later" nudge + its mobile landing against the `WorkResource` contract (§3), reusing the Review layout.
- Mobile web:
  - top/bottom segmented nav;
  - preview as full-screen drawer/page;
  - sticky approve/reject/reply controls;
  - SMS-link landing mode that hides full app chrome when appropriate.

## Signed SMS Preview Ideas

SMS should send short messages and links into scoped mobile previews. The link should open a resource/action page, not just a static artifact. **The mobile preview page and its signed-link backend are built** (`/agent/[employeeId]/review`, `ReviewClient.tsx`, `preview-links.ts`/`preview-render.ts`); it currently renders one generic `WorkResource` layout for every `resource_type` rather than a bespoke layout per type below. Whether these preview types below need their own visual treatment within that one page, versus staying one generic layout, is open design work — not a decision to relitigate the underlying contract.

Preview types to design:

- approval preview: exact payload, risk, recipient, amount, approve/reject/edit;
- artifact preview: document/image/video/report with proof and actions;
- task preview: status, current blocker, what the employee needs, reply/action form;
- connector preview: connected account status, reconnect/test/repair action;
- job preview: timeline of estimate, email, invoice, payment, reminder, customer replies;
- receipt preview: what happened, when, proof id, related job/output;
- failure preview: owner-safe error, retry/repair/reconnect path;
- generic work resource preview: schema/table/list/summary fallback.

SMS interaction ideas:

- numbered options for short decisions;
- natural-language fallback for "yes", "send", "edit this", "stop", "remind me tomorrow";
- short action tokens for approve/reject without a full login;
- expiring links with safe reissue;
- link unfurls that show title, amount/recipient/risk, and status;
- "send me preview" and "what are you doing?" commands;
- quiet receipts after completed actions.

Important: SMS is a compact renderer for the same work state. It should not become a separate estimate-only workflow.

## Media And Artifact Preview Ideas

Current artifacts are estimate-heavy and structured HTML/PDF oriented. The rendering primitives already
exist and are generic — `renderArtifactHtml()` (`artifact-view.ts`) turns any structured artifact
payload into owner-safe HTML with zero per-kind code, and `WorkResource.media`/`body_html` (rendered
today by `ReviewClient.tsx`) already carry image/video/document bodies. What's missing is not the
plumbing — it's real design applied to that plumbing, and it's needed now, not later.

**Build now — a first trial customer will actually see these:**

- **Documents.** The estimate/proposal itself is the single most important thing to make look good — it's
  the sold deliverable. Also: invoice PDFs, and eventually crew packets/contracts if those become real artifacts.
- **Images.** Contractors work with before/after job photos constantly — a clean before/after layout,
  a simple image comparison view, and a sane thumbnail/full-size pattern are near-term, real design work,
  not speculative.
- **Forms / questions.** Missing-info forms, connector repair forms, and scope-clarification prompts —
  these already happen via MCP-UI cards (`ui-resources.ts`) and need real visual treatment now.

**Later / speculative — do not prioritize:**

- Generated marketing image previews, short generated promo/walkthrough video, video transcripts.
- Website/landing-page/supplier-cart previews.
- Order carts and other external-system purchase actions.
- Datasets/reports (lead lists, AR aging, cashflow/pricing-drift reports) — plausible eventually, not asked for yet.

Fallback rule: if a special renderer does not exist, show a safe structured summary, sections/table/list where possible, proof refs, and a signed open/download link.

## Representing The Same Data Across Surfaces

Every work object should eventually be representable in multiple ways:

| Work object | Web desk | SMS | Signed preview | Admin/operator | Future desktop |
|---|---|---|---|---|---|
| Message | thread bubble + preview details | short text | message context | raw delivery/proof | thread + notifications |
| Task | row/card + preview pane | question/review line | focused action page | queue/repair/provenance | task board/right rail |
| Artifact/resource | library card + preview | link + status | full mobile preview | storage/proof/debug | tabbed right rail |
| Approval | card + exact payload | yes/no/edit + link | sticky approval page | audit + override context | approval panel |
| Job | folder/timeline | digest or single next action | mobile timeline | account/job support view | project/workspace |
| Connector | connected center | reconnect alert | consent/repair page | secrets/proof/health | settings/status |
| Ability | ability catalog | "I can/can't yet" summary | setup page if needed | capability graph/debug | skills/toolsets view |
| Progress | work timeline | only meaningful updates | status page | run/event trace | live stream |
| Receipt/proof | quiet proof row | short receipt | proof detail | raw ids/logs | proof panel |

This table is more important than any one visual design. It keeps web, SMS, preview links, admin, and future clients from drifting into separate products.

## Preview Media Over SMS

This is the "later/speculative" thumbnail/poster/OG-image *generation* pipeline (priority item 6 above)
— design for it, but it is not required for a trial customer to use the product today; the signed
Review page already renders real documents/images/video without it.

Potential approaches:

- SMS sends a short signed link with an Open Graph preview image.
- Generate a static thumbnail/poster for each rich resource:
  - first page of PDF;
  - image thumbnail;
  - video poster frame;
  - table/report summary card;
  - invoice/estimate amount card;
  - website screenshot.
- Store preview metadata with the resource:
  - title;
  - subtitle/summary;
  - status;
  - risk;
  - amount/recipient when relevant;
  - thumbnail/poster URL;
  - expires_at;
  - allowed actions.
- For MMS only where reliable and cost-appropriate:
  - send small image thumbnails;
  - avoid depending on MMS for the approval path;
  - always include a signed web link fallback.
- For video:
  - never force video playback in SMS;
  - send poster + duration + short summary;
  - open mobile preview for playback/transcript/actions.

Do not leak service-role URLs or long-lived private storage links. SMS previews need scoped, expiring links and auditable access.

## Task Progress Representations

Task progress can render at different fidelity:

- Web:
  - stepper/timeline for multi-step work;
  - active status chip;
  - current step and next expected owner action;
  - proof after completion;
  - expandable technical provenance later for admin only.
- SMS:
  - only interrupt for meaningful progress, blockers, questions, approvals, receipts;
  - digest bursts;
  - "still working" only if a task is long enough that silence is worse.
- Signed preview:
  - status page for a single task;
  - safe refresh/retry/cancel/reply actions if supported.
- Admin:
  - raw run ids, audit rows, provider ids, retry controls, repair queue.

Progress should read like a human assistant's status, not a developer log.

## Experimental Resource Types To Keep In Mind

These are not required for the immediate MVP, but the UI should avoid choices that make them hard:

- generated social posts with image/video variants;
- website/landing-page drafts;
- before/after marketing galleries;
- supplier order carts;
- enriched lead datasets;
- cashflow and pricing-drift reports;
- calendar schedule changes;
- customer upload requests;
- voice-call summaries;
- bookkeeper monthly handoff bundles;
- permit/COI/document packets;
- multi-employee handoffs later.

Most of these should fit into a small set of render types: document, outbound message, money movement, dataset/report, recommendation, schedule mutation, structured record write, media asset, job folder, external-system action, plan, generic.

## What Not To Build Yet

- A finished desktop client before web/SMS are credible.
- One-off React pages for every future connector.
- Media preview pipelines that bypass artifact/resource security.
- SMS flows that cannot be represented in web history.
- Owner-facing raw tool logs.
- A production dependency on MMS/video delivery.
- Visual gimmicks that do not help the owner inspect, approve, understand, or recover work.

## Immediate UI Contributor Takeaway

Design the web desk, the artifact/document preview, and the mobile Review page as one job, not three
— a trial customer's first real interaction is likely "get a text, tap the link, look at the estimate."
Make that whole path excellent now. The preview pane, output library, task progress model, status
chips, and action controls are the same patterns that will later extend to richer media previews,
admin inspection, and optional desktop right rails — but that extension is later work, not a reason to
under-invest in what's already built.
