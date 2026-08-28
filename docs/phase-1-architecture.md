# Phase 1 Architecture

## Decision

Supabase is the target persistence platform for PostgreSQL, Auth, Storage, and
Row Level Security. The application keeps a repository and service boundary so
React components do not access database tables directly.

```text
Route/UI -> React Query hook -> domain service -> repository/API -> authorization -> PostgreSQL/RLS
```

## Current Runtime State

The repository still runs against static mock data. Supabase runtime access is
not enabled until deployment credentials are supplied through `.env` based on
`.env.example`. No service-role or secret key belongs in a `VITE_*` variable.

## Security Boundaries

- Frontend permission checks are usability only, never the security boundary.
- Backend services must call authorization with user identity, permission, and resource scope.
- PostgreSQL RLS policies enforce authenticated access and contingent ownership.
- Public views expose only public columns; sensitive identity and document tables are not public.
- Critical service operations append audit records independently of UI events.

## Migration Groups

- `foundation_identity`: users, roles, permissions, organization, people, documents, verification, notifications, and audit logs.
- `foundation_competition`: competitions, groups, venues, fixtures, matches, lineups, events, results, and standings.
- `foundation_security`: timestamp triggers, RLS helpers/policies, and public read views.

## Phase 1 Limitations

Authentication gateway implementation, Supabase client wiring, storage policies,
seed data, and route migration remain prerequisites for Phase 2. Existing
routes intentionally continue reading mock data until those pieces are tested.