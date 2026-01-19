#!/bin/bash
set -e

TYPE=$1

if [[ "$TYPE" != "patch" && "$TYPE" != "minor" && "$TYPE" != "major" ]]; then
  echo "Usage: ./release.sh {patch|minor|major}"
  exit 1
fi

GIT_REMOTE=origin

# Sync branches
git checkout master
git pull $GIT_REMOTE master

git checkout develop
git pull $GIT_REMOTE develop

# Merge develop into master
git checkout master
git merge develop

# Release version
npm version $TYPE -m "build(release): %s"

# Push
git push $GIT_REMOTE master
git push $GIT_REMOTE --tags

echo "Frontend release ($TYPE) done"