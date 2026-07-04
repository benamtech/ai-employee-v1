-- AMTECH AI Employee MVP — Phase 5 event batching
--
-- Account-layer batching gains a flush window + priority so bursts collapse into
-- one owner digest (event-batching.ts `flushDueBatches`, `flush_event_batches`
-- scheduler lane). Additive.

alter table event_batches add column if not exists first_seen_at timestamptz;
alter table event_batches add column if not exists last_seen_at  timestamptz;
alter table event_batches add column if not exists flush_after   timestamptz;
alter table event_batches add column if not exists priority      text;

-- Backfill existing rows so ordering/flush logic has values to work with.
update event_batches
   set first_seen_at = coalesce(first_seen_at, created_at),
       last_seen_at  = coalesce(last_seen_at, created_at)
 where first_seen_at is null or last_seen_at is null;

-- The original unique(account_id, batch_key, status) allowed only ONE row per
-- (account, batch_key, status). That breaks repeated digests over time (a second
-- burst for the same key cannot produce a second 'flushed' row). Replace it with a
-- partial unique index that only enforces "at most one OPEN batch per key" — many
-- historical 'flushed'/'flushing' rows are fine.
alter table event_batches drop constraint if exists event_batches_account_id_batch_key_status_key;
create unique index if not exists uq_event_batches_open
  on event_batches(account_id, batch_key) where status = 'open';

-- Flush scan: due open batches ordered by window.
create index if not exists idx_event_batches_flush
  on event_batches(account_id, status, flush_after);

-- Raw batch rows are Manager-only control-plane telemetry. Enable RLS with no
-- policy so the Data API cannot expose them; the service-role client bypasses RLS.
alter table event_batches enable row level security;
