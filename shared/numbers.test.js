import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCutoff } from './numbers.js';

test('cutoff accepts signed integers and decimals and normalizes decimal separators', () => {
  for (const [input, expected] of [
    [0, '0'], [12, '12'], [-12, '-12'], [1.25, '1.25'], [-0.125, '-0.125'],
    ['+12', '+12'], ['-0.0001', '-0.0001'], ['0.1234', '0.1234'],
    ['-2,75', '-2.75'], ['+2,75', '+2.75'], ['  -0.5  ', '-0.5'],
    ['.5', '.5'], ['-,5', '-.5'], ['2.', '2.'],
    ['', null], [null, null], [undefined, null],
  ]) assert.deepEqual(parseCutoff(input), { valid: true, value: expected }, String(input));
});

test('cutoff rejects text, formulas, incomplete signs and non-finite or non-numeric values', () => {
  for (const input of [
    'texto', 'NaN', 'Infinity', NaN, Infinity, -Infinity, true, false, [], {},
    '-', '+', '.', ' ', '=1+1', '-1+2', '+1+2', '@SUM(A1)', '0x10',
    '1,2.3', '--1', '1 2', '1e3',
  ]) assert.deepEqual(parseCutoff(input), { valid: false }, String(input));
});
