begin;

-- Failed/compensated jobs must be retryable with a fresh job while active
-- duplicate starts still converge. The initial 0032 index was intentionally
-- conservative; this narrows uniqueness to non-terminal jobs.
drop index if exists provisioning_jobs_operation_key_idx;

create unique index if not exists provisioning_jobs_operation_key_active_idx
  on provisioning_jobs (operation_key)
  where operation_key is not null
    and state not in ('failed','compensated');

commit;
