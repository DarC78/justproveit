#!/usr/bin/env bash
# Update only a GitHub-built static test preview. No Docker/sudo/backend changes.
set -euo pipefail
umask 077
run="${1:?Successful WhatsApp CRM test preview workflow run ID required}"
[[ "$run" =~ ^[0-9]+$ ]]
root=/home/administrator/projects/LSAgent2/LaunchingStack
runtime="$root/services/whatsapp-gateway/.runtime/crm-test"
[[ -d "$runtime/site" && -w "$runtime/site" && -f "$runtime/release-record" ]]
metadata="$(gh run view "$run" --repo DarC78/justproveit --json conclusion,headBranch,headSha,workflowName)"
revision="$(printf '%s' "$metadata" | python3 -c 'import sys,json;d=json.load(sys.stdin);assert d["conclusion"]=="success" and d["headBranch"]=="feat/whatsapp-gateway-crm-history" and d["workflowName"]=="WhatsApp CRM test preview";print(d["headSha"])')"
release="$(mktemp -d "$runtime/frontend-update-$run-XXXX")"
gh run download "$run" --repo DarC78/justproveit --name "whatsapp-crm-preview-$revision" --dir "$release/frontend"
(cd "$release/frontend" && sha256sum -c crm-preview.tar.gz.sha256)
[[ "$(cat "$release/frontend/source-revision.txt")" == "$revision" ]]
python3 - "$release" "$runtime" <<'PY'
from pathlib import Path
import sys,tarfile,shutil,os,json
release=Path(sys.argv[1]);runtime=Path(sys.argv[2]);stage=release/'unpacked';stage.mkdir(mode=0o700)
with tarfile.open(release/'frontend/crm-preview.tar.gz') as t:
 for m in t.getmembers():
  assert (stage/m.name).resolve().is_relative_to(stage.resolve()) and not m.issym() and not m.islnk() and (m.isfile() or m.isdir()),'Invalid static artifact'
 t.extractall(stage,filter='data')
assert (stage/'admin/crm/index.html').is_file() and (stage/'login/index.html').is_file()
previous=Path((runtime/'release-record').read_text().strip())
assert previous.resolve().is_relative_to(runtime.resolve()) and (previous/'backend/source-revision.txt').is_file()
# Preserve immutable backend manifests and the previous complete release for rollback.
os.symlink(previous/'backend',release/'backend',target_is_directory=True)
# Copy assets before entry HTML; individual files switch atomically. Keep old hashed
# assets so browsers already open on the previous build continue to work.
files=[p for p in stage.rglob('*') if p.is_file()]
for src in sorted(files,key=lambda p:(p.suffix=='.html',str(p))):
 dst=runtime/'site'/src.relative_to(stage);assert dst.resolve().is_relative_to((runtime/'site').resolve()),'Invalid preview destination';dst.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
 temp=dst.with_name(dst.name+'.deploy-tmp');shutil.copyfile(src,temp);temp.chmod(0o600);os.replace(temp,dst)
(runtime/'previous-frontend-release').write_text(str(previous)+'\n')
new_record=runtime/'release-record.pending';new_record.write_text(str(release)+'\n');os.replace(new_record,runtime/'release-record')
print(json.dumps({'event':'static_crm_preview_updated','frontend_revision':(release/'frontend/source-revision.txt').read_text().strip(),'backend_unchanged':True,'docker_restart':False,'sending_unchanged':True}))
PY
