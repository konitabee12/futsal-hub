-- Batch 2.14: Eligibility read and decision authorization RLS policies.

-- RLS policy: players read eligibility (scoped by team/contingent)
create policy players_read_eligibility on public.players
for select to authenticated
using (
  app_private.has_permission('eligibility.view')
  and app_private.has_contingent_access((select contingent_id from public.teams where id = players.team_id))
);

-- RLS policy: players update eligibility (scoped by team/contingent)
create policy players_update_eligibility on public.players
for update to authenticated
using (
  app_private.has_permission('eligibility.decide')
  and app_private.has_contingent_access((select contingent_id from public.teams where id = players.team_id))
)
with check (
  app_private.has_permission('eligibility.decide')
  and app_private.has_contingent_access((select contingent_id from public.teams where id = players.team_id))
);
