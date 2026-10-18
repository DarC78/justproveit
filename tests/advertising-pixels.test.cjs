const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('public/advertising-pixels.js', 'utf8');

function harness(path = '/bani-uk-ai/', value = 'granted', expires = Date.now() + 86400000) {
  const scripts = [];
  const storage = { value, expires };
  const window = { location: { pathname: path }, localStorage: { getItem: () => JSON.stringify(storage) } };
  const document = { createElement: () => ({}), getElementById: id => scripts.find(s => s.id === id), head: { appendChild: s => scripts.push(s) } };
  const context = vm.createContext({ window, document, Date, URL });
  return { window, scripts, storage, run: () => vm.runInContext(code, context) };
}

test('explicit refusal and unavailable storage block advertising', () => {
  for (const value of ['denied']) {
    const h = harness('/bani-uk-ai/', value);
    h.run();
    assert.equal(h.scripts.length, 0);
    assert.equal(h.window.fbq, undefined);
    assert.equal(h.window.ttq, undefined);
    assert.equal(h.window.gtag, undefined);
  }
  const expired = harness('/bani-uk-ai/', 'granted', Date.now() - 1);
  expired.run(); assert.equal(expired.scripts.length, 3);
  const blocked = harness();
  blocked.window.localStorage.getItem = () => { throw new Error('blocked'); };
  blocked.run(); assert.equal(blocked.scripts.length, 0);
});

test('protected and authentication pages never load pixels, even with consent', () => {
  for (const path of ['/admin', '/admin/crm', '/ADMIN//crm', '/%61dmin/crm', '/login', '/reset-password', '/api/email-link', '/ro/raport-gratuit', '/ro/rezultate-raport', '/%invalid']) {
    const h = harness(path); h.run(); assert.equal(h.scripts.length, 0, path);
  }
});

test('first visits start all three advertising tags without fabricating an accepted choice', () => {
  const h = harness();
  h.window.localStorage.getItem = () => null;
  h.run();
  assert.equal(h.scripts.length, 3);
  assert.equal(h.window.ttq.filter(args => args[0] === 'page').length, 1);
});

test('checkout return enables purchase vendors only after verification and has no page-view events', () => {
  const h = harness('/bani-uk-multumim/');
  h.run(); assert.equal(h.scripts.length, 0);
  h.window.proveitPurchaseVerified = true;
  h.run(); assert.equal(h.scripts.length, 2);
  assert.equal(h.window.ttq.filter(args => args[0] === 'page').length, 0);
  assert.equal(h.window.dataLayer.filter(args => args[0] === 'config').length, 0);
  assert.equal(h.window.fbq.queue.filter(args => args[0] === 'track').length, 0);
});

test('correct IDs, consent and explicit page views; duplicate mounts cannot double initialize', () => {
  const h = harness(); h.run(); h.run();
  assert.equal(h.scripts.length, 3);
  assert.equal(h.scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  assert.equal(h.scripts[1].src, 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=CLLIILJC77UBIO8OFG1G&lib=ttq');
  assert.equal(h.scripts[2].src, 'https://www.googletagmanager.com/gtag/js?id=AW-11386018124');
  const google = h.window.dataLayer.map(args => Array.from(args));
  assert.equal(google[0][0], 'consent');
  assert.equal(google[0][1], 'default');
  assert.equal(google[0][2].ad_storage, 'granted');
  assert.equal(google[0][2].analytics_storage, 'denied');
  assert.equal(google.filter(args => args[0] === 'config').length, 1);
  assert.equal(google.find(args => args[0] === 'config')[1], 'AW-11386018124');
  assert.equal(google.find(args => args[0] === 'config').length, 2, 'keep the standard Ads config that sends the initial hit');
  assert.equal(google.filter(args => args[0] === 'event' && args[1] === 'page_view').length, 0, 'no extra manual initial page view');
  const queue = h.window.fbq.queue.map(args => Array.from(args));
  assert.ok(queue.some(args => args[0] === 'init' && args[1] === '674835348003619'));
  assert.ok(queue.some(args => args[0] === 'set' && args[1] === 'autoConfig' && args[2] === false));
  assert.equal(queue.filter(args => args[0] === 'track' && args[1] === 'PageView').length, 1);
  assert.equal(h.window.ttq.filter(args => args[0] === 'page').length, 1);
  h.window.proveitAdvertising.page();
  assert.equal(h.window.ttq.filter(args => args[0] === 'page').length, 1);
  assert.equal(h.window.dataLayer.filter(args => args[0] === 'event').length, 0, 'repeated initial-page callbacks cannot double-count');
  h.window.location.pathname = '/ro/'; h.window.proveitAdvertising.page();
  assert.equal(h.window.ttq.filter(args => args[0] === 'page').length, 2);
  const virtualViews = h.window.dataLayer.filter(args => args[0] === 'event' && args[1] === 'page_view');
  assert.equal(virtualViews.length, 1, 'only subsequent pathname changes send manual views');
  assert.equal(virtualViews[0][2].send_to, 'AW-11386018124');
  assert.equal(virtualViews[0][2].page_path, '/ro/');
});

test('withdrawal stops explicit events and queues both vendors consent revocation', () => {
  const h = harness(); h.run();
  h.storage.value = 'denied'; h.window.proveitAdvertising.revoke();
  h.window.location.pathname = '/'; h.window.proveitAdvertising.page();
  assert.equal(h.window.ttq.filter(args => args[0] === 'page').length, 1);
  assert.ok(h.window.ttq.some(args => args[0] === 'revokeConsent'));
  assert.ok(h.window.fbq.queue.some(args => args[0] === 'consent' && args[1] === 'revoke'));
  const googleRevocation = h.window.dataLayer.find(args => args[0] === 'consent' && args[1] === 'update');
  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) assert.equal(googleRevocation[2][key], 'denied');
  assert.equal(h.window.dataLayer.filter(args => args[0] === 'event').length, 0);
});

test('UI loads bootstrap immediately, retains choice controls and revokes/reloads on reject', () => {
  const ts = require('typescript');
  const scripts = [], states = [], effects = [];
  let cursor = 0, stored = null, reloads = 0, revoked = 0;
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  const router = { pathname: '/bani-uk-ai', asPath: '/bani-uk-ai/', events: { on() {}, off() {} } };
  const window = { location: { href: 'https://www.justproveit.co.uk/bani-uk-ai/', reload: () => reloads++ }, addEventListener() {}, removeEventListener() {} };
  const document = { cookie: '', getElementById: id => scripts.find(s => s.id === id), createElement: () => ({}), head: { appendChild: s => scripts.push(s) } };
  const exports = {};
  const element = (type, props) => ({ type, props });
  const modules = {
    react: { useEffect: fn => effects.push(fn), useState: initial => {
      const slot = cursor++;
      if (!(slot in states)) states[slot] = initial;
      return [states[slot], value => { states[slot] = value; }];
    } },
    'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'fragment' },
    'next/router': { useRouter: () => router },
    '@/lib/clarity': { isClarityPage: () => true },
    '@/styles/advertising-consent.module.css': { default: {} },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/AdvertisingConsent.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => modules[name], window, document, localStorage: storage, Date, Set });
  const render = () => { cursor = 0; return exports.default(); };
  assert.equal(render(), null);
  effects.splice(0).forEach(fn => fn());
  const buttons = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (node.type === 'button') buttons.push(node);
    visit(node.props?.children);
  }
  visit(render());
  assert.equal(scripts.length, 1);
  const accept = buttons.find(b => b.props.children === 'Accept publicitatea');
  const reject = buttons.find(b => b.props.children === 'Refuz publicitatea');
  accept.props.onClick();
  assert.equal(JSON.parse(stored).value, 'granted');
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, '/advertising-pixels.js?v=onboarding-2');
  window.proveitAdvertising = { revoke: () => revoked++ };
  reject.props.onClick();
  assert.equal(JSON.parse(stored).value, 'denied');
  assert.equal(revoked, 1);
  assert.equal(reloads, 1);
});
