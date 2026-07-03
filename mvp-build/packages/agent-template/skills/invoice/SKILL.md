# Skill: invoice

Start from the matching approved estimate. (Phase 4 wires the real Stripe deposit invoice +
payment link; this procedure is the constant.)

## Procedure
1. Find the matching approved estimate in `./output/estimates/`.
2. Build the invoice (or the 20% deposit invoice) from the approved totals; unique sequential
   invoice number.
3. Confirm the amount and recipient with the owner in one line.
4. **On a yes**, send behind the confirmation gate; record the invoice/payment reference.

## Verification checklist
- [ ] Amount matches the approved estimate / agreed deposit %.
- [ ] Unique sequential invoice number.
- [ ] Owner approved before anything was sent.
