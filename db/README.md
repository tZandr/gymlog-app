# db

Drizzle schema, migrations, and one-time scripts for the Supabase Postgres backend. This package is dev/setup tooling only — nothing here runs as a live server; the frontend talks to Supabase directly.

## One-time setup

1. Create a Supabase project at supabase.com.
2. Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Project Settings -> API.
   - `DATABASE_URL` — Project Settings -> Database -> Connection string -> URI.
   - `MONGO_URI` — same value as `backend/.env`, only needed once for the data migration.
3. `npm install`
4. `npm run push` — creates all tables in Supabase from `schema.ts`.
5. `npm run run-sql rls.sql` — applies the RLS policies.
6. `npm run run-sql storage.sql` — creates the `avatars` bucket and its folder-scoped policies.
7. `npm run run-sql coach-client.sql` — creates the coach-client invite/link table's policies, the `accept_coach_invite` function, and the coach-read policies on profiles/workouts/workout_exercises/sets.
8. `npm run run-sql user-provisioning.sql` — trigger that auto-creates a `profiles` row for every new signup.
9. `npm run run-sql invite-preview.sql` — lets an unauthenticated visitor on a client invite link see who invited them before they have an account.
10. `npm run run-sql coach-invites.sql` — RLS + functions for platform-level coach signup invites.

No accounts are created by any script from here on — everyone, including the very first coach and client, signs up through the app itself:

11. `npm run create-coach-invite <email>` — prints a coach signup link (`/coach-signup/<token>`). This is how you onboard a new coach: send them this link when they buy in or want a demo. Run it once for yourself acting as the first coach.
12. Open that link, sign up for real — that account is now a coach.
13. Log in as that coach, go to Clients, and invite yourself (or whoever's real workout history you're migrating) as a client. Open the resulting `/invite/<token>` link and sign up for real.
14. `npm run find-user <email>` — get that new client account's user id; put it in `.env` as `OWNER_USER_ID`.
15. `npm run migrate-from-mongo` — one-time import of the existing MongoDB data (exercises, workouts, sets) onto that account.

## If you change `schema.ts` later

`npm run generate` produces a new SQL migration by diffing against `migrations/meta/`. Two gotchas found while building this:

- **`auth.users` reference**: `schema.ts` references Supabase's own `auth.users` table (for the `profiles.id` foreign key) so Drizzle/TypeScript can type-check the relationship, but that table already exists and is managed by Supabase Auth. The very first migration had its `CREATE TABLE "auth"."users"` statement manually removed for that reason (see `migrations/0000_*.sql`); the tracked snapshot already reflects that, so this shouldn't recur unless the `auth.users` stub definition itself changes.
- **`drizzle-kit push` can crash** on this project (`TypeError: Cannot read properties of undefined (reading 'replace')`, inside its own live-introspection diffing) once there's enough schema in place. If that happens, use `npm run generate` instead to produce a migration file, review it, then apply it with `npm run run-sql migrations/<file>.sql` — that's the path that's actually been used here since the second migration.

## Scripts

- `npm run push` — push `schema.ts` straight to the database. Works for a from-scratch database; see the `drizzle-kit push` gotcha above if it starts crashing.
- `npm run generate` — generate a versioned SQL migration file instead of pushing directly (safer once there's real data, and the current workaround for the `push` crash).
- `npm run studio` — Drizzle Studio, a GUI for browsing the database.
- `npm run run-sql <file.sql>` — apply a raw SQL file against `DATABASE_URL` (used for `rls.sql`/`storage.sql`/etc., no `psql` install required).
- `npm run create-coach-invite <email>` — print a platform-level coach signup link for onboarding a new coach.
- `npm run find-user <email>` — look up a user's id by email (needed since Supabase Auth has no direct email lookup).
- `npm run migrate-from-mongo` — one-time import from the old MongoDB data.
