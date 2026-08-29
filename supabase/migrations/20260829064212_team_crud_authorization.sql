-- Batch 2.7: split team create/update permissions and scope-aware RLS policies.
insert into public.permissions (code, name) values
  ('team.view', 'View teams'),
  ('team.create', 'Create teams'),
  ('team.update', 'Update teams')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('team.view', 'team.create', 'team.update')
where r.code in ('SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'CONTINGENT_ADMIN')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'team.view'
where r.code in ('VERIFIER', 'COMPETITION_OPERATOR', 'MATCH_OPERATOR')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('team.view', 'team.update')
where r.code = 'TEAM_MANAGER'
on conflict do nothing;

create or replace function app_private.has_contingent_access(target_contingent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.contingents c on c.id = target_contingent_id
    where ur.user_id = auth.uid()
      and (
        r.code = 'SUPER_ADMIN'
        or (r.code = 'EVENT_ADMIN' and ur.event_id = c.event_id)
        or (r.code in ('FUTSAL_ADMIN', 'VERIFIER', 'COMPETITION_OPERATOR') and ur.sport_id = c.sport_id)
        or (r.code = 'CONTINGENT_ADMIN' and ur.contingent_id = c.id)
        or (r.code = 'TEAM_MANAGER' and exists (
          select 1 from public.teams t where t.id = ur.team_id and t.contingent_id = c.id
        ))
      )
  );
$$;

drop policy if exists teams_write_scoped on public.teams;

create policy teams_insert_scoped on public.teams
for insert to authenticated
with check (
  app_private.has_permission('team.create')
  and app_private.has_contingent_access(contingent_id)
);

create policy teams_update_scoped on public.teams
for update to authenticated
using (
  app_private.has_permission('team.update')
  and app_private.has_contingent_access(contingent_id)
)
with check (
  app_private.has_permission('team.update')
  and app_private.has_contingent_access(contingent_id)
);
