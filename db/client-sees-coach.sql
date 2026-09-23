-- Lets a client read the profile of a coach they're linked to (accepted link
-- only), so the client dashboard can show who their coach is. Mirror image of
-- profiles_select_as_coach in coach-client.sql. Run once via
-- `npm run run-sql client-sees-coach.sql`.

create policy "profiles_select_coach_as_client" on profiles
  for select using (
    exists (
      select 1 from coach_client_links l
      where l.coach_id = profiles.id and l.client_id = auth.uid() and l.status = 'accepted'
    )
  );
