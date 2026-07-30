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

const watchMinutesArg = process.argv.find((arg) => arg.startsWith("--watch-minutes="));
const watchMinutes = watchMinutesArg ? Number(watchMinutesArg.split("=")[1]) : 45;
const pollSeconds = 30;

const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

async function run(sqlText) {
  const request = pool.request();
  request.timeout = 120000;
  return request.batch(`USE [server];\n${sqlText}`);
}

async function setupAudit() {
  await run(`
    IF OBJECT_ID(N'dbo.JPI_ClientTrialsAudit', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.JPI_ClientTrialsAudit (
        AuditId bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_JPI_ClientTrialsAudit PRIMARY KEY,
        CapturedAtUtc datetime2(3) NOT NULL CONSTRAINT DF_JPI_ClientTrialsAudit_CapturedAtUtc DEFAULT SYSUTCDATETIME(),
        CapturedAtLocal datetime2(3) NOT NULL CONSTRAINT DF_JPI_ClientTrialsAudit_CapturedAtLocal DEFAULT SYSDATETIME(),
        Spid int NOT NULL,
        AppName nvarchar(128) NULL,
        HostName nvarchar(128) NULL,
        LoginName nvarchar(128) NULL,
        OriginalLoginName nvarchar(128) NULL,
        DatabaseUserName nvarchar(128) NULL,
        ClientId int NOT NULL,
        QueueId int NULL,
        OldClientTrials int NULL,
        NewClientTrials int NULL,
        OldStatus int NULL,
        NewStatus int NULL,
        OldAgentResult int NULL,
        NewAgentResult int NULL,
        OldRuleStep int NULL,
        NewRuleStep int NULL,
        InputEventType nvarchar(64) NULL,
        InputParameters int NULL,
        InputSql nvarchar(max) NULL
      );
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = OBJECT_ID(N'dbo.JPI_ClientTrialsAudit', N'U')
        AND name = N'IX_JPI_ClientTrialsAudit_CapturedAtUtc'
    )
    BEGIN
      CREATE INDEX IX_JPI_ClientTrialsAudit_CapturedAtUtc
      ON dbo.JPI_ClientTrialsAudit (CapturedAtUtc DESC, AuditId DESC);
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = OBJECT_ID(N'dbo.JPI_ClientTrialsAudit', N'U')
        AND name = N'IX_JPI_ClientTrialsAudit_ClientId'
    )
    BEGIN
      CREATE INDEX IX_JPI_ClientTrialsAudit_ClientId
      ON dbo.JPI_ClientTrialsAudit (ClientId, CapturedAtUtc DESC);
    END;

    DECLARE @triggerSql nvarchar(max) = N'
CREATE OR ALTER TRIGGER dbo.trg_JPI_Audit_ClientTrials
ON dbo.leads_clients
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    IF NOT UPDATE(CLIENT_TRIALS)
      RETURN;

    DECLARE
      @InputEventType nvarchar(64) = NULL,
      @InputParameters int = NULL,
      @InputSql nvarchar(max) = NULL;

    BEGIN TRY
      SELECT TOP (1)
        @InputEventType = event_type,
        @InputParameters = parameters,
        @InputSql = event_info
      FROM sys.dm_exec_input_buffer(@@SPID, NULL);
    END TRY
    BEGIN CATCH
      SELECT
        @InputEventType = N''input_buffer_error'',
        @InputSql = ERROR_MESSAGE();
    END CATCH;

    INSERT INTO dbo.JPI_ClientTrialsAudit (
      Spid,
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      DatabaseUserName,
      ClientId,
      QueueId,
      OldClientTrials,
      NewClientTrials,
      OldStatus,
      NewStatus,
      OldAgentResult,
      NewAgentResult,
      OldRuleStep,
      NewRuleStep,
      InputEventType,
      InputParameters,
      InputSql
    )
    SELECT
      @@SPID,
      APP_NAME(),
      HOST_NAME(),
      SUSER_SNAME(),
      ORIGINAL_LOGIN(),
      USER_NAME(),
      i.CLIENT_ID,
      i.QUEUE_ID,
      d.CLIENT_TRIALS,
      i.CLIENT_TRIALS,
      d.STATUS,
      i.STATUS,
      d.AGENT_RESULT,
      i.AGENT_RESULT,
      d.RULE_STEP,
      i.RULE_STEP,
      @InputEventType,
      @InputParameters,
      @InputSql
    FROM inserted i
    JOIN deleted d
      ON d.CLIENT_ID = i.CLIENT_ID
    WHERE ISNULL(i.CLIENT_TRIALS, -2147483648) <> ISNULL(d.CLIENT_TRIALS, -2147483648)
      AND (i.QUEUE_ID IN (37, 39) OR d.QUEUE_ID IN (37, 39));
  END TRY
  BEGIN CATCH
    -- Audit must not break live dialler updates.
    RETURN;
  END CATCH;
END';

    EXEC sys.sp_executesql @triggerSql;
  `);
}

async function resetClientTrials() {
  const result = await run(`
    DECLARE @ResetRows int;

    UPDATE lc
      SET CLIENT_TRIALS = 3
    FROM dbo.leads_clients lc
    WHERE lc.QUEUE_ID IN (37, 39)
      AND lc.CLIENT_TRIALS = 9;

    SET @ResetRows = @@ROWCOUNT;

    SELECT
      resetRows = @ResetRows,
      resetAtLocal = CONVERT(varchar(33), GETDATE(), 126),
      resetAtUtc = CONVERT(varchar(33), SYSUTCDATETIME(), 126);
  `);

  return result.recordset?.[0] ?? {};
}

async function readAuditSince(startedAtUtc) {
  const request = pool.request();
  request.timeout = 120000;
  request.input("startedAtUtc", sql.DateTime2, startedAtUtc);

  return request.query(`
    USE [server];

    SELECT
      totalAuditRows = COUNT(*),
      resetRows = SUM(CASE WHEN OldClientTrials = 9 AND NewClientTrials = 3 THEN 1 ELSE 0 END),
      changedAwayFrom3Rows = SUM(CASE WHEN OldClientTrials = 3 AND NewClientTrials <> 3 THEN 1 ELSE 0 END),
      changedTo9Rows = SUM(CASE WHEN OldClientTrials = 3 AND NewClientTrials = 9 THEN 1 ELSE 0 END),
      latestCapturedAtUtc = CONVERT(varchar(33), MAX(CapturedAtUtc), 126)
    FROM dbo.JPI_ClientTrialsAudit
    WHERE CapturedAtUtc >= @startedAtUtc;

    SELECT TOP (20)
      AuditId,
      CapturedAtUtc = CONVERT(varchar(33), CapturedAtUtc, 126),
      CapturedAtLocal = CONVERT(varchar(33), CapturedAtLocal, 126),
      Spid,
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      DatabaseUserName,
      ClientId,
      QueueId,
      OldClientTrials,
      NewClientTrials,
      OldStatus,
      NewStatus,
      OldAgentResult,
      NewAgentResult,
      OldRuleStep,
      NewRuleStep,
      InputEventType,
      InputParameters,
      InputSqlSnippet = LEFT(REPLACE(REPLACE(InputSql, CHAR(13), ' '), CHAR(10), ' '), 2000)
    FROM dbo.JPI_ClientTrialsAudit
    WHERE CapturedAtUtc >= @startedAtUtc
      AND OldClientTrials = 3
      AND NewClientTrials <> 3
    ORDER BY AuditId DESC;

    SELECT TOP (20)
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      OldClientTrials,
      NewClientTrials,
      rowsChanged = COUNT(*),
      firstCapturedAtUtc = CONVERT(varchar(33), MIN(CapturedAtUtc), 126),
      lastCapturedAtUtc = CONVERT(varchar(33), MAX(CapturedAtUtc), 126),
      InputSqlSnippet = LEFT(REPLACE(REPLACE(MAX(InputSql), CHAR(13), ' '), CHAR(10), ' '), 1000)
    FROM dbo.JPI_ClientTrialsAudit
    WHERE CapturedAtUtc >= @startedAtUtc
    GROUP BY
      AppName,
      HostName,
      LoginName,
      OriginalLoginName,
      OldClientTrials,
      NewClientTrials
    ORDER BY lastCapturedAtUtc DESC, rowsChanged DESC;
  `);
}

try {
  const startedAtUtc = new Date();
  console.log(JSON.stringify({ phase: "setup", startedAtUtc: startedAtUtc.toISOString() }));

  await setupAudit();
  console.log(JSON.stringify({ phase: "audit-ready" }));

  const reset = await resetClientTrials();
  console.log(JSON.stringify({ phase: "reset-done", reset }));

  const deadline = Date.now() + watchMinutes * 60_000;
  let poll = 0;
  let finalResult = null;

  while (Date.now() <= deadline) {
    poll += 1;
    const result = await readAuditSince(startedAtUtc);
    finalResult = result;
    const summary = result.recordsets[0]?.[0] ?? {};
    console.log(JSON.stringify({ phase: "poll", poll, summary }));

    if (Number(summary.changedAwayFrom3Rows ?? 0) > 0) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, pollSeconds * 1000));
  }

  if (finalResult) {
    console.log(JSON.stringify({
      phase: "final",
      summary: finalResult.recordsets[0]?.[0] ?? {},
      changesAwayFrom3: finalResult.recordsets[1] ?? [],
      groupedChanges: finalResult.recordsets[2] ?? [],
    }, null, 2));
  }
} finally {
  await pool.close();
}
