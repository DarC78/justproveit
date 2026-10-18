import { test } from 'node:test';
import assert from 'node:assert/strict';
import { personalizedSubject } from '../scripts/lib/proveit-email-subject.mjs';

test('uses the actual recipient name and preserves Romanian text', () => {
  assert.equal(personalizedSubject('Soția mea nu m-a crezut (până a văzut contul)', 'Popescu'), 'Popescu, soția mea nu m-a crezut (până a văzut contul)');
  assert.equal(personalizedSubject('Salut', '  Ana   Maria  '), 'Ana Maria, salut');
  assert.equal(personalizedSubject('Salut'), 'Salut');
});

test('rejects header injection through recipient names and subjects', () => {
  assert.throws(() => personalizedSubject('Salut', 'Popescu\r\nBcc: stranger@example.com'));
  assert.throws(() => personalizedSubject('Salut\nInjected', 'Adrian'));
});
