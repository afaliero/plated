#!/bin/sh
set -eu
cd "$(git rev-parse --show-toplevel)"
command -v node >/dev/null || { echo "Install Node.js first." >&2; exit 1; }
command -v git-secrets >/dev/null || { echo "Install git-secrets: brew install git-secrets" >&2; exit 1; }
hooks_path=$(git config --get core.hooksPath || true)
if [ -n "$hooks_path" ] && [ "$hooks_path" != ".githooks" ]; then
  echo "An existing core.hooksPath is configured; integrate it before installing." >&2
  exit 1
fi
for hook in .git/hooks/*; do
  case "$hook" in *.sample) continue ;; esac
  if [ -f "$hook" ] && [ -x "$hook" ]; then
    echo "An existing executable hook must be integrated first: $hook" >&2
    exit 1
  fi
done
if ! git config --get-all secrets.providers | grep -Fxq 'git secrets --aws-provider'; then
  git secrets --register-aws
fi
chmod +x .githooks/pre-commit
git config --local core.hooksPath .githooks
echo "Enabled the Plated pre-commit secret check."
