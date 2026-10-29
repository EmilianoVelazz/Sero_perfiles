import mysql from 'mysql2/promise';
import pg from 'pg';

export function compilePostgresQuery(sql, params = {}) {
  const values = [];
  const positions = new Map();
  let text = sql
    .replace(/DATE_FORMAT\(fecha, '%Y-%m-%d'\)/g, "to_char(fecha, 'YYYY-MM-DD')")
    .replace(/\bLIKE\b/g, 'ILIKE')
    .replace(/correo = :correo/g, 'lower(correo) = lower(:correo)')
    .replace(/\bAS ([a-zA-Z_][a-zA-Z_0-9]*)/g, 'AS "$1"')
    .replace(/(?<!:):([a-zA-Z_][a-zA-Z_0-9]*)/g, (_match, name) => {
      if (!Object.hasOwn(params, name)) throw new Error(`Falta el parametro ${name}`);
      if (!positions.has(name)) {
        values.push(params[name]);
        positions.set(name, values.length);
      }
      return `$${positions.get(name)}`;
    });
  if (/^\s*INSERT INTO seroperfiles\b/i.test(text)) text += ' RETURNING id';
  return { text, values };
}

export function wrapPostgres(client) {
  const execute = async (sql, params) => {
    const result = await client.query(compilePostgresQuery(sql, params));
    return result.command === 'SELECT'
      ? [result.rows]
      : [{ insertId: result.rows[0]?.id, affectedRows: result.rowCount }];
  };
  return {
    execute,
    query: execute,
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release(),
  };
}

export function createDatabase() {
  if (!process.env.DATABASE_URL) {
    if (process.env.VERCEL) throw new Error('Configura DATABASE_URL en Vercel.');
    return mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'registro_seroperfiles',
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }
  // Keep dates as calendar dates, and counts as safe JSON numbers.
  pg.types.setTypeParser(1082, value => value);
  pg.types.setTypeParser(20, value => {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : value;
  });
  let url;
  try {
    url = new URL(process.env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    // Do not let an invalid URL error disclose the connection string in logs.
    throw new Error('DATABASE_URL debe ser una URI valida de PostgreSQL.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  // URL SSL flags must not override certificate verification.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  const pool = new pg.Pool({
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: true, ...(process.env.DATABASE_CA ? { ca: process.env.DATABASE_CA } : {}) },
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', error => console.error('Error de conexion PostgreSQL:', error.code));
  return {
    ...wrapPostgres(pool),
    getConnection: async () => wrapPostgres(await pool.connect()),
    end: () => pool.end(),
  };
}
