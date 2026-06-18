import fs from 'node:fs/promises';
import path from 'node:path';

const DATAFORSEO_ENDPOINT = 'https://api.dataforseo.com/v3/business_data/business_listings/search/live';
const DEFAULT_OUTPUT = 'leads/Small Plumbing Companies UK - DataForSEO.csv';
const DEFAULT_LIMIT_PER_LOCATION = 100;
const DEFAULT_MAX_RESULTS = 1000;
const REQUEST_DELAY_MS = 350;
const CRAWL_TIMEOUT_MS = 9000;
const MAX_CONTACT_LINKS = 4;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const SEED_LOCATIONS = [
  ['London', 51.5072, -0.1276, 35],
  ['Birmingham', 52.4862, -1.8904, 25],
  ['Manchester', 53.4808, -2.2426, 25],
  ['Leeds', 53.8008, -1.5491, 25],
  ['Glasgow', 55.8642, -4.2518, 30],
  ['Sheffield', 53.3811, -1.4701, 22],
  ['Bradford', 53.7950, -1.7594, 20],
  ['Liverpool', 53.4084, -2.9916, 22],
  ['Edinburgh', 55.9533, -3.1883, 25],
  ['Bristol', 51.4545, -2.5879, 22],
  ['Cardiff', 51.4816, -3.1791, 22],
  ['Newcastle upon Tyne', 54.9783, -1.6178, 22],
  ['Nottingham', 52.9548, -1.1581, 20],
  ['Leicester', 52.6369, -1.1398, 20],
  ['Coventry', 52.4068, -1.5197, 18],
  ['Belfast', 54.5973, -5.9301, 25],
  ['Southampton', 50.9097, -1.4044, 20],
  ['Portsmouth', 50.8198, -1.0880, 18],
  ['Brighton', 50.8225, -0.1372, 18],
  ['Plymouth', 50.3755, -4.1427, 20],
  ['Derby', 52.9225, -1.4746, 18],
  ['Stoke-on-Trent', 53.0027, -2.1794, 18],
  ['Wolverhampton', 52.5862, -2.1288, 18],
  ['Norwich', 52.6309, 1.2974, 20],
  ['Swansea', 51.6214, -3.9436, 20],
  ['Aberdeen', 57.1497, -2.0943, 22],
  ['Dundee', 56.4620, -2.9707, 18],
  ['Middlesbrough', 54.5742, -1.2350, 18],
  ['Hull', 53.7676, -0.3274, 18],
  ['Reading', 51.4543, -0.9781, 18],
  ['Oxford', 51.7520, -1.2577, 18],
  ['Cambridge', 52.2053, 0.1218, 18]
];

function getArg(name, fallback = null) {
  const exact = `--${name}`;
  const prefix = `${exact}=`;
  const index = process.argv.indexOf(exact);
  if (index !== -1) {
    return process.argv[index + 1] ?? fallback;
  }
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeUrl(value) {
  const raw = normalizeText(value);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function cityFromAddressInfo(item) {
  return normalizeText(item?.address_info?.city || item?.address_info?.borough || item?.address_info?.region);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  const headers = ['business name', 'city name', 'website', 'email', 'contact us page', 'phone number', 'business type', 'contact name'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function extractEmails(text) {
  const matches = String(text || '').match(EMAIL_REGEX) || [];
  return Array.from(new Set(matches.map(normalizeEmail)))
    .filter((email) => !email.includes('example.'))
    .filter((email) => !['example@server.co.uk', 'example@mysite.com', 'user@domain.com'].includes(email))
    .filter((email) => !email.endsWith('@latinotype.com') && !email.endsWith('@sansoxygen.com'))
    .filter((email) => !email.includes('sentry') && !email.includes('wixpress.com'))
    .filter((email) => !email.startsWith('noreply@') && !email.startsWith('no-reply@'))
    .filter((email) => !/^[a-f0-9]{20,}@/i.test(email))
    .filter((email) => !email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.jpeg') && !email.endsWith('.webp'));
}

function looksLikeContactPath(url) {
  return /contact|about|support|get-in-touch|privacy/i.test(url);
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return '';
  }
}

function extractContactLinks(html, baseUrl) {
  const links = [];
  const hrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    const url = absoluteUrl(href, baseUrl);
    if (url && looksLikeContactPath(url)) links.push(url);
  }
  return Array.from(new Set(links)).slice(0, MAX_CONTACT_LINKS);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 lead-research-bot (+contact-page-email-enrichment)'
      }
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) return '';
    return await response.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichEmailFromWebsite(website) {
  const homeUrl = normalizeUrl(website);
  if (!homeUrl) return { email: '', contactPage: '' };
  const homeHtml = await fetchText(homeUrl);
  let emails = extractEmails(homeHtml);
  if (emails.length) return { email: emails[0], contactPage: homeUrl };

  const contactLinks = extractContactLinks(homeHtml, homeUrl);
  for (const contactUrl of contactLinks) {
    const html = await fetchText(contactUrl);
    emails = extractEmails(html);
    if (emails.length) return { email: emails[0], contactPage: contactUrl };
  }

  return { email: '', contactPage: contactLinks[0] || homeUrl };
}

function authHeader(login, password) {
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function queryDataForSeo({ login, password, location, limit }) {
  const [, lat, lng, radius] = location;
  const body = [{
    categories: ['plumber'],
    title: 'plumber',
    description: 'plumber plumbing heating',
    location_coordinate: `${lat},${lng},${radius}`,
    limit,
    order_by: ['rating.votes_count,desc']
  }];

  const response = await fetch(DATAFORSEO_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: authHeader(login, password),
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok || payload.status_code !== 20000) {
    throw new Error(`DataForSEO request failed: ${payload.status_code || response.status} ${payload.status_message || response.statusText}`);
  }
  return payload.tasks?.[0]?.result?.[0]?.items || [];
}

function rowFromItem(item, fallbackCity) {
  const contactInfo = Array.isArray(item.contact_info) ? item.contact_info : [];
  const emailContact = contactInfo.find((entry) => String(entry?.value || '').includes('@'));
  const email = normalizeEmail(emailContact?.value || '');
  const website = normalizeUrl(item.url || item.domain || '');
  return {
    'business name': normalizeText(item.title || item.original_title),
    'city name': cityFromAddressInfo(item) || fallbackCity,
    website,
    email,
    'contact us page': website,
    'phone number': normalizeText(item.phone),
    'business type': normalizeText(item.category || 'plumbing'),
    'contact name': ''
  };
}

function dedupeRows(rows) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    const domain = (() => {
      try {
        return new URL(row.website).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })();
    const key = domain || normalizeText(`${row['business name']} ${row['phone number']} ${row['city name']}`).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

async function main() {
  const login = process.env.DATAFORSEO_LOGIN || process.env.DATA_FOR_SEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD || process.env.DATA_FOR_SEO_PASSWORD;
  const output = getArg('output', DEFAULT_OUTPUT);
  const limitPerLocation = parsePositiveInt(getArg('limit-per-location'), DEFAULT_LIMIT_PER_LOCATION);
  const maxResults = parsePositiveInt(getArg('max-results'), DEFAULT_MAX_RESULTS);
  const skipCrawl = hasFlag('skip-crawl');

  if (!login || !password) {
    console.error('Missing DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.');
    console.error('Add them to your shell/.env runner, then run:');
    console.error('  node scripts/pull-plumbing-leads-dataforseo.mjs --max-results 1000');
    process.exit(1);
  }

  const rows = [];
  for (const location of SEED_LOCATIONS) {
    const [city] = location;
    console.log(`Querying ${city}...`);
    const items = await queryDataForSeo({ login, password, location, limit: limitPerLocation });
    rows.push(...items.map((item) => rowFromItem(item, city)));
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    if (dedupeRows(rows).length >= maxResults) break;
  }

  let uniqueRows = dedupeRows(rows).slice(0, maxResults);
  if (!skipCrawl) {
    for (let index = 0; index < uniqueRows.length; index += 1) {
      const row = uniqueRows[index];
      if (!row.email && row.website) {
        console.log(`Crawling ${index + 1}/${uniqueRows.length}: ${row['business name']}`);
        const enriched = await enrichEmailFromWebsite(row.website);
        row.email = enriched.email;
        row['contact us page'] = enriched.contactPage || row.website;
      }
    }
  }

  uniqueRows = uniqueRows.filter((row) => row.email);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, toCsv(uniqueRows), 'utf8');
  console.log(`Wrote ${uniqueRows.length} email leads to ${output}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
