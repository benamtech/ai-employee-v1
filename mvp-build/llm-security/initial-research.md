# Initial Research: LLM-Native Onboarding

## 2026-07-16T00:00:00-04:00 - Pre-implementation standard

Context: The live normal employee onboarding flow produced provider-backed chat replies, but the LLM repeated known facts, did not know when intake was complete, account creation did not advance the canonical state, and provisioning failed with a raw invalid-manifest error.

Sources considered:
- OWASP Top 10 for Large Language Model Applications: prompt injection, insecure output handling, sensitive information disclosure, excessive agency, overreliance, and resource consumption are relevant to an onboarding LLM that can trigger account/provisioning actions.
- NIST AI RMF and Generative AI Profile: the useful operational pattern here is risk management by explicit mapping, measurement, and governance rather than trusting model behavior.
- Microsoft HAX Toolkit: plan for predictable AI failures and give users recovery paths; the UI must expose captured state and completion status instead of relying on conversational implication.

Working standard:
- The LLM may propose structured intake updates, but deterministic server code owns canonical state, readiness, account linkage, and provisioning.
- Client state is display and input only. It must not assemble the final employee manifest.
- Provider-backed text is not proof of operational success. Runtime proof requires a valid manifest, account linkage, phone proof, provisioned employee id, and live reply.
- Failure copy must stay user-facing and hide internal provider/database/runtime vocabulary.
- Conversation must have a completion boundary: once required facts are captured, the assistant should stop intake and guide phone/account/provision steps.

Decision before implementation:
- Use `onboarding_sessions.manifest_draft` as the temporary store for MVP speed.
- Compile the final `OnboardingManifest` on the Manager side from session, verified phone, account, and transcript state.
- Keep `provision_employee` strict and add a session-backed provisioning path above it rather than weakening schema validation.

## 2026-07-16T00:10:00-04:00 - Source correction

User correction: Ignore Microsoft/HAX and similar guidance that is not aimed at cutting-edge development or research around pushing LLM boundaries.

Decision update:
- Do not use Microsoft/HAX as a governing source for this implementation.
- Keep OWASP/NIST as baseline risk framing only, then synthesize the product standard from the observed live failure: model text is untrusted, session state is canonical, deterministic code owns readiness/provisioning, and the UI must make the LLM's inferred state inspectable and recoverable.
- Treat speculative/theoretical computation ideas as research notes unless they produce an immediately testable product invariant.

## 2026-07-16T02:10:00-04:00 - Post-implementation onboarding standard

Scope correction: This implementation is onboarding-only. It does not attempt a comprehensive security redesign for all future virtual-computer employees, MCP connectors, or sensitive business systems.

Implemented standard:
- Chat is the orchestration surface from the first screen, including phone verification, account creation, and employee start.
- Secure values are entered through chat-native controls, but raw passwords and verification codes are not sent to the LLM or printed in the visible status log.
- The browser no longer compiles the final employee manifest. It sends `session_id`, `account_id`, and an idempotency key to a Manager route.
- The Manager compiles the final manifest from canonical session state and keeps `provision_employee` strict.
- Phone verification and account creation now write milestones and required manifest facts back to `onboarding_sessions`.

Security/UX principle extracted:
- For LLM-native onboarding, "through chat" should mean the conversation owns flow and timing, not that all values become model-visible text.
- The model gets business context and safe milestone summaries; deterministic endpoints receive secrets and create durable state.
- Provisioning proof must come from server-compiled state, not model confidence or client-side assembly.

Verification:
- Focused unit tests passed for onboarding readiness and server-side manifest compilation.
- Full unit suite passed: 96 files, 593 tests.
- Workspace typecheck passed after rebuilding shared contract declarations.

## 2026-07-16T02:45:00-04:00 - Holographic interaction note

Research check:
- "Holographic computing" did not appear as a mainstream product-interface standard for LLM agents.
- Related technical lines are holographic reduced representations, hyperdimensional computing, holographic associative memory, distributed artificial intelligence, and LLM-agent UI research.
- The useful product-level idea is not literal optical or quantum computation. It is distributed, associative, partial reconstruction: a local view can reveal and reconstruct the larger state of the system because each visible object carries enough references, provenance, and action affordances.

Simple explanation:
- A hologram is interesting because each part can contain information about the whole image.
- In software terms, an agentic card should behave similarly: one estimate card, approval card, customer follow-up, or payroll issue should carry the business context, source, proof, risk, and next action needed to understand its place in the whole business without opening every database table or reading the full chat.
- This maps to AMTECH's existing direction: surface envelopes, work resources, proof envelopes, safety envelopes, render hints, MCP UI resources, business brain facts, task/event streams, and scoped ingress/egress.

Emerging AMTECH synthesis:
- The business should feel like it was born into an ephemeral machine: a provisioned employee runtime, scoped tools, connectors, memory, tasks, MCP access, approval gates, and ingress/egress routes materialize around the owner in real time.
- The interface should not feel like a static SaaS dashboard. It should feel alive because work continually becomes cards, cards become approvals or drafts, approvals become actions, and actions become proof.
- The "faraway view" is the whole-business state: what needs the owner, what the employee is watching, what can be done now, what is blocked, and what was proven.
- The "near view" is the generated card: one object with enough context to act safely.
- Chat is the connective tissue, not the whole interface. It creates, refines, and explains cards; it should not swallow the business back into an unstructured transcript.

Verifiable insight candidates:
- Holographic Surface Principle: every actionable UI object must include state, source, safety, and next-action references sufficient to reconstruct its role in the larger workflow.
- Ephemeral Machine Principle: onboarding is successful only when the owner can see a living operational environment appear, not merely a chat session or static account.
- Trust Through Progressive Delegation: users become comfortable giving an agent more of the business when each new capability appears first as inspectable, reversible, approval-gated cards with proof.
- Synthetic State Over Raw Prompting: the model should receive compact state events and typed work objects, while secrets, credentials, and high-impact actions remain tool-bound and approval-bound.
- Feed Before Support Chat: the primary surface should present generated business state and action cards; support-like open chat should be available but not frame the product.

Research/paper/course angle:
- AMTECH can frame this as a standard for "holographic agentic interfaces": distributed business state materialized into typed, inspectable work objects, with LLMs coordinating but not owning the security boundary.
- A course could teach the stack as: canonical state, model-proposed objects, deterministic renderers, approval gates, proof envelopes, connector custody, and living feed design.
