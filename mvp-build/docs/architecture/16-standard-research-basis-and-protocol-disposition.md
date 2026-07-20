# Standard v0.2 Research Basis and Protocol Disposition

Status: ratification research record  
Date: 2026-07-19  
Task: `AMTECH-P0-GOV-001`  
Standard: `../../STANDARD.md`

## Purpose

This document records the external standards and repository evidence used to ratify AMTECH Standard v0.2. It is a research disposition, not a claim that AMTECH is certified by any external body.

## Method

Each source was evaluated against four questions:

1. Does it define a stable normative protocol or only an implementation trend?
2. Does it improve interoperability, safety, or evidence without replacing AMTECH's labor/authority ontology?
3. Can current source adopt it through an adapter or manifest rather than a parallel platform?
4. Which claims remain hypotheses until measured on AMTECH's codebase and deployed environments?

## Dispositions

### 1. MCP core authorization

Sources:

- MCP authorization specification, 2025-11-25: `https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization`
- OAuth 2.0 Protected Resource Metadata, RFC 9728: `https://www.rfc-editor.org/rfc/rfc9728.html`
- OAuth Authorization Server Metadata, RFC 8414: `https://www.rfc-editor.org/rfc/rfc8414.html`

Disposition: **adopt as interoperability profile**.

Remote protected MCP servers are resource servers. AMTECH clients must use protected-resource metadata and authorization-server discovery rather than guessing endpoints from tool text. Dynamic client registration remains optional/profiled because provider support and registration policy vary.

Repository implications:

- preserve internal Manager MCP as the governed employee capability plane;
- represent direct MCP and Manager-mediated MCP through one capability descriptor;
- keep remote authorization separate from AMTECH assignment authority;
- add standards metadata to connector manifests before treating a remote MCP connector as native-level.

### 2. MCP Apps

Sources:

- MCP Apps stable specification, 2026-01-26: `https://apps.extensions.modelcontextprotocol.io/specification/2026-01-26/apps.html`
- MCP Apps overview: `https://modelcontextprotocol.io/extensions/apps/overview`
- SEP-1865: `https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp`

Disposition: **reorient from generic “MCP-UI” terminology to official MCP Apps while retaining adapters**.

MCP Apps is the official optional MCP UI extension. Tools associate with `ui://` resources; compliant hosts negotiate support, render isolated HTML, enforce CSP/permissions, and mediate JSON-RPC communication.

AMTECH does not replace `SurfaceEnvelope`, `WorkResource`, `WorkAction`, approval, or effect contracts with MCP Apps. MCP Apps becomes one rendering adapter and one possible server-supplied interaction surface.

Current `McpUiResource.tsx` and generated-view machinery remain useful, but naming and protocol claims distinguish:

- AMTECH generated views;
- legacy or compatible MCP-UI implementations;
- official MCP Apps;
- host capability negotiation.

### 3. AG-UI

Sources:

- AG-UI overview: `https://docs.ag-ui.com/`
- AG-UI events: `https://docs.ag-ui.com/concepts/events`
- AG-UI state: `https://docs.ag-ui.com/concepts/state`
- AG-UI generative UI relationship: `https://docs.ag-ui.com/concepts/generative-ui-specs`

Disposition: **adopt as optional agent↔user transport adapter, not authority or UI schema**.

AG-UI defines event-based agent/user interaction, including run lifecycle, streamed messages/tool calls, activity, and state snapshot/delta synchronization. AG-UI explicitly is not itself a generative UI specification.

AMTECH's strict snapshot/SSE and typed event system contain analogous concepts. The production direction is a versioned adapter and conformance matrix, not replacement of durable Manager state or an immediate rewrite.

### 4. OAuth and managed connector authorization

Sources:

- OAuth 2.0 Security Best Current Practice, RFC 9700: `https://www.rfc-editor.org/rfc/rfc9700.html`
- Protected Resource Metadata, RFC 9728: `https://www.rfc-editor.org/rfc/rfc9728.html`
- Resource Indicators, RFC 8707: `https://www.rfc-editor.org/rfc/rfc8707.html`
- Rich Authorization Requests, RFC 9396: `https://www.rfc-editor.org/rfc/rfc9396.html`
- DPoP, RFC 9449: `https://www.rfc-editor.org/rfc/rfc9449.html`
- PKCE, RFC 7636: `https://www.rfc-editor.org/rfc/rfc7636.html`
- Pushed Authorization Requests, RFC 9126: `https://www.rfc-editor.org/rfc/rfc9126.html`

Disposition: **adopt the security baseline and condition advanced mechanisms on provider support**.

Required baseline:

- authorization code rather than implicit/password grants;
- exact redirect and authorization-host allowlists;
- state and PKCE where applicable;
- least-privilege scopes/resource indicators;
- sealed Manager custody;
- revocation and rotation;
- no arbitrary return redirects;
- no inferred authorization endpoint for unknown providers.

Resource metadata, rich authorization requests, PAR, and DPoP are preferred when provider and operating environment support them. The Standard does not falsely claim these mechanisms are universal.

The code implication is a declarative setup manifest supporting OAuth, provider-managed onboarding, managed secrets/service accounts, direct read-only MCP, and operator-managed installation. Gmail and QuickBooks are adapters, not the ontology. Stripe uses provider-managed Connect onboarding and must not be mislabeled as OAuth.

### 5. NIST AI RMF and Generative AI Profile

Sources:

- NIST AI RMF 1.0: `https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10`
- NIST AI 600-1 Generative AI Profile: `https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence`

Disposition: **use as a risk-organization crosswalk; do not claim certification**.

AMTECH maps its lifecycle to Govern, Map, Measure, and Manage. The Standard retains intended-use definition, affected-party and misuse analysis, evidence separation, measurement validity, monitoring, incident response, and operator accountability.

### 6. OWASP agentic risk

Source:

- OWASP Top 10 for Agentic Applications 2026: `https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/`

Disposition: **adopt as a threat-model checklist**.

The current architecture directly addresses several high-impact classes:

- goal hijacking: external content is data, not authority;
- tool misuse: capability/effect bounds and approval;
- identity/privilege abuse: assignment-scoped principals and grants;
- memory poisoning: scoped memory and provenance;
- insecure communication: authenticated Manager/Host/MCP boundaries;
- cascading failure: durable states, ambiguity, repair, and bounded retries.

This is a crosswalk, not a guarantee that every risk is closed.

### 7. NIST SSDF

Sources:

- NIST SP 800-218 SSDF 1.1: `https://csrc.nist.gov/pubs/sp/800/218/final`
- NIST SP 800-218A: `https://csrc.nist.gov/pubs/sp/800/218/a/final`

Disposition: **adopt outcome-oriented secure-development practices**.

The company task contract, branch discipline, self-verification, threat modeling, secure defaults, provenance, vulnerability response, and artifact integrity align with SSDF outcomes. SSDF 1.2 remains draft at ratification and is not named as a final requirement.

### 8. SLSA and attestations

Sources:

- SLSA v1.2: `https://slsa.dev/spec/v1.2/`
- SLSA Build Track: `https://slsa.dev/spec/v1.2/build-track-basics`
- in-toto attestations: `https://in-toto.io/`
- Sigstore: `https://docs.sigstore.dev/`

Disposition: **reorient custom proof language toward standard attestations**.

AMTECH should target signed hosted-build provenance equivalent to SLSA Build L2 before launch and design a path to hardened L3 controls. Repository release evidence remains valuable but should serialize into standard in-toto/SLSA predicates and use managed signing infrastructure.

### 9. OpenTelemetry

Sources:

- OpenTelemetry semantic conventions: `https://opentelemetry.io/docs/specs/semconv/`
- GenAI attribute registry: `https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/`

Disposition: **adopt stable conventions through a versioned adapter; do not make experimental attributes durable schema**.

AMTECH's durable audit/proof records remain authoritative. OTel spans, metrics, and logs provide interoperable operational telemetry. Evolving GenAI conventions require version pinning and adapter ownership.

## Repository findings that changed the Standard

### Connector architecture

`packages/shared/src/connector-registry.ts` already provides the correct baseline:

- arbitrary connectors are representable;
- unknown connectors default to Manager mediation;
- custody derives from write/money/customer-facing risk;
- only explicit read-only connectors may use direct MCP.

The lost abstraction was concentrated in owner setup:

- `packages/shared/src/connector-setup.ts` listed only Gmail and QuickBooks OAuth;
- `CapabilityDrawer.tsx` inferred those providers from category/tool-name substrings;
- Web and Manager setup routes expected one OAuth consent URL shape.

The v0.2 implementation replaces that provider whitelist with a managed connector setup descriptor while retaining fail-closed provider adapters.

### Database proof

The original real-Supabase clause was directionally correct but too easy to operationalize as a constant manual dependency.

Ratified interpretation:

- local/CI production-shaped PostgreSQL is the TDD inner loop;
- real disposable Supabase is a release/staging boundary for platform-specific behavior, security-sensitive Data API/Auth/RLS changes, new migration classes, and final release acceptance;
- neither substitutes for the other.

### Runtime image

The original Standard named an obsolete Hermes image. Current source and acceptance use `nousresearch/hermes-agent:v2026.7.1` plus resolved OCI digest. v0.2 updates the normative baseline and prohibits mutable-tag proof.

## Rejected interpretations

- **“MCP Apps replaces AMTECH work objects.”** Rejected. It is a UI extension, not durable labor authority.
- **“AG-UI is a generated UI schema.”** Rejected by AG-UI's own documentation.
- **“Every connector should be direct MCP.”** Rejected. Consequential connectors require Manager custody.
- **“Every provider must literally use OAuth.”** Rejected. Stripe Connect onboarding, service accounts, API keys, and operator installation must be represented honestly under one setup protocol.
- **“Green local PostgreSQL removes the real database gate.”** Rejected. It changes frequency and purpose, not the release requirement.
- **“Research framework reference means compliance.”** Rejected. Each reference is a profile/crosswalk unless independently audited.
- **“A vector score can waive authority or safety.”** Rejected. Hard gates remain Boolean.

## Ratification conclusion

The original Standard's core product direction is retained. v0.2:

- satisfies and operationalizes the identity, assignment, authority, effect, proof, and recovery ontology;
- expands connector/protocol and engineering-method requirements;
- narrows overbroad database-testing and cryptographic wording;
- reorients MCP-UI, OAuth, and supply-chain assumptions to current standards;
- records zero unapproved destructive modifications.
