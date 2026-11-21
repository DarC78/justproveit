const fs=require('node:fs');
(async()=>{
 const key=JSON.parse(fs.readFileSync('/azure-functions-host/Secrets/host.json','utf8')).masterKey.value;
 const response=await fetch('http://127.0.0.1:7077/admin/host/status',{headers:{'x-functions-key':key},signal:AbortSignal.timeout(7000)});
 const body=await response.json();process.exit(response.ok&&body.state==='Running'?0:1);
})().catch(()=>process.exit(1));
