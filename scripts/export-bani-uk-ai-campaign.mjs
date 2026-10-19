import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'scripts/lib/proveit-campaign-email.mjs', 'scripts/lib/proveit-email-links.mjs',
  'scripts/lib/proveit-email-subject.mjs', 'api/shared/emailLinks.js',
  'api/shared/email-links.json', 'email-templates/proveit/base.html',
  'email-templates/proveit/bani-uk-ai-01.json',
];
const output = path.join(root, 'artifacts/campaigns/bani-uk-ai-email-01');
const hashes = {};
for (const file of files) {
  const content = fs.readFileSync(path.join(root, file));
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  hashes[file] = crypto.createHash('sha256').update(content).digest('hex');
}
const manifest = {
  campaignKey: 'bani-uk-ai-2026-10', templateKey: 'ro-bani-uk-ai-email-01',
  tenantKey: 'justproveit', audienceTable: 'wix.ozLeadsBanks1910',
  snapshotCount: 28105, sendEnabled: false,
  entrypoint: 'scripts/lib/proveit-campaign-email.mjs', export: 'renderProveitCampaignEmail',
  inputs: ['recipientName', 'unsubscribeUrl'],
  rendererVersion: crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),
  hashes,
};
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
// Keep CommonJS helpers working; do not set package-wide type=module.
fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify({ private: true, engines: { node: '>=20' }, dependencies: { htmlparser2: '^10.0.0' } }, null, 2) + '\n');
fs.copyFileSync(path.join(root, 'docs/launchingstack-bani-uk-ai-campaign-spec.md'), path.join(output, 'LAUNCHINGSTACK-HANDOFF.md'));
fs.writeFileSync(path.join(output, 'README.md'), '# Bani UK AI email 01 integration bundle\n\nRead LAUNCHINGSTACK-HANDOFF.md first. This bundle renders content only; it cannot send or schedule emails.\n\nInstall the htmlparser2 dependency under the receiving project dependency policy. Preserve the directory structure. Import renderProveitCampaignEmail from scripts/lib/proveit-campaign-email.mjs. Pass recipientName and a real recipient-specific first-party unsubscribeUrl; add the actual recipient in the backend.\n\nmanifest.json identifies the exact source hashes and renderer version. No credentials or audience email addresses are included. Sending remains disabled.\n');
console.log(JSON.stringify({ output, rendererVersion: manifest.rendererVersion, sendEnabled: false }));
