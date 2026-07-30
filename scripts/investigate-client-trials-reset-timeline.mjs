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

    SELECT
      serverLocal = CONVERT(varchar(33), GETDATE(), 126),
      serverUtc = CONVERT(varchar(33), SYSUTCDATETIME(), 126);

    SELECT TOP (10)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 2000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE LOWER(LTRIM(st.text)) LIKE 'update server.dbo.leads_clients set client_trials = 3%'
    ORDER BY qs.last_execution_time DESC;

    SELECT TOP (10)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 2000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE CHARINDEX('UPDATE [LEADS_CLIENTS] set [STATUS]', st.text) > 0
      AND CHARINDEX('[CLIENT_TRIALS] = [CLIENT_TRIALS]+', st.text) > 0
      AND LEFT(LTRIM(st.text), 1) = '('
    ORDER BY qs.last_execution_time DESC;

    SELECT
      databaseName = DB_NAME(ps.database_id),
      objectName = OBJECT_SCHEMA_NAME(ps.object_id, ps.database_id) + '.' + OBJECT_NAME(ps.object_id, ps.database_id),
      cached_time = CONVERT(varchar(33), ps.cached_time, 126),
      last_execution_time = CONVERT(varchar(33), ps.last_execution_time, 126),
      ps.execution_count
    FROM sys.dm_exec_procedure_stats ps
    WHERE ps.database_id = DB_ID('server')
      AND OBJECT_NAME(ps.object_id, ps.database_id) IN (
        'upsert_leads_PhoneTrials',
        'predictive_GetPhoneTrials',
        'predictive_RefreshClients',
        'predictive_GetClientsWithProgram',
        'predictive_GetClientsWithoutProgram',
        'UpdateRules'
      )
    ORDER BY ps.last_execution_time DESC;

    DECLARE @lastReset datetime;
    SELECT @lastReset = MAX(qs.last_execution_time)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE LOWER(LTRIM(st.text)) LIKE 'update server.dbo.leads_clients set client_trials = 3%';

    SELECT lastResetLocal = CONVERT(varchar(33), @lastReset, 126);

    WITH base AS (
      SELECT
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        ln.number_status,
        ln.LastDialed,
        phoneTrials = MAX(pt.Trials),
        lastCallSameQueue = MAX(CASE
          WHEN ct.QUEUEID = lc.QUEUE_ID THEN ct.INCOMINGCALLTIME
          ELSE NULL
        END),
        lastCall37_39 = MAX(ct.INCOMINGCALLTIME),
        calltraceSameQueueRows = COUNT(CASE WHEN ct.QUEUEID = lc.QUEUE_ID THEN 1 END),
        calltrace37_39Rows = COUNT(ct.CALLTRACEID)
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      LEFT JOIN dbo.leads_PhoneTrials pt
        ON pt.ClientID = lc.CLIENT_ID
       AND pt.PhoneTypeID = ln.PhoneTypeID
      LEFT JOIN dbo.calltrace ct
        ON (ct.DNIS = ln.PHONE_NO OR ct.LEADID = lc.CLIENT_ID)
       AND ct.QUEUEID IN (37, 39)
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
      GROUP BY
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        ln.number_status,
        ln.LastDialed
    )
    SELECT
      QUEUE_ID,
      totalTrial9 = COUNT(*),
      noSameQueueCallAfterReset = SUM(CASE WHEN @lastReset IS NOT NULL AND (lastCallSameQueue IS NULL OR lastCallSameQueue <= @lastReset) THEN 1 ELSE 0 END),
      noAny37_39CallAfterReset = SUM(CASE WHEN @lastReset IS NOT NULL AND (lastCall37_39 IS NULL OR lastCall37_39 <= @lastReset) THEN 1 ELSE 0 END),
      noLastDialedAfterReset = SUM(CASE WHEN @lastReset IS NOT NULL AND (LastDialed IS NULL OR LastDialed <= @lastReset) THEN 1 ELSE 0 END),
      latestLastDialed = CONVERT(varchar(33), MAX(LastDialed), 126),
      latestCallSameQueue = CONVERT(varchar(33), MAX(lastCallSameQueue), 126)
    FROM base
    GROUP BY QUEUE_ID
    ORDER BY QUEUE_ID;

    WITH base AS (
      SELECT
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        ln.number_status,
        ln.LastDialed,
        phoneTrials = MAX(pt.Trials),
        lastCallSameQueue = MAX(CASE
          WHEN ct.QUEUEID = lc.QUEUE_ID THEN ct.INCOMINGCALLTIME
          ELSE NULL
        END),
        lastCall37_39 = MAX(ct.INCOMINGCALLTIME),
        calltraceSameQueueRows = COUNT(CASE WHEN ct.QUEUEID = lc.QUEUE_ID THEN 1 END),
        calltrace37_39Rows = COUNT(ct.CALLTRACEID)
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      LEFT JOIN dbo.leads_PhoneTrials pt
        ON pt.ClientID = lc.CLIENT_ID
       AND pt.PhoneTypeID = ln.PhoneTypeID
      LEFT JOIN dbo.calltrace ct
        ON (ct.DNIS = ln.PHONE_NO OR ct.LEADID = lc.CLIENT_ID)
       AND ct.QUEUEID IN (37, 39)
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
      GROUP BY
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        ln.number_status,
        ln.LastDialed
    )
    SELECT TOP (20)
      CLIENT_ID,
      PHONE_NO,
      QUEUE_ID,
      CLIENT_TRIALS,
      RULE_STEP,
      STATUS,
      AGENT_RESULT,
      number_status,
      phoneTrials,
      lastNumberDialed = CONVERT(varchar(33), LastDialed, 126),
      lastCallSameQueue = CONVERT(varchar(33), lastCallSameQueue, 126),
      lastCall37_39 = CONVERT(varchar(33), lastCall37_39, 126),
      calltraceSameQueueRows,
      calltrace37_39Rows
    FROM base
    WHERE @lastReset IS NOT NULL
      AND (lastCall37_39 IS NULL OR lastCall37_39 <= @lastReset)
      AND (LastDialed IS NULL OR LastDialed <= @lastReset)
    ORDER BY LastDialed DESC, CLIENT_ID DESC;

    SELECT TOP (20)
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
  `);

  console.log(JSON.stringify({
    serverTime: result.recordsets[0],
    manualResets: result.recordsets[1],
    directClientTrialIncrements: result.recordsets[2],
    procedureStats: result.recordsets[3],
    lastReset: result.recordsets[4],
    postResetCalltraceSummary: result.recordsets[5],
    trial9WithoutPostResetCallExamples: result.recordsets[6],
    currentSessions: result.recordsets[7],
  }, null, 2));
} finally {
  await pool.close();
}
