-- Coach-client relationship: invite-based, one coach to many clients.
-- Run once via `npm run run-sql coach-client.sql`, after rls.sql/storage.sql.

alter table coach_client_links enable row level security;

-- A coach manages their own invites/links (create, revoke, list their clients).
create policy "coach_client_links_all_as_coach" on coach_client_links
  for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- A client can see the link(s) pointing at them, to know who their coach is.
create policy "coach_client_links_select_as_client" on coach_client_links
  for select using (auth.uid() = client_id);

-- Redeem an invite. Runs with elevated privilege (security definer) because the
-- invitee doesn't own the row yet (client_id is still null) so no ordinary RLS
-- policy could let them update it -- this function is the one narrow exception,
-- and it only ever links the invite to the CALLING user's own auth.uid().
create or replace function accept_coach_invite(p_token uuid)
returns coach_client_links
language plpgsql
security definer
set search_path = public
as $$
declare
  result coach_client_links;
begin
  update coach_client_links
  set client_id = auth.uid(), status = 'accepted', accepted_at = now()
  where invite_token = p_token and status = 'pending'
  returning * into result;

  if result is null then
    raise exception 'Invite not found or already used';
  end if;

  return result;
end;
$$;

revoke all on function accept_coach_invite(uuid) from public;
grant execute on function accept_coach_invite(uuid) to authenticated;

-- Coaches get read access into their accepted clients' data, alongside each
-- client's own owner-only access from rls.sql (RLS policies are OR'd together).

create policy "profiles_select_as_coach" on profiles
  for select using (
    exists (
      select 1 from coach_client_links l
      where l.client_id = profiles.id and l.coach_id = auth.uid() and l.status = 'accepted'
    )
  );

create policy "workouts_select_as_coach" on workouts
  for select using (
    exists (
      select 1 from coach_client_links l
      where l.client_id = workouts.user_id and l.coach_id = auth.uid() and l.status = 'accepted'
    )
  );

create policy "workout_exercises_select_as_coach" on workout_exercises
  for select using (
    exists (
      select 1 from workouts w
      join coach_client_links l on l.client_id = w.user_id
      where w.id = workout_id and l.coach_id = auth.uid() and l.status = 'accepted'
    )
  );

create policy "sets_select_as_coach" on sets
  for select using (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      join coach_client_links l on l.client_id = w.user_id
      where we.id = workout_exercise_id and l.coach_id = auth.uid() and l.status = 'accepted'
    )
  );
