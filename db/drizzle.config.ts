import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

// DATABASE_URL is only required for `push`/`studio` (they open a real connection);
// `generate` just reads schema.ts, so this falls back to a placeholder for that case.
export default defineConfig({
  schema: './schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  // `auth.users` is Supabase's own managed table -- schema.ts references it for the
  // profiles.id foreign key, but migrations must never try to create/alter it.
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder',
  },
});
