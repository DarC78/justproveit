import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { personalizedSubject } from './lib/proveit-email-subject.mjs';
import { rewriteEmailLinks } from './lib/proveit-email-links.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const final = process.argv.includes('--final');
const test = process.argv.includes('--test');
const ready = final || test;
const config = JSON.parse(fs.readFileSync(path.join(root, 'email-templates/proveit/bani-uk-ai-01.json'), 'utf8'));
const nameIndex = process.argv.indexOf('--name');
if (nameIndex >= 0 && (!process.argv[nameIndex + 1] || process.argv[nameIndex + 1].startsWith('--'))) {
  throw new Error('--name requires a recipient name');
}
const recipientName = nameIndex >= 0 ? process.argv[nameIndex + 1] : final && !test ? '' : config.testRecipientName;
const subject = personalizedSubject(config.subject, recipientName);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const httpsUrl = value => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Public HTTPS URLs required');
  return escape(url.href);
};
const paragraph = value => {
  const block = typeof value === 'string' ? { text: value } : value;
  const text = escape(block.text);
  return `<p style="margin:0 0 18px;${block.highlight ? 'color:#ff4e23;font-size:20px;font-weight:bold;line-height:29px;' : ''}">${block.strong ? `<strong>${text}</strong>` : text}</p>`;
};
const image = (url, alt, width, placeholder) => {
  if (!url) {
    if (ready) throw new Error(`Missing image: ${placeholder}`);
    return `<table role="presentation" width="100%" bgcolor="#dbe9ff"><tr><td align="center" style="padding:65px 22px;font:16px/24px Arial,sans-serif;color:#454545;border:1px dashed #6ea6f8;">PREVIZUALIZARE<br>${escape(placeholder)}</td></tr></table>`;
  }
  return `<img src="${httpsUrl(url)}" alt="${escape(alt)}" width="${width}" border="0" style="display:block;width:100%;max-width:${width}px;height:auto;margin:0 auto;">`;
};
const cta = `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#ff4e23" style="border-radius:8px;mso-padding-alt:16px 24px;"><a class="button" data-role="primary-cta" href="${httpsUrl(config.ctaUrl)}" style="display:inline-block;padding:16px 24px;font:700 16px/24px Arial,Helvetica,sans-serif;color:#111111;text-decoration:none;">${escape(config.ctaLabel)} &nbsp;<span style="white-space:nowrap;"><del style="font-weight:normal;">£97</del> &nbsp;£39</span></a></td></tr></table>`;
if (final && !config.unsubscribeUrl) throw new Error('Campaign unsubscribe URL required before final export');
const fields = {
  subject: escape(subject), preheader: escape(config.preheader),
  hero_html: image(config.heroImageUrl, config.heroImageAlt, 600, 'Imaginea de început va fi furnizată de Adrian.'),
  portrait_html: image(config.portraitImageUrl, config.portraitImageAlt, 280, 'Aici va apărea fotografia lui Adrian.'),
  postscript_images_html: (config.postscriptImages || []).map(asset => `<div style="margin-top:22px;">${image(asset.url, asset.alt, 524, 'Imagine suplimentară după P.S.')}</div>`).join('\n'),
  trustpilot_html: `<div style="margin:18px 0;">${image(config.trustpilotImageUrl, 'Profilul Proveit pe Trustpilot', 524, 'Imaginea profilului Trustpilot')}</div>`,
  reviews_html: config.reviews.map(review => `<table role="presentation" width="100%" bgcolor="#ffffff" style="margin-top:14px;"><tr><td style="padding:18px 20px;border:1px solid #c4d7f2;font:14px/22px Arial,Helvetica,sans-serif;color:#111111;"><p style="margin:0;">„${escape(review)}”</p></td></tr></table>`).join('\n'),
  intro_html: config.intro.map(paragraph).join('\n'), body_html: config.body.map(paragraph).join('\n'),
  cta_html: cta, offer_html: paragraph(config.offer) + paragraph(config.offerExtra), ps_html: escape(config.ps), disclaimer: escape(config.disclaimer),
  unsubscribe_html: config.unsubscribeUrl ? `<p style="margin:0;"><a href="${httpsUrl(config.unsubscribeUrl)}" style="color:#111111;">Dezabonare</a></p>` : test ? '<p style="margin:0;">E-mail de test trimis la solicitarea destinatarului.</p>' : '<p style="margin:0;font-style:italic;">PREVIZUALIZARE: linkul de dezabonare se completează în sistemul de trimitere.</p>',
};
let html = fs.readFileSync(path.join(root, 'email-templates/proveit/base.html'), 'utf8').replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
  if (!(key in fields)) throw new Error(`Unknown template field: ${key}`);
  return fields[key];
});
const plainParagraph = value => typeof value === 'string' ? value : value.text;
const signature = 'Mersi mult,\nAdrian Defta\nDirector Proveit\nTop 100 Romani de Pretutindeni';
let text = [config.preheader, ...config.intro, ...config.body.map(plainParagraph), config.offer, config.offerExtra, `${config.ctaLabel}: ${config.ctaUrl}`, signature, config.ps, config.disclaimer,
  ...config.reviews,
  'Review-uri Proveit: https://uk.trustpilot.com/review/proveitweb.co.uk', 'WhatsApp: https://api.whatsapp.com/send/?phone=447447707829&text=CRM_PROMO_BANI_UK_AI&type=phone_number&app_absent=0',
  'TikTok: https://www.tiktok.com/@proveit.ai', 'Facebook: https://www.facebook.com/ProveItWeb', 'Instagram: https://www.instagram.com/proveit.uk',
  'ProveIt Ltd · 14007642 · Ty Merlin, Caerphilly Business Park, Caerphilly, CF83 8DP, UK',
  config.unsubscribeUrl ? `Dezabonare: ${config.unsubscribeUrl}` : test ? 'E-mail de test trimis la solicitarea destinatarului.' : 'PREVIZUALIZARE: linkul de dezabonare nu este încă configurat.',
].join('\n\n');
({ html, text } = rewriteEmailLinks({ html, text, from: config.from, unsubscribeUrl: config.unsubscribeUrl }));
const output = path.join(root, 'artifacts/email');
fs.mkdirSync(output, { recursive: true });
const suffix = test ? 'test' : final ? 'final' : 'preview';
const basename = `bani-uk-ai-01-${suffix}`;
fs.writeFileSync(path.join(output, `${basename}.html`), html);
fs.writeFileSync(path.join(output, `${basename}.txt`), text);
if (ready) {
  fs.writeFileSync(path.join(output, 'bani-uk-ai-01-resend.json'), JSON.stringify({ from: config.from, to: [config.testRecipient], reply_to: config.replyTo, subject: `[TEST] ${subject}`, html, text,
    tags: [{ name: 'campaign', value: 'bani-uk-ai' }, { name: 'template', value: config.templateKey }, { name: 'audience', value: 'owner-test' }],
  }, null, 2));
}
console.log(JSON.stringify({ html: path.join(output, `${basename}.html`), text: path.join(output, `${basename}.txt`), bytes: Buffer.byteLength(html), readyToSend: ready }));
