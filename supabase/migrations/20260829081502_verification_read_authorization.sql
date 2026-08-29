-- Batch 2.12: Verification read authorization and RLS policies.

-- Add verification.view permission
insert into public.permissions (code, name) values
  ('verification.view', 'View verification cases')
on conflict (code) do nothing;

-- Assign verification.view to appropriate roles
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'verification.view'
where r.code in ('SUPER_ADMIN', 'EVENT_ADMIN', 'FUTSAL_ADMIN', 'VERIFIER', 'CONTINGENT_ADMIN')
on conflict do nothing;

-- RLS policy: verification_cases read for PLAYER subjects (scoped to CONTINGENT via TEAM)
create policy verification_cases_read_player_scoped on public.verification_cases
for select to authenticated
using (
  app_private.has_permission('verification.view')
  and subject_type = 'PLAYER'
  and exists (
    select 1
    from public.players p
    join public.teams t on t.id = p.team_id
    where p.id = verification_cases.subject_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

-- RLS policy: verification_cases read for OFFICIAL subjects (scoped to CONTINGENT via TEAM_MEMBERS)
create policy verification_cases_read_official_scoped on public.verification_cases
for select to authenticated
using (
  app_private.has_permission('verification.view')
  and subject_type = 'OFFICIAL'
  and exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.official_id = verification_cases.subject_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

-- RLS policy: verification_cases read for TEAM subjects (scoped to CONTINGENT)
create policy verification_cases_read_team_scoped on public.verification_cases
for select to authenticated
using (
  app_private.has_permission('verification.view')
  and subject_type = 'TEAM'
  and exists (
    select 1
    from public.teams t
    where t.id = verification_cases.subject_id
      and app_private.has_contingent_access(t.contingent_id)
  )
);

-- RLS policy: verification_cases read for CONTINGENT subjects
create policy verification_cases_read_contingent_scoped on public.verification_cases
for select to authenticated
using (
  app_private.has_permission('verification.view')
  and subject_type = 'CONTINGENT'
  and app_private.has_contingent_access(verification_cases.subject_id)
);

-- RLS policy: verification_items read (inherit from parent case)
create policy verification_items_read_via_case on public.verification_items
for select to authenticated
using (
  exists (
    select 1
    from public.verification_cases vc
    where vc.id = verification_items.case_id
      and app_private.has_permission('verification.view')
      and (
        (vc.subject_type = 'PLAYER' and exists (
          select 1
          from public.players p
          join public.teams t on t.id = p.team_id
          where p.id = vc.subject_id
            and app_private.has_contingent_access(t.contingent_id)
        ))
        or (vc.subject_type = 'OFFICIAL' and exists (
          select 1
          from public.team_members tm
          join public.teams t on t.id = tm.team_id
          where tm.official_id = vc.subject_id
            and app_private.has_contingent_access(t.contingent_id)
        ))
        or (vc.subject_type = 'TEAM' and exists (
          select 1
          from public.teams t
          where t.id = vc.subject_id
            and app_private.has_contingent_access(t.contingent_id)
        ))
        or (vc.subject_type = 'CONTINGENT' and app_private.has_contingent_access(vc.subject_id))
      )
  )
);

-- RLS policy: verification_decisions read (inherit from parent case)
create policy verification_decisions_read_via_case on public.verification_decisions
for select to authenticated
using (
  exists (
    select 1
    from public.verification_cases vc
    where vc.id = verification_decisions.case_id
      and app_private.has_permission('verification.view')
      and (
        (vc.subject_type = 'PLAYER' and exists (
          select 1
          from public.players p
          join public.teams t on t.id = p.team_id
          where p.id = vc.subject_id
            and app_private.has_contingent_access(t.contingent_id)
        ))
        or (vc.subject_type = 'OFFICIAL' and exists (
          select 1
          from public.team_members tm
          join public.teams t on t.id = tm.team_id
          where tm.official_id = vc.subject_id
            and app_private.has_contingent_access(t.contingent_id)
        ))
        or (vc.subject_type = 'TEAM' and exists (
          select 1
          from public.teams t
          where t.id = vc.subject_id
            and app_private.has_contingent_access(t.contingent_id)
        ))
        or (vc.subject_type = 'CONTINGENT' and app_private.has_contingent_access(vc.subject_id))
      )
  )
);
