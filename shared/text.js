export function normalizeFarmName(value) {
  return ['Joyas - Sitios 1', 'J oyas - Sitio 1'].includes(value.trim())
    ? 'Joyas - Sitio 1'
    : value;
}

export function normalizeDiseaseName(value) {
  const names = {
    app: 'App',
    influenza: 'Influenza',
    'influenza h1n2': 'Influenza',
    'ojo azul': 'Ojo Azul',
  };
  const key = value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX');
  return Object.hasOwn(names, key) ? names[key] : value;
}

// NFC keeps pasted accents equivalent to characters entered with a Spanish keyboard.
export function normalizeRecordText(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => {
    const text = typeof value === 'string' ? value.normalize('NFC') : value;
    if (typeof text === 'string' && key === 'granja') return [key, normalizeFarmName(text)];
    if (typeof text === 'string' && key === 'enfermedad') return [key, normalizeDiseaseName(text)];
    return [key, text];
  }));
}
