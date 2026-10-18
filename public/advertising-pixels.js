/* Proveit advertising pixels. Default-on test rollout; explicit refusal wins. */
(function (w, d) {
  'use strict';
  var META_ID = '674835348003619';
  var TIKTOK_ID = 'CLLIILJC77UBIO8OFG1G';
  var key = 'proveit-advertising-consent-v1';
  function permitted() {
    try {
      var choice = JSON.parse(w.localStorage.getItem(key));
      var path = decodeURIComponent(w.location.pathname).replace(/\/+/g, '/').toLowerCase();
      return !(choice && choice.value === 'denied' && choice.expires > Date.now()) &&
        !/^\/(admin|login|reset-password|api)(\/|$)/.test(path) &&
        !/^\/ro\/(raport-gratuit|rezultate-raport)(\/|$)/.test(path);
    } catch (_) { return false; }
  }
  function add(src, id) {
    if (d.getElementById(id)) return;
    var script = d.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    d.head.appendChild(script);
  }
  if (!permitted() || w.proveitAdvertising) return;

  // Standard Meta queue. Automatic event configuration is disabled; this
  // integration sends explicit page views only, without advanced matching.
  var fbq = w.fbq;
  if (!fbq) {
    fbq = w.fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
  }
  fbq('consent', 'grant');
  fbq('set', 'autoConfig', false, META_ID);
  fbq('init', META_ID);
  add('https://connect.facebook.net/en_US/fbevents.js', 'proveit-meta-pixel');

  w.TiktokAnalyticsObject = 'ttq';
  var ttq = w.ttq = w.ttq || [];
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
  ttq.setAndDefer = function (target, method) {
    target[method] = function () { target.push([method].concat(Array.prototype.slice.call(arguments))); };
  };
  ttq.methods.forEach(function (method) { ttq.setAndDefer(ttq, method); });
  ttq._i = ttq._i || {};
  ttq._i[TIKTOK_ID] = [];
  ttq._i[TIKTOK_ID]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
  ttq._t = ttq._t || {};
  ttq._t[TIKTOK_ID] = Date.now();
  ttq._o = ttq._o || {};
  ttq._o[TIKTOK_ID] = {};
  ttq.instance = function (id) {
    var instance = ttq._i[id] || [];
    ttq.methods.forEach(function (method) { ttq.setAndDefer(instance, method); });
    return instance;
  };
  ttq.grantConsent();
  add('https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + TIKTOK_ID + '&lib=ttq', 'proveit-tiktok-pixel');

  var lastPage = '';
  w.proveitAdvertising = {
    page: function () {
      if (!permitted()) return;
      // A query/fragment change is not another page view.
      var page = w.location.pathname.replace(/\/$/, '') || '/';
      if (lastPage === page) return;
      lastPage = page;
      fbq('track', 'PageView');
      ttq.page();
    },
    revoke: function () {
      fbq('consent', 'revoke');
      ttq.revokeConsent();
    }
  };
  w.proveitAdvertising.page();
})(window, document);
