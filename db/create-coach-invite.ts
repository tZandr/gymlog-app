import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL } = process.env;
const email = process.argv[2];

if (!email) throw new Error('Usage: tsx create-coach-invite.ts <email>');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in db/.env');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('coach_invites')
  .insert({ email })
  .select('invite_token')
  .single();
if (error) throw error;

const appUrl = APP_URL ?? 'http://localhost:5173';
console.log(`Coach signup link for ${email}:\n${appUrl}/coach-signup/${data.invite_token}`);
