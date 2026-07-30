import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const terms = process.argv.slice(2);

if (terms.length === 0 || terms.some((term) => !/^[A-Za-z0-9_]+$/.test(term))) {
  throw new Error("Usage: node scripts/search-db-object-name.mjs Missed ImportMissedCalls");
}

const settings = JSON.parse(await readFile("local.settings.json", "utf8"));
const connectionString = settings?.Values?.SqlConnectionString;

if (!connectionString) {
  throw new Error("SqlConnectionString was not found.");
}

const sqlModule = await import(pathToFileURL("/private/tmp/jpi-sqlprobe/node_modules/mssql/index.js").href);
const sql = sqlModule.default ?? sqlModule;
const pool = await sql.connect(connectionString);

function literal(value) {
  return "N'" + value.replaceAll("'", "''") + "'";
}

function identifier(value) {
  return "[" + value.replaceAll("]", "]]") + "]";
}

try {
  const termPredicates = terms
    .map((term) => `o.name LIKE N'%${term}%' OR m.definition LIKE N'%${term}%'`)
    .join(" OR ");

  const databaseRows = await pool.request().query(`
    SELECT name
    FROM sys.databases
    WHERE state_desc = 'ONLINE'
      AND HAS_DBACCESS(name) = 1
    ORDER BY name;
  `);

  const databases = databaseRows.recordset.map((row) => row.name);
  const unionSql = databases.map((databaseName) => `
    SELECT
      databaseName = ${literal(databaseName)},
      schemaName = s.name COLLATE DATABASE_DEFAULT,
      objectName = o.name COLLATE DATABASE_DEFAULT,
      objectType = o.type_desc COLLATE DATABASE_DEFAULT,
      o.create_date,
      o.modify_date,
      definitionSnippet = LEFT(REPLACE(REPLACE(m.definition, CHAR(13), ' '), CHAR(10), ' '), 3000) COLLATE DATABASE_DEFAULT
    FROM ${identifier(databaseName)}.sys.objects o
    JOIN ${identifier(databaseName)}.sys.schemas s
      ON s.schema_id = o.schema_id
    LEFT JOIN ${identifier(databaseName)}.sys.sql_modules m
      ON m.object_id = o.object_id
    WHERE ${termPredicates}
  `).join("\nUNION ALL\n");

  const result = await pool.request().query(`
    ${unionSql}
    ORDER BY databaseName, schemaName, objectName;
  `);

  console.log(JSON.stringify({
    searchedDatabases: databases,
    terms,
    matches: result.recordset,
  }, null, 2));
} finally {
  await pool.close();
}
