# Ratification and Change Control

Status: active governance contract  
Task: `AMTECH-P0-GOV-001`  
Effective date: 2026-07-19

## Ratification decision

AMTECH Standard v0.2 is ratified by the AMTECH human operator through the production-governance directive recorded in draft PR `#23`.

Ratification means:

- the Standard is effective for current and future work under `mvp-build/`;
- its `MUST` and `MUST NOT` requirements are non-waivable without a recorded exception;
- source, applied migrations, and exact evidence still outrank prose when describing implementation state;
- ratification does not promote the product to production-ready.

## Preserved original commitments

The following original commitments remain intact:

- AI Employee identity is independent of one tenant, session, or provider;
- assignment is the execution and authority scope;
- human authority, ownership, access, custody, payer, and beneficiary remain separate relationships;
- durable work objects, approvals, commands, effects, receipts, audit, and repair are required;
- Manager owns authority and custody while Hermes owns employee reasoning/runtime behavior;
- generated UI is presentation rather than authority;
- customer-facing, monetary, destructive, credential, and broad external actions are governed;
- evidence states remain distinct and production claims cannot exceed proof.

## Material amendments

1. **Protocol reorientation**
   - MCP core handles tools/resources/prompts and remote authorization.
   - MCP Apps is the official interactive MCP extension.
   - AG-UI is an optional agent-user event/state adapter.
   - AMTECH work objects, authority, and durable effects remain the product protocol.

2. **Connector generalization**
   - native connectors use one declarative managed setup manifest;
   - OAuth, provider-hosted onboarding, managed secrets/service accounts, operator setup, and direct read-only MCP are represented honestly;
   - Gmail, QuickBooks, and Stripe are adapters rather than the ontology.

3. **Database testing policy**
   - production-shaped local/CI PostgreSQL is the routine TDD loop;
   - disposable Supabase/staging is a platform-specific and release-candidate gate;
   - repeated live testing is neither required nor accepted as a replacement for reproducible tests.

4. **Supply-chain profile**
   - standard in-toto/SLSA predicates and managed signing are the interoperability target;
   - repository HMAC tokens are not described as portable provenance.

5. **Engineering execution**
   - task contracts, branch isolation, self-verification, task-ID commits, stop-on-red, the three-attempt rule, and first-class scaffolding are normative.

## Destructive-modification review

The evolution vector records zero unapproved destructive modifications. Clauses were:

- satisfied by current implementation;
- expanded where the original Standard lacked protocol or engineering detail;
- narrowed where wording was overbroad or operationally counterproductive;
- reoriented where official standards changed;
- moved to appendices when explanatory rather than normative.

No assignment, authority, proof, isolation, approval, effect, recovery, privacy, or evidence hard gate was removed.

## Future amendment transaction

A future Standard amendment requires:

1. exact clause crosswalk;
2. evolution-vector update;
3. implementation/supersession references;
4. explicit destructive-loss analysis;
5. tests for machine-readable invariants;
6. CODEGRAPH, plan, architecture, memory, and PR synchronization;
7. human approval when any existing `MUST` is removed or weakened;
8. exact-head CI after the documentation transaction stops moving the branch.

## Success criteria

- [x] Standard states ratified/effective status.
- [x] Approval source and effective date are recorded.
- [x] Original protections are preserved or explicitly strengthened.
- [x] Evolution vector exists and records no unapproved destructive motion.
- [ ] Final repository-authority head passes all required workflows.
- [ ] PR `#23` records that exact final head and workflow matrix.
