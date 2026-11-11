const { backendUrl } = require('../shared/backendUrl');
module.exports = async function(context,req) {
 const headers={'Cache-Control':'no-store'};
 const raw=typeof req.rawBody==='string'?req.rawBody:JSON.stringify(req.body||{});
 if(Buffer.byteLength(raw)>2048){context.res={status:413,headers};return;}
 try {const response=await fetch(backendUrl('/justproveit/public/email-template-funnel-events'),{method:'POST',headers:{'Content-Type':'application/json',Origin:req.headers.origin||'','User-Agent':req.headers['user-agent']||''},body:raw,signal:AbortSignal.timeout(10000)});context.res={status:response.status,headers,body:await response.text()};}
 catch {context.res={status:503,headers};}
};
