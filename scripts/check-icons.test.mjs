import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { templateIcons, typescriptIcons, validateIcons } from './check-icons.mjs';

test('inspects static, conditional and control-flow icon names', () => {
  const result = templateIcons(`
    @if (visible) { <i-tabler name="mail" /> }
    @for (row of rows; track row.id) { <i-tabler [name]="row.open ? 'eye' : 'eye-off'" /> }
  `, 'template.html');
  assert.deepEqual(result.references.map(reference => reference.name), ['mail', 'eye', 'eye-off']);
});

test('rejects typos instead of accepting a generic fallback', () => {
  const { references } = templateIcons('<i-tabler name="unkown-typo" />', 'invalid.html');
  assert.match(validateIcons(references)[0], /unknown Tabler icon "unkown-typo"/);
});

test('identifies a valid icon missing from the selected registry', () => {
  assert.match(validateIcons([{ name: 'mail', file: 'template.html' }], new Set())[0], /not in admin-tabler-icons/);
});

test('ignores unrelated binding errors while still checking icon names', () => {
  const result = templateIcons('<input [(ngModel)]="legacy?.value"><i-tabler name="trash" />', 'legacy.html');
  assert.deepEqual(result.references.map(reference => reference.name), ['trash']);
});

test('inspects icon names returned through local lookup maps', () => {
  const source = ts.createSourceFile('dynamic.ts', `class Example { tipoIcon(status: string) { const mapa = { READY: 'printer', DONE: 'truck-delivery' }; return mapa[status] ?? 'circle'; } }`, ts.ScriptTarget.Latest, true);
  assert.deepEqual(typescriptIcons(source, 'dynamic.ts').map(reference => reference.name), ['printer', 'truck-delivery', 'circle']);
});
