create table public.competitions (
	id uuid primary key default gen_random_uuid(),
	sport_id uuid not null references public.sports(id) on delete cascade,
	name text not null,
	status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'INACTIVE')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.competition_categories (
	id uuid primary key default gen_random_uuid(),
	competition_id uuid not null references public.competitions(id) on delete cascade,
	code text not null check (code in ('PUTRA', 'PUTRI')),
	name text not null,
	unique (competition_id, code)
);

create table public.competition_stages (
	id uuid primary key default gen_random_uuid(),
	category_id uuid not null references public.competition_categories(id) on delete cascade,
	code text not null,
	stage_order integer not null check (stage_order > 0),
	unique (category_id, code),
	unique (category_id, stage_order)
);

create table public.competition_rules (
	id uuid primary key default gen_random_uuid(),
	competition_id uuid not null references public.competitions(id) on delete cascade,
	rules jsonb not null default '{}'::jsonb,
	effective_at timestamptz not null default now()
);

create table public.groups (
	id uuid primary key default gen_random_uuid(),
	stage_id uuid not null references public.competition_stages(id) on delete cascade,
	name text not null,
	unique (stage_id, name)
);

create table public.group_teams (
	group_id uuid not null references public.groups(id) on delete cascade,
	team_id uuid not null references public.teams(id) on delete restrict,
	primary key (group_id, team_id)
);

create table public.venues (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	city text not null,
	capacity integer not null check (capacity > 0),
	courts integer not null default 1 check (courts > 0),
	unique (name, city)
);

create table public.fixtures (
	id uuid primary key default gen_random_uuid(),
	stage_id uuid not null references public.competition_stages(id) on delete restrict,
	group_id uuid references public.groups(id) on delete restrict,
	home_team_id uuid not null references public.teams(id) on delete restrict,
	away_team_id uuid not null references public.teams(id) on delete restrict,
	venue_id uuid references public.venues(id) on delete set null,
	scheduled_at timestamptz not null,
	created_at timestamptz not null default now(),
	check (home_team_id <> away_team_id)
);

create table public.matches (
	id uuid primary key default gen_random_uuid(),
	fixture_id uuid not null unique references public.fixtures(id) on delete restrict,
	referee text,
	status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'CHECK_IN', 'LIVE', 'HALFTIME', 'FINISHED', 'POSTPONED', 'CANCELLED', 'VOID')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.match_officials (
	match_id uuid not null references public.matches(id) on delete cascade,
	user_id uuid not null references public.users(id) on delete restrict,
	role text not null,
	primary key (match_id, user_id, role)
);

create table public.lineups (
	id uuid primary key default gen_random_uuid(),
	match_id uuid not null references public.matches(id) on delete cascade,
	team_id uuid not null references public.teams(id) on delete restrict,
	player_id uuid not null references public.players(id) on delete restrict,
	starter boolean not null default false,
	created_at timestamptz not null default now(),
	unique (match_id, player_id)
);

create table public.match_events (
	id uuid primary key default gen_random_uuid(),
	match_id uuid not null references public.matches(id) on delete cascade,
	team_id uuid not null references public.teams(id) on delete restrict,
	player_id uuid references public.players(id) on delete restrict,
	event_type text not null check (event_type in ('GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'FOUL', 'SUBSTITUTION', 'TIMEOUT', 'PENALTY')),
	minute integer check (minute >= 0),
	period integer check (period in (1, 2)),
	detail text,
	created_by uuid not null references public.users(id) on delete restrict,
	created_at timestamptz not null default now()
);

create table public.match_results (
	id uuid primary key default gen_random_uuid(),
	match_id uuid not null unique references public.matches(id) on delete cascade,
	home_score integer not null check (home_score >= 0),
	away_score integer not null check (away_score >= 0),
	status text not null default 'PENDING' check (status in ('PENDING', 'SUBMITTED', 'VERIFIED', 'PUBLISHED')),
	submitted_by uuid references public.users(id) on delete set null,
	verified_by uuid references public.users(id) on delete set null,
	submitted_at timestamptz,
	verified_at timestamptz,
	published_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.standings (
	id uuid primary key default gen_random_uuid(),
	group_id uuid not null references public.groups(id) on delete cascade,
	team_id uuid not null references public.teams(id) on delete restrict,
	played integer not null default 0 check (played >= 0),
	won integer not null default 0 check (won >= 0),
	draw integer not null default 0 check (draw >= 0),
	lost integer not null default 0 check (lost >= 0),
	goals_for integer not null default 0 check (goals_for >= 0),
	goals_against integer not null default 0 check (goals_against >= 0),
	points integer not null default 0 check (points >= 0),
	recalculated_at timestamptz not null default now(),
	unique (group_id, team_id)
);

create table public.standings_snapshots (
	id uuid primary key default gen_random_uuid(),
	competition_id uuid not null references public.competitions(id) on delete cascade,
	snapshot jsonb not null,
	created_by uuid references public.users(id) on delete set null,
	created_at timestamptz not null default now()
);

create index fixtures_schedule_idx on public.fixtures (scheduled_at);
create index matches_status_idx on public.matches (status);
create index match_events_match_idx on public.match_events (match_id, created_at);
create index match_results_status_idx on public.match_results (status);
