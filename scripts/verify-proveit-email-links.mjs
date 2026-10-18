import { readFileSync } from 'node:fs';

const { origin, links } = JSON.parse(readFileSync(new URL('../api/shared/email-links.json', import.meta.url), 'utf8'));
for (const [id, destination] of Object.entries(links)) {
  const url = new URL('/r', origin);
  url.searchParams.set('id', id);
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  if (response.status !== 302 || response.headers.get('location') !== new URL(destination).href || response.headers.get('cache-control') !== 'no-store') {
    throw new Error(`Live branded link not ready: ${id} (HTTP ${response.status})`);
  }
}
for (const suffix of ['/r', '/r?id=unregistered&url=https%3A%2F%2Fevil.example']) {
  const response = await fetch(new URL(suffix, origin), { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  if (response.status !== 400 || response.headers.has('location')) throw new Error('Invalid redirects must be rejected');
}
console.log(`Verified ${Object.keys(links).length} live branded redirects and invalid-link rejection.`);
