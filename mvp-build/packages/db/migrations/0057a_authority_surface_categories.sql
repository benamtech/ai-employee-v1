-- S9 authority/version records are first-class consequential surfaces rather than
-- being forced into unrelated transport or storage categories.

begin;

alter table assignment_scope_registry
  drop constraint if exists assignment_scope_registry_surface_category_check;

alter table assignment_scope_registry
  add constraint assignment_scope_registry_surface_category_check check (
    surface_category in (
      'table',
      'manager_route',
      'sms_path',
      'signed_resource',
      'connector_binding',
      'owner_session',
      'admin_support_action',
      'commercial_row',
      'service_worker',
      'public_claim',
      'credential',
      'approval'
    )
  );

commit;
