-- ============================================================================
-- AMTECH AI Employee MVP — Phase 3 groundwork: race-safe inbound_events dedupe
-- deliverEmployeeEvent dedupes by idempotency_key with a select-then-insert. Two
-- at-least-once webhook deliveries (Pub/Sub, Stripe) can race past the select and
-- both insert -> duplicate inbound_events rows (and a double owner notification).
-- idx_events_idem (0001) is only a *lookup* index; this promotes the invariant to
-- the database so idempotency_key is unique. The Manager now treats a 23505 on
-- insert as a duplicate (same outcome as the pre-check), so the constraint is a
-- correctness backstop, not a new failure mode. Mirrors the reminder idempotency
-- index in 0009. Additive; assumes no pre-existing duplicate keys.
-- ============================================================================

drop index if exists idx_events_idem;

create unique index if not exists inbound_events_idempotency_key_uniq
  on inbound_events(idempotency_key);
