-- S1-S4 closure for employee MCP authority and signed artifact resources.

begin;

alter table employee_mcp_credentials
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict,
  add column if not exists principal_id text references employee_principals(id) on delete restrict,
  add column if not exists policy_version text;

update employee_mcp_credentials credential
   set assignment_id = ea.id,
       principal_id = ep.id,
       policy_version = ea.policy_version
  from employee_principals ep
  join employee_assignments ea on ea.employee_principal_id = ep.id
 where ep.employee_id = credential.employee_id
   and ea.account_id = credential.account_id
   and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
   and credential.assignment_id is null
   and not exists (
     select 1
       from employee_assignments other
       join employee_principals other_ep on other_ep.id = other.employee_principal_id
      where other_ep.employee_id = credential.employee_id
        and other.account_id = credential.account_id
        and other.id <> ea.id
        and amtech_relationship_current(other.status, other.starts_at, other.ends_at)
   );

create index if not exists employee_mcp_credentials_assignment_idx
  on employee_mcp_credentials(assignment_id, status, expires_at)
  where assignment_id is not null;

alter table employee_mcp_credentials
  drop constraint if exists employee_mcp_credentials_authority_shape_check,
  add constraint employee_mcp_credentials_authority_shape_check check (
    assignment_id is not null and principal_id is not null and policy_version is not null
  ) not valid;

update artifact_links link
   set assignment_id = artifact.assignment_id
  from artifacts artifact
 where link.artifact_id = artifact.id
   and link.assignment_id is null
   and artifact.assignment_id is not null;

create index if not exists artifact_links_assignment_token_idx
  on artifact_links(assignment_id, token_hash)
  where assignment_id is not null and revoked_at is null;

insert into assignment_resource_grants(
  id, assignment_id, principal_id, resource_class, resource_id,
  actions, status, starts_at, policy_version, provenance
)
select
  'grant_' || substr(md5('employee_tool_surface:' || ea.id || ':' || ep.id), 1, 26),
  ea.id,
  ep.id,
  'employee',
  ep.employee_id,
  array[
    'artifact:create','artifact:render','artifact_link:create',
    'approval:request','tool:execute','stream:read','turn:create'
  ],
  'active',
  ea.starts_at,
  ea.policy_version,
  jsonb_build_object('source','s1_s4_mcp_artifact_closure','kind','employee_tool_surface')
from employee_assignments ea
join employee_principals ep on ep.id = ea.employee_principal_id
where amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
on conflict (id) do update set
  actions = excluded.actions,
  status = excluded.status,
  policy_version = excluded.policy_version,
  provenance = excluded.provenance;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values
  ('session:employee-mcp','owner_session','employee Manager MCP credential','Lane 1','explicit_assignment','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','mutable_header_identity'],
   array['credential-assignment-binding','employee-principal-current','policy-version-current'],
   'apps/manager/src/lib/mcp-auth.ts','MCP bearer possession resolves one durable employee principal and assignment before tool dispatch.'),
  ('signed:artifact-link','signed_resource','signed artifact delivery','Lane 1','signed_resource_assignment','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only'],
   array['signed-assignment-claim','durable-artifact-link-assignment','artifact-resource-grant'],
   'apps/manager/src/server.ts','Artifact token possession is checked against the durable link and artifact assignment.')
on conflict (key) do update set
  surface_category = excluded.surface_category,
  subject = excluded.subject,
  lane_owner = excluded.lane_owner,
  scope_requirement = excluded.scope_requirement,
  authorization_contract = excluded.authorization_contract,
  customer_consequential = excluded.customer_consequential,
  enabled = excluded.enabled,
  denied_authorizers = excluded.denied_authorizers,
  required_evidence = excluded.required_evidence,
  source_ref = excluded.source_ref,
  notes = excluded.notes,
  updated_at = now();

commit;
