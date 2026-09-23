import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const email = process.argv[2];
if (!email) throw new Error('Usage: tsx find-user.ts <email>');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in db/.env');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// listUsers doesn't support filtering by email directly, so page through and match.
let page = 1;
for (;;) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => u.email === email);
  if (match) {
    console.log(match.id);
    process.exit(0);
  }
  if (data.users.length < 200) break;
  page += 1;
}
console.error(`No user found with email ${email}`);
process.exit(1);
