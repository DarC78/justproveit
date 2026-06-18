import fs from 'node:fs/promises';
import path from 'node:path';

const ENDPOINT = 'https://api.dataforseo.com/v3/serp/google/maps/live/advanced';
const OUTPUT_DEFAULT = 'leads/Local-Electricians-UK-DataForSEO-Maps.csv';
const REQUEST_DELAY_MS = 450;
const CRAWL_TIMEOUT_MS = 9000;
const MAX_CONTACT_LINKS = 4;
const PARTIAL_SAVE_EVERY = 25;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const LOCATIONS = [
  'London,England,United Kingdom',
  'Birmingham,England,United Kingdom',
  'Manchester,England,United Kingdom',
  'Leeds,England,United Kingdom',
  'Glasgow,Scotland,United Kingdom',
  'Sheffield,England,United Kingdom',
  'Bradford,England,United Kingdom',
  'Liverpool,England,United Kingdom',
  'Edinburgh,Scotland,United Kingdom',
  'Bristol,England,United Kingdom',
  'Cardiff,Wales,United Kingdom',
  'Newcastle upon Tyne,England,United Kingdom',
  'Nottingham,England,United Kingdom',
  'Leicester,England,United Kingdom',
  'Coventry,England,United Kingdom',
  'Belfast,Northern Ireland,United Kingdom',
  'Southampton,England,United Kingdom',
  'Portsmouth,England,United Kingdom',
  'Brighton,England,United Kingdom',
  'Plymouth,England,United Kingdom',
  'Derby,England,United Kingdom',
  'Stoke-on-Trent,England,United Kingdom',
  'Wolverhampton,England,United Kingdom',
  'Norwich,England,United Kingdom',
  'Swansea,Wales,United Kingdom',
  'Aberdeen,Scotland,United Kingdom',
  'Dundee,Scotland,United Kingdom',
  'Middlesbrough,England,United Kingdom',
  'Hull,England,United Kingdom',
  'Reading,England,United Kingdom',
  'Oxford,England,United Kingdom',
  'Cambridge,England,United Kingdom',
  'York,England,United Kingdom',
  'Bath,England,United Kingdom',
  'Exeter,England,United Kingdom',
  'Cheltenham,England,United Kingdom',
  'Gloucester,England,United Kingdom',
  'Swindon,England,United Kingdom',
  'Bournemouth,England,United Kingdom',
  'Poole,England,United Kingdom',
  'Weymouth,England,United Kingdom',
  'Taunton,England,United Kingdom',
  'Truro,England,United Kingdom',
  'Falmouth,England,United Kingdom',
  'Torquay,England,United Kingdom',
  'Barnstaple,England,United Kingdom',
  'Chelmsford,England,United Kingdom',
  'Colchester,England,United Kingdom',
  'Ipswich,England,United Kingdom',
  'Peterborough,England,United Kingdom',
  'Luton,England,United Kingdom',
  'Milton Keynes,England,United Kingdom',
  'Northampton,England,United Kingdom',
  'Bedford,England,United Kingdom',
  'Watford,England,United Kingdom',
  'St Albans,England,United Kingdom',
  'Harlow,England,United Kingdom',
  'Maidstone,England,United Kingdom',
  'Canterbury,England,United Kingdom',
  'Dover,England,United Kingdom',
  'Ashford,England,United Kingdom',
  'Tunbridge Wells,England,United Kingdom',
  'Crawley,England,United Kingdom',
  'Worthing,England,United Kingdom',
  'Eastbourne,England,United Kingdom',
  'Hastings,England,United Kingdom',
  'Guildford,England,United Kingdom',
  'Woking,England,United Kingdom',
  'Croydon,England,United Kingdom',
  'Kingston upon Thames,England,United Kingdom',
  'Sutton,England,United Kingdom',
  'Romford,England,United Kingdom',
  'Ilford,England,United Kingdom',
  'Enfield,England,United Kingdom',
  'Harrow,England,United Kingdom',
  'Slough,England,United Kingdom',
  'Windsor,England,United Kingdom',
  'Basingstoke,England,United Kingdom',
  'Winchester,England,United Kingdom',
  'Newport,Wales,United Kingdom',
  'Wrexham,Wales,United Kingdom',
  'Bangor,Wales,United Kingdom',
  'Aberystwyth,Wales,United Kingdom',
  'Merthyr Tydfil,Wales,United Kingdom',
  'Llanelli,Wales,United Kingdom',
  'Preston,England,United Kingdom',
  'Blackpool,England,United Kingdom',
  'Lancaster,England,United Kingdom',
  'Bolton,England,United Kingdom',
  'Wigan,England,United Kingdom',
  'Warrington,England,United Kingdom',
  'Chester,England,United Kingdom',
  'Crewe,England,United Kingdom',
  'Stockport,England,United Kingdom',
  'Oldham,England,United Kingdom',
  'Rochdale,England,United Kingdom',
  'Burnley,England,United Kingdom',
  'Blackburn,England,United Kingdom',
  'Carlisle,England,United Kingdom',
  'Kendal,England,United Kingdom',
  'Darlington,England,United Kingdom',
  'Durham,England,United Kingdom',
  'Sunderland,England,United Kingdom',
  'Gateshead,England,United Kingdom',
  'Hartlepool,England,United Kingdom',
  'Scarborough,England,United Kingdom',
  'Harrogate,England,United Kingdom',
  'Wakefield,England,United Kingdom',
  'Huddersfield,England,United Kingdom',
  'Halifax,England,United Kingdom',
  'Barnsley,England,United Kingdom',
  'Rotherham,England,United Kingdom',
  'Doncaster,England,United Kingdom',
  'Scunthorpe,England,United Kingdom',
  'Grimsby,England,United Kingdom',
  'Lincoln,England,United Kingdom',
  'Mansfield,England,United Kingdom',
  'Chesterfield,England,United Kingdom',
  'Loughborough,England,United Kingdom',
  'Kettering,England,United Kingdom',
  'Worcester,England,United Kingdom',
  'Hereford,England,United Kingdom',
  'Shrewsbury,England,United Kingdom',
  'Telford,England,United Kingdom',
  'Stafford,England,United Kingdom',
  'Tamworth,England,United Kingdom',
  'Solihull,England,United Kingdom',
  'Dudley,England,United Kingdom',
  'Walsall,England,United Kingdom',
  'West Bromwich,England,United Kingdom',
  'Warwick,England,United Kingdom',
  'Leamington Spa,England,United Kingdom',
  'Stratford-upon-Avon,England,United Kingdom',
  'Nuneaton,England,United Kingdom',
  'Rugby,England,United Kingdom',
  'Aylesbury,England,United Kingdom',
  'High Wycombe,England,United Kingdom',
  'Marlow,England,United Kingdom',
  'Maidenhead,England,United Kingdom',
  'Bracknell,England,United Kingdom',
  'Newbury,England,United Kingdom',
  'Perth,Scotland,United Kingdom',
  'Stirling,Scotland,United Kingdom',
  'Inverness,Scotland,United Kingdom',
  'Ayr,Scotland,United Kingdom',
  'Paisley,Scotland,United Kingdom',
  'East Kilbride,Scotland,United Kingdom',
  'Dunfermline,Scotland,United Kingdom',
  'Kirkcaldy,Scotland,United Kingdom',
  'Motherwell,Scotland,United Kingdom',
  'Hamilton,Scotland,United Kingdom',
  'Derry,Northern Ireland,United Kingdom',
  'Lisburn,Northern Ireland,United Kingdom',
  'Newry,Northern Ireland,United Kingdom',
  'Armagh,Northern Ireland,United Kingdom',
  'Bangor,Northern Ireland,United Kingdom'
];

const KEYWORDS = [
  'electrician',
  'electricians near me',
  'local electrician',
  'emergency electrician',
  'electrical services',
  'domestic electrician',
  'commercial electrician',
  'electrical contractor',
  'ev charger installation',
  'eicr certificate'
];

function getArg(name, fallback = null) {
  const exact = `--${name}`;
  const prefix = `${exact}=`;
  const index = process.argv.indexOf(exact);
  if (index !== -1) return process.argv[index + 1] ?? fallback;
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

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function normalizeUrl(value) {
  const raw = clean(value);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function cityFromLocationName(locationName) {
  return clean(locationName).split(',')[0] || '';
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  const headers = ['business name', 'city name', 'website', 'email', 'contact us page', 'phone number', 'business type', 'contact name', 'source external id'];
  return `${[
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n')}\n`;
}

function outputFor(output, suffix) {
  const parsed = path.parse(output);
  return path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`);
}

function extractEmails(text) {
  const matches = String(text || '').match(EMAIL_REGEX) || [];
  return Array.from(new Set(matches.map(normalizeEmail)))
    .filter((email) => !isJunkEmail(email));
}

function isJunkEmail(email) {
  const [local = '', domain = ''] = normalizeEmail(email).split('@');
  const exactJunk = new Set([
    'example@gmail.com',
    'example@host.co.uk',
    'example@email.com',
    'example@server.co.uk',
    'example@mysite.com',
    'user@domain.com',
    'john@email.com',
    'your@email.com',
    'name@email.com',
    'you@company.com',
    'john@doe.com',
    'name@domain.com',
    'info@mysite.com',
    'filler@godaddy.com',
    'support@webador.com',
    'privacy@linktr.ee',
    'registrants@fasthosts.com',
    'service@atom.com'
  ]);
  const junkDomains = [
    'latinotype.com',
    'sansoxygen.com',
    'indiantypefoundry.com',
    'pixelspread.com',
    'micahrich.com',
    'floodlightmedia.co.uk',
    'osamweb.com',
    'eyebytes.com',
    'astigmatic.com',
    'latofonts.com'
  ];

  if (!local || !domain) return true;
  if (exactJunk.has(email)) return true;
  if (email.includes('example.')) return true;
  if (local === 'example') return true;
  if (domain === 'email.com' || domain === 'mysite.com') return true;
  if (email.includes('sentry') || email.includes('wixpress.com')) return true;
  if (local === 'noreply' || local === 'no-reply' || local === 'donotreply') return true;
  if (/^[a-f0-9]{20,}$/i.test(local)) return true;
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(email)) return true;
  return junkDomains.some((junkDomain) => domain === junkDomain || domain.endsWith(`.${junkDomain}`));
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
    if (/contact|about|get-in-touch|support|privacy/i.test(url)) links.push(url);
  }
  return Array.from(new Set(links)).slice(0, MAX_CONTACT_LINKS);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 lead-research-bot (+public-email-enrichment)' }
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

async function enrichEmail(website) {
  const homeUrl = normalizeUrl(website);
  if (!homeUrl) return { email: '', contactPage: '' };
  const homeHtml = await fetchText(homeUrl);
  let emails = extractEmails(homeHtml);
  if (emails.length) return { email: emails[0], contactPage: homeUrl };
  const links = extractContactLinks(homeHtml, homeUrl);
  for (const link of links) {
    const html = await fetchText(link);
    emails = extractEmails(html);
    if (emails.length) return { email: emails[0], contactPage: link };
  }
  return { email: '', contactPage: links[0] || homeUrl };
}

function authHeader(login, password) {
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function queryMaps({ login, password, keyword, locationName, depth }) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: authHeader(login, password),
      'content-type': 'application/json'
    },
    body: JSON.stringify([{
      keyword,
      language_code: 'en',
      location_name: locationName,
      depth
    }])
  });
  const payload = await response.json();
  const task = payload.tasks?.[0];
  if (response.ok && payload.status_code === 20000 && task?.status_code === 40102) {
    return [];
  }
  if (!response.ok || payload.status_code !== 20000 || task?.status_code !== 20000) {
    throw new Error(
      `DataForSEO Maps request failed: top=${payload.status_code || response.status} ${payload.status_message || response.statusText}; task=${task?.status_code || 'missing'} ${task?.status_message || 'missing task'}`
    );
  }
  return task?.result?.[0]?.items || [];
}

function isRelevantMapsItem(item) {
  if (item.type !== 'maps_search') return false;
  const haystack = [
    item.title,
    item.category,
    ...(Array.isArray(item.additional_categories) ? item.additional_categories : []),
    ...(Array.isArray(item.category_ids) ? item.category_ids : [])
  ].join(' ').toLowerCase();
  const relevant = /electric|eicr|ev charger|rewir|pat test|fuse box|consumer unit|lighting|socket|alarm|cctv|solar/.test(haystack);
  const excluded = /merchant|suppl|wholesal|training|course|college|school|parts|showroom|hardware|builders merchant|appliance store|electronics store|mobile phone|computer repair/.test(haystack);
  return relevant && !excluded;
}

function rowFromMapsItem(item, locationName) {
  const website = normalizeUrl(item.url || item.domain || '');
  const city = clean(item.address_info?.city || item.address_info?.region) || cityFromLocationName(locationName);
  const phones = [
    item.phone,
    ...(Array.isArray(item.phone_numbers) ? item.phone_numbers : []),
    ...(Array.isArray(item.phones) ? item.phones : [])
  ].map(clean).filter(Boolean);
  return {
    'business name': clean(item.title || item.original_title),
    'city name': city,
    website,
    email: '',
    'contact us page': website,
    'phone number': Array.from(new Set(phones)).join('; '),
    'business type': clean(item.category || 'electrician'),
    'contact name': '',
    'source external id': clean(item.place_id || item.cid || item.feature_id || item.data_id || '')
  };
}

function dedupeRows(rows) {
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    let domain = '';
    try {
      domain = new URL(row.website).hostname.replace(/^www\./, '');
    } catch {
      domain = '';
    }
    const key = domain || clean(`${row['business name']} ${row['phone number']} ${row['city name']}`).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

async function main() {
  const login = process.env.DATAFORSEO_LOGIN || process.env.DATA_FOR_SEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD || process.env.DATA_FOR_SEO_PASSWORD;
  const output = getArg('output', OUTPUT_DEFAULT);
  const depth = parsePositiveInt(getArg('depth'), 100);
  const maxResults = parsePositiveInt(getArg('max-results'), 500);
  const maxRequests = parsePositiveInt(getArg('max-requests'), 80);
  const skipCrawl = hasFlag('skip-crawl');
  const candidatesOutput = outputFor(output, '-candidates');
  const partialOutput = outputFor(output, '-partial');

  if (!login || !password) {
    console.error('Missing DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.');
    process.exit(1);
  }

  let requestCount = 0;
  let rows = [];
  for (const locationName of LOCATIONS) {
    for (const keyword of KEYWORDS) {
      if (requestCount >= maxRequests || dedupeRows(rows).length >= maxResults) break;
      requestCount += 1;
      console.log(`Querying ${keyword} in ${cityFromLocationName(locationName)}...`);
      const items = await queryMaps({ login, password, keyword, locationName, depth });
      const mapped = items
        .filter(isRelevantMapsItem)
        .map((item) => rowFromMapsItem(item, locationName));
      rows = dedupeRows(rows.concat(mapped));
      console.log(`  ${mapped.length} relevant, ${rows.length} unique so far.`);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(candidatesOutput, toCsv(rows), 'utf8');
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
    if (requestCount >= maxRequests || dedupeRows(rows).length >= maxResults) break;
  }

  rows = dedupeRows(rows).slice(0, maxResults);
  if (!skipCrawl) {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row.email && row.website) {
        console.log(`Crawling ${index + 1}/${rows.length}: ${row['business name']}`);
        const enriched = await enrichEmail(row.website);
        row.email = enriched.email;
        row['contact us page'] = enriched.contactPage || row.website;
        if ((index + 1) % PARTIAL_SAVE_EVERY === 0) {
          await fs.writeFile(partialOutput, toCsv(rows), 'utf8');
          console.log(`  partial save: ${rows.length} business leads`);
        }
      }
    }
  }

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(candidatesOutput, toCsv(rows), 'utf8');
  await fs.writeFile(partialOutput, toCsv(rows), 'utf8');
  await fs.writeFile(output, toCsv(rows), 'utf8');
  console.log(`Wrote ${rows.length} business leads to ${output}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
