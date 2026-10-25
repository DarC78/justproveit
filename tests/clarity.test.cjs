const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, URL, require: name => dependencies[name], ...globals });
  return exports;
}
const lib = load('src/lib/clarity.ts');
const excluded = ['/admin', '/admin/crm?tab=privatePensions', '/admin/support-inbox/',
  '/admin/dialler', '/admin/overdue-payments', '/admin/role-play-feedback',
  '/admin/future-tool', '/login?next=/admin', '/reset-password?token=secret',
  '/ro/rezultate-simulare/#token=private', '/ro/raport-gratuit', '/ro/rezultate-raport?token=secret', '/bani-uk-multumim/?session_id=cs_live_secret', '/bani-uk-ai-multumim/?session_id=cs_live_secret'];
test('private, authentication and bearer-link pages are excluded; marketing stays enabled', () => {
  for (const path of excluded) assert.equal(lib.isClarityPage(path), false, path);
  for (const path of ['/', '/ro/', '/car-finance-mis-selling/', '/ro/hai-in-club', '/saleconsultation']) {
    assert.equal(lib.isClarityPage(path), true, path);
  }
  for (const path of ['/ADMIN/crm/', '/%61dmin/crm', '/admin//crm', '/%invalid']) {
    assert.equal(lib.isClarityPage(path), false, path);
  }
});
function routerHarness() {
  const listeners = {}, events = [], navigations = [];
  const router = {
    events: { on: (event, fn) => { listeners[event] = fn; }, off: event => { delete listeners[event]; },
      emit: (...args) => events.push(args) },
    beforePopState: fn => { router.pop = fn; },
  };
  return { router, listeners, events, navigations };
}
test('links and programmatic navigation cancel before protected pages mount', () => {
  for (const path of excluded) {
    const h = routerHarness();
    lib.installClarityBoundary(h.router, true, url => h.navigations.push(url));
    assert.throws(() => h.listeners.routeChangeStart(path), error => error.cancelled === true);
    assert.deepEqual(h.navigations, [path]);
    assert.equal(h.events[0][0], 'routeChangeError');
  }
});
test('back/forward and return to public pages cross using full navigation', () => {
  for (const [publicDocument, target] of [[true, '/admin/crm'], [false, '/']]) {
    const h = routerHarness();
    const cleanup = lib.installClarityBoundary(h.router, publicDocument, url => h.navigations.push(url));
    assert.equal(h.router.pop({ as: target }), false);
    assert.deepEqual(h.navigations, [target]);
    assert.throws(() => h.listeners.routeChangeStart(target), error => error.cancelled === true);
    cleanup();
    assert.equal(h.listeners.routeChangeStart, undefined);
    assert.equal(h.router.pop({ as: target }), true);
  }
});
test('navigation within each boundary keeps normal SPA behavior', () => {
  for (const [publicDocument, target] of [[true, '/ro/'], [false, '/admin/crm?tab=privatePensions']]) {
    const h = routerHarness();
    lib.installClarityBoundary(h.router, publicDocument, url => h.navigations.push(url));
    h.listeners.routeChangeStart(target);
    assert.equal(h.router.pop({ as: target }), true);
    assert.deepEqual(h.navigations, []);
  }
});
test('direct private loads never insert Clarity; public loads use existing project once', () => {
  for (const path of ['/', ...excluded]) {
    const h = routerHarness(), effects = [], scripts = [], refs = [];
    let cursor = 0;
    h.router.pathname = path.split('?')[0];
    h.router.asPath = path;
    const window = { location: { href: `https://example.test${path}`, assign: url => h.navigations.push(url) } };
    const component = load('src/components/ClarityBoundary.tsx', {
      '@/lib/clarity': lib,
      'next/router': { useRouter: () => h.router },
      react: { useEffect: fn => effects.push(fn), useRef: initial => refs[cursor++] ??= { current: initial } },
    }, { window, document: { getElementById: id => scripts.find(s => s.id === id),
      createElement: () => ({}), head: { appendChild: script => scripts.push(script) } } }).default;
    const render = () => { cursor = 0; return component({ children: 'page' }); };
    assert.equal(render(), 'page');
    effects.splice(0).forEach(fn => fn());
    assert.equal(scripts.length, path === '/' ? 1 : 0, path);
    if (path === '/') {
      assert.equal(scripts[0].src, 'https://www.clarity.ms/tag/xp8gw8yl07');
      render(); effects.splice(0).forEach(fn => fn());
      assert.equal(scripts.length, 1);
      h.router.pathname = '/admin/crm'; h.router.asPath = '/admin/crm';
      assert.equal(render(), null, 'protected content must not render even if router event is bypassed');
      effects.splice(0).forEach(fn => fn());
      assert.deepEqual(h.navigations, ['/admin/crm']);
    }
  }
});
