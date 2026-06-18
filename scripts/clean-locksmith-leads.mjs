import fs from 'node:fs/promises';
import path from 'node:path';

const INPUTS = [
  'leads/Locksmiths-UK-DataForSEO-Maps-National.csv',
  'leads/Locksmiths-UK-DataForSEO-Maps-National-2.csv',
  'leads/Locksmiths-UK-DataForSEO-Maps-National-3.csv'
];

const OUTPUT = 'leads/Locksmiths-UK-Master.csv';
const CLEAN_NATIONAL = 'leads/Locksmiths-UK-DataForSEO-Maps-National-Clean.csv';

const HEADERS = [
  'business name',
  'city name',
  'website',
  'email',
  'contact us page',
  'phone number',
  'business type',
  'contact name',
  'source external id'
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  const text = String(value ?? '').trim();
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  return `${[
    HEADERS.join(','),
    ...rows.map((row) => HEADERS.map((header) => csvEscape(row[header])).join(','))
  ].join('\n')}\n`;
}

function normalizeEmail(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^mailto:/, '')
    .replace(/[?].*$/, '')
    .replace(/^[<("'[\s]+|[>)"',\].;\s]+$/g, '')
    .trim();
}

function cleanText(value) {
  return String(value || '')
    .replace(/â€“|â€”/g, '-')
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/Â/g, '')
    .trim();
}

function normalizeWebsite(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    url.hash = '';
    return url.toString();
  } catch {
    return raw;
  }
}

function cleanCity(value) {
  const text = cleanText(value);
  if (!text || /\d/.test(text) || text.length <= 2) return '';
  return text;
}

function isJunkEmail(email) {
  const normalized = normalizeEmail(email);
  const [local = '', domain = ''] = normalized.split('@');
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
    'service@atom.com',
    'impallari@gmail.com',
    'asxvmprobertest@gmail.com',
    'wweeiihhuuaanngg@gmail.com',
    'jonpinhorn.typedesign@gmail.com',
    'mymail@mailservice.com',
    'mail@business.com',
    'amkryukov@gmail.com',
    'support@blinkcharging.com',
    'pcpr@eco-movement.com',
    'privacy-team@evbox.com',
    'driversupport.uk@swarco.com',
    'newsletter@ionity.eu',
    'notifications@chargepoint.com',
    'support@be-ev.co.uk',
    'support.uk@mer.eco',
    'support.de@mer.eco',
    'csm-shenzhen@300.cn',
    'vouchers@aldi.co.uk',
    'dpo@gumtree.com'
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
    'latofonts.com',
    'eco-movement.com',
    'evbox.com',
    'swarco.com',
    'chargepoint.com',
    'ubitricity.co.uk',
    'shellrecharge.com',
    'ionity.eu',
    'aldi.co.uk',
    'lidl.co.uk',
    'hyundai.co.uk',
    'nissancorporate.co.uk',
    'tesla.com'
  ];

  if (!local || !domain) return true;
  if (exactJunk.has(normalized)) return true;
  if (normalized.includes('example.')) return true;
  if (local === 'example') return true;
  if (domain === 'email.com' || domain === 'mysite.com') return true;
  if (normalized.includes('sentry') || normalized.includes('wixpress.com')) return true;
  if (local === 'noreply' || local === 'no-reply' || local === 'donotreply') return true;
  if (/^[a-f0-9]{20,}$/i.test(local)) return true;
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(normalized)) return true;
  return junkDomains.some((junkDomain) => domain === junkDomain || domain.endsWith(`.${junkDomain}`));
}

function isRelevantLocksmith(row) {
  const contentHaystack = [
    row['business name'],
    row.website,
    row['contact us page']
  ].join(' ').toLowerCase();
  const typeHaystack = String(row['business type'] || '').toLowerCase();
  const haystack = `${contentHaystack} ${typeHaystack}`;

  const locksmithSignal = /locksmith|lock smith|auto locksmith|emergency locksmith|mobile locksmith|lock repair|lock replacement|key cutting|safe opening|access control|door lock|upvc lock|uPVC|master key/.test(haystack);
  const excluded = /plumb|boiler|gas engineer|heating engineer|hvac|air conditioning|electrician|charging station|mechanic|mot | mot$|tyre|garage|autocentre|auto centre|foodbank|hairdressing|cleaning|cleaners|gutter|wasp control|laundry|mobile phone|appliance store|lighting centre|serviced offices|estate agent|property management|self storage|training|course|college|school|manufacturer|wholesale|supplier|showroom|shoe repair|cobbler|engraving|watch repair|trophies|clothing|clothings|florida|boca raton|yamcha\.cloud|xtreme clean/.test(haystack);

  return locksmithSignal && !excluded;
}

function rowScore(row) {
  return HEADERS.reduce((score, header) => score + (row[header] ? 1 : 0), 0);
}

async function readRows(file) {
  const text = await fs.readFile(file, 'utf8');
  const [headers, ...records] = parseCsv(text).filter((row) => row.some((cell) => cell.trim()));
  if (!headers) return [];

  return records.map((record) => {
    const source = Object.fromEntries(headers.map((header, index) => [header.trim().toLowerCase(), record[index] || '']));
    return {
      'business name': cleanText(source['business name'] || source.name || ''),
      'city name': cleanCity(source['city name'] || source.city || ''),
      website: normalizeWebsite(source.website || ''),
      email: normalizeEmail(source.email || ''),
      'contact us page': normalizeWebsite(source['contact us page'] || ''),
      'phone number': cleanText(source['phone number'] || source.phone || ''),
      'business type': cleanText(source['business type'] || ''),
      'contact name': cleanText(source['contact name'] || ''),
      'source external id': cleanText(source['source external id'] || source.source_external_id || source.place_id || source.cid || '')
    };
  });
}

function dedupeKey(row) {
  if (row.email) return `email:${row.email}`;
  if (row['source external id']) return `source:${row['source external id'].toLowerCase()}`;
  try {
    const domain = new URL(row.website).hostname.replace(/^www\./, '');
    if (domain) return `domain:${domain}`;
  } catch {
    // Fall through to business identity.
  }
  return `business:${[
    row['business name'],
    row['city name'],
    row['phone number']
  ].join('|').toLowerCase()}`;
}

function cleanRows(rows) {
  const byIdentity = new Map();

  for (const row of rows) {
    if (row.email && isJunkEmail(row.email)) continue;
    if (!isRelevantLocksmith(row)) continue;
    const key = dedupeKey(row);
    if (!key || key === 'business:||') continue;
    const previous = byIdentity.get(key);
    if (!previous || rowScore(row) > rowScore(previous)) {
      byIdentity.set(key, row);
    }
  }

  return Array.from(byIdentity.values()).sort((a, b) => {
    const city = a['city name'].localeCompare(b['city name']);
    if (city) return city;
    return a['business name'].localeCompare(b['business name']);
  });
}

async function main() {
  const allRows = [];
  const perFileCounts = {};

  for (const input of INPUTS) {
    try {
      const rows = await readRows(input);
      perFileCounts[input] = rows.length;
      allRows.push(...rows);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      perFileCounts[input] = 0;
    }
  }

  const nationalRows = cleanRows(await readRows('leads/Locksmiths-UK-DataForSEO-Maps-National.csv'));
  const masterRows = cleanRows(allRows);

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(CLEAN_NATIONAL, toCsv(nationalRows), 'utf8');
  await fs.writeFile(OUTPUT, toCsv(masterRows), 'utf8');

  console.log(JSON.stringify({
    inputs: perFileCounts,
    cleanNational: nationalRows.length,
    master: masterRows.length,
    output: OUTPUT,
    cleanNationalOutput: CLEAN_NATIONAL
  }, null, 2));
}

await main();
