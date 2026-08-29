-- Batch 2.9: scoped Player creation and mutation privileges.
-- Protected field enforcement remains at the server-function/service boundary;
-- this policy only grants rows within the actor's existing team/contingent scope.
insert into public.permissions (code, name) values
  ('player.create', 'Create players'),
  ('player.update', 'Update players')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('player.create', 'player.update')
where r.code in ('SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'CONTINGENT_ADMIN', 'TEAM_MANAGER')
on conflict do nothing;

drop policy if exists players_write_scoped on public.players;

create policy players_insert_scoped on public.players
for insert to authenticated
with check (
  app_private.has_permission('player.create')
  and exists (
    select 1 from public.teams t
    where t.id = players.team_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

create policy players_update_scoped on public.players
for update to authenticated
using (
  app_private.has_permission('player.update')
  and exists (
    select 1 from public.teams t
    where t.id = players.team_id
      and app_private.has_contingent_access(t.contingent_id)
  )
)
with check (
  app_private.has_permission('player.update')
  and exists (
    select 1 from public.teams t
    where t.id = players.team_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

create policy identities_insert_player_scoped on public.identities
for insert to authenticated
with check (
  player_id is not null
  and app_private.has_permission('player.create')
  and exists (
    select 1
    from public.players p
    join public.teams t on t.id = p.team_id
    where p.id = identities.player_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

grant insert, update on public.players to authenticated;
grant insert on public.identities to authenticated;
