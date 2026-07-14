# Product Principles

Status: active  
Purpose: product laws for the new MVP UI

## 1. Avery Is The Interface

The app should not ask the owner to learn a dashboard before getting work done. The owner starts with Avery:

- "Avery, make the estimate from today's walkthrough."
- "Follow up with Jane Friday if she has not replied."
- "Use the lower labor number, but keep the prep note."
- "What still needs me?"

The interface exists to support that relationship: conversation, permission, inspection, memory, and proof.

## 2. Not A Giant Chat Transcript

Chat is the command language, not the storage model. Business work must leave the transcript as soon as it
becomes durable:

- an estimate draft;
- a customer reply needing judgment;
- a deposit link approval;
- a missing-info question;
- a connector problem;
- a receipt/proof item.

The transcript can remain available, but it is not the user's filing system.

## 3. Preparation Is Quiet; Permission Is Exact

Avery should independently prepare work. That preparation should feel reassuring, not noisy.

Visible independence:

- "Avery is watching replies and preparing the Riverbend estimate."
- "Avery found two missing details."
- "Avery can draft the invoice after QuickBooks is reconnected."

Exact permission:

- recipient;
- amount;
- customer/business consequence;
- what will happen next;
- what proof will be saved.

## 4. Trust Comes From Receipts, Not Explanatory Theater

Do not make Avery over-explain normal work. Save proof quietly:

- sent message receipts;
- approval receipts;
- artifact/document proof;
- payment/invoice proof;
- connector proof;
- blocked/failure proof.

The owner should find proof later by customer, job, date, or recent action. The owner should not manage a ledger.

## 5. The System Is Emotionally Calm

The product should feel steady and capable:

- warm language;
- restrained density;
- no alarmist color unless there is real risk;
- minimal badges;
- no stream of internal statuses;
- no raw implementation vocabulary.

The owner should feel "Avery has this, and will stop when I need to decide."

## 6. Power Is Contextual

Avoid a generic feature catalog. Capabilities appear when useful:

- Email readiness appears when sending is relevant.
- QuickBooks readiness appears when accounting work is relevant.
- Stripe readiness appears when deposits are relevant.
- Artifact/review safety appears when the owner opens a document or approval.

This preserves capability without turning the first screen into SaaS settings.

## 7. Mobile Is The Primary Constraint

The first real user may approve an estimate from a truck, job site, or kitchen table. Therefore:

- one-column first;
- large readable controls;
- short approval summaries;
- exact details available without hunting;
- sticky action bars only for active decisions;
- no desktop-only mental model.

## 8. Generated Work Surfaces Are Allowed, But Safety Is Fixed

Generated UI can vary by task. Safety grammar cannot:

- exact previews for risky actions;
- scoped signed review links;
- protected artifact access;
- owner-safe copy;
- proof capture;
- no generated card can relax gates.

`SurfaceEnvelope`, `WorkResource`, and `WorkAction` remain the substrate behind the visible product.

