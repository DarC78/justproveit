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
