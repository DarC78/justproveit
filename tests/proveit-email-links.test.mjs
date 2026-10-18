import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { brandedEmailLink, rewriteEmailLinks } from '../scripts/lib/proveit-email-links.mjs';

const require = createRequire(import.meta.url);
const handler = require('../api/email-link/index.js');
const config = require('../api/shared/email-links.json');
const from = 'Adrian Defta <adrian@mail.justproveit.co.uk>';

test('every registered link redirects exactly, without caching or caller overrides', async () => {
  for (const [id, destination] of Object.entries(config.links)) {
    const wrapped = new URL(brandedEmailLink(destination));
    assert.equal(wrapped.origin, config.origin);
    assert.equal(wrapped.searchParams.get('id'), id);
    const context = {};
    await handler(context, { query: { id, url: 'https://evil.example', ct: 'ignored' } });
    assert.equal(context.res.status, 302);
    assert.equal(context.res.headers.Location, new URL(destination).href);
    assert.equal(context.res.headers['Cache-Control'], 'no-store');
  }
});

test('invalid IDs and arbitrary destinations are rejected', async () => {
  for (const id of [undefined, '', '__proto__', 'constructor', ['whatsapp'], 'unknown']) {
    const context = {};
    await handler(context, { query: { id } });
    assert.equal(context.res.status, 400);
    assert.equal(context.res.headers.Location, undefined);
  }
  assert.throws(() => brandedEmailLink('https://evil.example'), /not registered/);
  assert.throws(() => rewriteEmailLinks({ html: '', text: '', from: 'person@evil.example' }), /sender/);
});

test('HTML parser handles entities, casing and quoted/unquoted attributes without changing images or text', () => {
  const href = config.links.whatsapp.replaceAll('&', '&amp;');
  const html = `<!-- <a href="https://evil.example"> -->\n<A title="href='fake' >" HREF='${href}'>Romanian \u0219 text</A><a href=${config.links.tiktok}>TikTok</a><img src="${config.links.trustpilot}"><a href="mailto:hello@example.com">Mail</a><a href="tel:+44123">Phone</a><a href="#here">Here</a><a href="/relative">Relative</a>`;
  const result = rewriteEmailLinks({ html, text: `WhatsApp: ${config.links.whatsapp}\nTikTok: ${config.links.tiktok}.`, from });
  assert.match(result.html, /href="https:\/\/www.justproveit.co.uk\/r\?id=whatsapp"/);
  assert.match(result.html, /href="https:\/\/www.justproveit.co.uk\/r\?id=tiktok"/);
  assert.ok(result.html.includes(`<img src="${config.links.trustpilot}">`));
  assert.ok(result.html.includes('Romanian \u0219 text'));
  assert.ok(result.html.includes('<!-- <a href="https://evil.example"> -->'));
  for (const value of ['mailto:hello@example.com', 'tel:+44123', '#here', '/relative']) assert.ok(result.html.includes(`href="${value}"`));
  assert.ok(result.text.endsWith('/r?id=tiktok.'));
  assert.deepEqual(rewriteEmailLinks({ ...result, from }), result);
});

test('unsubscribe is excluded and the complete template has only branded HTTP hrefs', () => {
  const unsubscribeUrl = 'https://unsubscribe.example/one?token=private';
  const result = rewriteEmailLinks({ html: `<a href="${unsubscribeUrl}">Unsubscribe</a>`, text: unsubscribeUrl, from, unsubscribeUrl });
  assert.equal(result.text, unsubscribeUrl);
  assert.ok(result.html.includes(unsubscribeUrl));
  const html = readFileSync(new URL('../artifacts/email/bani-uk-ai-01-preview.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/href="(https?:[^\"]+)"/g)) assert.ok(match[1].startsWith(`${config.origin}/r?id=`));
});
