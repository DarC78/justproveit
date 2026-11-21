#!/usr/bin/python3
import json,subprocess,urllib.request,urllib.error
health=json.loads(subprocess.check_output(['docker','inspect','--format','{{json .State.Health}}','ls-justproveit-api']))
assert health['Status']=='healthy','JustProveIt API container unhealthy'
with urllib.request.urlopen('http://127.0.0.1:8092/',timeout=15) as response:assert response.status==200
try:urllib.request.urlopen('http://127.0.0.1:8092/api/email-link?id=inhouse-readiness-invalid',timeout=15)
except urllib.error.HTTPError as response:assert response.code==400 and response.read()==b'Invalid email link.'
else:raise RuntimeError('Invalid link guard not active')
print('JustProveIt website and API healthy')
