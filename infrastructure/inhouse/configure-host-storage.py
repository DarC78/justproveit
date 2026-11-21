import base64,json,os,secrets,subprocess
from pathlib import Path
p=Path('/etc/ls-justproveit/host-storage.env')
if not p.exists():
 p.write_text('AZURITE_ACCOUNTS=justproveithost:'+base64.b64encode(secrets.token_bytes(64)).decode()+'\n');p.chmod(0o600)
account,key=p.read_text().strip().split('=',1)[1].split(':',1)
data=Path('/var/lib/ls-justproveit/host-storage');data.mkdir(mode=0o700,exist_ok=True);os.chown(data,1000,1000)
name='ls-justproveit-host-storage';exists=subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
if not exists:
 subprocess.run(['docker','run','-d','--name='+name,'--network=host','--restart=unless-stopped','--read-only','--user=1000:1000','--cap-drop=ALL','--security-opt=no-new-privileges','--memory=256m','--cpus=0.5','--tmpfs=/tmp:rw,nosuid,size=32m','--env-file='+str(p),'--mount=type=bind,src='+str(data)+',dst=/data','--log-opt=max-size=5m','--log-opt=max-file=2','mcr.microsoft.com/azure-storage/azurite@sha256:647c63a91102a9d8e8000aab803436e1fc85fbb285e7ce830a82ee5d6661cf37','azurite','--blobHost','127.0.0.1','--blobPort','10003','--queueHost','127.0.0.1','--queuePort','10004','--tableHost','127.0.0.1','--tablePort','10005','--location','/data','--silent','--skipApiVersionCheck','--disableTelemetry'],check=True,stdout=subprocess.DEVNULL)
settings=Path('/etc/ls-justproveit/settings.json');s=json.loads(settings.read_text())
s['AzureWebJobsStorage']='DefaultEndpointsProtocol=http;AccountName='+account+';AccountKey='+key+';'+''.join(service+'Endpoint=http://127.0.0.1:'+str(port)+'/'+account+';' for service,port in [('Blob',10003),('Queue',10004),('Table',10005)])
settings.write_text(json.dumps(s)+'\n');settings.chmod(0o640);os.chown(settings,0,1000)
print('Dedicated local host metadata storage configured; business fulfillment storage unchanged')
