-- Batch 2.8: permit scoped server-side identity masking for the Player admin read DTO.
insert into public.permissions (code, name) values
  ('player.view', 'View players')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'player.view'
where r.code in (
  'SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'VERIFIER',
  'MATCH_OPERATOR', 'CONTINGENT_ADMIN', 'TEAM_MANAGER'
)
on conflict do nothing;

create policy identities_read_player_scoped on public.identities
for select to authenticated
using (
  player_id is not null
  and app_private.has_permission('player.view')
  and exists (
    select 1
    from public.players p
    join public.teams t on t.id = p.team_id
    where p.id = identities.player_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

grant select on public.identities to authenticated;
