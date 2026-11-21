(async()=>{
 // Exercise a local, side-effect-free handler instead of requiring host keys.
 // Invalid IDs cannot redirect, contact a provider or create delivery state.
 const response=await fetch('http://127.0.0.1:7077/api/email-link?id=inhouse-readiness-invalid',{signal:AbortSignal.timeout(7000)});
 process.exit(response.status===400&&(await response.text())==='Invalid email link.'?0:1);
})().catch(()=>process.exit(1));
