import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const launchingStackRoot = process.env.LAUNCHINGSTACK_ROOT || 'D:/DevProjects/LaunchingStack';
const functionsRoot = `${launchingStackRoot}/backend/functions`;
const settingsPath = `${functionsRoot}/local.settings.json`;
const mssqlPath = `${functionsRoot}/node_modules/mssql/index.js`;

const sqlModule = await import(pathToFileURL(mssqlPath).href);
const sql = sqlModule.default ?? sqlModule;
const settings = JSON.parse(await readFile(settingsPath, 'utf8'));
const connectionString =
  process.env.SqlConnectionString ||
  process.env.SQL_CONNECTION_STRING ||
  process.env.AzureSql__SqlConnectionString ||
  settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error('SqlConnectionString was not found.');
}

const pool = await sql.connect(connectionString);

try {
  const result = await pool.request().query(`
    SELECT 'lead_sources' AS metric, COUNT_BIG(*) AS value FROM marketing.lead_sources
    UNION ALL SELECT 'leads', COUNT_BIG(*) FROM marketing.leads
    UNION ALL SELECT 'services', COUNT_BIG(*) FROM marketing.services
    UNION ALL SELECT 'lead_service_interests', COUNT_BIG(*) FROM marketing.lead_service_interests
    UNION ALL SELECT 'email_templates', COUNT_BIG(*) FROM marketing.email_templates
    UNION ALL SELECT 'email_messages', COUNT_BIG(*) FROM marketing.email_messages
    UNION ALL SELECT 'email_links', COUNT_BIG(*) FROM marketing.email_links
    UNION ALL SELECT 'email_events', COUNT_BIG(*) FROM marketing.email_events
    UNION ALL SELECT 'email_unsubscribes', COUNT_BIG(*) FROM marketing.email_unsubscribes
    UNION ALL SELECT 'email_sequences', COUNT_BIG(*) FROM marketing.email_sequences
    UNION ALL SELECT 'lead_sequence_enrollments', COUNT_BIG(*) FROM marketing.lead_sequence_enrollments;
  `);

  const sourceCounts = await pool.request().query(`
    SELECT
      ls.source_id,
      ls.source_key,
      ls.source_file,
      COUNT(l.lead_id) AS lead_count
    FROM marketing.lead_sources ls
    LEFT JOIN marketing.leads l ON l.source_id = ls.source_id
    GROUP BY ls.source_id, ls.source_key, ls.source_file
    ORDER BY ls.source_id;
  `);

  const serviceCounts = await pool.request().query(`
    SELECT
      s.service_key,
      s.service_name,
      COUNT(lsi.lead_id) AS lead_count
    FROM marketing.services s
    LEFT JOIN marketing.lead_service_interests lsi ON lsi.service_id = s.service_id
    GROUP BY s.service_key, s.service_name
    ORDER BY lead_count DESC, s.service_key;
  `);

  const sourceServiceCounts = await pool.request().query(`
    SELECT
      ls.source_key,
      s.service_key,
      s.service_name,
      COUNT(DISTINCT lsi.lead_id) AS lead_count
    FROM marketing.lead_service_interests lsi
    JOIN marketing.leads l ON l.lead_id = lsi.lead_id
    JOIN marketing.lead_sources ls ON ls.source_id = l.source_id
    JOIN marketing.services s ON s.service_id = lsi.service_id
    GROUP BY ls.source_key, s.service_key, s.service_name
    ORDER BY ls.source_key, lead_count DESC, s.service_key;
  `);

  console.log(JSON.stringify({
    metrics: result.recordset,
    sources: sourceCounts.recordset,
    serviceInterests: serviceCounts.recordset,
    sourceServiceInterests: sourceServiceCounts.recordset
  }, null, 2));
} finally {
  await pool.close();
}
