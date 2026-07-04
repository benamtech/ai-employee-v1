# Live Employee Wake — Phase 4 Core Acceptance

Status: pending live proof

1. Fill `.env` with Supabase, Twilio, Gmail/PubSub, Stripe test-mode, Manager, and Hermes API server env.
2. Run migrations through `0015`.
3. Provision an employee and confirm the rendered profile `.env` contains `API_SERVER_ENABLED=true`, `API_SERVER_PORT`, and `API_SERVER_KEY`.
4. Start `hermes gateway` for the profile and verify `GET /health` plus `GET /v1/capabilities` with bearer auth.
5. Send owner SMS to the employee number. Expected: Twilio webhook returns empty TwiML quickly, `to_employee` is stored, SMS presence is stamped, and the employee reply is sent from the same dedicated number.
6. Drive a verified Gmail Pub/Sub reply. Expected: `ingestEvent` creates a claimed `inbound_events` row, Hermes Sessions chat returns a JSON descriptor, Manager validates/stamps it, binds approval if needed, and routes through `delivery_decisions`.
7. With Work Surface heartbeat active, expected `delivery_decisions.chosen_channel=web` and no SMS SID. After heartbeat expiry, repeat with a second event and expect `chosen_channel=sms` plus MessageSid.
8. Record proof ids in `wiki/MVP/implementation-records/`.
