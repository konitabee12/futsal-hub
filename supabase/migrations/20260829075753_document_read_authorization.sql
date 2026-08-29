-- Batch 2.11: extend document read access to the existing PLAYER and OFFICIAL owner types.
insert into public.permissions (code, name) values
  ('document.view', 'View documents')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'document.view'
where r.code in ('SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'VERIFIER', 'CONTINGENT_ADMIN', 'TEAM_MANAGER')
on conflict do nothing;

create policy documents_read_player_official_scoped on public.documents
for select to authenticated
using (
  app_private.has_permission('document.view')
  and (
    (owner_type = 'PLAYER' and exists (
      select 1
      from public.players p
      join public.teams t on t.id = p.team_id
      where p.id = documents.owner_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (owner_type = 'OFFICIAL' and exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.official_id = documents.owner_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
  )
);
