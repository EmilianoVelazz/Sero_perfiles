import test from 'node:test';
import assert from 'node:assert/strict';
import { compilePostgresQuery, createDatabase, wrapPostgres } from './database.js';

test('keeps repeated filter values bound and preserves response field names', () => {
  const input = "x' OR 1=1 --";
  const query = compilePostgresQuery("SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, num_muestras AS numMuestras FROM seroperfiles WHERE granja LIKE :q OR empresa LIKE :q", { q: input });
  assert.equal(query.text, 'SELECT to_char(fecha, \'YYYY-MM-DD\') AS "fecha", num_muestras AS "numMuestras" FROM seroperfiles WHERE granja ILIKE $1 OR empresa ILIKE $1');
  assert.deepEqual(query.values, [input]);
  assert.ok(!query.text.includes(input));
  assert.throws(() => compilePostgresQuery('SELECT :missing'), /Falta el parametro/);
});

test('returns the generated id and uses the same connection throughout a transaction', async () => {
  const calls = [];
  const client = {
    query: async query => { calls.push(query); return { command: 'INSERT', rows: [{ id: 10052 }], rowCount: 1 }; },
    release: () => calls.push('release'),
  };
  const connection = wrapPostgres(client);
  await connection.beginTransaction();
  const [result] = await connection.execute('INSERT INTO seroperfiles (empresa) VALUES (:empresa)', { empresa: 'Test' });
  await connection.commit();
  connection.release();
  assert.deepEqual(result, { insertId: 10052, affectedRows: 1 });
  assert.equal(calls[0], 'BEGIN');
  assert.equal(calls[1].text, 'INSERT INTO seroperfiles (empresa) VALUES ($1) RETURNING id');
  assert.equal(calls[2], 'COMMIT');
  assert.equal(calls[3], 'release');
});

test('wraps SELECT rows without changing camel case aliases or decimal values', async () => {
  const rows = [{ numMuestras: 5, avgResult: '12.50', fecha: '2026-10-29' }];
  const connection = wrapPostgres({ query: async () => ({ command: 'SELECT', rows }) });
  assert.deepEqual(await connection.query('SELECT 1'), [rows]);
});

test('invalid connection strings never appear in configuration errors', () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'not-a-url-with-private-password';
  try {
    assert.throws(() => createDatabase(), error => {
      assert.equal(error.message, 'DATABASE_URL debe ser una URI valida de PostgreSQL.');
      assert.ok(!error.stack.includes('not-a-url-with-private-password'));
      return true;
    });
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
