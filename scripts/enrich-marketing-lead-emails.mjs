import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const requireFromFunctions = createRequire('D:/DevProjects/LaunchingStack/backend/functions/package.json');
const sql = requireFromFunctions('mssql');

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  })
);

const settings = JSON.parse(
  await readFile('D:/DevProjects/LaunchingStack/backend/functions/local.settings.json', 'utf8')
);

const sourceKeys = String(args.get('source-keys') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const limit = Number.parseInt(args.get('limit') || '0', 10);
const concurrency = Math.max(1, Number.parseInt(args.get('concurrency') || '24', 10));
const timeoutMs = Math.max(1500, Number.parseInt(args.get('timeout-ms') || '6000', 10));
const maxContactLinks = Math.max(0, Number.parseInt(args.get('max-contact-links') || '4', 10));

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeEmail(value) {
  return clean(value)
    .toLowerCase()
    .replace(/^mailto:/, '')
    .replace(/[?].*$/, '')
    .replace(/^[<("'[\s]+|[>)"',\].;\s]+$/g, '');
}

function normalizeUrl(value) {
  const raw = clean(value);
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
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
    'mail@business.com',
    'support@webador.com',
    'privacy@linktr.ee',
    'registrants@fasthosts.com',
    'service@atom.com'
  ]);
  const junkDomains = [
    'example.com',
    'email.com',
    'mysite.com',
    'domain.com',
    'wixpress.com',
    'sentry.io',
    'google.com',
    'schema.org',
    'wordpress.org',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'youtube.com',
    'cloudflare.com',
    'godaddy.com',
    'shopify.com'
  ];

  if (!local || !domain) return true;
  if (exactJunk.has(normalized)) return true;
  if (normalized.includes('example.')) return true;
  if (local === 'example') return true;
  if (['noreply', 'no-reply', 'donotreply', 'do-not-reply'].includes(local)) return true;
  if (/^[a-f0-9]{20,}$/i.test(local)) return true;
  if (/\.(png|jpe?g|webp|gif|svg|css|js|ico|woff2?)$/i.test(normalized)) return true;
  return junkDomains.some((junkDomain) => domain === junkDomain || domain.endsWith(`.${junkDomain}`));
}

function extractEmails(text) {
  const matches = String(text || '').match(EMAIL_REGEX) || [];
  return Array.from(new Set(matches.map(normalizeEmail)))
    .filter((email) => !isJunkEmail(email))
    .slice(0, 10);
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
    if (!href || href.startsWith('tel:')) continue;
    if (href.startsWith('mailto:')) {
      links.push(href);
      continue;
    }
    const url = absoluteUrl(href, baseUrl);
    if (/contact|about|get-in-touch|support|privacy|legal|terms|enquir|quote|book/i.test(url)) {
      links.push(url);
    }
  }
  return Array.from(new Set(links)).slice(0, maxContactLinks);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 lead-email-enrichment (+public-contact-discovery)' },
      redirect: 'follow'
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

async function enrichWebsite(website) {
  const homeUrl = normalizeUrl(website);
  if (!homeUrl) return { emails: [], contactPage: '' };

  const homeHtml = await fetchText(homeUrl);
  const emails = new Set(extractEmails(homeHtml));
  let bestContactPage = homeUrl;
  const links = extractContactLinks(homeHtml, homeUrl);

  for (const link of links) {
    if (link.startsWith('mailto:')) {
      for (const email of extractEmails(link)) emails.add(email);
      continue;
    }
    const html = await fetchText(link);
    const pageEmails = extractEmails(html);
    if (pageEmails.length && bestContactPage === homeUrl) bestContactPage = link;
    for (const email of pageEmails) emails.add(email);
  }

  return {
    emails: Array.from(emails).slice(0, 10),
    contactPage: bestContactPage
  };
}

async function loadLeads(pool) {
  const request = pool.request();
  const sourceFilter = sourceKeys.length
    ? `AND s.source_key IN (${sourceKeys.map((_, index) => `@source${index}`).join(', ')})`
    : '';

  sourceKeys.forEach((sourceKey, index) => {
    request.input(`source${index}`, sql.NVarChar(160), sourceKey);
  });

  const top = Number.isFinite(limit) && limit > 0 ? `TOP (${limit})` : '';
  const result = await request.query(`
    SELECT ${top}
      l.lead_id,
      l.business_name,
      l.website_url,
      l.contact_page_url,
      l.email,
      s.source_key
    FROM marketing.leads l
    INNER JOIN marketing.lead_sources s
      ON s.source_id = l.source_id
    WHERE NULLIF(LTRIM(RTRIM(l.website_url)), '') IS NOT NULL
      AND NULLIF(LTRIM(RTRIM(l.email)), '') IS NULL
      ${sourceFilter}
    ORDER BY l.lead_id;
  `);

  return result.recordset;
}

async function saveEmails(pool, lead, emails, contactPage) {
  if (!emails.length) return 0;
  const request = pool.request()
    .input('leadId', sql.BigInt, lead.lead_id)
    .input('contactPageUrl', sql.NVarChar(1000), contactPage ? contactPage.slice(0, 1000) : null)
    .input('emailsJson', sql.NVarChar(sql.MAX), JSON.stringify(emails));

  const result = await request.query(`
    DECLARE @inserted TABLE (email NVARCHAR(320));

    ;WITH parsed AS (
      SELECT DISTINCT LOWER(LTRIM(RTRIM([value]))) AS email
      FROM OPENJSON(@emailsJson)
      WHERE NULLIF(LTRIM(RTRIM([value])), '') IS NOT NULL
    ),
    available AS (
      SELECT p.email
      FROM parsed p
      WHERE NOT EXISTS (
          SELECT 1 FROM marketing.lead_emails existing WHERE existing.normalized_email = p.email
        )
        AND NOT EXISTS (
          SELECT 1 FROM marketing.leads existingLead WHERE existingLead.normalized_email = p.email
        )
    )
    INSERT INTO marketing.lead_emails (lead_id, email, is_primary, source)
      OUTPUT inserted.email INTO @inserted(email)
      SELECT
        @leadId,
        email,
        CASE WHEN ROW_NUMBER() OVER (ORDER BY email) = 1 THEN 1 ELSE 0 END,
        N'website_enrichment'
      FROM available;

    DECLARE @primaryEmail NVARCHAR(320);
    SELECT TOP 1 @primaryEmail = email FROM @inserted ORDER BY email;

    IF @primaryEmail IS NOT NULL
    BEGIN
      UPDATE marketing.leads
      SET
        email = COALESCE(email, @primaryEmail),
        contact_page_url = COALESCE(NULLIF(@contactPageUrl, N''), contact_page_url),
        updated_at = SYSUTCDATETIME()
      WHERE lead_id = @leadId;
    END
    ELSE IF NULLIF(@contactPageUrl, N'') IS NOT NULL
    BEGIN
      UPDATE marketing.leads
      SET
        contact_page_url = COALESCE(contact_page_url, @contactPageUrl),
        updated_at = SYSUTCDATETIME()
      WHERE lead_id = @leadId;
    END;

    SELECT COUNT(*) AS inserted_count FROM @inserted;
  `);

  return Number(result.recordset[0]?.inserted_count || 0);
}

async function runPool(items, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

const pool = await sql.connect(settings.Values.SqlConnectionString);

try {
  const leads = await loadLeads(pool);
  const stats = {
    scanned: leads.length,
    websites_with_email: 0,
    emails_found: 0,
    emails_inserted: 0,
    failed: 0
  };

  console.log(JSON.stringify({
    sources: sourceKeys,
    leads_to_scan: leads.length,
    concurrency,
    timeout_ms: timeoutMs,
    max_contact_links: maxContactLinks
  }));

  let processed = 0;
  await runPool(leads, async (lead) => {
    try {
      const enriched = await enrichWebsite(lead.website_url);
      if (enriched.emails.length) {
        stats.websites_with_email += 1;
        stats.emails_found += enriched.emails.length;
        stats.emails_inserted += await saveEmails(pool, lead, enriched.emails, enriched.contactPage);
      }
    } catch {
      stats.failed += 1;
    } finally {
      processed += 1;
      if (processed % 250 === 0 || processed === leads.length) {
        console.log(JSON.stringify({ processed, ...stats }));
      }
    }
  });

  console.log(JSON.stringify(stats, null, 2));
} finally {
  await pool.close();
}
