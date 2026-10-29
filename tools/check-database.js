import dotenv from 'dotenv';
import { createDatabase } from '../server/database.js';

dotenv.config({ path: '.env.local', quiet: true });
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
