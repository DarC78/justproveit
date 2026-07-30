import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const settings = JSON.parse(await readFile("local.settings.json", "utf8"));
const connectionString =
  process.env.SqlConnectionString ||
  process.env.SQL_CONNECTION_STRING ||
  process.env.AzureSql__SqlConnectionString ||
  settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

try {
  const result = await pool.request().query(`
    USE [server];

    SELECT
      serverLocal = CONVERT(varchar(33), GETDATE(), 126),
      serverUtc = CONVERT(varchar(33), SYSUTCDATETIME(), 126);

    SELECT TOP (20)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      databaseName = DB_NAME(st.dbid),
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 2000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE CHARINDEX('UPDATE [LEADS_CLIENTS] set [STATUS]', st.text) > 0
      AND CHARINDEX('[CLIENT_TRIALS] = [CLIENT_TRIALS]+', st.text) > 0
      AND LEFT(LTRIM(st.text), 1) = '('
    ORDER BY qs.last_execution_time DESC;

    SELECT TOP (20)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      databaseName = DB_NAME(st.dbid),
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 2000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE CHARINDEX('LEADS_NUMBERS', UPPER(st.text)) > 0
      AND CHARINDEX('LASTDIALED', UPPER(st.text)) > 0
    ORDER BY qs.last_execution_time DESC;

    SELECT TOP (30)
      s.session_id,
      s.login_name,
      s.host_name,
      s.program_name,
      s.status,
      login_time = CONVERT(varchar(33), s.login_time, 126),
      last_request_start_time = CONVERT(varchar(33), s.last_request_start_time, 126),
      last_request_end_time = CONVERT(varchar(33), s.last_request_end_time, 126),
      mostRecentSqlSnippet = LEFT(REPLACE(REPLACE(txt.text, CHAR(13), ' '), CHAR(10), ' '), 1000)
    FROM sys.dm_exec_sessions s
    LEFT JOIN sys.dm_exec_connections c
      ON c.session_id = s.session_id
    OUTER APPLY sys.dm_exec_sql_text(c.most_recent_sql_handle) txt
    WHERE s.is_user_process = 1
    ORDER BY s.last_request_end_time DESC, s.last_request_start_time DESC;

    SELECT
      lc.QUEUE_ID,
      noCalltrace37_39 = SUM(CASE WHEN cp.calltraceRows37_39 = 0 AND cl.calltraceRows37_39 = 0 THEN 1 ELSE 0 END),
      hasCalltrace37_39 = SUM(CASE WHEN cp.calltraceRows37_39 > 0 OR cl.calltraceRows37_39 > 0 THEN 1 ELSE 0 END),
      totalTrial9 = COUNT(*),
      latestLastDialed = CONVERT(varchar(33), MAX(ln.LastDialed), 126)
    FROM dbo.leads_clients lc
    JOIN dbo.leads_numbers ln
      ON ln.CLIENT_ID = lc.CLIENT_ID
    OUTER APPLY (
      SELECT calltraceRows37_39 = COUNT(*)
      FROM dbo.calltrace ct
      WHERE ct.DNIS = ln.PHONE_NO
        AND ct.QUEUEID IN (37, 39)
    ) cp
    OUTER APPLY (
      SELECT calltraceRows37_39 = COUNT(*)
      FROM dbo.calltrace ct
      WHERE ct.LEADID = lc.CLIENT_ID
        AND ct.QUEUEID IN (37, 39)
    ) cl
    WHERE lc.QUEUE_ID IN (37, 39)
      AND lc.CLIENT_TRIALS = 9
    GROUP BY lc.QUEUE_ID
    ORDER BY lc.QUEUE_ID;

    SELECT TOP (10)
      lc.CLIENT_ID,
      ln.PHONE_NO,
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT,
      ln.number_status,
      lastNumberDialed = CONVERT(varchar(33), ln.LastDialed, 126),
      phoneTrials = pt.Trials,
      pt.RoundCfgID,
      calltraceByPhone37_39 = cp.calltraceRows37_39,
      calltraceByLead37_39 = cl.calltraceRows37_39,
      calltraceByPhoneAnyQueue = cpa.calltraceRowsAnyQueue,
      lastCallByPhoneAnyQueue = CONVERT(varchar(33), cpa.lastCallAnyQueue, 126),
      calltraceByLeadAnyQueue = cla.calltraceRowsAnyQueue,
      lastCallByLeadAnyQueue = CONVERT(varchar(33), cla.lastCallAnyQueue, 126)
    FROM dbo.leads_clients lc
    JOIN dbo.leads_numbers ln
      ON ln.CLIENT_ID = lc.CLIENT_ID
    LEFT JOIN dbo.leads_PhoneTrials pt
      ON pt.ClientID = lc.CLIENT_ID
     AND pt.PhoneTypeID = ln.PhoneTypeID
    OUTER APPLY (
      SELECT calltraceRows37_39 = COUNT(*)
      FROM dbo.calltrace ct
      WHERE ct.DNIS = ln.PHONE_NO
        AND ct.QUEUEID IN (37, 39)
    ) cp
    OUTER APPLY (
      SELECT calltraceRows37_39 = COUNT(*)
      FROM dbo.calltrace ct
      WHERE ct.LEADID = lc.CLIENT_ID
        AND ct.QUEUEID IN (37, 39)
    ) cl
    OUTER APPLY (
      SELECT
        calltraceRowsAnyQueue = COUNT(*),
        lastCallAnyQueue = MAX(ct.INCOMINGCALLTIME)
      FROM dbo.calltrace ct
      WHERE ct.DNIS = ln.PHONE_NO
    ) cpa
    OUTER APPLY (
      SELECT
        calltraceRowsAnyQueue = COUNT(*),
        lastCallAnyQueue = MAX(ct.INCOMINGCALLTIME)
      FROM dbo.calltrace ct
      WHERE ct.LEADID = lc.CLIENT_ID
    ) cla
    WHERE lc.QUEUE_ID IN (37, 39)
      AND lc.CLIENT_TRIALS = 9
      AND cp.calltraceRows37_39 = 0
      AND cl.calltraceRows37_39 = 0
    ORDER BY ln.LastDialed DESC, lc.CLIENT_ID DESC;
  `);

  console.log(JSON.stringify({
    serverTime: result.recordsets[0],
    clientTrialsIncrementPlanCache: result.recordsets[1],
    lastDialedPlanCache: result.recordsets[2],
    currentSessions: result.recordsets[3],
    trial9CalltraceSummary: result.recordsets[4],
    trial9NoCalltraceExamples: result.recordsets[5],
  }, null, 2));
} finally {
  await pool.close();
}
