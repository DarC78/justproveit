import { createRequire } from 'node:module';
const require = createRequire(new URL('../api/package.json', import.meta.url));
const { TableClient } = require('@azure/data-tables');
// Configuration is supplied over stdin, never argv, environment or files.
let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const { connection } = JSON.parse(input);
  const client = TableClient.fromConnectionString(connection, 'BaniUkAiFounders');
  await client.createTable().catch(error => { if (error.statusCode !== 409) throw error; });
  const iterator = client.listEntities({ queryOptions: { filter: "PartitionKey eq 'FondatoriBaniUkAi'", select: ['PartitionKey'] } });
  // Check access without logging names, addresses or payment references.
  await iterator.next();
  console.log('Founder storage table is ready and readable.');
} catch {
  console.error('Founder storage preparation failed. No secret values logged.');
  process.exitCode = 1;
} finally { input = ''; }
