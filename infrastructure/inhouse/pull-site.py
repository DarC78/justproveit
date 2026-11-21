#!/usr/bin/python3
"""Deploy only the private Gitea CI release; retain secrets and DNS separately."""
import io,json,os,re,shutil,subprocess,tarfile,time
from pathlib import Path
BASE=Path('/opt/ls-justproveit');REPO=BASE/'repo.git';PUBLIC=Path('/srv/ls-frontends/justproveit');NAME='ls-justproveit-api'
SOURCE='ssh://git@192.168.87.184:2222/gitea-admin/justproveit.git'
ENV=dict(os.environ,GIT_TERMINAL_PROMPT='0',GIT_SSH_COMMAND='ssh -i /opt/ls-justproveit/deploy_key -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/etc/ls-frontends/gitea_known_hosts -o ConnectTimeout=15')
def run(*args,**kw):return subprocess.run(list(args),check=True,timeout=kw.pop('timeout',180),**kw)
def git(*args):return subprocess.check_output(['git','--git-dir',str(REPO),*args],env=ENV,timeout=180)
def container(image):
 return ['docker','run','-d','--name='+NAME,'--network=host','--add-host=agents.launchingstack.com:127.0.0.1','--restart=unless-stopped','--read-only','--user=1000:1000','--cap-drop=ALL','--security-opt=no-new-privileges','--memory=768m','--cpus=1','--pids-limit=256','--stop-timeout=120','--tmpfs=/tmp:rw,nosuid,size=128m','--tmpfs=/home/LogFiles:rw,nosuid,size=64m,uid=1000,gid=1000','--mount=type=bind,src=/etc/ls-justproveit,dst=/run/justproveit,readonly','--mount=type=bind,src=/var/lib/ls-justproveit/secrets,dst=/azure-functions-host/Secrets','--mount=type=bind,src=/var/lib/ls-justproveit/aspnet,dst=/home/.aspnet','--log-opt=max-size=10m','--log-opt=max-file=3',image]
def main():
 BASE.mkdir(mode=0o700,exist_ok=True)
 if not REPO.exists():run('git','init','--bare',str(REPO))
 git('fetch','--depth=1',SOURCE,'justproveit-inhouse');revision=git('rev-parse','FETCH_HEAD').decode().strip();manifest=json.loads(git('show','FETCH_HEAD:inhouse-release.json'));sha=manifest.get('sourceSha','')
 if not re.fullmatch('[0-9a-f]{40}',sha) or manifest.get('ciProvider')!='gitea' or not str(manifest.get('giteaRun','')).isdigit():raise SystemExit('Invalid CI release')
 state=BASE/'deployed.json'
 if state.exists() and json.loads(state.read_text()).get('revision')==revision:return
 release=BASE/'releases'/revision;release.mkdir(parents=True,mode=0o700,exist_ok=True)
 with tarfile.open(fileobj=io.BytesIO(git('archive','FETCH_HEAD'))) as archive:archive.extractall(release,filter='data')
 if not (release/'site/index.html').exists() or not (release/'site/404.html').exists():raise SystemExit('Incomplete static export')
 image='ls-justproveit:'+sha;run('docker','build','--network=host','-q','-t',image,'-f',str(release/'infrastructure/inhouse/Dockerfile'),str(release),timeout=900)
 old=subprocess.run(['docker','inspect','--format','{{.Image}}',NAME],capture_output=True,text=True).stdout.strip()
 if old:run('docker','stop','-t','120',NAME,timeout=150);run('docker','rm',NAME)
 try:
  run(*container(image))
  for _ in range(60):
   health=subprocess.check_output(['docker','inspect','--format','{{.State.Health.Status}}',NAME],text=True).strip()
   if health=='healthy':break
   if health=='unhealthy':raise RuntimeError('API health failed')
   time.sleep(5)
  else:raise RuntimeError('API readiness timeout')
 except Exception:
  subprocess.run(['docker','rm','-f',NAME],capture_output=True)
  if old:run(*container(old))
  raise
 target=PUBLIC/'releases'/revision;target.parent.mkdir(parents=True,exist_ok=True)
 if not target.exists():shutil.copytree(release/'site',target)
 for p in target.rglob('*'):p.chmod(0o755 if p.is_dir() else 0o644)
 target.chmod(0o755);PUBLIC.chmod(0o755);target.parent.chmod(0o755)
 link=PUBLIC/'current.next';link.unlink(missing_ok=True);link.symlink_to(target);link.replace(PUBLIC/'current')
 state.write_text(json.dumps(dict(manifest,revision=revision,image=image))+'\n');print('JustProveIt deployed '+sha)
if __name__=='__main__':main()
