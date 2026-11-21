const fs=require('node:fs'),{spawn}=require('node:child_process');
const values=JSON.parse(fs.readFileSync('/run/justproveit/settings.json','utf8'));
Object.assign(process.env,values,{HOME:'/home',AzureWebJobsScriptRoot:'/home/site/wwwroot',FUNCTIONS_WORKER_RUNTIME:'node',AzureWebJobsSecretStorageType:'files',FUNCTIONS_SECRETS_PATH:'/azure-functions-host/Secrets',AzureFunctionsWebHost__hostid:'justproveit-inhouse',ASPNETCORE_URLS:'http://127.0.0.1:7077',ASPNETCORE_HTTP_PORTS:'7077',DOTNET_CLI_HOME:'/tmp/dotnet',AzureFunctionsJobHost__logging__console__isEnabled:'true'});
const child=spawn('/azure-functions-host/Microsoft.Azure.WebJobs.Script.WebHost',[],{env:process.env,stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
