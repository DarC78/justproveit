/*
  Read-only diagnostics for CLIENT_TRIALS being reset to 9.

  Run this against the SQL Server that contains database [server].
  This script does not update data. It only reads metadata, plan/query-store
  history, active requests, and current queue/calltrace state.
*/

SET NOCOUNT ON;

USE [server];

PRINT '1. Current CLIENT_TRIALS distribution for queues 37 and 39';

SELECT
  lc.QUEUE_ID,
  lc.CLIENT_TRIALS,
  COUNT(DISTINCT lc.CLIENT_ID) AS clientCount
FROM dbo.leads_clients lc
WHERE lc.QUEUE_ID IN (37, 39)
GROUP BY
  lc.QUEUE_ID,
  lc.CLIENT_TRIALS
ORDER BY
  lc.QUEUE_ID,
  lc.CLIENT_TRIALS;

PRINT '2. Current rows at CLIENT_TRIALS = 9, with queue 39 calltrace counts';

SELECT TOP (200)
  lc.CLIENT_ID,
  lc.QUEUE_ID,
  lc.CLIENT_TRIALS,
  COUNT(DISTINCT ln.PHONE_NO) AS phoneCount,
  COUNT(ct.dnis) AS queue39CalltraceRows
FROM dbo.leads_clients lc
LEFT JOIN dbo.leads_numbers ln
  ON ln.CLIENT_ID = lc.CLIENT_ID
LEFT JOIN dbo.calltrace ct
  ON ct.dnis = ln.PHONE_NO
  AND ct.QUEUEID = 39
WHERE
  lc.QUEUE_ID IN (37, 39)
  AND lc.CLIENT_TRIALS = 9
GROUP BY
  lc.CLIENT_ID,
  lc.QUEUE_ID,
  lc.CLIENT_TRIALS
ORDER BY
  queue39CalltraceRows DESC,
  lc.CLIENT_ID;

PRINT '3. Table columns that may help identify updated-at or status fields';

SELECT
  c.TABLE_SCHEMA,
  c.TABLE_NAME,
  c.ORDINAL_POSITION,
  c.COLUMN_NAME,
  c.DATA_TYPE,
  c.CHARACTER_MAXIMUM_LENGTH,
  c.IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE
  c.TABLE_SCHEMA = 'dbo'
  AND c.TABLE_NAME IN ('leads_clients', 'leads_numbers', 'calltrace')
ORDER BY
  c.TABLE_NAME,
  c.ORDINAL_POSITION;

PRINT '4. DML triggers on leads_clients, leads_numbers, and calltrace';

SELECT
  parentTable = OBJECT_SCHEMA_NAME(t.parent_id) + '.' + OBJECT_NAME(t.parent_id),
  triggerName = OBJECT_SCHEMA_NAME(t.object_id) + '.' + t.name,
  t.is_disabled,
  t.is_instead_of_trigger,
  t.create_date,
  t.modify_date,
  triggerDefinition = OBJECT_DEFINITION(t.object_id)
FROM sys.triggers t
WHERE
  OBJECT_NAME(t.parent_id) IN ('leads_clients', 'leads_numbers', 'calltrace')
ORDER BY
  parentTable,
  triggerName;

PRINT '5. Programmable objects that mention CLIENT_TRIALS / leads_clients / calltrace / QUEUEID 39';

SELECT
  objectType = o.type_desc,
  objectName = OBJECT_SCHEMA_NAME(o.object_id) + '.' + o.name,
  o.create_date,
  o.modify_date,
  m.definition
FROM sys.sql_modules m
JOIN sys.objects o
  ON o.object_id = m.object_id
WHERE
  m.definition LIKE '%CLIENT_TRIALS%'
  OR m.definition LIKE '%leads_clients%'
  OR m.definition LIKE '%leads_numbers%'
  OR m.definition LIKE '%calltrace%'
  OR m.definition LIKE '%QUEUEID%39%'
  OR m.definition LIKE '%QUEUE_ID%39%'
ORDER BY
  o.modify_date DESC,
  objectName;

PRINT '6. Default/check constraints on leads_clients that mention CLIENT_TRIALS';

SELECT
  tableName = OBJECT_SCHEMA_NAME(c.object_id) + '.' + OBJECT_NAME(c.object_id),
  columnName = c.name,
  constraintName = dc.name,
  dc.definition
FROM sys.default_constraints dc
JOIN sys.columns c
  ON c.object_id = dc.parent_object_id
  AND c.column_id = dc.parent_column_id
WHERE
  OBJECT_NAME(dc.parent_object_id) = 'leads_clients'
  AND (
    c.name = 'CLIENT_TRIALS'
    OR dc.definition LIKE '%9%'
  )
ORDER BY
  columnName;

SELECT
  tableName = OBJECT_SCHEMA_NAME(cc.parent_object_id) + '.' + OBJECT_NAME(cc.parent_object_id),
  constraintName = cc.name,
  cc.definition
FROM sys.check_constraints cc
WHERE
  OBJECT_NAME(cc.parent_object_id) = 'leads_clients'
  AND cc.definition LIKE '%CLIENT_TRIALS%';

PRINT '7. SQL Agent jobs that mention these tables/fields, if msdb is accessible';

BEGIN TRY
  SELECT
    jobName = j.name,
    s.step_id,
    s.step_name,
    s.database_name,
    s.command
  FROM msdb.dbo.sysjobs j
  JOIN msdb.dbo.sysjobsteps s
    ON s.job_id = j.job_id
  WHERE
    s.command LIKE '%CLIENT_TRIALS%'
    OR s.command LIKE '%leads_clients%'
    OR s.command LIKE '%leads_numbers%'
    OR s.command LIKE '%calltrace%'
    OR s.command LIKE '%QUEUEID%39%'
    OR s.command LIKE '%QUEUE_ID%39%'
  ORDER BY
    j.name,
    s.step_id;
END TRY
BEGIN CATCH
  SELECT
    skippedCheck = 'SQL Agent jobs / msdb',
    errorMessage = ERROR_MESSAGE();
END CATCH;

PRINT '8. Query Store history for statements mentioning CLIENT_TRIALS, if Query Store is enabled';

BEGIN TRY
  SELECT TOP (100)
    lastExecutionTime = MAX(rs.last_execution_time),
    executionCount = SUM(rs.count_executions),
    avgDurationMs = CONVERT(decimal(18, 2), SUM(rs.avg_duration * rs.count_executions) / NULLIF(SUM(rs.count_executions), 0) / 1000.0),
    qt.query_sql_text
  FROM sys.query_store_query_text qt
  JOIN sys.query_store_query q
    ON q.query_text_id = qt.query_text_id
  JOIN sys.query_store_plan p
    ON p.query_id = q.query_id
  JOIN sys.query_store_runtime_stats rs
    ON rs.plan_id = p.plan_id
  WHERE
    qt.query_sql_text LIKE '%CLIENT_TRIALS%'
    OR qt.query_sql_text LIKE '%leads_clients%'
    OR qt.query_sql_text LIKE '%calltrace%'
  GROUP BY
    qt.query_sql_text
  ORDER BY
    lastExecutionTime DESC;
END TRY
BEGIN CATCH
  SELECT
    skippedCheck = 'Query Store',
    errorMessage = ERROR_MESSAGE();
END CATCH;

PRINT '9. Current plan cache statements mentioning CLIENT_TRIALS, if visible';

BEGIN TRY
  SELECT TOP (100)
    qs.last_execution_time,
    qs.execution_count,
    databaseName = DB_NAME(st.dbid),
    st.text
  FROM sys.dm_exec_query_stats qs
  CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
  WHERE
    st.text LIKE '%CLIENT_TRIALS%'
    OR st.text LIKE '%leads_clients%'
    OR st.text LIKE '%calltrace%'
  ORDER BY
    qs.last_execution_time DESC;
END TRY
BEGIN CATCH
  SELECT
    skippedCheck = 'Plan cache',
    errorMessage = ERROR_MESSAGE();
END CATCH;

PRINT '10. Active SQL requests currently touching these tables/fields, if visible';

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
    runningSql = txt.text
  FROM sys.dm_exec_requests r
  JOIN sys.dm_exec_sessions s
    ON s.session_id = r.session_id
  CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) txt
  WHERE
    txt.text LIKE '%CLIENT_TRIALS%'
    OR txt.text LIKE '%leads_clients%'
    OR txt.text LIKE '%calltrace%'
  ORDER BY
    r.start_time DESC;
END TRY
BEGIN CATCH
  SELECT
    skippedCheck = 'Active requests',
    errorMessage = ERROR_MESSAGE();
END CATCH;

PRINT '11. Lightweight 3-minute watch of CLIENT_TRIALS = 9 reappearing in queues 37/39';

DECLARE @watchIteration int = 0;

WHILE @watchIteration < 12
BEGIN
  SELECT
    observedAtUtc = SYSUTCDATETIME(),
    lc.QUEUE_ID,
    lc.CLIENT_TRIALS,
    clientCount = COUNT(DISTINCT lc.CLIENT_ID)
  FROM dbo.leads_clients lc
  WHERE
    lc.QUEUE_ID IN (37, 39)
    AND lc.CLIENT_TRIALS IN (3, 9)
  GROUP BY
    lc.QUEUE_ID,
    lc.CLIENT_TRIALS
  ORDER BY
    lc.QUEUE_ID,
    lc.CLIENT_TRIALS;

  SET @watchIteration += 1;
  WAITFOR DELAY '00:00:15';
END;
