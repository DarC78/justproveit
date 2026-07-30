import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const settings = JSON.parse(await readFile("local.settings.json", "utf8"));
const connectionString = settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

try {
  const result = await pool.request().query(`
    USE [server];

    WITH base AS (
      SELECT
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
    ),
    matched AS (
      SELECT
        b.CLIENT_ID,
        b.PHONE_NO,
        b.QUEUE_ID,
        userJoinQueue39 = CASE WHEN EXISTS (
          SELECT 1 FROM dbo.calltrace ct
          WHERE ct.DNIS = b.PHONE_NO
            AND ct.QUEUEID = 39
        ) THEN 1 ELSE 0 END,
        dnisSameQueue = CASE WHEN EXISTS (
          SELECT 1 FROM dbo.calltrace ct
          WHERE ct.DNIS = b.PHONE_NO
            AND ct.QUEUEID = b.QUEUE_ID
        ) THEN 1 ELSE 0 END,
        leadIdSameQueue = CASE WHEN EXISTS (
          SELECT 1 FROM dbo.calltrace ct
          WHERE ct.LEADID = b.CLIENT_ID
            AND ct.QUEUEID = b.QUEUE_ID
        ) THEN 1 ELSE 0 END,
        dnisOrLeadAny37_39 = CASE WHEN EXISTS (
          SELECT 1 FROM dbo.calltrace ct
          WHERE (ct.DNIS = b.PHONE_NO OR ct.LEADID = b.CLIENT_ID)
            AND ct.QUEUEID IN (37, 39)
        ) THEN 1 ELSE 0 END
      FROM base b
    )
    SELECT
      QUEUE_ID,
      totalTrial9 = COUNT(*),
      matchedByYourJoin_dnisQueue39 = SUM(userJoinQueue39),
      matchedByDnisSameQueue = SUM(dnisSameQueue),
      matchedByLeadIdSameQueue = SUM(leadIdSameQueue),
      matchedByDnisOrLeadAny37_39 = SUM(dnisOrLeadAny37_39)
    FROM matched
    GROUP BY QUEUE_ID
    ORDER BY QUEUE_ID;

    WITH base AS (
      SELECT
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        lastNumberDialed = ln.LastDialed
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
    )
    SELECT TOP (10)
      b.CLIENT_ID,
      b.PHONE_NO,
      b.QUEUE_ID,
      b.CLIENT_TRIALS,
      lastNumberDialed = CONVERT(varchar(33), b.lastNumberDialed, 126),
      yourJoinQueue39Rows = (
        SELECT COUNT(*) FROM dbo.calltrace ct
        WHERE ct.DNIS = b.PHONE_NO
          AND ct.QUEUEID = 39
      ),
      dnisSameQueueRows = (
        SELECT COUNT(*) FROM dbo.calltrace ct
        WHERE ct.DNIS = b.PHONE_NO
          AND ct.QUEUEID = b.QUEUE_ID
      ),
      leadIdSameQueueRows = (
        SELECT COUNT(*) FROM dbo.calltrace ct
        WHERE ct.LEADID = b.CLIENT_ID
          AND ct.QUEUEID = b.QUEUE_ID
      ),
      lastByLeadId = CONVERT(varchar(33), (
        SELECT MAX(ct.INCOMINGCALLTIME) FROM dbo.calltrace ct
        WHERE ct.LEADID = b.CLIENT_ID
          AND ct.QUEUEID = b.QUEUE_ID
      ), 126)
    FROM base b
    WHERE NOT EXISTS (
      SELECT 1 FROM dbo.calltrace ct
      WHERE ct.DNIS = b.PHONE_NO
        AND ct.QUEUEID = 39
    )
      AND EXISTS (
        SELECT 1 FROM dbo.calltrace ct
        WHERE ct.LEADID = b.CLIENT_ID
          AND ct.QUEUEID = b.QUEUE_ID
      )
    ORDER BY b.lastNumberDialed DESC, b.CLIENT_ID DESC;
  `);

  console.log(JSON.stringify({
    matchSummary: result.recordsets[0],
    missedByOriginalJoinExamples: result.recordsets[1],
  }, null, 2));
} finally {
  await pool.close();
}
