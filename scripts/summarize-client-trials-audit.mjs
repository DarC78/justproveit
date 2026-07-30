import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const settings = JSON.parse(await readFile("local.settings.json", "utf8"));
const connectionString = settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const startedAtUtc = process.argv[2] ? new Date(process.argv[2]) : new Date(Date.now() - 60 * 60 * 1000);
const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

try {
  const request = pool.request();
  request.input("startedAtUtc", sql.DateTime2, startedAtUtc);
  const result = await request.query(`
    USE [server];

    SELECT
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      OldClientTrials,
      NewClientTrials,
      rowsChanged = COUNT(*),
      firstUtc = CONVERT(varchar(33), MIN(CapturedAtUtc), 126),
      lastUtc = CONVERT(varchar(33), MAX(CapturedAtUtc), 126),
      sampleSql = LEFT(REPLACE(REPLACE(MAX(InputSql), CHAR(13), ' '), CHAR(10), ' '), 600)
    FROM dbo.JPI_ClientTrialsAudit
    WHERE CapturedAtUtc >= @startedAtUtc
    GROUP BY
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      OldClientTrials,
      NewClientTrials
    ORDER BY MIN(CapturedAtUtc), OldClientTrials, NewClientTrials;

    SELECT TOP (30)
      AuditId,
      CapturedAtUtc = CONVERT(varchar(33), CapturedAtUtc, 126),
      CapturedAtLocal = CONVERT(varchar(33), CapturedAtLocal, 126),
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      Spid,
      ClientId,
      QueueId,
      OldClientTrials,
      NewClientTrials,
      OldStatus,
      NewStatus,
      InputSqlSnippet = LEFT(REPLACE(REPLACE(InputSql, CHAR(13), ' '), CHAR(10), ' '), 700)
    FROM dbo.JPI_ClientTrialsAudit
    WHERE CapturedAtUtc >= @startedAtUtc
      AND AppName = 'MCC Server Application'
    ORDER BY AuditId DESC;

    SELECT
      lc.CLIENT_TRIALS,
      clients = COUNT(*)
    FROM dbo.leads_clients lc
    WHERE lc.QUEUE_ID IN (37, 39)
    GROUP BY lc.CLIENT_TRIALS
    ORDER BY lc.CLIENT_TRIALS;
  `);

  console.log(JSON.stringify({
    startedAtUtc: startedAtUtc.toISOString(),
    groupedAudit: result.recordsets[0],
    latestMccAuditRows: result.recordsets[1],
    currentDistribution: result.recordsets[2],
  }, null, 2));
} finally {
  await pool.close();
}
