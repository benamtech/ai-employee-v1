# Core Surfaces

Status: active  
Purpose: specify the concrete user-facing surfaces

## Home

Home answers: "What can I tell Avery, and does Avery need me?"

Required content:

- Avery identity and calm status.
- Business/account identity in small text.
- Primary composer.
- Needs your say section when nonempty.
- Avery is watching section as ambient awareness.
- Recent proof link or small receipt row.

Empty state:

- Do not use a marketing hero.
- Show Avery ready to receive the first real business instruction.
- Offer 2-3 grounded example prompts tied to the business, not generic onboarding copy.

## Composer

The composer is the main affordance.

Modes:

- text;
- future voice;
- selected-object context;
- attach/photo/file when supported.

It should invite natural business language. It should not look like a support chat widget.

## Needs Your Say

Driven primarily by `ResurfaceItem`, unresolved approvals/questions/failures, and blocking connector/runtime items.

Each item must show:

- what Avery needs;
- why now;
- consequence;
- one primary action.

Do not show more than a small number by default. If there are many, summarize and let the owner open the list.

## Approval / Review Sheet

Used for customer sends, money, publishing, protected sharing, and durable external writes.

Must show:

- plain title;
- exact preview;
- recipient/customer/system;
- amount when money is involved;
- consequence after approval;
- proof that will be saved;
- Approve, Tweak/Reply, Decline.

This sheet should feel calm, high-trust, and single-purpose.

## Work Object View

Used when the owner opens an estimate, draft, reply, invoice, media set, generated form, website draft, or other
materialized work.

Backed by `WorkResource` or `SurfaceEnvelope.resource` where possible.

Should show:

- object title;
- summary;
- fields/body/media;
- actions;
- receipts/proof;
- Ask Avery about this.

## Talk

Talk is the fuller conversation space.

Required:

- recent transcript;
- composer;
- compact work moments inline;
- selected-work context.

Do not turn Talk into a full dashboard. It is for conversation and repair.

## Proof

Proof answers:

- What did Avery do?
- When did it happen?
- Who/what was affected?
- Where is the receipt or artifact?

Proof groups by recency first, then job/customer/search. It should not expose audit internals by default.

## Connected

Connected answers:

- What can Avery do now?
- What needs setup?
- What is blocked?
- What still requires approval?

Use `ConnectionSurface` as the main shape and `CapabilityGraphNode` as supporting readiness. Avoid connector
tables and raw provider state.

## Signed Review

Signed review is a scoped, mobile-first permission surface.

Rules:

- one work object;
- clear owner-safe copy;
- no owner login required for scoped token;
- token expiration/resolution states are explicit;
- state-changing actions only within the signed scope;
- proof/receipt after action.

## Artifact / Output

Artifact views must feel like finished business documents or media, not storage redirects.

Rules:

- protected access;
- readable document body when available;
- download/open affordance;
- proof metadata in owner-safe language;
- no raw storage paths.

## Admin

Admin remains separate. It can be denser and diagnostic, but must preserve role, audit, support reason, and
redaction boundaries. Do not import admin vocabulary into owner surfaces.

