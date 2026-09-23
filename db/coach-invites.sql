-- Platform-level coach signup invites. No direct table access for anyone --
-- everything goes through these two functions, same pattern as the client
-- invite flow in coach-client.sql. coach_invites rows are created with the
-- service role key (db/create-coach-invite.ts), never through the app.

alter table coach_invites enable row level security;

create or replace function get_pending_coach_invite(p_token uuid)
returns table(email text, status text)
language sql
security definer
set search_path = public
as $$
  select email, status from coach_invites where invite_token = p_token;
$$;

revoke all on function get_pending_coach_invite(uuid) from public;
grant execute on function get_pending_coach_invite(uuid) to anon, authenticated;

create or replace function accept_coach_invite_signup(p_token uuid)
returns coach_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  result coach_invites;
begin
  update coach_invites
  set status = 'accepted', accepted_at = now()
  where invite_token = p_token and status = 'pending'
  returning * into result;

  if result is null then
    raise exception 'Invite not found or already used';
  end if;

  update profiles set role = 'coach' where id = auth.uid();

  return result;
end;
$$;

revoke all on function accept_coach_invite_signup(uuid) from public;
grant execute on function accept_coach_invite_signup(uuid) to authenticated;
