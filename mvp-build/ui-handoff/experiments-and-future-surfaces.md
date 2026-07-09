# Experiments And Future Surfaces

Status: active design backlog

Purpose: capture the more experimental UI ideas so they are not lost while the immediate priority remains the web client.

The most important surface right now is the web Work Surface. It is where the product can show the richest state, prove the employee desk model, and give UI contributors a fast feedback loop. SMS, preview media, signed links, video/image artifacts, and future desktop/admin/customer views should be designed as renderers of the same underlying work, not as separate apps.

## Priority Order

1. **Web client first.** Make the employee desk understandable, polished, responsive, and useful with the data we already have.
2. **Mobile web preview second.** The signed-link preview path should feel native on a phone because SMS will send owners there.
3. **SMS copy/action grammar third.** SMS should summarize and route to preview/actions, not try to cram the whole app into text.
4. **Generic resource/media preview system fourth.** Images, video, PDFs, web pages, reports, order carts, and task progress should share a resource contract.
5. **Admin/operator and optional desktop later.** These consume the same resources/actions with more provenance and control.

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
- Mobile web:
  - top/bottom segmented nav;
  - preview as full-screen drawer/page;
  - sticky approve/reject/reply controls;
  - SMS-link landing mode that hides full app chrome when appropriate.

## Signed SMS Preview Ideas

SMS should send short messages and links into scoped mobile previews. The link should open a resource/action page, not just a static artifact.

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

Current artifacts are estimate-heavy and structured HTML/PDF oriented. Future work should support broad media/resource previews:

- **Images**
  - before/after galleries;
  - generated marketing image previews;
  - annotated job photos;
  - image comparison slider;
  - downloadable originals plus compressed SMS thumbnails.
- **Video**
  - short generated promo clips;
  - job walkthrough videos;
  - customer-uploaded videos;
  - poster frame thumbnail in SMS/web;
  - transcript/summary fallback;
  - review/publish approval if customer-facing.
- **Documents**
  - estimate/proposal PDFs;
  - crew packets;
  - invoice PDFs;
  - contracts/SOWs;
  - bookkeeper handoff packets.
- **Web previews**
  - website draft preview;
  - landing page preview;
  - supplier/cart page preview;
  - customer-facing portal preview.
- **Datasets/reports**
  - lead lists;
  - AR aging;
  - cashflow brief;
  - pricing drift report;
  - sortable/filterable table on web, summary + link on SMS.
- **Order carts / external-system actions**
  - target vendor/system;
  - item list;
  - total cost;
  - delivery/pickup;
  - approve before purchase.
- **Forms / questions**
  - missing info forms;
  - connector repair forms;
  - scope clarification;
  - owner policy setting.

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

Make the web desk excellent first, but design it as if every selected preview could also open from SMS tomorrow. The preview pane, output library, task progress model, status chips, and action controls are the patterns that will later become signed mobile previews, media previews, admin inspection, and optional desktop right rails.
