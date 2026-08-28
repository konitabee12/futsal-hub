create or replace function app_private.has_permission(required_permission text)
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
		join public.role_permissions rp on rp.role_id = r.id
		join public.permissions p on p.id = rp.permission_id
		where ur.user_id = auth.uid()
			and p.code = required_permission
	);
$$;

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
		where ur.user_id = auth.uid()
			and (
				r.code in ('SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'VERIFIER', 'COMPETITION_OPERATOR', 'MATCH_OPERATOR', 'MATCH_OFFICIAL')
				or ur.contingent_id = target_contingent_id
			)
	);
$$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger users_touch_updated_at
before update on public.users
for each row execute function app_private.touch_updated_at();

create trigger contingents_touch_updated_at
before update on public.contingents
for each row execute function app_private.touch_updated_at();

create trigger teams_touch_updated_at
before update on public.teams
for each row execute function app_private.touch_updated_at();

create trigger players_touch_updated_at
before update on public.players
for each row execute function app_private.touch_updated_at();

create trigger officials_touch_updated_at
before update on public.officials
for each row execute function app_private.touch_updated_at();

create trigger verification_cases_touch_updated_at
before update on public.verification_cases
for each row execute function app_private.touch_updated_at();

create trigger competitions_touch_updated_at
before update on public.competitions
for each row execute function app_private.touch_updated_at();

create trigger matches_touch_updated_at
before update on public.matches
for each row execute function app_private.touch_updated_at();

create trigger match_results_touch_updated_at
before update on public.match_results
for each row execute function app_private.touch_updated_at();

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.sports enable row level security;
alter table public.contingents enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.identities enable row level security;
alter table public.officials enable row level security;
alter table public.team_members enable row level security;
alter table public.documents enable row level security;
alter table public.verification_cases enable row level security;
alter table public.verification_items enable row level security;
alter table public.verification_decisions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_categories enable row level security;
alter table public.competition_stages enable row level security;
alter table public.competition_rules enable row level security;
alter table public.groups enable row level security;
alter table public.group_teams enable row level security;
alter table public.venues enable row level security;
alter table public.fixtures enable row level security;
alter table public.matches enable row level security;
alter table public.match_officials enable row level security;
alter table public.lineups enable row level security;
alter table public.match_events enable row level security;
alter table public.match_results enable row level security;
alter table public.standings enable row level security;
alter table public.standings_snapshots enable row level security;

create policy users_read_self on public.users for select to authenticated
using (id = auth.uid());

create policy notifications_read_own on public.notifications for select to authenticated
using (user_id = auth.uid());

create policy contingents_read_scoped on public.contingents for select to authenticated
using (app_private.has_permission('contingent.view') and app_private.has_contingent_access(id));

create policy contingents_write_scoped on public.contingents for all to authenticated
using (app_private.has_permission('contingent.update') and app_private.has_contingent_access(id))
with check (app_private.has_permission('contingent.update') and app_private.has_contingent_access(id));

create policy teams_read_scoped on public.teams for select to authenticated
using (app_private.has_permission('team.view') and app_private.has_contingent_access(contingent_id));

create policy teams_write_scoped on public.teams for all to authenticated
using (app_private.has_permission('team.update') and app_private.has_contingent_access(contingent_id))
with check (app_private.has_permission('team.update') and app_private.has_contingent_access(contingent_id));

create policy players_read_scoped on public.players for select to authenticated
using (
	app_private.has_permission('player.view')
	and exists (select 1 from public.teams t where t.id = team_id and app_private.has_contingent_access(t.contingent_id))
);

create policy players_write_scoped on public.players for all to authenticated
using (
	app_private.has_permission('player.update')
	and exists (select 1 from public.teams t where t.id = team_id and app_private.has_contingent_access(t.contingent_id))
)
with check (
	app_private.has_permission('player.update')
	and exists (select 1 from public.teams t where t.id = team_id and app_private.has_contingent_access(t.contingent_id))
);

create view public.public_players as
select id, team_id, name, number, position, eligibility
from public.players
where status in ('VERIFIED', 'ACTIVE') and eligibility = 'ELIGIBLE';

create view public.public_teams as
select id, category, name, short_name, head_coach, eligibility
from public.teams
where status in ('VERIFIED', 'ACTIVE');

create view public.public_contingents as
select id, code, name, region, status
from public.contingents
where status in ('VERIFIED', 'ACTIVE');

revoke all on table public.players, public.identities, public.documents, public.verification_cases,
	public.verification_items, public.verification_decisions, public.audit_logs from anon;
revoke all on table public.players, public.identities, public.documents, public.verification_cases,
	public.verification_items, public.verification_decisions, public.audit_logs from authenticated;

grant select, insert, update, delete on table public.users, public.contingents, public.teams,
	public.players, public.notifications to authenticated;
grant select on public.public_players, public.public_teams, public.public_contingents to anon, authenticated;
