import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProveitCampaignEmail } from './lib/proveit-campaign-email.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const final = process.argv.includes('--final');
const test = process.argv.includes('--test');
if (final && test) throw new Error('Choose either --test or --final');
const config = JSON.parse(fs.readFileSync(path.join(root, 'email-templates/proveit/bani-uk-ai-01.json'), 'utf8'));
const nameIndex = process.argv.indexOf('--name');
if (nameIndex >= 0 && (!process.argv[nameIndex + 1] || process.argv[nameIndex + 1].startsWith('--'))) {
  throw new Error('--name requires a recipient name');
}
const recipientName = nameIndex >= 0 ? process.argv[nameIndex + 1] : final && !test ? '' : config.testRecipientName;
const unsubscribeIndex = process.argv.indexOf('--unsubscribe-url');
if (unsubscribeIndex >= 0 && (!process.argv[unsubscribeIndex + 1] || process.argv[unsubscribeIndex + 1].startsWith('--'))) throw new Error('--unsubscribe-url requires a URL');
const unsubscribeUrl = unsubscribeIndex >= 0 ? process.argv[unsubscribeIndex + 1] : null;
const rendered = renderProveitCampaignEmail({ recipientName, unsubscribeUrl, mode: final ? 'campaign' : test ? 'test' : 'preview' });
const { html, text, subject } = rendered;
const output = path.join(root, 'artifacts/email');
fs.mkdirSync(output, { recursive: true });
const suffix = test ? 'test' : final ? 'final' : 'preview';
const basename = `bani-uk-ai-01-${suffix}`;
fs.writeFileSync(path.join(output, `${basename}.html`), html);
fs.writeFileSync(path.join(output, `${basename}.txt`), text);
if (test) {
  fs.writeFileSync(path.join(output, 'bani-uk-ai-01-resend.json'), JSON.stringify({ from: config.from, to: [config.testRecipient], reply_to: config.replyTo, subject: `[TEST] ${subject}`, html, text,
    tags: [{ name: 'campaign', value: 'bani-uk-ai' }, { name: 'template', value: config.templateKey }, { name: 'audience', value: 'owner-test' }],
  }, null, 2));
}
console.log(JSON.stringify({ html: path.join(output, `${basename}.html`), text: path.join(output, `${basename}.txt`), bytes: Buffer.byteLength(html), readyToSend: test, campaignSendImplemented: false }));
