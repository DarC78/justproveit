// Keep paid-checkout bearer references in this document only, before any SDK.
(function (w, d) {
  'use strict';
  var url = new URL(w.location.href);
  if (!/^\/(?:plata-confirmata|bani-uk-multumim)\/?$/.test(url.pathname) || !url.searchParams.has('session_id')) return;
  var sessions = url.searchParams.getAll('session_id');
  var sources = url.searchParams.getAll('source');
  var source = sources.length === 0 ? 'proveit' : sources[0];
  url.searchParams.delete('session_id'); url.searchParams.delete('source');
  try { w.history.replaceState(w.history.state, '', url.pathname + url.search + url.hash); }
  catch (_) { w.location.replace(url.pathname + url.search + url.hash); return; }
  var meta = d.createElement('meta'); meta.name = 'referrer'; meta.content = 'no-referrer'; d.head.appendChild(meta);
  if (url.protocol === 'https:' && /^(www\.)?justproveit\.co\.uk$/.test(url.hostname) && sessions.length === 1 && sources.length <= 1 && /^(proveit|justproveit)$/.test(source) && /^cs_live_[A-Za-z0-9]{10,200}$/.test(sessions[0])) {
    w.proveitPaidCheckout = {source:source,sessionId:sessions[0]};
  }
})(window, document);
// Execute before Next/analytics. Keep attribution tokens only in this document.
(function (w, d) {
  'use strict';
  var url = new URL(w.location.href);
  if (!url.searchParams.has('ec')) return;
  var values = url.searchParams.getAll('ec');
  url.searchParams.delete('ec');
  try {
    w.history.replaceState(w.history.state, '', url.pathname + url.search + url.hash);
  } catch (_) {
    // Do not continue loading vendor scripts with the bearer token in the URL.
    w.location.replace(url.pathname + url.search + url.hash);
    return;
  }
  var meta = d.createElement('meta');
  meta.name = 'referrer'; meta.content = 'no-referrer'; d.head.appendChild(meta);
  if (url.protocol === 'https:' && /^(www\.)?justproveit\.co\.uk$/.test(url.hostname) && /^\/bani-uk-ai\/?$/.test(url.pathname) && values.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(values[0])) {
    w.proveitEmailToken = values[0];
    if (w.crypto && w.crypto.randomUUID) {
      w.proveitEmailAttribution = { token: values[0], visitId: w.crypto.randomUUID(), eventId: w.crypto.randomUUID() };
      var ttclid = url.searchParams.get('ttclid');
      if (ttclid && /^[A-Za-z0-9._-]{1,256}$/.test(ttclid)) w.proveitEmailAttribution.ttclid = ttclid;
    }
  }
})(window, document);
