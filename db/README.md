# db

Drizzle schema, migrations, SQL and scripts for the Supabase Postgres backend. This package is dev/setup tooling only — nothing here runs as a live server; the frontend talks to Supabase directly and Row Level Security (RLS) plus the functions in `platform.sql` are what protect the data.

## The model in one paragraph

Anyone can sign up (with a unique `@username`). **Coach tools are paywalled in the database**: a user has coach access only while they have a row in `coach_subscriptions` (created by an admin today, by payments later). **Clients are free.** A coach invites a client by `@username`; the client accepts or declines in their dashboard. A coach builds a **program** (a named list of days of exercises), then sends it to one accepted client. **Admins** (a flag on `profiles`) grant/revoke coach access and invite other admins. Nothing coach/admin/subscription related is writable directly from the app: it all goes through `security definer` functions that check who is calling.

## Fresh setup

1. Create a Supabase project at supabase.com.
2. Copy `.env.example` to `.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (Project Settings → API / Database). `MONGO_URI` is only needed for the one-time import of old data.
3. `npm install`
4. Apply the migrations in order: `npm run run-sql migrations/0000_*.sql`, then `0001`, `0002`, `0003`, `0004` (see gotchas below for why not `push`).
5. `npm run run-sql rls.sql` — RLS for the core tables (profiles, exercises, workouts, sets, push subscriptions).
6. `npm run run-sql storage.sql` — the `avatars` bucket and its policies.
7. `npm run run-sql platform.sql` — usernames, the coach paywall, invites, programs and the admin area (safe to re-run).
8. `npm run smoke-test` — signs in as throwaway users and checks the security model end to end (creates and deletes `@smoke_*` users). Run it after any change to `platform.sql`.
9. Sign up in the app with your username, then `npm run make-admin <username>` to make yourself the first admin. From then on, admins invite admins at `/admin/team`.
10. Optional: `npm run find-user <email>` then `npm run migrate-from-mongo` to import the old MongoDB history onto an account (set `OWNER_USER_ID` in `.env`).

## Changing the schema

Edit `schema.ts`, `npm run generate`, review the new file in `migrations/`, apply it with `npm run run-sql migrations/<file>.sql`. Gotchas found while building this:

- **Don't mix drops and adds in one `generate`.** drizzle-kit asks interactively whether a dropped column/table was "renamed" to a new one, which can't be answered from a script. Do the drops as one migration, then the adds as another (that's what `0003` and `0004` are).
- **`auth.users` reference**: `schema.ts` references Supabase's own `auth.users` table (for `profiles.id`) so TypeScript can check the relationship, but Supabase owns that table. The first migration had its `CREATE TABLE "auth"."users"` statement removed by hand; the tracked snapshot already reflects that.
- **`drizzle-kit push` can crash** on this project (`TypeError: Cannot read properties of undefined (reading 'replace')`), so migrations are applied with `run-sql` instead.
- Policies and functions live in the `.sql` files, not in `schema.ts`.

## Files

- `schema.ts`, `migrations/` — tables (Drizzle).
- `rls.sql`, `storage.sql` — base RLS and avatar storage.
- `platform.sql` — the security model and all functions (usernames, paywall, invites, programs, admin).
- `run-sql.ts` — apply any `.sql` file against `DATABASE_URL`.
- `smoke-test.ts` — end-to-end security checks against the live project.
- `make-admin.ts`, `find-user.ts`, `migrate-from-mongo.ts` — one-off helpers.
