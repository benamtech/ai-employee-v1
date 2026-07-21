# Trace 010 — Connector operating substrate

Status: selected before implementation  
Base evidence: `evidence_matrix.json` at exact SHA `712599ff31599e1a259157dd0e34915d0777d5f6`

## Question

How does AMTECH close the gap between connector-shaped infrastructure and an AI Employee that arrives broadly capable, adapts to the owner’s business, receives native business events, acts through every supported channel, proves its work, and fails closed after revocation?

## Evidence result

The base repository completed 7 of 13 mandatory lifecycle invariants. Four were partial and two were absent. The decisive gaps were not another provider adapter:

- no provider-neutral capability discovery and lifecycle receipt;
- no atomic generic revoke spanning binding, grants, credential references, capability projections, and owner evidence;
- no target-bound, single-use SMS step-up factor for consequential approvals;
- no deterministic first-use activation plan compiled from business context, named tools, repeat workflows, event posture, and current connections.

The existing repository already contains strong primitives: owner setup descriptors, Manager custody, assignment-bound connector bindings, fresh execution interception, verified webhook ingress, durable effects, and SMS sessions. Replacing those primitives would increase risk without closing the missing transitions.

## Candidate decision

Candidate D, `connector_operating_substrate`, is selected because it is the only feasible candidate under the all-invariant constraint. No weighted score, graph density, diversity term, or mathematical decoration affected the decision.

The implementation must preserve three separate but joined spines:

1. **Connection lifecycle** — setup → custody → binding → discovery → use → proof → expiry/revoke → fail closed.
2. **Ambient event lifecycle** — verified ingress → assignment custody → durable command/effect → projection/automation → receipt/reconciliation.
3. **Human step-up lifecycle** — authorized principal → verified phone → target-bound challenge → single-use verification → atomic approval resolution.

## Runtime doctrine

Adaptive does not mean bypassing authority. The employee remains broadly capable in reasoning, discovery, composition, tool selection, recommendation, and proactive planning. Narrowing occurs only at the final consequential effect boundary. Manager policy must not be presented to Hermes as general inability.

Unknown connectors remain representable. Unknown write, money, or customer-facing risk defaults to Manager custody. Read-only direct MCP remains possible only when every risk axis is explicitly false.

## Maximum implementation

The selected trajectory includes:

- a provider-neutral connector runtime manifest and adaptive activation compiler;
- a forward-only database lifecycle, capability projection, revocation, and action-verification spine;
- Manager lifecycle discovery, evidence, and revoke transactions;
- optional SMS step-up requirements attached to immutable approvals and resolved atomically;
- SMS command handling for VERIFY, APPROVE, and REJECT challenges without converting ordinary SMS into a restricted approval-only channel;
- first-session context that recommends highest-gain event-driven workflows from onboarding evidence;
- owner UI support for discovery results and revocation;
- exact source, migration, unit, integration, UI-contract, and workflow evidence.

## Evidence classes

Source and CI can establish local contracts and blank-ledger PostgreSQL behavior. They cannot establish live OAuth consent, remote MCP interoperability, provider token revocation, webhook delivery, Twilio delivery, managed secret deletion, or target-host production acceptance without configured external credentials and endpoints. Those remain explicit external gates rather than inferred passes.
