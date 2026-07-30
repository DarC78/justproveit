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

    SELECT
      tableName = c.TABLE_SCHEMA + '.' + c.TABLE_NAME,
      c.COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.COLUMN_NAME LIKE '%CLIENT_TRIALS%'
       OR c.COLUMN_NAME LIKE '%TRIAL%'
    ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION;

    SELECT TOP (10)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 1000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE CHARINDEX('update server.dbo.leads_clients set CLIENT_TRIALS = 3', LOWER(st.text)) > 0
    ORDER BY qs.last_execution_time DESC;

    SELECT TOP (10)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 1000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE CHARINDEX('UPDATE [LEADS_CLIENTS] set [STATUS]', st.text) > 0
      AND CHARINDEX('[CLIENT_TRIALS] = [CLIENT_TRIALS]+', st.text) > 0
      AND LEFT(LTRIM(st.text), 1) = '('
    ORDER BY qs.last_execution_time DESC;

    WITH dialConfig AS (
      SELECT
        q.QUEUEID,
        q.QUEUEDESCRIPTION,
        q.DialRuleID,
        dialRoundMaxTrials = MAX(drcfg.MAX_TRIALS)
      FROM dbo.queues q
      LEFT JOIN dbo.dial_rule_round drr
        ON drr.RULE_ID = q.DialRuleID
      LEFT JOIN dbo.dial_round_cfg drcfg
        ON drcfg.DIAL_ROUND_ID = drr.RULE_ROUND_ID
      WHERE q.QUEUEID IN (37, 39)
      GROUP BY q.QUEUEID, q.QUEUEDESCRIPTION, q.DialRuleID
    ),
    candidates AS (
      SELECT TOP (5)
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        dc.QUEUEDESCRIPTION,
        currentClientTrials = lc.CLIENT_TRIALS,
        queueMaxTrials = qpp.MaxTrialsFor,
        dc.dialRoundMaxTrials,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        ln.number_status,
        lastNumberDialed = MAX(ln.LastDialed),
        queue37CalltraceRows = COUNT(CASE WHEN ct.QUEUEID = 37 THEN 1 END),
        queue39CalltraceRows = COUNT(CASE WHEN ct.QUEUEID = 39 THEN 1 END),
        allCalltraceRows = COUNT(ct.CALLTRACEID),
        lastCallTime = MAX(ct.INCOMINGCALLTIME)
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      LEFT JOIN dbo.calltrace ct
        ON ct.DNIS = ln.PHONE_NO
       AND ct.QUEUEID IN (37, 39)
      LEFT JOIN dbo.queuespredictiveprops qpp
        ON qpp.QueueID = lc.QUEUE_ID
      LEFT JOIN dialConfig dc
        ON dc.QUEUEID = lc.QUEUE_ID
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
        AND lc.STATUS = -1
        AND lc.AGENT_RESULT = -1
      GROUP BY
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        dc.QUEUEDESCRIPTION,
        lc.CLIENT_TRIALS,
        qpp.MaxTrialsFor,
        dc.dialRoundMaxTrials,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        ln.number_status
      ORDER BY MAX(ln.LastDialed) DESC, lc.CLIENT_ID DESC
    )
    SELECT
      CLIENT_ID,
      PHONE_NO,
      QUEUE_ID,
      QUEUEDESCRIPTION,
      currentClientTrials,
      queueMaxTrials,
      dialRoundMaxTrials,
      RULE_STEP,
      STATUS,
      AGENT_RESULT,
      number_status,
      lastNumberDialed = CONVERT(varchar(33), lastNumberDialed, 126),
      queue37CalltraceRows,
      queue39CalltraceRows,
      allCalltraceRows,
      lastCallTime = CONVERT(varchar(33), lastCallTime, 126)
    FROM candidates
    ORDER BY lastNumberDialed DESC, CLIENT_ID DESC;

    WITH dialConfig AS (
      SELECT
        q.QUEUEID,
        q.QUEUEDESCRIPTION,
        dialRoundMaxTrials = MAX(drcfg.MAX_TRIALS)
      FROM dbo.queues q
      LEFT JOIN dbo.dial_rule_round drr
        ON drr.RULE_ID = q.DialRuleID
      LEFT JOIN dbo.dial_round_cfg drcfg
        ON drcfg.DIAL_ROUND_ID = drr.RULE_ROUND_ID
      WHERE q.QUEUEID IN (37, 39)
      GROUP BY q.QUEUEID, q.QUEUEDESCRIPTION
    ),
    candidates AS (
      SELECT TOP (5)
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lastNumberDialed = MAX(ln.LastDialed)
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      LEFT JOIN dbo.calltrace ct
        ON ct.DNIS = ln.PHONE_NO
       AND ct.QUEUEID IN (37, 39)
      LEFT JOIN dbo.queuespredictiveprops qpp
        ON qpp.QueueID = lc.QUEUE_ID
      LEFT JOIN dialConfig dc
        ON dc.QUEUEID = lc.QUEUE_ID
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
        AND lc.STATUS = -1
        AND lc.AGENT_RESULT = -1
      GROUP BY lc.CLIENT_ID, ln.PHONE_NO, lc.QUEUE_ID
      ORDER BY MAX(ln.LastDialed) DESC, lc.CLIENT_ID DESC
    )
    SELECT
      c.CLIENT_ID,
      c.PHONE_NO,
      c.QUEUE_ID,
      calltraceId = ct.CALLTRACEID,
      incomingCallTime = CONVERT(varchar(33), ct.INCOMINGCALLTIME, 126),
      closeTime = CONVERT(varchar(33), ct.CLOSETIME, 126),
      ct.DIALERRESULT,
      ct.CALLCODE,
      ct.CALLTYPE,
      ct.AGENTID
    FROM candidates c
    LEFT JOIN dbo.calltrace ct
      ON ct.DNIS = c.PHONE_NO
     AND ct.QUEUEID IN (37, 39)
    ORDER BY c.lastNumberDialed DESC, c.CLIENT_ID DESC, ct.INCOMINGCALLTIME;

    WITH candidates AS (
      SELECT TOP (5)
        lc.CLIENT_ID,
        ln.PHONE_NO,
        lc.QUEUE_ID,
        lastNumberDialed = MAX(ln.LastDialed)
      FROM dbo.leads_clients lc
      JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      LEFT JOIN dbo.calltrace ct
        ON ct.DNIS = ln.PHONE_NO
       AND ct.QUEUEID IN (37, 39)
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
        AND lc.STATUS = -1
        AND lc.AGENT_RESULT = -1
      GROUP BY lc.CLIENT_ID, ln.PHONE_NO, lc.QUEUE_ID
      ORDER BY MAX(ln.LastDialed) DESC, lc.CLIENT_ID DESC
    )
    SELECT
      c.CLIENT_ID,
      c.PHONE_NO,
      c.QUEUE_ID,
      pt.PhoneTypeID,
      pt.RoundCfgID,
      pt.Trials
    FROM candidates c
    LEFT JOIN dbo.leads_PhoneTrials pt
      ON pt.ClientID = c.CLIENT_ID
    ORDER BY c.lastNumberDialed DESC, c.CLIENT_ID DESC, pt.PhoneTypeID, pt.RoundCfgID;

    SELECT TOP (20)
      creation_time = CONVERT(varchar(33), qs.creation_time, 126),
      last_execution_time = CONVERT(varchar(33), qs.last_execution_time, 126),
      qs.execution_count,
      databaseName = DB_NAME(st.dbid),
      textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 2000)
    FROM sys.dm_exec_query_stats qs
    CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
    WHERE CHARINDEX('leads_PhoneTrials', st.text) > 0
       OR CHARINDEX('PhoneTrials', st.text) > 0
    ORDER BY qs.last_execution_time DESC;
  `);

  console.log(JSON.stringify({
    serverTime: result.recordsets[0],
    trialColumns: result.recordsets[1],
    manualResetPlanCache: result.recordsets[2],
    directDiallerTrialIncrementPlanCache: result.recordsets[3],
    examples: result.recordsets[4],
    exampleCalltraceRows: result.recordsets[5],
    examplePhoneTrialsRows: result.recordsets[6],
    phoneTrialsPlanCache: result.recordsets[7],
  }, null, 2));
} finally {
  await pool.close();
}
