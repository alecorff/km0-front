#!/bin/bash
set -e

TYPE=$1

if [[ "$TYPE" != "patch" && "$TYPE" != "minor" && "$TYPE" != "major" ]]; then
  echo "Usage: ./release.sh {patch|minor|major}"
  exit 1
fi

GIT_REMOTE=origin

# Sync
git checkout master
git pull $GIT_REMOTE master

git checkout develop
git pull $GIT_REMOTE develop

# Merge develop → master
git checkout master
git merge develop

# Release
npm version $TYPE -m "build(release): %s"

git push $GIT_REMOTE master
git push $GIT_REMOTE --tags

# Report version back to develop
git checkout develop
git merge master
git push $GIT_REMOTE develop

echo "Frontend release ($TYPE) done"