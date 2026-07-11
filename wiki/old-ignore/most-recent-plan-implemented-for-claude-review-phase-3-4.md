• Explored
  └ Read work-events.ts, stripe.ts, gmail.stub.ts, events.stub.ts,
  repair.stub.ts

────────────────────────────────────────────────────────────────────────────────

• Two high-impact decisions are not safely derivable from the repo alone. The
  first is the exact Hermes conversation endpoint: the current public docs I
  verified now advertise /v1/responses with conversation as the stateful path,
  while also listing /api/sessions/{id}/chat; your draft anchors on Sessions.
  The second is where to store the per-employee API key reference, because
  runtime_endpoints is currently owner-readable under RLS.

• Questions 2/2 answered
  • Which Hermes API surface should the production plan target for the canonical
    employee thread?
    answer: Sessions chat
  • Where should the per-employee Hermes `API_SERVER_KEY` reference live?
    answer: Private table (Recommended)

────────────────────────────────────────────────────────────────────────────────

• Locked: the plan will target Hermes Sessions chat, and per-employee API key
  refs go in a private service-role table rather than owner-readable
  runtime_endpoints. I’m doing one more pass over env inventory, web proxy
  routes, and tests so the plan’s interfaces and acceptance gates are concrete.

• Explored
  └ Read route.ts, .env.example
    List unit
    List api
    Read fake-db.ts

────────────────────────────────────────────────────────────────────────────────

• The env file still exposes the obsolete HERMES_MESSAGE_PATH/HERMES_EVENT_PATH,
  so the plan should explicitly remove those and add the real API server/
  session/router envs. I also hit shell globbing on the bracketed Next routes;
  I’m re-reading those with quoted paths.

• Explored
  └ Read route.ts
    Search *fake* in tests
    Read route.ts, manager.ts
    Search makeFakeDb\|FakeDb\|asClient in tests

────────────────────────────────────────────────────────────────────────────────

• The web message proxy is thin and can carry heartbeat through the same Manager
  proxy pattern. The fake Supabase helper exists and is already the right test
  harness for router/ingress/queue behavior, so the plan can keep the unit suite
  style consistent.

• Explored
  └ Search makeFakeDb\|FakeDb\|asClient in tests

────────────────────────────────────────────────────────────────────────────────

• One remaining tradeoff affects the plan’s production bar. Your draft keeps
  turn serialization in process with a named DB-lease seam; that is reasonable
  for a single VPS pilot, but not truly multi-instance safe. I need to lock that
  before finalizing the plan.

• Questions 1/1 answered
  • What production bar should the turn queue meet in this implementation plan?
    answer: Multi-instance now

• Proposed Plan


  # Production Plan: Live Hermes Runtime + Event Spine for Phases 3 / 3A / 4-
  Core

  ## Summary

  Build the real live-employee path in one production-grade slice: replace the
  fictional Hermes runtime endpoints with the real Hermes Sessions API,
  promote generic ingress into the primary event spine, add a minimal
  presence-aware channel router, and land the first employee-authored
  descriptor path for Gmail replies.

  Key decisions locked:

  - Hermes runtime target: /api/sessions/{id}/chat, not /v1/responses.
  - Hermes API key storage: private service-role-only secret table, not owner-
    readable runtime_endpoints.

  - Turn serialization: DB-backed multi-instance queue/lease now, not in-
    process FIFO.

  - External contract source: Hermes API Server docs, especially env config,
    auth, health/capabilities, Sessions API, Runs/Jobs seams:
    https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server

  ## Key Changes

  - Runtime contract:
      - Replace runtime.ts with a Hermes client that uses bearer auth, GET /
        health, GET /v1/capabilities, POST /api/sessions, and POST /api/
        sessions/{id}/chat.

      - Use request body shape { input, system_message? }; parse tolerant
        text/usage response shapes.

      - Remove HERMES_MESSAGE_PATH and HERMES_EVENT_PATH from env/docs.
      - Add HERMES_TURN_TIMEOUT_MS, WEB_PRESENCE_WINDOW_SECONDS,
        SMS_PRESENCE_WINDOW_MINUTES, and explicit API server profile envs.

  - Schema and shared contracts:
      - Add runtime API columns: runtime_endpoints.api_base_url,
        runtime_endpoints.api_session_id; keep runtime_endpoints owner-
        readable but secret-free.

      - Add private service-role-only
        runtime_endpoint_secrets(runtime_endpoint_id, api_key_ref, created_at,
        rotated_at) with RLS enabled and no anon/authenticated policies.

      - Add DB-backed turn queue tables: employee_turn_jobs and
        employee_turn_locks, with per-employee ordering, lease tokens,
        attempts, timeout/error fields, idempotency keys, and no browser
        policies.

      - Add channel_sessions and delivery_decisions with service-role-only
        write posture; browser presence writes go through Manager.

      - Add shared types for Hermes API shapes, channel routing intents/
        decisions, and new ID prefixes for channel sessions, delivery
        decisions, runtime secrets, and turn jobs.

  - Provisioning/runtime setup:
      - Provisioner mints a per-employee API_SERVER_KEY, renders it only into
        the Hermes profile .env, seals it with sealSecret, and stores the
        sealed ref in the private runtime secret table.

      - Profile .env.tpl gets API_SERVER_ENABLED=true, API_SERVER_KEY,
        API_SERVER_PORT, and API_SERVER_HOST=127.0.0.1.

      - Remove fictional gateway.api_server config from config.yaml; Hermes
        API server config is env-only.

      - Disable Hermes SMS gateway and template cron for this phase; Manager
        owns Twilio ingress, sender identity, scheduler, delivery, and
        approval gates.

      - Runtime health checks authenticate to Hermes and record health plus
        best-effort capabilities without logging keys.

  - DB-backed turn execution:
      - Implement enqueueEmployeeTurn / runEmployeeTurnWorkerOnce /
        drainEmployeeTurnsForEmployee.

      - Every Hermes chat call runs through the turn queue; grep gate: no
        direct chatTurn outside queue/worker tests.

      - Owner web turns try inline execution under the DB lease and return the
        reply when complete; if queued or timed out, return a queued response
        and surface the eventual reply through employee_messages.

      - SMS inbound verifies, records to_employee, stamps SMS presence,
        enqueues an owner_sms_chat job idempotent by Twilio SID, returns empty
        TwiML immediately, then worker sends the employee reply by REST SMS.

      - Provider-event wakes enqueue employee_event_wake jobs after an inbound
        event is atomically claimed.

  - Twilio sender identity:
      - Add resolveEmployeeSmsSender(db, employeeId) using
        runtime_endpoints.sms_number_e164.

      - Update sendSms with forceFrom; when set, do not use Messaging Service
        SID.

      - Use the dedicated employee number for provisioner first SMS, SMS
        replies, and ambient event pushes; production missing sender fails
        closed.

  - Generic ingress:
      - Replace placeholder registry with real gmail, stripe, and manager
        adapters. Do not keep Twilio as an event adapter; inbound owner SMS is
        channel/session input.

      - Add ingestEvent(db, { source, payload, edgeContext }): adapter lookup,
        structural verify, safe normalization, stable dedupe key, route
        classification, and delivery.

      - Keep provider transport auth at the HTTP edge: Pub/Sub OIDC, Stripe
        raw-body signature, Twilio signature.

      - Route rules are token-free: Gmail reply wakes the employee; Stripe
        paid/manager/reminder/brief events deliver only; Stripe invoice-sent
        records silently; unknown valid types deliver only with an audit
        marker.

      - Add assertSafeFact before persistence; reject raw email bodies,
        oversized snippets, raw Stripe objects/secrets, and unbounded free
        text into repair.

  - Channel/session/presence router:
      - Add Manager heartbeat route plus web proxy route; AgentClient sends
        heartbeat every 30 seconds.

      - Web presence is active when heartbeat is inside
        WEB_PRESENCE_WINDOW_SECONDS; SMS presence stamps on inbound messages
        and uses SMS_PRESENCE_WINDOW_MINUTES.

      - routeEmployeeIntent claims delivery_decisions(employee_id, intent_key)
        before any send. Conflict means duplicate/no delivery.

      - Active web session wins over SMS preference; no active session sends
        interrupt-worthy intents to SMS; silent intents record only.

      - Replace the direct SMS tail in deliverEmployeeEvent with the router.
        Direct owner-turn replies stay on the originating channel.

  - Live wake path:
      - Gmail replies flow through ingestEvent, atomically create/claim the
        inbound_events row, enqueue a wake job, and acknowledge the provider
        route without waiting on Hermes.

      - Wake job sends an internal event prompt into the canonical Hermes
        session and requires exactly one JSON descriptor block.

      - Manager stamps account_id, employee_id, source_event_id, and proof
        fields after parsing; the model never authors identity.

      - Validate with validateWorkEventDescriptor; retry once in the same
        canonical session with the validation error; second failure goes to
        repair and does not surface to owner.

      - Gated deliverables bind approvals before routing. Keep the old
        Manager-authored Gmail descriptor only as a repair fallback template,
        not the normal path.

  ## Test Plan

  - New unit tests:
      - Hermes client: auth header, health/capabilities, session-create 409
        tolerance, chat timeout, error taxonomy, no secret leakage.

      - Turn queue: FIFO per employee, cross-employee parallelism, lease
        expiry/reclaim, duplicate idempotency, worker failure isolation.

      - SMS sender: dedicated number resolution, forceFrom behavior,
        production fail-closed.

      - Ingress/adapters: Gmail/Stripe/manager normalization, safe-fact
        whitelist, malformed-to-repair, unknown-source repair, zero-token
        literal route.

      - Channel router: active web means web only, no presence means SMS,
        silent means none, duplicate intent prevents double delivery, SMS
        failure records fallback.

      - Wake parser: fenced JSON extraction, identity override, one retry,
        repair on invalid descriptor, gated deliverable without approval
        rejected.

      - Security: Pub/Sub audience fail-closed in production, no SMS signature
        bypass in production, forged provider requests do not reach
        ingestEvent.

  - Updated tests:
      - Existing event-bus, Gmail Pub/Sub, Stripe webhook, Twilio webhook,
        runtime health, provisioning, repair redelivery, and Work Surface
        resource tests.

      - Fake Supabase helper must support unique indexes/claims well enough
        for queue, inbound-event, and delivery-decision conflict tests.

  - Acceptance scripts:
      - Update run7 to prove generic ingress across Gmail/Stripe/manager,
        safe-fact persistence, and zero-token deliver-only events.

      - Add run9 live employee proof: provision profile, curl /health, capture
        capabilities, send a real Sessions chat turn, drive Gmail reply to
        live wake, validate descriptor, route via active web, then route a
        second event to SMS after presence expiry.

  ## Acceptance Gates

  - source-wired:
      - All implementation above complete.
      - npm run typecheck && npm run test:unit && npm run build && npm run
        lint green.

      - No direct runtime calls outside the DB-backed queue.
      - No raw provider payloads or secret refs exposed to browser-readable
        surfaces.

  - runtime-accepted:
      - Real Hermes gateway health/capabilities proof captured.
      - Real canonical session create or 409 captured.
      - Real /api/sessions/{id}/chat turn captured with response and usage if
        provided.

      - Real Gmail wake job returns a validated employee-authored descriptor;
        capture Hermes session id, turn job id, inbound event id, and
        descriptor proof.

  - provider-accepted:
      - Real Twilio inbound SID, employee reply SID, and ambient push SID.
      - Real Gmail message id and Pub/Sub message id.
      - Real Stripe test event id for paid invoice path.
      - Proof IDs recorded in implementation records without secrets or raw
        payloads.

  ## Documentation And Records

  - Update .env.example, mvp-build/CLAUDE.md, mvp-build/CODEGRAPH.md, root
    CODEGRAPH.md, and relevant phase docs.

  - Add implementation record for Phase 3 / 3A / 4-core with local proof and
    live proof placeholders.

  - Update hermes-run-session-semantics-research.md with the locked Sessions-
    chat contract and public-doc caveat.

  - Add dated mvp-build/memory/ handoff after implementation.
  - Do not mark provider/runtime accepted until proof IDs exist.

  ## Assumptions

  - Deployment target for this phase may run multiple Manager instances, so
    turn serialization must be DB-backed.

  - Hermes Sessions API is the locked target even though the current public
    docs also advertise /v1/responses; /v1/responses, Runs SSE, and Jobs API
    remain forward seams.

  - Browser clients never receive Hermes API keys or secret refs.
  - Twilio owner replies should not block on Hermes inside the webhook
    request.

  - Full preference/authority modeling, batching digest flush, live SSE Work
    Surface stream, Hermes Jobs scheduler replacement, and per-employee
    Manager tool credentials remain named follow-up seams.
