import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
const fixture=await mkdtemp(join(tmpdir(),'ls-callback-routing-'));
const upstreams=[7076,7077].map(port=>createServer(async(req,res)=>{const parts=[];for await(const x of req)parts.push(x);res.setHeader('content-type','application/json');res.end(JSON.stringify({port,url:req.url,body:Buffer.concat(parts).toString('base64'),signature:req.headers['stripe-signature'],authorization:req.headers.authorization}));}));
let nginx;
try{
 for(let i=0;i<upstreams.length;i++)await new Promise(r=>upstreams[i].listen(7076+i,'127.0.0.1',r));
 const locations=await readFile('infrastructure/inhouse/locations.conf','utf8');
 await writeFile(join(fixture,'nginx.conf'),`pid ${fixture}/nginx.pid; error_log ${fixture}/error.log; events {} http { access_log off; server { listen 127.0.0.1:19091; server_name www.justproveit.co.uk; ${locations} } }`);
 nginx=spawn('nginx',['-c',join(fixture,'nginx.conf'),'-g','daemon off;'],{stdio:'ignore'});
 await new Promise((resolve,reject)=>{nginx.once('error',reject);setTimeout(resolve,500);});
 const callbacks=['family-memory/stripe-webhook','justproveit/stripe-crm/proveit/webhook','justproveit/stripe-crm/justproveit/webhook','webhooks/resend','social/facebook/oauth/callback','internal/tiktok/connect','internal/tiktok/account/connect','justproveit/admin/crm/email-oauth/callback'];
 const raw=' { "fixture": true, "spaces": "preserved" }\n';
 for(const path of callbacks){const r=await fetch('http://127.0.0.1:19091/api/'+path+'?state=fixture%2Bexact',{method:'POST',headers:{'stripe-signature':'fixture-signature',authorization:'Bearer fixture'},body:raw});assert.equal(r.status,200);const data=await r.json();assert.equal(data.port,7076);assert.equal(data.body,Buffer.from(raw).toString('base64'));assert.equal(data.url,'/api/'+path+'?state=fixture%2Bexact');assert.equal(data.signature,'fixture-signature');assert.equal(data.authorization,'Bearer fixture');}
 for(const path of ['bani-uk-ai/webhook','email-link','stripe-installments/overdue']){const r=await fetch('http://127.0.0.1:19091/api/'+path);assert.equal((await r.json()).port,7077);}
 const large='x'.repeat(2*1024*1024+1);const largeResponse=await fetch('http://127.0.0.1:19091/api/webhooks/resend',{method:'POST',body:large});assert.equal(largeResponse.status,200);assert.equal((await largeResponse.json()).body,Buffer.from(large).toString('base64'),'Preserve the existing backend body limit; application handlers still enforce their own limits');
 for(const path of ['/api/admin/host/status','/admin/host/status','/admin/functions/test','/api/not-registered','/api/webhooks/resend/private','/.env'])assert.equal((await fetch('http://127.0.0.1:19091'+path)).status,404,path);
 console.log('Verified callback bodies, queries, signatures and authorization; website routes preserved and private paths denied');
}finally{
 if(nginx?.pid){nginx.kill('SIGTERM');await new Promise(r=>nginx.once('exit',r));}
 for(const server of upstreams)await new Promise(r=>server.close(r));await rm(fixture,{recursive:true,force:true});
}
