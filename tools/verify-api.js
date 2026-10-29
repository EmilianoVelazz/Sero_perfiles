import fs from 'node:fs';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { createDatabase } from '../server/database.js';

dotenv.config({ path: '.env.local', quiet: true });
if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en .env.local');
process.env.DATABASE_CA ||= fs.readFileSync(new URL('../server/certs/supabase-prod-ca-2021.crt', import.meta.url), 'utf8');
// Isolate the test from deployed sessions; only read existing data.
process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
process.env.VERCEL = '1';
const { default: app } = await import('../server/index.js');
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const db = createDatabase();
try {
  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  assert.equal((await fetch(`${origin}/api/seroperfiles`)).status, 401);
  const [[user]] = await db.query("SELECT id, nombre, correo, rol FROM usuarios WHERE activo = 1 AND rol = 'admin' ORDER BY id LIMIT 1");
  assert.ok(user, 'Se requiere un administrador activo para esta verificacion');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol, exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('base64url');
  const paths = [
    '/api/seroperfiles?limit=10',
    '/api/seroperfiles?q=Vall&limit=10',
    '/api/seroperfiles/filters',
    '/api/seroperfiles/summary',
    '/api/powerbi/schema',
    '/api/powerbi/seroperfiles?anio=2025',
    '/api/powerbi/seroperfiles.csv?anio=2025',
  ];
  for (const path of paths) {
    const response = await fetch(origin + path, { headers: { Authorization: `Bearer ${payload}.${signature}` } });
    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
    if (!path.includes('.csv')) {
      const result = await response.json();
      if (path === '/api/seroperfiles?limit=10') {
        assert.equal(result.pagination.total, 10051);
        assert.equal(result.data.length, 10);
        assert.ok(Object.hasOwn(result.data[0], 'numMuestras'));
        assert.match(result.data[0].fecha, /^\d{4}-\d{2}-\d{2}$/);
      }
      if (path.endsWith('/summary')) assert.ok(Object.hasOwn(result.totals, 'uniqueFarms'));
    } else assert.match(await response.text(), /id,fecha,semana/);
    console.log(JSON.stringify({ path, status: response.status }));
  }
  console.log(JSON.stringify({ ok: true, health: true, unauthenticatedRejected: true }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, code: error.code || 'API_VERIFICATION_FAILED', message: error.name === 'AssertionError' ? error.message : 'No se pudo verificar la API' }));
  process.exitCode = 1;
} finally {
  server.close();
  await db.end();
}
