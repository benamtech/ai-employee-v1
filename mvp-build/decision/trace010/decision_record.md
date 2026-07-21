# Trace 010 — Connector operating substrate

Status: selected before implementation  
Base evidence: `evidence_matrix.json` at exact SHA `712599ff31599e1a259157dd0e34915d0777d5f6`

## Question

How does AMTECH close the gap between connector-shaped infrastructure and an AI Employee that arrives broadly capable, adapts to the owner’s business, receives native business events, acts through every supported channel, proves its work, and fails closed after revocation?

## Evidence result

The base repository completed 7 of 13 mandatory lifecycle invariants. Four were partial and two were absent. The decisive gaps were not another provider adapter:

- no provider-neutral capability discovery and lifecycle receipt;
- no atomic generic revoke spanning binding, grants, credential references, capability projections, and owner evidence;
- no durable conversation-to-work-object binding that lets a natural owner reply safely resolve the exact immutable approval across SMS, web, or voice;
- no deterministic first-use activation plan compiled from business context, named tools, repeat workflows, event posture, and current connections.

The existing repository already contains strong primitives: owner setup descriptors, Manager custody, assignment-bound connector bindings, fresh execution interception, verified webhook ingress, durable effects, sophisticated Hermes sessions, verified SMS ownership, signed review links, and immutable approval snapshots. Replacing those primitives or inventing a passcode challenge would reduce the intended user experience without closing the real context-binding gap.

## Candidate decision

Candidate D, `connector_operating_substrate`, is selected because it is the only feasible candidate under the all-invariant constraint. No weighted score, graph density, diversity term, or mathematical decoration affected the decision.

The implementation preserves three separate but joined spines:

1. **Connection lifecycle** — setup → custody → binding → discovery → use → proof → expiry/revoke → fail closed.
2. **Ambient event lifecycle** — verified ingress → assignment custody → durable command/effect → projection/automation → receipt/reconciliation.
3. **Conversational decision lifecycle** — verified owner session → exact current work object → LLM intent interpretation → immutable approval resolution → one authorized effect.

## Runtime doctrine

Adaptive does not mean bypassing authority. The employee remains broadly capable in reasoning, discovery, composition, tool selection, recommendation, and proactive planning. Narrowing occurs only at the final consequential effect boundary. Manager policy must not be presented to Hermes as general inability.

SMS is a normal assignment-bound owner session, not a repeated authentication ceremony. “Reply YES,” “yeah, send it,” a web approval tap, and an equivalent voice response are surface-specific expressions of one decision grammar. The LLM interprets meaning; Manager proves that the inbound message, human principal, assignment, focused approval, immutable snapshot, and effect identity agree.

Unknown connectors remain representable. Unknown write, money, or customer-facing risk defaults to Manager custody. Read-only direct MCP remains possible only when every risk axis is explicitly false. Long-tail systems use a guided in-product setup intent rather than exposing credential, webhook, or MCP mechanics to the owner.

## Maximum implementation

The selected trajectory includes:

- a provider-neutral connector runtime manifest and adaptive activation compiler;
- one setup grammar for AMTECH-managed OAuth/provider onboarding and guided long-tail systems;
- a forward-only database lifecycle, capability projection, revocation, setup-intent, and conversational decision spine;
- Manager lifecycle discovery, evidence, setup, and revoke transactions;
- exact SMS conversation focus attached when an approval prompt is delivered, without blocking ordinary messages when no focus exists;
- a Manager MCP capability that lets Hermes resolve a clear natural-language decision only against the supplied exact context;
- first-session context that recommends highest-gain event-driven workflows from onboarding evidence;
- owner UI support for discovery results, event posture, guided setup, evidence, and revocation;
- exact source, migration, unit, integration, UI-contract, and workflow evidence.

## Evidence classes

Source and CI can establish local contracts and blank-ledger PostgreSQL behavior. They cannot establish live OAuth consent, remote MCP interoperability, provider token revocation, webhook delivery, Twilio delivery, managed secret deletion, or target-host production acceptance without configured external credentials and endpoints. Those remain explicit external gates rather than inferred passes.
