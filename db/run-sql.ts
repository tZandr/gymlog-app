import 'dotenv/config';
import postgres from 'postgres';

const file = process.argv[2];
if (!file) throw new Error('Usage: tsx run-sql.ts <file.sql>');

const sql = postgres(process.env.DATABASE_URL!, { connect_timeout: 10 });
try {
  await sql.file(file);
  console.log(`Applied ${file}`);
} finally {
  await sql.end({ timeout: 1 });
}
