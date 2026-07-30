import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const settings = JSON.parse(await readFile("local.settings.json", "utf8"));
const connectionString =
  process.env.SqlConnectionString ||
  process.env.SQL_CONNECTION_STRING ||
  process.env.AzureSql__SqlConnectionString ||
  settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const outDir = "/private/tmp/jpi-sqlprobe";
const csvPath = `${outDir}/queue37_39_dialled_3_no_agent_or_voicemail.csv`;
const jsonPath = `${outDir}/queue37_39_dialled_3_no_agent_or_voicemail.json`;

const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  if (rows.length === 0) {
    return "";
  }
  const columns = Object.keys(rows[0]);
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

try {
  const request = pool.request();
  request.timeout = 120000;
  const result = await request.query(`
    USE [server];

    SELECT
      QUEUEID,
      CALLTYPE,
      agentBucket = CASE WHEN AGENTID > 0 THEN 'agent' ELSE 'no_agent' END,
      rows = COUNT(*),
      minIncomingCallTime = CONVERT(varchar(33), MIN(INCOMINGCALLTIME), 126),
      maxIncomingCallTime = CONVERT(varchar(33), MAX(INCOMINGCALLTIME), 126)
    FROM dbo.calltrace
    WHERE QUEUEID IN (37, 39)
    GROUP BY
      QUEUEID,
      CALLTYPE,
      CASE WHEN AGENTID > 0 THEN 'agent' ELSE 'no_agent' END
    ORDER BY
      QUEUEID,
      CALLTYPE,
      agentBucket;

    WITH baseClients AS (
      SELECT
        lc.CLIENT_ID,
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT
      FROM dbo.leads_clients lc
      WHERE lc.QUEUE_ID IN (37, 39)
    ),
    phones AS (
      SELECT
        b.CLIENT_ID,
        phoneNumbers = STUFF((
          SELECT ', ' + ln2.PHONE_NO
          FROM dbo.leads_numbers ln2
          WHERE ln2.CLIENT_ID = b.CLIENT_ID
          ORDER BY ln2.PhoneTypeID, ln2.PHONE_NO
          FOR XML PATH(''), TYPE
        ).value('.', 'nvarchar(max)'), 1, 2, '')
      FROM baseClients b
      GROUP BY b.CLIENT_ID
    ),
    dialAttempts AS (
      SELECT
        b.CLIENT_ID,
        dialAttemptsOnQueues37_39 = COUNT(DISTINCT ct.CALLTRACEID),
        firstDialOnQueues37_39 = MIN(ct.INCOMINGCALLTIME),
        lastDialOnQueues37_39 = MAX(ct.INCOMINGCALLTIME),
        dialAttemptsQueue37 = COUNT(DISTINCT CASE WHEN ct.QUEUEID = 37 THEN ct.CALLTRACEID END),
        dialAttemptsQueue39 = COUNT(DISTINCT CASE WHEN ct.QUEUEID = 39 THEN ct.CALLTRACEID END),
        dialAttemptsCallType3 = COUNT(DISTINCT CASE WHEN ct.CALLTYPE = 3 THEN ct.CALLTRACEID END),
        dialAttemptsOtherCallTypes = COUNT(DISTINCT CASE WHEN ISNULL(ct.CALLTYPE, -999) <> 3 THEN ct.CALLTRACEID END)
      FROM baseClients b
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = b.CLIENT_ID
      JOIN dbo.calltrace ct
        ON (ct.DNIS = ln.PHONE_NO OR ct.LEADID = b.CLIENT_ID)
       AND ct.QUEUEID IN (37, 39)
      GROUP BY b.CLIENT_ID
    ),
    agentHistory AS (
      SELECT
        b.CLIENT_ID,
        agentCallsLast3Months = COUNT(DISTINCT CASE WHEN ct.AGENTID > 0 THEN ct.CALLTRACEID END),
        voicemailAgentCallsLast3Months = COUNT(DISTINCT CASE WHEN ct.AGENTID > 0 AND ct.CALLCODE = 5 THEN ct.CALLTRACEID END),
        nonVoicemailAgentCallsLast3Months = COUNT(DISTINCT CASE WHEN ct.AGENTID > 0 AND ISNULL(ct.CALLCODE, -2147483648) <> 5 THEN ct.CALLTRACEID END),
        firstAgentCallLast3Months = MIN(CASE WHEN ct.AGENTID > 0 THEN ct.INCOMINGCALLTIME END),
        lastAgentCallLast3Months = MAX(CASE WHEN ct.AGENTID > 0 THEN ct.INCOMINGCALLTIME END),
        lastNonVoicemailAgentCallLast3Months = MAX(CASE WHEN ct.AGENTID > 0 AND ISNULL(ct.CALLCODE, -2147483648) <> 5 THEN ct.INCOMINGCALLTIME END),
        lastVoicemailAgentCallLast3Months = MAX(CASE WHEN ct.AGENTID > 0 AND ct.CALLCODE = 5 THEN ct.INCOMINGCALLTIME END),
        agentCallcodesLast3Months = STUFF((
          SELECT DISTINCT ', ' + CONVERT(varchar(20), ct2.CALLCODE)
          FROM dbo.leads_numbers ln2
          JOIN dbo.calltrace ct2
            ON (ct2.DNIS = ln2.PHONE_NO OR ct2.LEADID = b.CLIENT_ID)
           AND ct2.INCOMINGCALLTIME >= DATEADD(MONTH, -3, GETDATE())
           AND ct2.AGENTID > 0
          WHERE ln2.CLIENT_ID = b.CLIENT_ID
          FOR XML PATH(''), TYPE
        ).value('.', 'nvarchar(max)'), 1, 2, '')
      FROM baseClients b
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = b.CLIENT_ID
      LEFT JOIN dbo.calltrace ct
        ON (ct.DNIS = ln.PHONE_NO OR ct.LEADID = b.CLIENT_ID)
       AND ct.INCOMINGCALLTIME >= DATEADD(MONTH, -3, GETDATE())
      GROUP BY b.CLIENT_ID
    )
    SELECT
      b.CLIENT_ID,
      b.QUEUE_ID,
      q.QUEUEDESCRIPTION,
      p.phoneNumbers,
      b.CLIENT_TRIALS,
      b.RULE_STEP,
      b.STATUS,
      b.AGENT_RESULT,
      d.dialAttemptsOnQueues37_39,
      d.dialAttemptsQueue37,
      d.dialAttemptsQueue39,
      d.dialAttemptsCallType3,
      d.dialAttemptsOtherCallTypes,
      firstDialOnQueues37_39 = CONVERT(varchar(33), d.firstDialOnQueues37_39, 126),
      lastDialOnQueues37_39 = CONVERT(varchar(33), d.lastDialOnQueues37_39, 126),
      ah.agentCallsLast3Months,
      ah.voicemailAgentCallsLast3Months,
      ah.nonVoicemailAgentCallsLast3Months,
      firstAgentCallLast3Months = CONVERT(varchar(33), ah.firstAgentCallLast3Months, 126),
      lastAgentCallLast3Months = CONVERT(varchar(33), ah.lastAgentCallLast3Months, 126),
      lastVoicemailAgentCallLast3Months = CONVERT(varchar(33), ah.lastVoicemailAgentCallLast3Months, 126),
      lastNonVoicemailAgentCallLast3Months = CONVERT(varchar(33), ah.lastNonVoicemailAgentCallLast3Months, 126),
      ah.agentCallcodesLast3Months,
      inclusionReason = CASE
        WHEN ISNULL(ah.agentCallsLast3Months, 0) = 0 THEN 'No agent call in last 3 months'
        ELSE 'Only voicemail agent calls in last 3 months'
      END
    FROM baseClients b
    JOIN dialAttempts d
      ON d.CLIENT_ID = b.CLIENT_ID
    LEFT JOIN phones p
      ON p.CLIENT_ID = b.CLIENT_ID
    LEFT JOIN agentHistory ah
      ON ah.CLIENT_ID = b.CLIENT_ID
    LEFT JOIN dbo.queues q
      ON q.QUEUEID = b.QUEUE_ID
    WHERE d.dialAttemptsOnQueues37_39 >= 3
      AND ISNULL(ah.nonVoicemailAgentCallsLast3Months, 0) = 0
    ORDER BY
      b.QUEUE_ID,
      d.lastDialOnQueues37_39 DESC,
      b.CLIENT_ID DESC;
  `);

  const calltypeDistribution = result.recordsets[0];
  const rows = result.recordsets[1];

  await mkdir(outDir, { recursive: true });
  await writeFile(csvPath, toCsv(rows), "utf8");
  await writeFile(jsonPath, JSON.stringify({ calltypeDistribution, rows }, null, 2), "utf8");

  const byQueue = rows.reduce((acc, row) => {
    acc[row.QUEUE_ID] = (acc[row.QUEUE_ID] ?? 0) + 1;
    return acc;
  }, {});

  const byReason = rows.reduce((acc, row) => {
    acc[row.inclusionReason] = (acc[row.inclusionReason] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    csvPath,
    jsonPath,
    rowCount: rows.length,
    byQueue,
    byReason,
    calltypeDistribution,
    sampleRows: rows.slice(0, 10),
  }, null, 2));
} finally {
  await pool.close();
}
