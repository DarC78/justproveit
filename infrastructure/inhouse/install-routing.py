#!/usr/bin/python3
import argparse,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--public',action='store_true');args=p.parse_args()
base=Path('/opt/ls-justproveit');state=json.loads((base/'deployed.json').read_text());source=base/'releases'/state['revision']/'infrastructure/inhouse';changes={}
def write(path,text):
 path=Path(path);changes[path]=path.read_text() if path.exists() else None;path.write_text(text);path.chmod(0o644)
write('/etc/nginx/snippets/justproveit-locations.conf',(source/'locations.conf').read_text())
write('/etc/nginx/sites-available/justproveit-staging','server { listen 127.0.0.1:8092; server_name _; include /etc/nginx/snippets/justproveit-locations.conf; }\n')
links=[]
def enable(name):
 link=Path('/etc/nginx/sites-enabled')/name
 if not link.exists():link.symlink_to(Path('/etc/nginx/sites-available')/name);links.append(link)
enable('justproveit-staging')
if args.public:
 cert=Path('/etc/letsencrypt/live/justproveit/fullchain.pem');key=cert.parent/'privkey.pem';assert cert.exists() and key.exists()
 for host in ['justproveit.co.uk','www.justproveit.co.uk']:subprocess.run(['openssl','x509','-in',str(cert),'-noout','-checkhost',host],check=True)
 write('/etc/nginx/sites-available/justproveit','server { listen 80; server_name justproveit.co.uk www.justproveit.co.uk; location ^~ /.well-known/acme-challenge/ { root /var/lib/ls-frontends-acme; } location / { return 301 https://$host$request_uri; } }\nserver { listen 443 ssl; http2 on; server_name justproveit.co.uk www.justproveit.co.uk; ssl_certificate '+str(cert)+'; ssl_certificate_key '+str(key)+'; include /etc/nginx/snippets/justproveit-locations.conf; }\n')
 enable('justproveit')
try:subprocess.run(['nginx','-t'],check=True)
except Exception:
 for link in links:link.unlink()
 for path,old in changes.items():
  if old is None:path.unlink(missing_ok=True)
  else:path.write_text(old)
 raise
subprocess.run(['systemctl','reload','nginx'],check=True)
print('JustProveIt public hosting configured' if args.public else 'JustProveIt loopback preview configured')
