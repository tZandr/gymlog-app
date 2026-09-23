-- Lets an unauthenticated visitor on an /invite/:token page see who invited
-- them and whether the invite is still valid, before they have an account.
-- Deliberately exposes only these three columns, never the full row.

create or replace function get_pending_invite(p_token uuid)
returns table(client_email text, coach_name text, status text)
language sql
security definer
set search_path = public
as $$
  select l.client_email, p.name, l.status
  from coach_client_links l
  join profiles p on p.id = l.coach_id
  where l.invite_token = p_token;
$$;

revoke all on function get_pending_invite(uuid) from public;
grant execute on function get_pending_invite(uuid) to anon, authenticated;
