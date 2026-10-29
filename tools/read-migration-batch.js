import fs from 'node:fs';

// Parse generated SQL without splitting semicolons inside quoted data.
const sql = fs.readFileSync(new URL('../migracion_supabase/registro_seroperfiles_supabase.sql', import.meta.url), 'utf8');
const statements = [];
let start = 0, quoted = false, comment = false, dollar = null;
for (let i = 0; i < sql.length; i++) {
  if (comment) { if (sql[i] === '\n') comment = false; continue; }
  if (dollar) {
    if (sql.startsWith(dollar, i)) { i += dollar.length - 1; dollar = null; }
    continue;
  }
  if (quoted) {
    if (sql[i] === "'") {
      if (sql[i + 1] === "'") i++; else quoted = false;
    }
    continue;
  }
  if (sql.startsWith('--', i)) { comment = true; i++; continue; }
  if (sql[i] === "'") { quoted = true; continue; }
  if (sql[i] === '$') {
    const match = sql.slice(i).match(/^\$[a-zA-Z_][a-zA-Z_0-9]*\$|^\$\$/);
    if (match) { dollar = match[0]; i += dollar.length - 1; continue; }
  }
  if (sql[i] === ';') { statements.push(sql.slice(start, i + 1).trim()); start = i + 1; }
}
if (quoted || dollar) throw new Error('SQL incompleto');
const inserts = statements.filter(s => /INSERT INTO public\.(usuarios|seroperfiles) \(/.test(s));
const index = process.argv[2];
if (index === undefined) console.log(JSON.stringify({ batches: inserts.length, sizes: inserts.map(s => s.length) }));
else {
  const query = inserts[Number(index)];
  if (!query) throw new Error('Lote inexistente');
  console.log(JSON.stringify({ index: Number(index), query }));
}
