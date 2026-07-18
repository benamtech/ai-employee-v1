-- ============================================================================
-- Correct policy-version ownership for assignment authorization.
--
-- 0039 introduced separate assignment lifecycle and authorization policy
-- versions, but the action evaluator compared the caller's authorization
-- version to employee_assignments.policy_version. Authorization versions belong
-- to the current actor relationship / resource grant, not assignment lifecycle.
-- ============================================================================

create or replace function amtech_authorize_assignment_action(
  p_assignment_id text,
  p_resource_class text,
  p_resource_id text,
  p_action text,
  p_policy_version text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with actor as (
    select amtech_current_human_principal_id() as principal_id
  ),
  authorized_assignment as (
    select aa.assignment_id
      from amtech_authorized_assignment_ids(
        p_action,
        p_resource_class,
        p_resource_id
      ) aa
     where aa.assignment_id = p_assignment_id
  ),
  current_actor_relationship as (
    select ap.role
      from actor
      join assignment_principals ap
        on ap.principal_id = actor.principal_id
       and ap.principal_class = 'human'
       and ap.assignment_id = p_assignment_id
     where actor.principal_id is not null
       and ap.policy_version = p_policy_version
       and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
  )
  select exists (
    select 1
      from authorized_assignment aa
     where
       (
         p_action = 'read'
         and p_resource_class in ('employee','assignment')
         and exists (select 1 from current_actor_relationship)
       )
       or (
         p_action = 'read'
         and p_resource_class = 'commercial_relationship'
         and exists (
           select 1
             from current_actor_relationship car
            where car.role in ('owner','manager','billing')
         )
       )
       or exists (
         select 1
           from actor
           join assignment_resource_grants g
             on g.assignment_id = aa.assignment_id
            and (g.principal_id is null or g.principal_id = actor.principal_id)
          where actor.principal_id is not null
            and g.policy_version = p_policy_version
            and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
            and (g.resource_class = p_resource_class or g.resource_class = '*')
            and (g.resource_id is null or g.resource_id = p_resource_id)
            and (p_action = any(g.actions) or '*' = any(g.actions))
       )
  )
$$;

revoke all on function amtech_authorize_assignment_action(text,text,text,text,text) from public;
grant execute on function amtech_authorize_assignment_action(text,text,text,text,text)
  to authenticated, service_role;
