# Golden path — Step 2: Estimate Artifact (Phase 2 acceptance)

Source: `wiki/MVP/old-build-plan/12-tests-demo-acceptance.md` §2.

## Flow
1. Owner asks the live employee for an estimate from SMS or web.
2. Employee checks business brain facts before asking questions.
3. Employee creates line items with assumptions and low-confidence flags.
4. Employee writes the PDF under `./output/estimates/`.
5. Employee calls Manager tools:
   - `create_estimate_artifact`
   - `render_estimate_pdf`
   - `create_signed_artifact_link`
6. Owner opens `/agent/{employee_id}/output/{artifact_id}?t=...`.
7. Web owner view shows the artifact under Artifacts.
8. Employee calls `request_approval` before any customer-facing send; owner resolves it from web.

## Pass criteria
- [ ] `artifacts` row exists with estimate payload and private `storage_ref`.
- [ ] PDF is in the private Supabase Storage `artifacts` bucket.
- [ ] Signed artifact link opens for the owner.
- [ ] Bad/expired/revoked token fails.
- [ ] Owner session can open own artifact without token.
- [ ] Another account cannot open the artifact.
- [ ] `approvals` row is created and can be approved/rejected once.
- [ ] No Gmail/Stripe/customer send is claimed as complete in Phase 2.
