import dotenv from 'dotenv';
import fs from 'node:fs';
import { createDatabase } from '../server/database.js';

dotenv.config({ path: '.env.local', quiet: true });
process.env.DATABASE_CA ||= fs.readFileSync(new URL('../server/certs/supabase-prod-ca-2021.crt', import.meta.url), 'utf8');
const database = createDatabase();
try {
  const [rows] = await database.query(`SELECT
    (SELECT count(*) FROM usuarios) AS usuarios,
    (SELECT count(*) FROM seroperfiles) AS seroperfiles`);
  console.log(JSON.stringify({ ok: true, ...rows[0] }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, code: error.code || 'CONNECTION_FAILED' }));
  process.exitCode = 1;
} finally {
  await database.end();
}
