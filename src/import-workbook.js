export function decodeCsv(buffer) {
  const bytes = new Uint8Array(buffer);
  let text;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    text = new TextDecoder('utf-16le', { fatal: true }).decode(bytes);
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    text = new TextDecoder('utf-16be', { fatal: true }).decode(bytes);
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (error) {
      // A declared UTF-8 file must not silently become Windows-1252 when damaged.
      if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        throw new Error('El CSV tiene una codificación UTF-8 dañada. Vuelve a exportarlo desde el archivo original.');
      }
      // Legacy CSV exports from Excel on Spanish Windows use this encoding.
      text = new TextDecoder('windows-1252', { fatal: true }).decode(bytes);
    }
  }
  if (text.includes('\uFFFD')) {
    throw new Error('El CSV contiene texto dañado (�). Vuelve a exportarlo desde el archivo original.');
  }
  return text.normalize('NFC');
}

export function readImportWorkbook(XLSX, buffer, filename) {
  // Decode plaintext before SheetJS: its binary CSV fallback misreads UTF-8 without BOM.
  return /\.csv$/i.test(filename)
    ? XLSX.read(decodeCsv(buffer), { type: 'string', cellDates: true, raw: true })
    : XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
}
