const { Parser } = require('htmlparser2');

const config = require('./email-links.json');
const escapeAttribute = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function brandedEmailLink(value, { exclude = [] } = {}) {
  if (!/^https?:\/\//i.test(value)) return value;
  const url = new URL(value);
  if (exclude.some(item => item && new URL(item).href === url.href)) return value;
  if (url.origin === config.origin && url.pathname === '/r') return value;
  const entry = Object.entries(config.links).find(([, destination]) => new URL(destination).href === url.href);
  if (!entry) throw new Error(`Email destination is not registered: ${url.origin}${url.pathname}`);
  const redirect = new URL('/r', config.origin);
  redirect.searchParams.set('id', entry[0]);
  return redirect.href;
}

// Parse tags and patch only href spans to retain the original email markup.
function rewriteEmailLinks({ html, text, from, unsubscribeUrl }) {
  const sender = /<?([^<>\s]+@([^<>\s]+))>?$/.exec(from);
  if (!sender || !config.senderDomains.includes(sender[2].toLowerCase())) throw new Error('No branded email link configuration for sender');
  const options = { exclude: [unsubscribeUrl] };
  const patches = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      if (name !== 'a' || !attributes.href) return;
      const replacement = brandedEmailLink(attributes.href, options);
      if (replacement === attributes.href) return;
      const tag = html.slice(parser.startIndex, parser.endIndex + 1);
      const attr = /\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let match;
      while ((match = attr.exec(tag))) {
        if (match[1].toLowerCase() !== 'href') continue;
        patches.push({ start: parser.startIndex + match.index, end: parser.startIndex + attr.lastIndex, value: ` href="${escapeAttribute(replacement)}"` });
        break;
      }
    },
  }, { decodeEntities: true });
  parser.end(html);
  for (const patch of patches.reverse()) html = html.slice(0, patch.start) + patch.value + html.slice(patch.end);
  text = text.replace(/https?:\/\/[^\s<>"']+/gi, match => {
    // Prefer the complete URL; punctuation may belong to its query/fragment.
    try { return brandedEmailLink(match, options); } catch {
      const [, value, punctuation] = /^(.*?)([.,;!?)\]]*)$/.exec(match);
      return brandedEmailLink(value, options) + punctuation;
    }
  });
  return { html, text };
}

module.exports = { brandedEmailLink, rewriteEmailLinks };
