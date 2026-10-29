import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });
const output = path.join(root, 'migracion_supabase');
const columns = {
  usuarios: ['id', 'nombre', 'correo', 'password_hash', 'rol', 'activo', 'creado_en'],
  seroperfiles: ['id', 'fecha', 'semana', 'trimestre', 'anio', 'razon', 'empresa', 'flujo', 'granja', 'caseta', 'lote', 'funcion', 'edad', 'identidad', 'muestra', 'laboratorio', 'no_caso', 'num_muestras', 'enfermedad', 'tecnica', 'resultado', 'punto_corte', 'interpretacion', 'comentarios', 'creado_por', 'creado_en', 'actualizado_en'],
};
const numeric = new Set(['id', 'semana', 'trimestre', 'anio', 'edad', 'num_muestras', 'resultado', 'punto_corte', 'creado_por', 'activo']);
const timestamps = new Set(['creado_en', 'actualizado_en']);

function quote(value) {
  const text = String(value);
  if (text.includes('\u0000')) throw new Error('PostgreSQL no admite caracteres NUL en texto.');
  return `'${text.replaceAll("'", "''")}'`;
}

function literal(column, value) {
  if (value === null) return 'NULL';
  if (numeric.has(column)) {
    if (!/^-?\d+(?:\.\d+)?$/.test(String(value))) throw new Error(`Numero no valido en ${column}`);
    return String(value);
  }
  if (timestamps.has(column)) {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) || value.startsWith('0000')) {
      throw new Error(`Timestamp no valido en ${column}`);
    }
    return `TIMESTAMPTZ ${quote(`${value}+00`)}`;
  }
  if (column === 'fecha' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000'))) {
    throw new Error('Fecha no valida.');
  }
  return quote(value);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'registro_seroperfiles',
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

try {
  await connection.query("SET SESSION time_zone = '+00:00'");
  await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const [tableList] = await connection.query('SHOW FULL TABLES');
  const actualTables = tableList.map(row => Object.values(row)[0]).sort();
  if (JSON.stringify(actualTables) !== JSON.stringify(Object.keys(columns).sort())) {
    throw new Error('La base contiene tablas adicionales o distintas; revisar antes de exportar.');
  }
  const manifest = { database: process.env.DB_NAME || 'registro_seroperfiles', exportedAtUtc: new Date().toISOString(), timezone: 'UTC', tables: {} };
  const schema = await fs.readFile(path.join(output, 'estructura.sql'), 'utf8');
  const sql = [
    `-- Copia de ${manifest.database}; exportada ${manifest.exportedAtUtc}.`,
    '-- Contiene usuarios y hashes de contrasenas: guardar como respaldo privado.',
    '-- Ejecutar UNA vez en un destino vacio. No elimina ni sobreescribe tablas.',
    'BEGIN;',
    "SET LOCAL standard_conforming_strings = on;",
    "SET LOCAL TIME ZONE 'UTC';",
    schema,
  ];
  for (const [table, fields] of Object.entries(columns)) {
    const [actualFields] = await connection.query('SHOW COLUMNS FROM ??', [table]);
    if (JSON.stringify(actualFields.map(field => field.Field)) !== JSON.stringify(fields)) {
      throw new Error(`La estructura de ${table} cambio; revisar el exportador.`);
    }
    const [rows] = await connection.query('SELECT * FROM ?? ORDER BY id', [table]);
    const [metadata] = await connection.execute('SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [manifest.database, table]);
    const nextId = rows.reduce((next, row) => Math.max(next, Number(row.id) + 1), Number(metadata[0].AUTO_INCREMENT || 1));
    manifest.tables[table] = {
      rows: rows.length, nextId, columns: fields,
      sha256: crypto.createHash('sha256').update(JSON.stringify(rows.map(row => fields.map(field => row[field] === null ? null : String(row[field]))))).digest('hex'),
    };
    sql.push(`-- ${table}: ${rows.length} filas.`);
    for (let start = 0; start < rows.length; start += 250) {
      const values = rows.slice(start, start + 250).map(row => `(${fields.map(field => literal(field, row[field])).join(', ')})`);
      sql.push(`INSERT INTO public.${table} (${fields.join(', ')}) VALUES\n${values.join(',\n')};`);
    }
    sql.push(`SELECT setval(pg_get_serial_sequence('public.${table}', 'id'), ${nextId}, false);`);
  }
  sql.push(`DO $verificacion$\nBEGIN\n  IF (SELECT count(*) FROM public.usuarios) <> ${manifest.tables.usuarios.rows}\n     OR (SELECT count(*) FROM public.seroperfiles) <> ${manifest.tables.seroperfiles.rows} THEN\n    RAISE EXCEPTION 'La cantidad de filas importadas no coincide con el respaldo';\n  END IF;\nEND;\n$verificacion$;`);
  sql.push('COMMIT;', "SELECT 'usuarios' AS tabla, count(*) AS filas FROM public.usuarios\nUNION ALL\nSELECT 'seroperfiles', count(*) FROM public.seroperfiles;", '');
  await connection.commit();
  await fs.writeFile(path.join(output, 'registro_seroperfiles_supabase.sql'), sql.join('\n\n'), 'utf8');
  await fs.writeFile(path.join(output, 'resumen-exportacion.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ file: path.join(output, 'registro_seroperfiles_supabase.sql'), usuarios: manifest.tables.usuarios.rows, seroperfiles: manifest.tables.seroperfiles.rows }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
