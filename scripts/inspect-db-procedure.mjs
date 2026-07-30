import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const procedureName = process.argv[2];

if (!procedureName || !/^[A-Za-z0-9_\[\].]+$/.test(procedureName)) {
  throw new Error("Usage: node scripts/inspect-db-procedure.mjs dbo.ProcedureName");
}

const settings = JSON.parse(await readFile("local.settings.json", "utf8"));
const connectionString =
  process.env.SqlConnectionString ||
  process.env.SQL_CONNECTION_STRING ||
  process.env.AzureSql__SqlConnectionString ||
  settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const [schemaName = "dbo", objectName] = procedureName.replaceAll("[", "").replaceAll("]", "").split(".");
const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

try {
  const request = pool.request();
  request.input("schemaName", sql.NVarChar(128), objectName ? schemaName : "dbo");
  request.input("objectName", sql.NVarChar(128), objectName || schemaName);

  const result = await request.query(`
    USE [server];

    DECLARE @objectId int = OBJECT_ID(QUOTENAME(@schemaName) + N'.' + QUOTENAME(@objectName));

    SELECT
      objectId = @objectId,
      objectType = o.type_desc,
      objectName = OBJECT_SCHEMA_NAME(o.object_id) + N'.' + o.name,
      o.create_date,
      o.modify_date,
      isEncrypted = OBJECTPROPERTY(o.object_id, 'IsEncrypted'),
      definition = OBJECT_DEFINITION(o.object_id)
    FROM sys.objects o
    WHERE o.object_id = @objectId;

    SELECT
      p.parameter_id,
      parameterName = p.name,
      typeName = TYPE_NAME(p.user_type_id),
      p.max_length,
      p.precision,
      p.scale,
      p.is_output,
      p.has_default_value,
      p.default_value
    FROM sys.parameters p
    WHERE p.object_id = @objectId
    ORDER BY p.parameter_id;

    SELECT
      referencedServer = d.referenced_server_name,
      referencedDatabase = d.referenced_database_name,
      referencedSchema = d.referenced_schema_name,
      referencedEntity = d.referenced_entity_name,
      referencedClass = d.referenced_class_desc,
      d.is_ambiguous
    FROM sys.sql_expression_dependencies d
    WHERE d.referencing_id = @objectId
    ORDER BY
      d.referenced_database_name,
      d.referenced_schema_name,
      d.referenced_entity_name;

    SELECT
      databaseName = DB_NAME(ps.database_id),
      objectName = OBJECT_SCHEMA_NAME(ps.object_id, ps.database_id) + N'.' + OBJECT_NAME(ps.object_id, ps.database_id),
      ps.cached_time,
      ps.last_execution_time,
      ps.execution_count,
      ps.total_worker_time,
      ps.total_elapsed_time,
      ps.total_logical_reads,
      ps.total_logical_writes
    FROM sys.dm_exec_procedure_stats ps
    WHERE ps.database_id = DB_ID('server')
      AND ps.object_id = @objectId;

    BEGIN TRY
      SELECT TOP (20)
        lastExecutionTime = MAX(rs.last_execution_time),
        executionCount = SUM(rs.count_executions),
        avgDurationMs = CONVERT(decimal(18, 2), SUM(rs.avg_duration * rs.count_executions) / NULLIF(SUM(rs.count_executions), 0) / 1000.0),
        queryTextSnippet = LEFT(REPLACE(REPLACE(qt.query_sql_text, CHAR(13), ' '), CHAR(10), ' '), 3000)
      FROM sys.query_store_query_text qt
      JOIN sys.query_store_query q
        ON q.query_text_id = qt.query_text_id
      JOIN sys.query_store_plan p
        ON p.query_id = q.query_id
      JOIN sys.query_store_runtime_stats rs
        ON rs.plan_id = p.plan_id
      WHERE qt.query_sql_text LIKE N'%' + @objectName + N'%'
      GROUP BY qt.query_sql_text
      ORDER BY lastExecutionTime DESC;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;

    BEGIN TRY
      SELECT
        jobName = j.name,
        s.step_id,
        s.step_name,
        s.database_name,
        commandSnippet = LEFT(REPLACE(REPLACE(s.command, CHAR(13), ' '), CHAR(10), ' '), 3000)
      FROM msdb.dbo.sysjobs j
      JOIN msdb.dbo.sysjobsteps s
        ON s.job_id = j.job_id
      WHERE s.command LIKE N'%' + @objectName + N'%'
      ORDER BY j.name, s.step_id;
    END TRY
    BEGIN CATCH
      SELECT errorMessage = ERROR_MESSAGE();
    END CATCH;
  `);

  console.log(JSON.stringify({
    procedure: result.recordsets[0],
    parameters: result.recordsets[1],
    dependencies: result.recordsets[2],
    procedureStats: result.recordsets[3],
    queryStoreMentions: result.recordsets[4],
    jobMentions: result.recordsets[5],
  }, null, 2));
} finally {
  await pool.close();
}
