import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { decodeCsv, readImportWorkbook } from './import-workbook.js';
import { normalizeRecordText } from '../shared/text.js';

const rows = [
  ['Fecha', 'Razón', 'Granja', 'Técnica', 'Interpretación', 'Comentarios'],
  ['2026-11-24', 'Revisión', 'Peña', 'ELISA', 'Negativo', 'ÁÉÍÓÚ áéíóú Ññ ü, “revisión” €'],
];
const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));
const parsedRows = (bytes, filename = 'registros.csv') => {
  const workbook = readImportWorkbook(XLSX, bytes, filename);
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true });
};

for (const bom of ['', '\uFEFF']) {
  test(`preserves CSV accents, headers and quoted commas in UTF-8 ${bom ? 'with' : 'without'} BOM`, () => {
    assert.deepEqual(parsedRows(new TextEncoder().encode(bom + csv).buffer), rows);
  });
}

test('reads legacy Windows-1252 CSV without replacing accents or punctuation', () => {
  const specials = new Map([['“', 0x93], ['”', 0x94], ['€', 0x80]]);
  const bytes = Uint8Array.from(csv, char => specials.get(char) ?? char.charCodeAt(0));
  assert.deepEqual(parsedRows(bytes.buffer, 'REGISTROS.CSV'), rows);
});

for (const endian of ['le', 'be']) {
  test(`reads UTF-16${endian.toUpperCase()} CSV exported by Excel`, () => {
    const bytes = Buffer.from('\uFEFF' + csv, 'utf16le');
    if (endian === 'be') bytes.swap16();
    assert.deepEqual(parsedRows(Uint8Array.from(bytes).buffer), rows);
  });
}

test('composes pasted accents and preserves identifiers with leading zeroes', () => {
  const bytes = new TextEncoder().encode('Funcio\u0301n;Granja;Lote\nLi\u0301nea;Pen\u0303a;00123');
  assert.deepEqual(parsedRows(bytes.buffer), [['Función', 'Granja', 'Lote'], ['Línea', 'Peña', '00123']]);
});

test('reports damaged UTF-8 instead of silently importing replacement characters', () => {
  assert.throws(() => decodeCsv(new TextEncoder().encode('Granja\nPe\uFFFDa').buffer), /texto dañado/);
  assert.throws(() => decodeCsv(Uint8Array.from([0xef, 0xbb, 0xbf, 0xc3]).buffer), /UTF-8 dañada/);
});

for (const bookType of ['xlsx', 'xls']) {
  test(`preserves binary ${bookType} workbooks including dates and accents`, () => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet.A3 = { t: 'n', v: 46350, z: 'yyyy-mm-dd' };
    sheet.B3 = { t: 'n', f: '1+1', v: 2 };
    sheet['!ref'] = 'A1:F3';
    const source = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(source, sheet, 'Registros');
    const bytes = XLSX.write(source, { type: 'array', bookType });
    const result = readImportWorkbook(XLSX, bytes, `datos.${bookType}`);
    assert.equal(result.Sheets.Registros.C2.v, 'Peña');
    assert.equal(result.Sheets.Registros.A3.v.toISOString().slice(0, 10), '2026-11-24');
    // SheetJS only writes this formula into the XLSX fixture.
    if (bookType === 'xlsx') assert.equal(result.Sheets.Registros.B3.f, '1+1');
  });
}

test('normalizes API text without changing numeric, null or original values', () => {
  const input = { granja: 'Pen\u0303a', razon: 'Revisio\u0301n', resultado: 1.5, lote: null };
  assert.deepEqual(normalizeRecordText(input), { granja: 'Peña', razon: 'Revisión', resultado: 1.5, lote: null });
  assert.equal(input.granja, 'Pen\u0303a');
});
