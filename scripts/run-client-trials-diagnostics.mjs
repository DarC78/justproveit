import { readFile, writeFile } from "node:fs/promises";
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

const mssqlPath = "/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js";
const sqlModule = await import(pathToFileURL(mssqlPath).href);
const sql = sqlModule.default ?? sqlModule;

const pool = await sql.connect(connectionString);

async function query(name, sqlText) {
  const startedAt = Date.now();
  try {
    const request = pool.request();
    request.timeout = 60000;
    const result = await request.query(`USE [server];\n${sqlText}`);
    return {
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
      rows: result.recordset ?? [],
      recordsets: result.recordsets ?? [],
    };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const checks = [];

  checks.push(await query("distribution", `
    SELECT
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      COUNT(DISTINCT lc.CLIENT_ID) AS clientCount
    FROM dbo.leads_clients lc
    WHERE lc.QUEUE_ID IN (37, 39)
    GROUP BY lc.QUEUE_ID, lc.CLIENT_TRIALS
    ORDER BY lc.QUEUE_ID, lc.CLIENT_TRIALS;
  `));

  checks.push(await query("trial9ByCalltraceCount", `
    SELECT TOP (200)
      lc.CLIENT_ID,
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT,
      COUNT(DISTINCT ln.PHONE_NO) AS phoneCount,
      COUNT(ct.dnis) AS queue39CalltraceRows,
      MAX(ct.INCOMINGCALLTIME) AS lastQueue39IncomingCallTime,
      MAX(ct.CLOSETIME) AS lastQueue39CloseTime,
      MAX(ln.LastDialed) AS lastNumberDialed
    FROM dbo.leads_clients lc
    LEFT JOIN dbo.leads_numbers ln
      ON ln.CLIENT_ID = lc.CLIENT_ID
    LEFT JOIN dbo.calltrace ct
      ON ct.dnis = ln.PHONE_NO
      AND ct.QUEUEID = 39
    WHERE lc.QUEUE_ID IN (37, 39)
      AND lc.CLIENT_TRIALS = 9
    GROUP BY
      lc.CLIENT_ID,
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT
    ORDER BY lastNumberDialed DESC, queue39CalltraceRows DESC, lc.CLIENT_ID;
  `));

  checks.push(await query("trial9CalltraceBuckets", `
    WITH trial9 AS (
      SELECT
        lc.CLIENT_ID,
        lc.QUEUE_ID,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT,
        queue39CalltraceRows = COUNT(ct.dnis),
        lastNumberDialed = MAX(ln.LastDialed),
        lastQueue39CloseTime = MAX(ct.CLOSETIME)
      FROM dbo.leads_clients lc
      LEFT JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      LEFT JOIN dbo.calltrace ct
        ON ct.dnis = ln.PHONE_NO
        AND ct.QUEUEID = 39
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS = 9
      GROUP BY
        lc.CLIENT_ID,
        lc.QUEUE_ID,
        lc.RULE_STEP,
        lc.STATUS,
        lc.AGENT_RESULT
    )
    SELECT
      QUEUE_ID,
      RULE_STEP,
      STATUS,
      AGENT_RESULT,
      queue39CalltraceRows,
      clients = COUNT(*),
      latestLastDialed = MAX(lastNumberDialed),
      latestQueue39CloseTime = MAX(lastQueue39CloseTime)
    FROM trial9
    GROUP BY
      QUEUE_ID,
      RULE_STEP,
      STATUS,
      AGENT_RESULT,
      queue39CalltraceRows
    ORDER BY
      clients DESC,
      latestLastDialed DESC;
  `));

  checks.push(await query("queue37_39Pattern", `
    SELECT
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT,
      clients = COUNT(DISTINCT lc.CLIENT_ID),
      latestLastDialed = MAX(ln.LastDialed)
    FROM dbo.leads_clients lc
    LEFT JOIN dbo.leads_numbers ln
      ON ln.CLIENT_ID = lc.CLIENT_ID
    WHERE lc.QUEUE_ID IN (37, 39)
    GROUP BY
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT
    ORDER BY
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      clients DESC;
  `));

  checks.push(await query("queueTrialConfig", `
    SELECT
      tableName = c.TABLE_NAME,
      columnName = c.COLUMN_NAME,
      c.DATA_TYPE,
      c.CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = 'dbo'
      AND (
        c.TABLE_NAME IN ('queues', 'dial_rule', 'dial_rule_round', 'dial_round_cfg')
        OR c.TABLE_NAME LIKE '%queue%'
        OR c.TABLE_NAME LIKE '%dial%'
      )
      AND (
        c.COLUMN_NAME LIKE '%trial%'
        OR c.COLUMN_NAME LIKE '%attempt%'
        OR c.COLUMN_NAME LIKE '%DialRule%'
        OR c.COLUMN_NAME IN ('QUEUEID', 'QUEUEDESCRIPTION')
      )
    ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;

    SELECT TOP (20)
      *
    FROM dbo.queues
    WHERE QUEUEID IN (37, 39);
  `));

  checks.push(await query("columns", `
    SELECT
      c.TABLE_NAME AS tableName,
      c.ORDINAL_POSITION AS ordinalPosition,
      c.COLUMN_NAME AS columnName,
      c.DATA_TYPE AS dataType,
      c.CHARACTER_MAXIMUM_LENGTH AS maxLength,
      c.IS_NULLABLE AS isNullable
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = 'dbo'
      AND c.TABLE_NAME IN ('leads_clients', 'leads_numbers', 'calltrace')
    ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;
  `));

  checks.push(await query("triggers", `
    SELECT
      parentTable = OBJECT_SCHEMA_NAME(t.parent_id) + '.' + OBJECT_NAME(t.parent_id),
      triggerName = OBJECT_SCHEMA_NAME(t.object_id) + '.' + t.name,
      t.is_disabled,
      t.is_instead_of_trigger,
      t.create_date,
      t.modify_date,
      triggerDefinition = OBJECT_DEFINITION(t.object_id)
    FROM sys.triggers t
    WHERE OBJECT_NAME(t.parent_id) IN ('leads_clients', 'leads_numbers', 'calltrace')
    ORDER BY parentTable, triggerName;
  `));

  checks.push(await query("sqlModules", `
    SELECT
      objectType = o.type_desc,
      objectName = OBJECT_SCHEMA_NAME(o.object_id) + '.' + o.name,
      o.create_date,
      o.modify_date,
      definitionSnippet = LEFT(REPLACE(REPLACE(m.definition, CHAR(13), ' '), CHAR(10), ' '), 4000),
      hasClientTrials = CASE WHEN m.definition LIKE '%CLIENT_TRIALS%' THEN 1 ELSE 0 END,
      hasLeadsClients = CASE WHEN m.definition LIKE '%leads_clients%' THEN 1 ELSE 0 END,
      hasCalltrace = CASE WHEN m.definition LIKE '%calltrace%' THEN 1 ELSE 0 END
    FROM sys.sql_modules m
    JOIN sys.objects o
      ON o.object_id = m.object_id
    WHERE m.definition LIKE '%CLIENT_TRIALS%'
      OR m.definition LIKE '%leads_clients%'
      OR m.definition LIKE '%leads_numbers%'
      OR m.definition LIKE '%calltrace%'
      OR m.definition LIKE '%QUEUEID%39%'
      OR m.definition LIKE '%QUEUE_ID%39%'
    ORDER BY o.modify_date DESC, objectName;
  `));

  checks.push(await query("jobSteps", `
    BEGIN TRY
      SELECT
        jobName = j.name,
        s.step_id,
        s.step_name,
        s.database_name,
        commandSnippet = LEFT(REPLACE(REPLACE(s.command, CHAR(13), ' '), CHAR(10), ' '), 4000),
        hasClientTrials = CASE WHEN s.command LIKE '%CLIENT_TRIALS%' THEN 1 ELSE 0 END,
        hasLeadsClients = CASE WHEN s.command LIKE '%leads_clients%' THEN 1 ELSE 0 END,
        hasCalltrace = CASE WHEN s.command LIKE '%calltrace%' THEN 1 ELSE 0 END
      FROM msdb.dbo.sysjobs j
      JOIN msdb.dbo.sysjobsteps s
        ON s.job_id = j.job_id
      WHERE s.command LIKE '%CLIENT_TRIALS%'
        OR s.command LIKE '%leads_clients%'
        OR s.command LIKE '%leads_numbers%'
        OR s.command LIKE '%calltrace%'
        OR s.command LIKE '%QUEUEID%39%'
        OR s.command LIKE '%QUEUE_ID%39%'
      ORDER BY j.name, s.step_id;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("procedureStats", `
    BEGIN TRY
      SELECT
        databaseName = DB_NAME(ps.database_id),
        objectName = OBJECT_SCHEMA_NAME(ps.object_id, ps.database_id) + '.' + OBJECT_NAME(ps.object_id, ps.database_id),
        ps.cached_time,
        ps.last_execution_time,
        ps.execution_count,
        ps.total_elapsed_time,
        ps.total_worker_time
      FROM sys.dm_exec_procedure_stats ps
      WHERE ps.database_id = DB_ID('server')
        AND OBJECT_NAME(ps.object_id, ps.database_id) IN (
          'InsertLead',
          'UpdateRules',
          'predictive_RefreshClients',
          'predictive_GetClientsWithProgram',
          'predictive_GetClientsWithoutProgram',
          'RetakeFF_WriteClients'
        )
      ORDER BY ps.last_execution_time DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("targetModuleDefinitions", `
    SELECT
      objectType = o.type_desc,
      objectName = OBJECT_SCHEMA_NAME(o.object_id) + '.' + o.name,
      o.create_date,
      o.modify_date,
      definition = m.definition
    FROM sys.sql_modules m
    JOIN sys.objects o
      ON o.object_id = m.object_id
    WHERE OBJECT_SCHEMA_NAME(o.object_id) = 'dbo'
      AND o.name IN (
        'InsertLead',
        'UpdateRules',
        'predictive_RefreshClients',
        'predictive_GetClientsWithProgram',
        'predictive_GetClientsWithoutProgram',
        'RetakeFF_WriteClients'
      )
    ORDER BY objectName;
  `));

  checks.push(await query("queryStoreClientTrialsOnly", `
    BEGIN TRY
      SELECT TOP (20)
        lastExecutionTime = MAX(rs.last_execution_time),
        executionCount = SUM(rs.count_executions),
        avgDurationMs = CONVERT(decimal(18, 2), SUM(rs.avg_duration * rs.count_executions) / NULLIF(SUM(rs.count_executions), 0) / 1000.0),
        queryTextSnippet = LEFT(REPLACE(REPLACE(qt.query_sql_text, CHAR(13), ' '), CHAR(10), ' '), 4000)
      FROM sys.query_store_query_text qt
      JOIN sys.query_store_query q
        ON q.query_text_id = qt.query_text_id
      JOIN sys.query_store_plan p
        ON p.query_id = q.query_id
      JOIN sys.query_store_runtime_stats rs
        ON rs.plan_id = p.plan_id
      WHERE qt.query_sql_text LIKE '%CLIENT_TRIALS%'
      GROUP BY qt.query_sql_text
      ORDER BY lastExecutionTime DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("queryStoreClientTrialWrites", `
    BEGIN TRY
      SELECT TOP (50)
        objectName = CASE
          WHEN q.object_id IS NULL OR q.object_id = 0 THEN NULL
          ELSE OBJECT_SCHEMA_NAME(q.object_id) + '.' + OBJECT_NAME(q.object_id)
        END,
        lastExecutionTime = MAX(rs.last_execution_time),
        executionCount = SUM(rs.count_executions),
        avgDurationMs = CONVERT(decimal(18, 2), SUM(rs.avg_duration * rs.count_executions) / NULLIF(SUM(rs.count_executions), 0) / 1000.0),
        queryTextSnippet = LEFT(REPLACE(REPLACE(qt.query_sql_text, CHAR(13), ' '), CHAR(10), ' '), 4000)
      FROM sys.query_store_query_text qt
      JOIN sys.query_store_query q
        ON q.query_text_id = qt.query_text_id
      JOIN sys.query_store_plan p
        ON p.query_id = q.query_id
      JOIN sys.query_store_runtime_stats rs
        ON rs.plan_id = p.plan_id
      WHERE qt.query_sql_text LIKE '%CLIENT_TRIALS%+%'
        OR qt.query_sql_text LIKE '%UPDATE%LEADS_CLIENTS%CLIENT_TRIALS%'
        OR qt.query_sql_text LIKE '%UPDATE%leads_clients%CLIENT_TRIALS%'
        OR qt.query_sql_text LIKE '%UPDATE%leads_clients%client_trials%'
      GROUP BY q.object_id, qt.query_sql_text
      ORDER BY lastExecutionTime DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("planCache", `
    BEGIN TRY
      SELECT TOP (100)
        qs.last_execution_time,
        qs.execution_count,
        databaseName = DB_NAME(st.dbid),
        textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 4000)
      FROM sys.dm_exec_query_stats qs
      CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
      WHERE st.text LIKE '%CLIENT_TRIALS%'
        OR st.text LIKE '%leads_clients%'
        OR st.text LIKE '%calltrace%'
      ORDER BY qs.last_execution_time DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("planCacheClientTrialWrites", `
    BEGIN TRY
      SELECT TOP (50)
        qs.creation_time,
        qs.last_execution_time,
        qs.execution_count,
        databaseName = DB_NAME(st.dbid),
        textSnippet = LEFT(REPLACE(REPLACE(st.text, CHAR(13), ' '), CHAR(10), ' '), 4000)
      FROM sys.dm_exec_query_stats qs
      CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
      WHERE st.text LIKE '%CLIENT_TRIALS%+%'
        OR st.text LIKE '%UPDATE%LEADS_CLIENTS%CLIENT_TRIALS%'
        OR st.text LIKE '%UPDATE%leads_clients%CLIENT_TRIALS%'
        OR st.text LIKE '%UPDATE%leads_clients%client_trials%'
      ORDER BY qs.last_execution_time DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("activeRequests", `
    BEGIN TRY
      SELECT
        r.session_id,
        s.login_name,
        s.host_name,
        s.program_name,
        r.status,
        r.command,
        r.start_time,
        r.cpu_time,
        r.total_elapsed_time,
        databaseName = DB_NAME(r.database_id),
        runningSqlSnippet = LEFT(REPLACE(REPLACE(txt.text, CHAR(13), ' '), CHAR(10), ' '), 4000)
      FROM sys.dm_exec_requests r
      JOIN sys.dm_exec_sessions s
        ON s.session_id = r.session_id
      CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) txt
      WHERE txt.text LIKE '%CLIENT_TRIALS%'
        OR txt.text LIKE '%leads_clients%'
        OR txt.text LIKE '%calltrace%'
      ORDER BY r.start_time DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  checks.push(await query("currentUserSessions", `
    BEGIN TRY
      SELECT TOP (100)
        s.session_id,
        s.login_name,
        s.host_name,
        s.program_name,
        s.status,
        s.login_time,
        s.last_request_start_time,
        s.last_request_end_time,
        c.net_transport,
        c.protocol_type,
        c.auth_scheme,
        mostRecentSqlSnippet = LEFT(REPLACE(REPLACE(txt.text, CHAR(13), ' '), CHAR(10), ' '), 4000)
      FROM sys.dm_exec_sessions s
      LEFT JOIN sys.dm_exec_connections c
        ON c.session_id = s.session_id
      OUTER APPLY sys.dm_exec_sql_text(c.most_recent_sql_handle) txt
      WHERE s.is_user_process = 1
      ORDER BY s.last_request_end_time DESC, s.last_request_start_time DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `));

  for (let i = 0; i < 4; i += 1) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
    checks.push(await query(`watch${i}`, `
      SELECT
        observedAtUtc = SYSUTCDATETIME(),
        lc.QUEUE_ID,
        lc.CLIENT_TRIALS,
        clientCount = COUNT(DISTINCT lc.CLIENT_ID),
        latestLastDialed = MAX(ln.LastDialed)
      FROM dbo.leads_clients lc
      LEFT JOIN dbo.leads_numbers ln
        ON ln.CLIENT_ID = lc.CLIENT_ID
      WHERE lc.QUEUE_ID IN (37, 39)
        AND lc.CLIENT_TRIALS IN (3, 9)
      GROUP BY lc.QUEUE_ID, lc.CLIENT_TRIALS
      ORDER BY lc.QUEUE_ID, lc.CLIENT_TRIALS;
    `));
  }

  checks.push(await query("recentTrial9Clients", `
    SELECT
      lc.CLIENT_ID,
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT,
      lastNumberDialed = MAX(ln.LastDialed),
      queue39CalltraceRows = COUNT(ct.CALLTRACEID),
      lastQueue39Call = MAX(ct.INCOMINGCALLTIME),
      lastQueue39DialerResult = MAX(ct.DIALERRESULT)
    FROM dbo.leads_clients lc
    LEFT JOIN dbo.leads_numbers ln
      ON ln.CLIENT_ID = lc.CLIENT_ID
    LEFT JOIN dbo.calltrace ct
      ON ct.DNIS = ln.PHONE_NO
      AND ct.QUEUEID = 39
    WHERE lc.QUEUE_ID IN (37, 39)
      AND lc.CLIENT_TRIALS = 9
    GROUP BY
      lc.CLIENT_ID,
      lc.QUEUE_ID,
      lc.CLIENT_TRIALS,
      lc.RULE_STEP,
      lc.STATUS,
      lc.AGENT_RESULT
    ORDER BY lastNumberDialed DESC, lc.CLIENT_ID DESC;
  `));

  const summary = Object.fromEntries(
    checks.map((check) => [
      check.name,
      check.ok
        ? {
            rowCount: check.rows.length,
            recordsetCount: check.recordsets.length,
            durationMs: check.durationMs,
            sampleRows: check.rows.slice(0, 5),
          }
        : { error: check.error, durationMs: check.durationMs },
    ]),
  );

  const outputPath = "/private/tmp/jpi-sqlprobe/client-trials-diagnostics.json";
  await writeFile(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), checks }, null, 2));

  console.log(JSON.stringify({ outputPath, summary }, null, 2));
}

try {
  await main();
} finally {
  await pool.close();
}
