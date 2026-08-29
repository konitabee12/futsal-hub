-- Batch 2.10: read-only Official access through the actual team_members bridge.
insert into public.permissions (code, name) values
  ('official.view', 'View officials')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'official.view'
where r.code in (
  'SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'VERIFIER',
  'CONTINGENT_ADMIN', 'TEAM_MANAGER'
)
on conflict do nothing;

create policy officials_read_scoped on public.officials
for select to authenticated
using (
  app_private.has_permission('official.view')
  and exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.official_id = officials.id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

create policy team_members_read_official_scoped on public.team_members
for select to authenticated
using (
  official_id is not null
  and app_private.has_permission('official.view')
  and exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

grant select on public.officials, public.team_members to authenticated;
