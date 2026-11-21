#!/bin/bash
set -euo pipefail
case "${GITHUB_REF:-}" in refs/heads/main|main) ;; *) exit 1 ;; esac
test "${GITHUB_SHA:-}" = "$(git rev-parse HEAD)"
case "$(git remote get-url --push origin)" in https://192.168.87.184:3443/gitea-admin/justproveit|https://192.168.87.184:3443/gitea-admin/justproveit.git) ;; *) exit 1 ;; esac
release=$(mktemp -d)
trap 'git worktree remove --force "$release" >/dev/null 2>&1 || true' EXIT
set +e
git ls-remote --exit-code --heads origin justproveit-inhouse >/dev/null
status=$?
set -e
case "$status" in
 0) git fetch origin justproveit-inhouse;git worktree add --detach "$release" FETCH_HEAD ;;
 2) git worktree add --detach "$release" HEAD;git -C "$release" checkout --orphan "ci-justproveit-${GITHUB_RUN_ID}" ;;
 *) exit 1 ;;
esac
git -C "$release" rm -rf --ignore-unmatch . >/dev/null
mkdir -p "$release/site"
cp -a out/. "$release/site/"
git archive "$GITHUB_SHA" api infrastructure/inhouse | tar -x -C "$release"
cp infrastructure/inhouse/locations.conf "$release/infrastructure/inhouse/locations.conf"
printf '{"sourceSha":"%s","ciProvider":"gitea","giteaRun":"%s","repository":"gitea-admin/justproveit"}\n' "$GITHUB_SHA" "$GITHUB_RUN_ID" > "$release/inhouse-release.json"
git -C "$release" config user.name gitea-actions
git -C "$release" config user.email gitea-actions@internal.invalid
git -C "$release" add -f site api infrastructure/inhouse inhouse-release.json
git -C "$release" commit -m "Publish verified justproveit $GITHUB_SHA"
git -C "$release" push origin HEAD:justproveit-inhouse

