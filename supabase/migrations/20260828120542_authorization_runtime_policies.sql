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
				or (r.code in ('FUTSAL_ADMIN', 'VERIFIER', 'COMPETITION_OPERATOR', 'MATCH_OPERATOR', 'MATCH_OFFICIAL') and ur.sport_id = c.sport_id)
				or (r.code = 'CONTINGENT_ADMIN' and ur.contingent_id = c.id)
			)
	);
$$;

create policy roles_read_authenticated on public.roles
for select to authenticated
using (true);

create policy permissions_read_authenticated on public.permissions
for select to authenticated
using (true);

create policy role_permissions_read_authenticated on public.role_permissions
for select to authenticated
using (true);

create policy user_roles_read_self on public.user_roles
for select to authenticated
using (user_id = auth.uid());

create policy documents_read_scoped on public.documents
for select to authenticated
using (
	app_private.has_permission('document.view')
	and (
		(owner_type = 'CONTINGENT' and app_private.has_contingent_access(owner_id))
		or (owner_type = 'TEAM' and exists (
			select 1 from public.teams t
			where t.id = owner_id and app_private.has_contingent_access(t.contingent_id)
		))
	)
);

grant select on table public.documents to authenticated;

create or replace function app_private.has_contingent_create_access(target_event_id uuid, target_sport_id uuid)
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
				r.code = 'SUPER_ADMIN'
				or (r.code = 'EVENT_ADMIN' and ur.event_id = target_event_id)
				or (r.code = 'FUTSAL_ADMIN' and ur.sport_id = target_sport_id)
			)
	);
$$;

create policy contingents_insert_scoped on public.contingents
for insert to authenticated
with check (
	app_private.has_permission('contingent.create')
	and app_private.has_contingent_create_access(event_id, sport_id)
);

create policy audit_logs_insert_actor on public.audit_logs
for insert to authenticated
with check (actor = auth.uid());

grant insert on table public.audit_logs to authenticated;

create policy groups_read_scoped on public.groups
for select to authenticated
using (exists (
	select 1
	from public.group_teams gt
	join public.teams t on t.id = gt.team_id
	where gt.group_id = groups.id
		and app_private.has_contingent_access(t.contingent_id)
));

create policy group_teams_read_scoped on public.group_teams
for select to authenticated
using (exists (
	select 1 from public.teams t
	where t.id = group_teams.team_id
		and app_private.has_contingent_access(t.contingent_id)
));

grant select on table public.groups, public.group_teams to authenticated;

create view public.team_player_counts as
select t.id as team_id, count(p.id)::integer as player_count
from public.teams t
left join public.players p on p.team_id = t.id
where app_private.has_contingent_access(t.contingent_id)
group by t.id;

grant select on public.team_player_counts to authenticated;

insert into public.roles (code, name) values
	('SUPER_ADMIN', 'Super Admin'),
	('EVENT_ADMIN', 'Admin Event'),
	('FUTSAL_ADMIN', 'Admin Futsal'),
	('VERIFIER', 'Verifikator'),
	('CONTINGENT_ADMIN', 'Admin Kontingen')
on conflict (code) do nothing;

insert into public.permissions (code, name) values
	('contingent.view', 'View contingents'),
	('contingent.create', 'Create contingents'),
	('contingent.update', 'Update contingents')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN')
	and p.code in ('contingent.view', 'contingent.create', 'contingent.update')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'VERIFIER' and p.code = 'contingent.view'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'CONTINGENT_ADMIN' and p.code in ('contingent.view', 'contingent.update')
on conflict do nothing;
