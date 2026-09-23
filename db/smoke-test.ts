// End-to-end check of the security model against the live Supabase project.
// Creates throwaway users (@smoke_*), signs in as them with the public anon key,
// tries things they should and should not be able to do, then deletes them.
//   npm run smoke-test
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in db/.env and VITE_SUPABASE_ANON_KEY in ../frontend/.env.
import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: '../frontend/.env' });
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (db/.env) or VITE_SUPABASE_ANON_KEY (frontend/.env)');
}

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opts);
const anon = createClient(SUPABASE_URL, VITE_SUPABASE_ANON_KEY, opts);
const PASSWORD = 'smoke-test-pass-123';

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail !== undefined ? `  -> ${JSON.stringify(detail)}` : ''}`);
}

const created: string[] = [];
async function makeUser(handle: string): Promise<{ id: string; client: SupabaseClient }> {
  const email = `${handle}@gymlog.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { username: handle },
  });
  if (error) throw error;
  created.push(data.user.id);
  const client = createClient(SUPABASE_URL!, VITE_SUPABASE_ANON_KEY!, opts);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function cleanup() {
  for (const id of created) await admin.auth.admin.deleteUser(id);
}

try {
  // ---- usernames ----
  const before = await anon.rpc('username_available', { p_username: 'smoke_admin' });
  check('username_available is callable signed-out and says free', before.data === true, before);

  const a = await makeUser('smoke_admin');
  const b = await makeUser('smoke_coach');
  const c = await makeUser('smoke_client');
  const d = await makeUser('smoke_stranger');

  const taken = await anon.rpc('username_available', { p_username: 'SMOKE_ADMIN' });
  check('username_available says taken (case-insensitive)', taken.data === false, taken);

  const dup = await admin.auth.admin.createUser({
    email: 'smoke_dup@gymlog.test', password: PASSWORD, email_confirm: true, user_metadata: { username: 'smoke_admin' },
  });
  if (dup.data.user) created.push(dup.data.user.id);
  const dupProfile = dup.data.user
    ? await admin.from('profiles').select('username').eq('id', dup.data.user.id).single()
    : null;
  check('duplicate username at signup still creates the account, with no username', !!dup.data.user && dupProfile?.data?.username === null, dup.error ?? dupProfile);

  const setTaken = await d.client.rpc('set_username', { p_username: 'smoke_coach' });
  check('set_username refuses a name that is already set on the account', !!setTaken.error, setTaken);

  const badFormat = await admin.auth.admin.createUser({
    email: 'smoke_bad@gymlog.test', password: PASSWORD, email_confirm: true, user_metadata: { username: 'Bad Name!' },
  });
  if (badFormat.data.user) created.push(badFormat.data.user.id);
  const badProfile = badFormat.data.user
    ? await admin.from('profiles').select('username').eq('id', badFormat.data.user.id).single()
    : null;
  check('invalid username format is dropped, not stored', badProfile?.data?.username === null, badProfile);
  const setBad = await badFormat.data.user
    ? await (async () => {
        const cl = createClient(SUPABASE_URL!, VITE_SUPABASE_ANON_KEY!, opts);
        await cl.auth.signInWithPassword({ email: 'smoke_bad@gymlog.test', password: PASSWORD });
        return cl.rpc('set_username', { p_username: 'no' });
      })()
    : null;
  check('set_username rejects a bad format', !!setBad?.error, setBad);

  // ---- a plain user cannot escalate ----
  const esc = await c.client.from('profiles').update({ is_admin: true }).eq('id', c.id);
  const escCheck = await admin.from('profiles').select('is_admin').eq('id', c.id).single();
  check('a user cannot make themselves admin', !!esc.error && escCheck.data?.is_admin === false, { esc: esc.error, is_admin: escCheck.data });
  const okEdit = await c.client.from('profiles').update({ name: 'Smoke Client', bio: 'hi' }).eq('id', c.id);
  check('a user can still edit their own name/bio', !okEdit.error, okEdit.error);
  const usernameEdit = await c.client.from('profiles').update({ username: 'hijack' }).eq('id', c.id);
  check('a user cannot rewrite their username directly', !!usernameEdit.error, usernameEdit);
  const otherEdit = await c.client.from('profiles').update({ name: 'pwned' }).eq('id', b.id).select();
  check('a user cannot edit someone else', (otherEdit.data ?? []).length === 0, otherEdit);

  const ov = await c.client.rpc('admin_overview');
  check('non-admin cannot call admin_overview', !!ov.error, ov);
  const inv0 = await c.client.rpc('invite_client', { p_username: 'smoke_coach' });
  check('no coach plan -> invite_client refused (paywall)', !!inv0.error, inv0);
  const save0 = await c.client.rpc('save_program', { p: { name: 'x', days: [] } });
  check('no coach plan -> save_program refused (paywall)', !!save0.error, save0);
  const directLink = await c.client.from('coach_client_links').insert({ coach_id: c.id, client_id: b.id, status: 'accepted' });
  check('cannot insert a link directly', !!directLink.error, directLink);
  const directSub = await c.client.from('coach_subscriptions').insert({ user_id: c.id, source: 'granted' });
  check('cannot insert a coach subscription directly', !!directSub.error, directSub);
  const subRead = await c.client.from('coach_subscriptions').select('*');
  check('cannot read coach_subscriptions', (subRead.data ?? []).length === 0, subRead);

  // ---- admin ----
  await admin.from('profiles').update({ is_admin: true }).eq('id', a.id);
  const ov2 = await a.client.rpc('admin_overview');
  check('admin can call admin_overview', !ov2.error && ov2.data?.total >= 4, ov2);

  const grant = await a.client.rpc('admin_grant_coach', { p_username: 'smoke_coach' });
  check('admin can grant coach access', !grant.error, grant);
  const access = await b.client.rpc('my_access');
  check('coach sees their access', access.data?.coach === true, access);

  const users = await a.client.rpc('admin_list_users', { p_search: 'smoke_' });
  check('admin can list users', !users.error && (users.data ?? []).length >= 4, users);

  // ---- invites ----
  const dir = await c.client.rpc('list_coaches');
  check('coach shows up in the directory', (dir.data ?? []).some((r: { username: string }) => r.username === 'smoke_coach'), dir);

  const invUnknown = await b.client.rpc('invite_client', { p_username: '@nobody_here' });
  check('invite to unknown username fails', !!invUnknown.error, invUnknown);
  const invSelf = await b.client.rpc('invite_client', { p_username: 'smoke_coach' });
  check('cannot invite yourself', !!invSelf.error, invSelf);
  const inv1 = await b.client.rpc('invite_client', { p_username: '@Smoke_Client' });
  check('coach can invite by @username (case/at-sign tolerant)', !inv1.error, inv1);
  const inv2 = await b.client.rpc('invite_client', { p_username: 'smoke_client' });
  check('inviting twice is refused', !!inv2.error, inv2);

  const myCoaches = await c.client.rpc('my_coaches');
  const link = (myCoaches.data ?? []).find((r: { username: string }) => r.username === 'smoke_coach');
  check('client sees the pending invite', link?.status === 'pending', myCoaches);

  const strangerRespond = await d.client.rpc('respond_to_invite', { p_link_id: link?.id, p_accept: true });
  check('a stranger cannot accept someone else\'s invite', !!strangerRespond.error, strangerRespond);
  const selfAccept = await b.client.rpc('respond_to_invite', { p_link_id: link?.id, p_accept: true });
  check('the coach cannot accept on the client\'s behalf', !!selfAccept.error, selfAccept);

  // Before acceptance the coach must not see the client's data.
  const wk = await admin.from('workouts').insert({ user_id: c.id, name: 'Secret workout', date: new Date().toISOString() }).select('id').single();
  const early = await b.client.from('workouts').select('id').eq('user_id', c.id);
  check('coach cannot read client workouts before acceptance', (early.data ?? []).length === 0, early);

  const accept = await c.client.rpc('respond_to_invite', { p_link_id: link?.id, p_accept: true });
  check('client can accept', !accept.error, accept);
  const clients = await b.client.rpc('my_clients');
  check('coach sees the accepted client', (clients.data ?? []).some((r: { username: string; status: string }) => r.username === 'smoke_client' && r.status === 'accepted'), clients);
  const later = await b.client.from('workouts').select('id').eq('user_id', c.id);
  check('coach can read an accepted client\'s workouts', (later.data ?? []).length === 1 && later.data?.[0].id === wk.data?.id, later);
  const strangerRead = await d.client.from('workouts').select('id').eq('user_id', c.id);
  check('a stranger cannot read the client\'s workouts', (strangerRead.data ?? []).length === 0, strangerRead);

  // ---- programs ----
  const badLink = await b.client.rpc('save_program', { p: { name: 'Bad', days: [{ name: 'D', exercises: [{ name: 'X', link: 'javascript:alert(1)' }] }] } });
  check('save_program rejects non-http links', !!badLink.error, badLink);

  const saved = await b.client.rpc('save_program', {
    p: {
      name: 'Bro Split',
      days: [
        { name: 'Chest', exercises: [{ name: 'Bench press', sets: '4', reps: '6–8', rest: '2–3 min', feeder: '2 sets', comment: 'Pause on chest', link: 'https://example.com/v' }, { name: 'Cable fly', sets: '3', reps: '12–15' }] },
        { name: 'Back', exercises: [{ name: 'Barbell row', sets: '4', reps: '8' }] },
      ],
    },
  });
  check('coach can save a program', !saved.error && typeof saved.data === 'string', saved);
  const pid = saved.data as string;

  const resave = await b.client.rpc('save_program', { p: { id: pid, name: 'Bro Split v2', days: [{ name: 'Chest', exercises: [{ name: 'Bench press', sets: '4', reps: '6–8' }] }, { name: 'Back', exercises: [{ name: 'Barbell row', sets: '4', reps: '8' }] }] } });
  check('coach can re-save (replace) a program', !resave.error, resave);

  const beforeSend = await c.client.from('programs').select('id').eq('id', pid);
  check('client cannot see a draft', (beforeSend.data ?? []).length === 0, beforeSend);

  const sendStranger = await b.client.rpc('send_program', { p_program: pid, p_client_id: d.id, p_message: null });
  check('cannot send to someone who has not accepted', !!sendStranger.error, sendStranger);
  const sendOk = await b.client.rpc('send_program', { p_program: pid, p_client_id: c.id, p_message: 'Go get it' });
  check('coach can send to an accepted client', !sendOk.error, sendOk);

  const received = await c.client.from('programs').select('id, name, message, program_days(name, position, program_exercises(name, sets, reps, position))').eq('id', pid).single();
  check('client can read the sent program with days and exercises',
    !received.error && received.data?.name === 'Bro Split v2' && (received.data?.program_days ?? []).length === 2, received);

  const strangerProg = await d.client.from('programs').select('id').eq('id', pid);
  check('a stranger cannot read the program', (strangerProg.data ?? []).length === 0, strangerProg);
  const clientEdit = await c.client.from('programs').update({ name: 'mine now' }).eq('id', pid).select();
  check('client cannot edit the program', (clientEdit.data ?? []).length === 0, clientEdit);
  const clientDays = await c.client.from('program_days').delete().eq('program_id', pid).select();
  check('client cannot delete program days', (clientDays.data ?? []).length === 0, clientDays);

  const dupe = await b.client.rpc('duplicate_program', { p_program: pid });
  check('coach can duplicate a program', !dupe.error, dupe);
  const dupeSend = await b.client.rpc('send_program', { p_program: pid, p_client_id: b.id, p_message: null });
  check('a sent program cannot be re-sent to a different person', !!dupeSend.error, dupeSend);

  // ---- revoke = the paywall closes again ----
  const revoke = await a.client.rpc('admin_revoke_coach', { p_username: 'smoke_coach' });
  check('admin can revoke granted access', !revoke.error, revoke);
  const afterRevoke = await b.client.rpc('save_program', { p: { name: 'Nope', days: [] } });
  check('after revoke, save_program is refused', !!afterRevoke.error, afterRevoke);
  const afterRevokeRead = await b.client.from('workouts').select('id').eq('user_id', c.id);
  check('after revoke, the coach can no longer read client workouts', (afterRevokeRead.data ?? []).length === 0, afterRevokeRead);
  const afterDir = await c.client.rpc('list_coaches');
  check('after revoke, the coach leaves the directory', !(afterDir.data ?? []).some((r: { username: string }) => r.username === 'smoke_coach'), afterDir);

  // ---- request + admin invite ----
  const req = await d.client.rpc('request_coach_access');
  check('a user can request coach access', !req.error, req);
  const listed = await a.client.rpc('admin_list_users', { p_search: 'smoke_stranger' });
  check('admin sees the request', listed.data?.[0]?.requested === true, listed);

  const adminInv = await a.client.rpc('admin_invite_admin', { p_username: 'smoke_stranger' });
  check('admin can invite an admin', !adminInv.error, adminInv);
  const adminInvAgain = await a.client.rpc('admin_invite_admin', { p_username: 'smoke_stranger' });
  check('duplicate admin invite refused', !!adminInvAgain.error, adminInvAgain);
  const nonAdminInv = await c.client.rpc('admin_invite_admin', { p_username: 'smoke_client' });
  check('non-admin cannot invite admins', !!nonAdminInv.error, nonAdminInv);
  const dAccess = await d.client.rpc('my_access');
  check('invitee sees the pending admin invite', dAccess.data?.admin_invite === true, dAccess);
  const dAccept = await d.client.rpc('respond_admin_invite', { p_accept: true });
  const dNow = await d.client.rpc('admin_overview');
  check('invitee becomes admin after accepting', !dAccept.error && !dNow.error, { dAccept: dAccept.error, dNow: dNow.error });
  const selfRemove = await a.client.rpc('admin_remove_admin', { p_username: 'smoke_admin' });
  check('an admin cannot remove themselves', !!selfRemove.error, selfRemove);
  const remove = await a.client.rpc('admin_remove_admin', { p_username: 'smoke_stranger' });
  check('an admin can remove another admin', !remove.error, remove);
} catch (err) {
  failures += 1;
  console.error('Smoke test crashed:', err);
} finally {
  await cleanup();
  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}
