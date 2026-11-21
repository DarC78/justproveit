/* Proveit advertising pixels. Default-on test rollout; explicit refusal wins. */
(function (w, d) {
  'use strict';
  var META_ID = '674835348003619';
  var TIKTOK_ID = 'CLLIILJC77UBIO8OFG1G';
  var GOOGLE_ADS_ID = 'AW-11386018124';
  var key = 'proveit-advertising-consent-v1';
  function permitted() {
    try {
      var choice = JSON.parse(w.localStorage.getItem(key));
      var path = decodeURIComponent(w.location.pathname).replace(/\/+/g, '/').toLowerCase();
      if (/^\/ro\/rezultate-simulare\/?$/.test(path)) return w.proveitPensionResultTracking === true && !w.location.search && !w.location.hash && choice && choice.value === 'granted' && choice.expires > Date.now();
      if (/^\/bani-uk-ai-multumim\/?$/.test(path)) return false;
      if (/^\/bani-uk-multumim\/?$/.test(path) && !w.proveitPurchaseVerified) return false;
      return !(choice && choice.value === 'denied' && choice.expires > Date.now()) &&
        !/^\/(admin|login|reset-password|api)(\/|$)/.test(path) &&
        !/^\/ro\/(raport-gratuit|rezultate-raport|rezultate-simulare)(\/|$)/.test(path);
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
  var purchasePage = /^\/bani-uk-multumim\/?$/.test(w.location.pathname);

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

  // Google Ads emits its initial page view from config (verified in Tag
  // Assistant). Do not also emit a manual initial event: send_page_view:false
  // is not suppressing that Ads hit for this account's connected tag.
  w.dataLayer = w.dataLayer || [];
  var gtag = w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  gtag('consent', 'default', {
    ad_storage: 'granted', ad_user_data: 'granted',
    ad_personalization: 'granted', analytics_storage: 'denied'
  });
  gtag('js', new Date());
  if (!purchasePage) {
    gtag('config', GOOGLE_ADS_ID);
    add('https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ADS_ID, 'proveit-google-ads-tag');
  }

  var lastPage = '';
  w.proveitAdvertising = {
    page: function () {
      if (!permitted() || purchasePage) return;
      // A query/fragment change is not another page view.
      var page = w.location.pathname.replace(/\/$/, '') || '/';
      if (lastPage === page) return;
      var firstPage = lastPage === '';
      lastPage = page;
      fbq('track', 'PageView');
      ttq.page();
      if (!firstPage) gtag('event', 'page_view', {
        send_to: GOOGLE_ADS_ID,
        page_location: w.location.href,
        page_path: w.location.pathname,
        page_title: d.title
      });
    },
    revoke: function () {
      fbq('consent', 'revoke');
      ttq.revokeConsent();
      gtag('consent', 'update', {
        ad_storage: 'denied', ad_user_data: 'denied',
        ad_personalization: 'denied', analytics_storage: 'denied'
      });
    }
  };
  w.proveitAdvertising.page();
})(window, document);
