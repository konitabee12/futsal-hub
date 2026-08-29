-- Batch 2.13: Verification decision mutation authorization and RLS policies.

-- RLS policy: verification_cases UPDATE for decisions (scoped to accessible cases)
create policy verification_cases_update_decision on public.verification_cases
for update to authenticated
using (
  app_private.has_permission('verification.decide')
  and (
    (subject_type = 'PLAYER' and exists (
      select 1
      from public.players p
      join public.teams t on t.id = p.team_id
      where p.id = verification_cases.subject_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (subject_type = 'OFFICIAL' and exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.official_id = verification_cases.subject_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (subject_type = 'TEAM' and exists (
      select 1
      from public.teams t
      where t.id = verification_cases.subject_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (subject_type = 'CONTINGENT' and app_private.has_contingent_access(verification_cases.subject_id))
  )
)
with check (
  app_private.has_permission('verification.decide')
  and (
    (subject_type = 'PLAYER' and exists (
      select 1
      from public.players p
      join public.teams t on t.id = p.team_id
      where p.id = verification_cases.subject_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (subject_type = 'OFFICIAL' and exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.official_id = verification_cases.subject_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (subject_type = 'TEAM' and exists (
      select 1
      from public.teams t
      where t.id = verification_cases.subject_id
        and app_private.has_contingent_access(t.contingent_id)
    ))
    or (subject_type = 'CONTINGENT' and app_private.has_contingent_access(verification_cases.subject_id))
  )
);

-- RLS policy: verification_decisions INSERT for decision recording
create policy verification_decisions_insert_on_accessible_case on public.verification_decisions
for insert to authenticated
with check (
  app_private.has_permission('verification.decide')
  and exists (
    select 1
    from public.verification_cases vc
    where vc.id = verification_decisions.case_id
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
  and verification_decisions.decided_by = auth.uid()
);
