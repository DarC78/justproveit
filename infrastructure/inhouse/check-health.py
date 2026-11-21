#!/usr/bin/python3
import json,socket,subprocess,urllib.request,urllib.error
assert subprocess.check_output(['docker','inspect','--format','{{.State.Running}}','ls-justproveit-host-storage']).strip()==b'true','Host metadata storage stopped'
with socket.create_connection(('127.0.0.1',10003),timeout=5):pass
health=json.loads(subprocess.check_output(['docker','inspect','--format','{{json .State.Health}}','ls-justproveit-api']))
assert health['Status']=='healthy','JustProveIt API container unhealthy'
with urllib.request.urlopen('http://127.0.0.1:8092/',timeout=15) as response:assert response.status==200
try:urllib.request.urlopen('http://127.0.0.1:8092/api/email-link?id=inhouse-readiness-invalid',timeout=15)
except urllib.error.HTTPError as response:assert response.code==400 and response.read()==b'Invalid email link.'
else:raise RuntimeError('Invalid link guard not active')
print('JustProveIt website and API healthy')
