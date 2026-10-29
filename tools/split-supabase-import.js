import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'migracion_supabase');
const target = path.join(directory, 'partes_sql_editor');
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'resumen-exportacion.json'), 'utf8'));
const source = await fs.readFile(path.join(directory, 'SOLO_DATOS_para_tablas_ya_creadas.sql'), 'utf8');

// Separar sentencias sin cortar los textos que contienen comillas o punto y coma.
function statements(text) {
  const result = [];
  let start = 0;
  let quoted = false;
  let dollar = null;
  let lineComment = false;
  for (let i = 0; i < text.length; i++) {
    if (lineComment) { if (text[i] === '\n') lineComment = false; continue; }
    if (quoted) {
      if (text[i] === "'") {
        if (text[i + 1] === "'") i++;
        else quoted = false;
      }
      continue;
    }
    if (dollar) {
      if (text.startsWith(dollar, i)) { i += dollar.length - 1; dollar = null; }
      continue;
    }
    if (text.startsWith('--', i)) { lineComment = true; i++; continue; }
    if (text[i] === "'") { quoted = true; continue; }
    if (text[i] === '$') {
      const match = text.slice(i).match(/^(\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$)/);
      if (match) { dollar = match[0]; i += dollar.length - 1; continue; }
    }
    if (text[i] === ';') {
      result.push(text.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  if (quoted || dollar) throw new Error('SQL con comillas incompletas.');
  return result;
}

const inserts = statements(source)
  .map(statement => statement.replace(/^(?:\s*--[^\n]*(?:\n|$))*/, '').trim())
  .filter(statement => statement.startsWith('INSERT INTO public.seroperfiles '));
if (!inserts.length) throw new Error('No se encontraron registros.');
const groups = [];
let current = [];
let size = 0;
for (const insert of inserts) {
  const bytes = Buffer.byteLength(insert, 'utf8') + 2;
  if (current.length && size + bytes > 680000) { groups.push(current); current = []; size = 0; }
  current.push(insert);
  size += bytes;
}
if (current.length) groups.push(current);

const dataStart = source.indexOf(`-- seroperfiles: ${manifest.tables.seroperfiles.rows} filas.`);
if (dataStart < 0) throw new Error('No se encontro el inicio de seroperfiles.');
const initial = source.slice(0, dataStart);
await fs.mkdir(target, { recursive: true });
const report = { snapshotUtc: manifest.exportedAtUtc, totalSeroperfiles: manifest.tables.seroperfiles.rows, totalUsuarios: manifest.tables.usuarios.rows, files: [] };
let cumulative = 0;
for (let i = 0; i < groups.length; i++) {
  const group = groups[i];
  // El exportador genera un registro por linea; los saltos internos en texto
  // no afectan al conteo porque cada fila empieza fuera de una cadena SQL.
  let rows = 0;
  for (const insert of group) {
    let quote = false;
    let depth = 0;
    const valuesStart = insert.indexOf(' VALUES\n') + ' VALUES\n'.length;
    for (let j = valuesStart; j < insert.length; j++) {
      if (quote) {
        if (insert[j] === "'") { if (insert[j + 1] === "'") j++; else quote = false; }
      } else if (insert[j] === "'") quote = true;
      else if (insert[j] === '(') { if (depth === 0) rows++; depth++; }
      else if (insert[j] === ')') depth--;
    }
  }
  const before = cumulative;
  cumulative += rows;
  const label = String(i + 1).padStart(2, '0');
  const filename = `${label}_importar_datos.sql`;
  const begin = i === 0 ? initial : `BEGIN;
SET LOCAL standard_conforming_strings = on;
SET LOCAL TIME ZONE 'UTC';
LOCK TABLE public.usuarios, public.seroperfiles IN SHARE ROW EXCLUSIVE MODE;
DO $orden$
BEGIN
  IF (SELECT count(*) FROM public.seroperfiles) <> ${before}
     OR (SELECT count(*) FROM public.usuarios) <> ${manifest.tables.usuarios.rows} THEN
    RAISE EXCEPTION 'Parte ${label}: ejecuta primero las partes anteriores. Se esperaban ${before} seroperfiles y ${manifest.tables.usuarios.rows} usuarios.';
  END IF;
END;
$orden$;`;
  const ending = `DO $cantidad$
BEGIN
  IF (SELECT count(*) FROM public.seroperfiles) <> ${cumulative}
     OR (SELECT count(*) FROM public.usuarios) <> ${manifest.tables.usuarios.rows} THEN
    RAISE EXCEPTION 'La cantidad de registros de la parte ${label} no coincide.';
  END IF;
END;
$cantidad$;
SELECT setval(pg_get_serial_sequence('public.seroperfiles', 'id'), ${manifest.tables.seroperfiles.nextId}, false);
COMMIT;
SELECT '${label}/${groups.length}' AS parte_completada,
  (SELECT count(*) FROM public.usuarios) AS usuarios,
  (SELECT count(*) FROM public.seroperfiles) AS seroperfiles;`;
  const content = [`-- PARTE ${label} DE ${groups.length}: importar en orden, un archivo por consulta.`, `-- Agrega ${rows} seroperfiles; total despues de esta parte: ${cumulative}.`, begin, ...group, ending, ''].join('\n\n');
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes >= 700000) throw new Error(`Archivo ${filename} supera el limite previsto.`);
  await fs.writeFile(path.join(target, filename), content, 'utf8');
  report.files.push({ filename, bytes, rowsAdded: rows, expectedSeroperfiles: cumulative });
}
if (cumulative !== manifest.tables.seroperfiles.rows) throw new Error('Faltan registros al dividir el SQL.');
await fs.writeFile(path.join(target, 'orden-importacion.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
const lines = report.files.map(file => `| ${file.filename} | ${file.rowsAdded} | ${file.expectedSeroperfiles} | ${(file.bytes / 1024).toFixed(1)} KB |`);
await fs.writeFile(path.join(target, 'LEEME.md'), `# Importar por partes en el SQL Editor\n\nCada archivo es menor de 700 KB y tiene su propia transaccion. No pegues varios archivos juntos.\n\n1. Abre el archivo 01, copia todo su contenido y ejecutalo en una consulta nueva de SQL Editor.\n2. Sustituye el contenido de la consulta por el archivo 02 y ejecutalo. Continua en orden hasta el ultimo.\n3. La ultima parte debe mostrar ${manifest.tables.usuarios.rows} usuarios y ${manifest.tables.seroperfiles.rows} seroperfiles.\n\n| Archivo | Filas agregadas | Total esperado | Tamano |\n| --- | ---: | ---: | ---: |\n${lines.join('\n')}\n\nLa parte 01 reemplaza solamente el administrador inicial de las tablas vacias por los usuarios reales del respaldo. Los controles impiden ejecutar otra vez una parte que ya termino o saltarse partes. Si ocurre un error, no continues con la siguiente. Si una consola conserva una transaccion fallida, ejecuta ROLLBACK antes de reintentar.\n\nLas partes ya completadas quedan guardadas: si interrumpes el proceso, continua con la primera parte pendiente. La aplicacion debe permanecer desconectada de Supabase durante la importacion.\n\nNo ejecutes adicionalmente los archivos completos de 3 MB.\n\n[Supabase documenta el limite de 1 MB del SQL Editor](https://supabase.com/changelog/29239-dashboard-weekly-updates-02-09-24-09-09-24).\n`, 'utf8');
console.log(JSON.stringify(report));
