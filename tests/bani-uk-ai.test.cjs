const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/baniUkAi.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText, { exports: exportsObject, URL });

test('checkout accepts only an explicit HTTPS Stripe Payment Link', () => {
  assert.equal(exportsObject.courseCheckoutUrl('https://buy.stripe.com/synthetic-link'), 'https://buy.stripe.com/synthetic-link');
  for (const value of ['', 'javascript:alert(1)', 'http://buy.stripe.com/link',
    'https://buy.stripe.com.evil.test/link', 'https://buy.stripe.com@evil.test/link', '/checkout']) {
    assert.equal(exportsObject.courseCheckoutUrl(value), null);
  }
});

test('enrollment cutoff is the end of 1 November in London after the DST transition', () => {
  assert.equal(new Date(exportsObject.BANI_UK_AI_DEADLINE).toLocaleString('en-GB', {
    timeZone: 'Europe/London', hour12: false,
  }), '01/11/2026, 23:59:59');
});

test('course checkout preserves the owner-supplied payment link and founder promotion', () => {
  const checkout = new URL(exportsObject.courseCheckoutUrl(exportsObject.BANI_UK_AI_CHECKOUT_URL));
  assert.equal(checkout.origin, 'https://buy.stripe.com');
  assert.equal(checkout.pathname, '/00wdR8gUP7548yvd7R4Ni1o');
  assert.equal(checkout.searchParams.get('prefilled_promo_code'), 'DISC58');
});
