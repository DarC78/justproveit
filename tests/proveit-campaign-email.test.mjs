import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderProveitCampaignEmail as render } from '../scripts/lib/proveit-campaign-email.mjs';

const unsubscribeUrl = 'https://send.justproveit.co.uk/unsubscribe?token=fixture-only&campaign=bani-uk-ai';
test('campaign rendering requires an approved unsubscribe URL and rejects unsafe input', () => {
  assert.throws(() => render(), /unsubscribe/);
  for (const url of ['http://send.justproveit.co.uk/unsubscribe', 'https://evil.example/unsubscribe', 'https://user:pass@send.justproveit.co.uk/unsubscribe', unsubscribeUrl + '\r\nInjected: yes']) {
    assert.throws(() => render({ unsubscribeUrl: url }));
  }
  assert.throws(() => render({ recipientName: 'Ana\nBcc: other', unsubscribeUrl }), /control/);
});
test('each campaign render has recipient-specific subject, unsubscribe and no test recipient', () => {
  const ana = render({ recipientName: 'Ana', unsubscribeUrl });
  const ionUrl = unsubscribeUrl.replace('fixture-only', 'second-fixture');
  const ion = render({ recipientName: 'Ion', unsubscribeUrl: ionUrl });
  assert.ok(ana.subject.startsWith('Ana, '));
  assert.ok(ion.subject.startsWith('Ion, '));
  assert.ok(!ion.html.includes('fixture-only'));
  assert.ok(ana.html.includes('token=fixture-only&amp;campaign='));
  assert.ok(ana.text.includes(unsubscribeUrl));
  assert.equal(ana.headers['List-Unsubscribe'], `<${unsubscribeUrl}>`);
  assert.equal(ana.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  assert.equal(ana.to, undefined, 'the backend must select the actual recipient');
  assert.ok(!ana.subject.includes('[TEST]'));
  assert.ok(!ana.html.includes('PREVIZUALIZARE'));
  assert.ok(!ana.html.includes('E-mail de test'));
  assert.equal((ana.html.match(/data-role="primary-cta"/g) || []).length, 1);
  assert.ok(ana.html.includes('/r?id=whatsapp'));
  assert.ok(ana.html.includes('barclays.png'));
  assert.ok(!render({ unsubscribeUrl }).subject.startsWith('Adrian,'));
});
test('recipient names are escaped in the HTML title; preview and tests need no campaign endpoint', () => {
  const result = render({ recipientName: '<b>Ana</b>', unsubscribeUrl });
  assert.ok(result.html.includes('&lt;b&gt;Ana&lt;/b&gt;'));
  assert.ok(!result.html.includes('<b>Ana</b>'));
  for (const mode of ['preview', 'test']) assert.ok(render({ mode }).html);
});
