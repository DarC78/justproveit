import fs from 'node:fs';
import { personalizedSubject } from './proveit-email-subject.mjs';
import { rewriteEmailLinks } from './proveit-email-links.mjs';

const sourceConfig = JSON.parse(fs.readFileSync(new URL('../../email-templates/proveit/bani-uk-ai-01.json', import.meta.url), 'utf8'));
const shell = fs.readFileSync(new URL('../../email-templates/proveit/base.html', import.meta.url), 'utf8');

// Store in app.EmailOutbox.PayloadJson, not the Resend request. Without an
// explicit recipientId the backend binds the outbox UUID.
export function emailCampaignMetadata(recipientId) {
  if (recipientId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(recipientId)) throw new Error('Campaign recipient ID must be a lowercase UUID');
  return { emailCampaign: { campaignKey: 'CRM_PROMO_BANI_UK_AI_1', ...(recipientId === undefined ? {} : { recipientId }) } };
}

// Pure rendering only: never sends, schedules or writes recipient payloads.
export function renderProveitCampaignEmail({ recipientName = '', unsubscribeUrl = null, mode = 'campaign' } = {}) {
  if (!['campaign', 'test', 'preview'].includes(mode)) throw new Error('Invalid rendering mode');
  const final = mode === 'campaign', test = mode === 'test', ready = final || test;
  if (unsubscribeUrl) {
    if (/[\r\n\x00-\x1f\x7f]/.test(unsubscribeUrl)) throw new Error('Invalid unsubscribe URL');
    const url = new URL(unsubscribeUrl);
    if (url.protocol !== 'https:' || url.username || url.password || !['www.justproveit.co.uk', 'send.justproveit.co.uk', 'mail.justproveit.co.uk'].includes(url.hostname)) throw new Error('Approved first-party HTTPS unsubscribe URL required');
    unsubscribeUrl = url.href;
  }
  const config = { ...sourceConfig, unsubscribeUrl };
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
    ps_extra_html: config.psExtra ? `<div style="margin-top:18px;">${paragraph(config.psExtra)}</div>` : '',
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
  let html = shell.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
    if (!(key in fields)) throw new Error(`Unknown template field: ${key}`);
    return fields[key];
  });
  const plainParagraph = value => typeof value === 'string' ? value : value.text;
  const signature = 'Mersi mult,\nAdrian Defta\nDirector Proveit\nTop 100 Români de Pretutindeni';
  let text = [config.preheader, ...config.intro, ...config.body.map(plainParagraph), config.offer, config.offerExtra, `${config.ctaLabel}: ${config.ctaUrl}`, signature, config.ps, ...(config.psExtra ? [config.psExtra] : []), config.disclaimer,
    ...config.reviews,
    'Review-uri Proveit: https://uk.trustpilot.com/review/proveitweb.co.uk', 'WhatsApp: https://api.whatsapp.com/send/?phone=447447707829&text=CRM_PROMO_BANI_UK_AI&type=phone_number&app_absent=0',
    'TikTok: https://www.tiktok.com/@proveit.ai', 'Facebook: https://www.facebook.com/ProveItWeb', 'Instagram: https://www.instagram.com/proveit.uk',
    'ProveIt Ltd · 14007642 · Ty Merlin, Caerphilly Business Park, Caerphilly, CF83 8DP, UK',
    config.unsubscribeUrl ? `Dezabonare: ${config.unsubscribeUrl}` : test ? 'E-mail de test trimis la solicitarea destinatarului.' : 'PREVIZUALIZARE: linkul de dezabonare nu este încă configurat.',
  ].join('\n\n');
  ({ html, text } = rewriteEmailLinks({ html, text, from: config.from, unsubscribeUrl: config.unsubscribeUrl }));
  
  return { from: config.from, reply_to: config.replyTo, subject, html, text,
    ...(final ? { headers: { 'List-Unsubscribe': '<' + unsubscribeUrl + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
    tags: [{ name: 'campaign', value: 'CRM_PROMO_BANI_UK_AI_1' }, { name: 'template', value: config.templateKey }] };
}
