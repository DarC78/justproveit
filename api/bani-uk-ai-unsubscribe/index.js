module.exports=async function(context,req){
 const token=req.query?.token;
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Type':'text/html; charset=utf-8'};
 if(typeof token!=='string'||!/^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/i.test(token)){context.res={status:400,headers,body:'Link de dezabonare invalid.'};return;}
 const method=String(req.method||'GET').toUpperCase();
 if(!['GET','POST'].includes(method)){context.res={status:405,headers,body:'Method not allowed'};return;}
 let body;
 if(method==='POST'){
  body=typeof req.rawBody==='string'?req.rawBody:Buffer.isBuffer(req.rawBody)?req.rawBody.toString('utf8'):typeof req.body==='string'?req.body:new URLSearchParams(req.body||{}).toString();
  if(Buffer.byteLength(body)>2048){context.res={status:413,headers,body:'Cerere prea mare.'};return;}
 }
 try{
  const upstream=await fetch('https://launchingstack-func-dev.azurewebsites.net/api/justproveit/public/email-unsubscribe?token='+encodeURIComponent(token),{method,headers:method==='POST'?{'Content-Type':'application/x-www-form-urlencoded'}:undefined,body,redirect:'error',signal:AbortSignal.timeout(15000)});
  const csp=upstream.headers.get('content-security-policy');if(csp)headers['Content-Security-Policy']=csp;
  context.res={status:upstream.status,headers,body:await upstream.text()};
 }catch{context.res={status:503,headers,body:'Nu am putut salva dezabonarea. Încearcă din nou.'};}
};
