-- Row Level Security policies.
-- Run this once against the Supabase Postgres instance AFTER `drizzle-kit push`
-- has created the tables (via the Supabase SQL editor, or `psql "$DATABASE_URL" -f db/rls.sql`).
--
-- Deliberately does not reference any coach/client relationship table yet --
-- that comes in a later phase. Every policy here is owner-only, so the app
-- keeps working as a plain solo workout log with zero coach-related rows.

alter table profiles enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table sets enable row level security;
alter table push_subscriptions enable row level security;

-- profiles: a user can only see/edit their own row.
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- exercises: shared catalog. Any authenticated user can read and contribute,
-- matching today's app behavior (nothing currently gates who can add/edit one).
create policy "exercises_select_authenticated" on exercises
  for select using (auth.role() = 'authenticated');
create policy "exercises_insert_authenticated" on exercises
  for insert with check (auth.role() = 'authenticated');
create policy "exercises_update_authenticated" on exercises
  for update using (auth.role() = 'authenticated');
create policy "exercises_delete_authenticated" on exercises
  for delete using (auth.role() = 'authenticated');

-- workouts: owner-only CRUD.
create policy "workouts_all_own" on workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workout_exercises: owner-only, via the parent workout's owner.
create policy "workout_exercises_all_own" on workout_exercises
  for all using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

-- sets: owner-only, via the workout_exercise -> workout chain.
create policy "sets_all_own" on sets
  for all using (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- push_subscriptions: owner-only.
create policy "push_subscriptions_all_own" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
