const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createPostgresLedgerClient}=require('../api/shared/baniFulfillmentLedger');
const key='fixture-ledger-service-key-only-1234567890';
test('ledger transport preserves exact session, merge ETag and private service authentication',async()=>{
 const received=[];
 const server=http.createServer(async(req,res)=>{let raw='';for await(const p of req)raw+=p;received.push({body:JSON.parse(raw),key:req.headers['x-bani-ledger-key'],path:req.url});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({entity:{partitionKey:'FondatoriBaniUkAi',rowKey:'cs_live_fixture123456789',etag:'W/"2"',emailId:'existing-receipt'}}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  const client=createPostgresLedgerClient({baseUrl:'http://127.0.0.1:'+server.address().port+'/api',key});
  const saved=await client.getEntity('FondatoriBaniUkAi','cs_live_fixture123456789');assert.equal(saved.emailId,'existing-receipt');
  await client.updateEntity({partitionKey:'FondatoriBaniUkAi',rowKey:saved.rowKey,leaseUntil:'1970-01-01T00:00:00Z'},'Merge',{etag:saved.etag});
  assert.equal(received[1].body.etag,'W/"2"');assert.ok(received.every(x=>x.key===key&&x.path==='/api/justproveit/internal/bani-fulfillment-ledger'));
  await assert.rejects(()=>client.getEntity('another-course',saved.rowKey),/partition/);assert.equal(received.length,2);
 }finally{await new Promise(r=>server.close(r));}
});
test('a failed ledger mutation is not automatically retried or routed back to Azure',async()=>{
 let calls=0;const server=http.createServer((req,res)=>{calls++;req.resume();res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"ledger_unavailable"}');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {const client=createPostgresLedgerClient({baseUrl:'http://127.0.0.1:'+server.address().port+'/api',key});await assert.rejects(()=>client.createEntity({partitionKey:'FondatoriBaniUkAi',rowKey:'cs_live_fixture123456789'}),e=>e.statusCode===503);assert.equal(calls,1);}
 finally{await new Promise(r=>server.close(r));}
});
