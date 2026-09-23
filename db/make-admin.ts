// Bootstrap the first admin (after that, admins invite admins from /admin/team).
//   npm run make-admin <username>
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const username = process.argv[2]?.replace(/^@/, '').toLowerCase();
if (!username) throw new Error('Usage: tsx make-admin.ts <username>');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in db/.env');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('profiles')
  .update({ is_admin: true })
  .eq('username', username)
  .select('id, username')
  .maybeSingle();
if (error) throw error;
if (!data) throw new Error(`No user with username @${username}. Sign up in the app first.`);
console.log(`@${data.username} is now an admin.`);
