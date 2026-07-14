# Information Architecture

Status: active  
Purpose: define the simple product structure and disclosure model

## First Screen

First screen name: **Home**

Home is not a dashboard. It has four regions, in this order:

1. **Avery presence** - name, calm availability, business identity.
2. **Tell Avery** - primary composer.
3. **Needs your say** - only appears when a `ResurfaceItem`, approval, question, failure, or blocker genuinely
   needs owner attention.
4. **Avery is watching** - quiet ambient summary of current business awareness and prepared work.

Recent proof can appear as a small footer or secondary drawer, never as the main column.

## Primary Navigation

Mobile primary navigation:

- Home
- Talk
- Proof
- Connected

Desktop may expose the same destinations in a small rail or top bar, but must not default to three content
columns. The main screen remains one primary focus plus optional inspector.

## Secondary Surfaces

### Talk

Recent conversation and full composer. Still not a transcript-only product: active work cards and approval links
can appear inline as compact moments.

### Work Item / Review

One active object at a time. Used for estimates, replies, invoices, missing info, documents, generated cards,
media, website drafts, and connector-backed work.

### Proof

Recent receipts and searchable/refindable history. It answers "what happened?" and "where is the proof?" without
becoming the first screen.

### Connected

Plain-language capability readiness:

- what Avery can do now;
- what needs connection;
- what is blocked;
- what remains gated by approval.

Not a connector table.

### Settings

Owner/account preferences, notification preferences when backend supports them, employee identity, business
details, and safe account operations.

## Disclosure Rules

Default visible:

- composer;
- urgent permission/clarification;
- quiet awareness.

One tap away:

- exact preview;
- work details;
- proof receipt;
- connected account details;
- recent conversation.

Two taps away:

- advanced proof history;
- settings;
- admin/operator diagnostics;
- raw provider repair flows.

## Desktop Layout

Desktop can use width, but should not become a control room.

Allowed:

- centered home with optional right-side work sheet after selecting an active item;
- modal/sheet review for approvals;
- proof drawer;
- connected details drawer.

Avoid:

- persistent left nav + center table + right inspector as the default;
- multiple independent scroll columns;
- permanent stream rail;
- dashboard metrics row;
- status-pill groups.

## Mobile Layout

Mobile is the source of truth:

- single column;
- bottom navigation;
- composer reachable without scrolling through history;
- approval sheets with sticky actions;
- full-screen object view;
- proof accessible after completion.

Desktop should enrich mobile, not redefine the product.

## Route Model

Keep existing route shape unless a field gap is proven:

- owner employee route becomes Home/Talk/Proof/Connected/Settings.
- signed review route renders one scoped review object.
- artifact/output route renders protected proof/object view.
- admin route remains separate and diagnostic.
- public/create/claim/login routes should share warmth and brand, but they are not the main scope.

