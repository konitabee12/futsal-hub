create extension if not exists pgcrypto;

create schema if not exists app_private;

create table public.roles (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	name text not null,
	created_at timestamptz not null default now()
);

create table public.permissions (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	name text not null,
	created_at timestamptz not null default now()
);

create table public.role_permissions (
	role_id uuid not null references public.roles(id) on delete cascade,
	permission_id uuid not null references public.permissions(id) on delete cascade,
	primary key (role_id, permission_id)
);

create table public.users (
	id uuid primary key references auth.users(id) on delete cascade,
	display_name text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.user_roles (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users(id) on delete cascade,
	role_id uuid not null references public.roles(id) on delete restrict,
	event_id uuid,
	sport_id uuid,
	contingent_id uuid,
	team_id uuid,
	created_at timestamptz not null default now(),
	unique (user_id, role_id, event_id, sport_id, contingent_id, team_id)
);

create table public.events (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	starts_at timestamptz,
	ends_at timestamptz,
	status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'INACTIVE')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.sports (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete cascade,
	name text not null,
	code text not null,
	unique (event_id, code)
);

create table public.contingents (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete restrict,
	sport_id uuid not null references public.sports(id) on delete restrict,
	code text not null,
	name text not null,
	region text not null,
	logo_path text,
	pic text not null,
	email text not null,
	phone text not null,
	status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'VERIFIED', 'REJECTED', 'ACTIVE', 'INACTIVE')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (event_id, sport_id, code)
);

create table public.teams (
	id uuid primary key default gen_random_uuid(),
	contingent_id uuid not null references public.contingents(id) on delete restrict,
	category text not null check (category in ('PUTRA', 'PUTRI')),
	name text not null,
	short_name text not null,
	logo_path text,
	manager text not null,
	head_coach text not null,
	status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'VERIFIED', 'REJECTED', 'ACTIVE', 'INACTIVE')),
	eligibility text not null default 'PENDING' check (eligibility in ('ELIGIBLE', 'NOT_ELIGIBLE', 'PENDING')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (contingent_id, category)
);

create table public.players (
	id uuid primary key default gen_random_uuid(),
	team_id uuid not null references public.teams(id) on delete restrict,
	name text not null,
	number integer not null check (number between 1 and 99),
	position text not null check (position in ('PENJAGA GAWANG', 'ANCHOR', 'FLANK', 'PIVOT')),
	birth_date date not null,
	status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'VERIFIED', 'REJECTED', 'ACTIVE', 'INACTIVE')),
	eligibility text not null default 'PENDING' check (eligibility in ('ELIGIBLE', 'NOT_ELIGIBLE', 'PENDING')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (team_id, number)
);

create table public.identities (
	id uuid primary key default gen_random_uuid(),
	player_id uuid references public.players(id) on delete cascade,
	official_id uuid,
	identity_type text not null check (identity_type in ('NIK', 'PASSPORT')),
	identity_number text not null,
	address text,
	phone text,
	email text,
	unique (identity_type, identity_number),
	check ((player_id is not null) <> (official_id is not null))
);

create table public.officials (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	position text not null check (position in ('TEAM_MANAGER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_DOCTOR', 'PHYSIO', 'KIT_MANAGER', 'OTHER')),
	status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'VERIFIED', 'REJECTED', 'ACTIVE', 'INACTIVE')),
	eligibility text not null default 'PENDING' check (eligibility in ('ELIGIBLE', 'NOT_ELIGIBLE', 'PENDING')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.team_members (
	team_id uuid not null references public.teams(id) on delete cascade,
	player_id uuid references public.players(id) on delete restrict,
	official_id uuid references public.officials(id) on delete restrict,
	created_at timestamptz not null default now(),
	primary key (team_id, player_id, official_id),
	check ((player_id is not null) <> (official_id is not null))
);

alter table public.user_roles add constraint user_roles_event_fk foreign key (event_id) references public.events(id) on delete cascade;
alter table public.user_roles add constraint user_roles_sport_fk foreign key (sport_id) references public.sports(id) on delete cascade;
alter table public.user_roles add constraint user_roles_contingent_fk foreign key (contingent_id) references public.contingents(id) on delete cascade;
alter table public.user_roles add constraint user_roles_team_fk foreign key (team_id) references public.teams(id) on delete cascade;
alter table public.identities add constraint identities_official_fk foreign key (official_id) references public.officials(id) on delete cascade;

create table public.documents (
	id uuid primary key default gen_random_uuid(),
	owner_type text not null check (owner_type in ('CONTINGENT', 'TEAM', 'PLAYER', 'OFFICIAL')),
	owner_id uuid not null,
	document_type text not null,
	file_reference text not null,
	version integer not null default 1 check (version > 0),
	uploaded_by uuid not null references public.users(id) on delete restrict,
	status text not null default 'PENDING' check (status in ('PENDING', 'VERIFIED', 'REJECTED')),
	created_at timestamptz not null default now(),
	unique (owner_type, owner_id, document_type, version)
);

create table public.verification_cases (
	id uuid primary key default gen_random_uuid(),
	subject_type text not null check (subject_type in ('CONTINGENT', 'TEAM', 'PLAYER', 'OFFICIAL')),
	subject_id uuid not null,
	status text not null default 'SUBMITTED' check (status in ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'VERIFIED', 'REJECTED')),
	submitted_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.verification_items (
	id uuid primary key default gen_random_uuid(),
	case_id uuid not null references public.verification_cases(id) on delete cascade,
	label text not null,
	status text not null default 'PENDING' check (status in ('PENDING', 'VERIFIED', 'REJECTED'))
);

create table public.verification_decisions (
	id uuid primary key default gen_random_uuid(),
	case_id uuid not null references public.verification_cases(id) on delete cascade,
	decision text not null check (decision in ('VERIFIED', 'NEEDS_CORRECTION', 'REJECTED', 'SUBMITTED')),
	decided_by uuid not null references public.users(id) on delete restrict,
	reason text,
	notes text,
	created_at timestamptz not null default now()
);

create table public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users(id) on delete cascade,
	title text not null,
	message text not null,
	read_at timestamptz,
	created_at timestamptz not null default now()
);

create table public.audit_logs (
	id uuid primary key default gen_random_uuid(),
	actor uuid references public.users(id) on delete set null,
	action text not null check (action in ('LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'VERIFY', 'REJECT', 'APPROVE', 'ELIGIBILITY_CHANGE', 'MATCH_RESULT_CHANGE', 'SCHEDULE_CHANGE', 'STANDINGS_RECALCULATION')),
	resource text not null,
	resource_id uuid not null,
	before_data jsonb,
	after_data jsonb,
	ip inet,
	user_agent text,
	created_at timestamptz not null default now()
);

create index contingents_sport_idx on public.contingents (sport_id);
create index teams_contingent_idx on public.teams (contingent_id);
create index players_team_idx on public.players (team_id);
create index documents_owner_idx on public.documents (owner_type, owner_id);
create index audit_logs_resource_idx on public.audit_logs (resource, resource_id, created_at desc);
