import fs from 'node:fs';

// Generate a read-only check whose hashes use the exporter's canonical format.
const manifest = JSON.parse(fs.readFileSync(new URL('../migracion_supabase/resumen-exportacion.json', import.meta.url), 'utf8'));
const checks = Object.entries(manifest.tables).map(([table, info]) => {
  if (!['usuarios', 'seroperfiles'].includes(table)) throw new Error('Tabla no esperada');
  const columns = info.columns.map(column => {
    if (!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(column)) throw new Error('Columna no valida');
    return ['creado_en', 'actualizado_en'].includes(column)
      ? `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')`
      : `${column}::text`;
  });
  return `SELECT '${table}' AS tabla, count(*) AS filas, ${info.rows} AS esperadas,
    encode(sha256(convert_to('[' || coalesce(string_agg(array_to_json(ARRAY[${columns.join(', ')}])::text, ',' ORDER BY id), '') || ']', 'UTF8')), 'hex') = '${info.sha256}' AS contenido_identico
    FROM public.${table}`;
});
console.log(checks.join('\nUNION ALL\n') + ';');
