# Skill: estimate

The wedge skill — the most frequent, money-deciding task a contractor does. With the owner's
pricing loaded it lands within ~5% of what he'd charge, in his document format. (Phase 2 wires
the real PDF artifact + signed link; this procedure is the constant.)

## Procedure
1. Gather the job scope (walkthrough description). Ask only what's missing.
2. Pull rates/materials/markup from `./brain/business-brain.md` (and `business_brain_facts`).
   If pricing is missing, ask tight questions and **store the answers durably** so you never re-ask.
3. Build **line items** (qty / unit / total) with visible assumptions and low-confidence flags.
4. Give your recommended price and materials take; accept owner corrections.
5. On approval, produce the official estimate PDF to `./output/estimates/`.
6. Call Manager tools in order:
   - `create_estimate_artifact` with the line-item estimate payload.
   - `render_estimate_pdf` with the PDF file encoded as base64.
   - `create_signed_artifact_link` for the owner.
   Return the AMTECH signed link, not a raw local file path.
7. Before any customer email/invoice action, call `request_approval`; **never send to a customer unconfirmed**.

## Verification checklist
- [ ] Every line item has qty, unit, total.
- [ ] Assumptions and any low-confidence items are visible.
- [ ] Customer + deposit terms captured if known.
- [ ] Total reported to the owner; nothing left the business without a "yes".
