import fs from 'node:fs';
import { preparePilot } from './lib/email-attribution-pilot.mjs';

const target = new URL('../src/config/email-attribution.json', import.meta.url);
const current = JSON.parse(fs.readFileSync(target, 'utf8'));
const google = JSON.parse(fs.readFileSync(new URL('../src/config/google-advertising.json', import.meta.url), 'utf8'));
const write = process.argv.includes('--write');
if (process.argv.includes('--disable')) {
  const disabled = { ...current, enabled: false, pilot: { enabled: false, tokenSha256: null, preparedAt: null, expiresAt: null } };
  if (write) fs.writeFileSync(target, JSON.stringify(disabled, null, 2) + '\n');
  console.log(JSON.stringify({ written: write, generalEnabled: false, pilotEnabled: false }));
} else {
  // Read the bearer token only over stdin, never argv, a tracked file or logs.
  let text = '';
  for await (const chunk of process.stdin) {
    text += chunk;
    if (Buffer.byteLength(text) > 4096) { console.error('Pilot input too large. No settings changed.'); process.exit(1); }
  }
  let input;
  try { input = JSON.parse(text); }
  catch { console.error('Invalid pilot JSON. No settings changed.'); process.exit(1); }
  try {
    const planned = preparePilot(input, current, google);
    input = null; text = '';
    if (write) fs.writeFileSync(target, JSON.stringify(planned, null, 2) + '\n');
    console.log(JSON.stringify({ written: write, generalEnabled: false, pilotEnabled: planned.pilot.enabled, expiresAt: planned.pilot.expiresAt, tokenSha256: planned.pilot.tokenSha256, googleEnabled: false, deploymentRequired: write }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
