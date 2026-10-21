#!/usr/bin/env bash
# gitsave.sh: commit everything on the current branch, then push every local branch (no force).
# Usage: run from inside the repo.  ./gitsave.sh [remote]   (remote defaults to origin)
set -u

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not in a git repo"; exit 1; }

remote="${1:-origin}"
branch="$(git symbolic-ref --short -q HEAD || echo DETACHED)"

# A commit on a detached HEAD wouldn't be pushed by --all, so give it a branch.
if [ "$branch" = DETACHED ]; then
  branch="wip-rescue-$(date +%Y%m%d-%H%M)"
  git switch -c "$branch" || exit 1
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit on $branch"
else
  git commit -m "WIP: emergency save $(date '+%Y-%m-%d %H:%M')" || exit 1
fi

if git push --all "$remote"; then
  echo "All branches pushed to $remote"
else
  echo "Push reported errors (offline, or a branch was rejected). See output above."
  echo "Offline fallback: git bundle create ~/$(basename "$PWD").bundle --all"
fi
