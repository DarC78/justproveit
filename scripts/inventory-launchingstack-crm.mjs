import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const launchingStackRoot =
  process.env.LAUNCHINGSTACK_ROOT || "C:/Users/adria/LaunchingStack";
const functionsRoot = `${launchingStackRoot}/backend/functions`;
const settingsPath = `${functionsRoot}/local.settings.json`;
const mssqlPath = `${functionsRoot}/node_modules/mssql/index.js`;

const sqlModule = await import(pathToFileURL(mssqlPath).href);
const sql = sqlModule.default ?? sqlModule;
const settings = JSON.parse(await readFile(settingsPath, "utf8"));
const connectionString =
  process.env.SqlConnectionString ||
  process.env.SQL_CONNECTION_STRING ||
  process.env.AzureSql__SqlConnectionString ||
  settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const pool = await sql.connect(connectionString);

try {
  const tables = await pool.request().query(`
    SELECT
      TABLE_SCHEMA AS schemaName,
      TABLE_NAME AS tableName
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_SCHEMA, TABLE_NAME;
  `);

  const views = await pool.request().query(`
    SELECT
      TABLE_SCHEMA AS schemaName,
      TABLE_NAME AS viewName
    FROM INFORMATION_SCHEMA.VIEWS
    ORDER BY TABLE_SCHEMA, TABLE_NAME;
  `);

  const rowCounts = await pool.request().query(`
    SELECT
      s.name AS schemaName,
      t.name AS tableName,
      SUM(p.row_count) AS [rowCount]
    FROM sys.tables t
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    JOIN sys.dm_db_partition_stats p ON p.object_id = t.object_id
    WHERE p.index_id IN (0, 1)
    GROUP BY s.name, t.name
    ORDER BY s.name, t.name;
  `);

  const columns = await pool.request().query(`
    SELECT
      TABLE_SCHEMA AS schemaName,
      TABLE_NAME AS tableName,
      COLUMN_NAME AS columnName,
      DATA_TYPE AS dataType,
      CHARACTER_MAXIMUM_LENGTH AS maxLength,
      IS_NULLABLE AS isNullable,
      ORDINAL_POSITION AS ordinalPosition
    FROM INFORMATION_SCHEMA.COLUMNS
    ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
  `);

  const indexes = await pool.request().query(`
    SELECT
      s.name AS schemaName,
      t.name AS tableName,
      i.name AS indexName,
      i.is_unique AS isUnique,
      i.type_desc AS indexType,
      c.name AS columnName,
      ic.key_ordinal AS keyOrdinal
    FROM sys.indexes i
    JOIN sys.tables t ON t.object_id = i.object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = ic.column_id
    WHERE i.name IS NOT NULL
    ORDER BY s.name, t.name, i.name, ic.key_ordinal;
  `);

  const wantedNames = [
    "crm",
    "lead",
    "client",
    "customer",
    "email",
    "sms",
    "campaign",
    "activity",
    "log",
    "oz"
  ];

  const relevantTables = tables.recordset.filter((table) => {
    const name = `${table.schemaName}.${table.tableName}`.toLowerCase();
    return wantedNames.some((wanted) => name.includes(wanted));
  });

  const relevantTableKeys = new Set(
    relevantTables.map((table) => `${table.schemaName}.${table.tableName}`)
  );

  const relevantColumns = columns.recordset.filter((column) =>
    relevantTableKeys.has(`${column.schemaName}.${column.tableName}`)
  );

  const relevantIndexes = indexes.recordset.filter((index) =>
    relevantTableKeys.has(`${index.schemaName}.${index.tableName}`)
  );

  console.log(
    JSON.stringify(
      {
        tableCount: tables.recordset.length,
        allTables: tables.recordset,
        viewCount: views.recordset.length,
        allViews: views.recordset,
        rowCounts: rowCounts.recordset,
        relevantTables,
        relevantColumns,
        relevantIndexes
      },
      null,
      2
    )
  );
} finally {
  await pool.close();
}
