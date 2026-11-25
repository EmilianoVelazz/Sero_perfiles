// Accept a signed decimal with either decimal separator, never an expression.
export function parseCutoff(value) {
  if (value === null || value === undefined || value === '') return { valid: true, value: null };
  if (typeof value !== 'string' && typeof value !== 'number') return { valid: false };
  const text = String(value).trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(Number(text))) {
    return { valid: false };
  }
  return { valid: true, value: text };
}
