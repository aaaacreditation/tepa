#!/bin/bash
# Step 4 of the AAA landing-page deploy: pull, rebuild and restart on Hetzner.
#
# Run only after the local build gate passed and `git push origin main` landed.
# A push on its own deploys nothing — there is no CI and this is not Vercel.
set -euo pipefail

KEY=~/.ssh/tepa_hetzner_ed25519
HOST=root@2.28.26.33

[ -f "$KEY" ] || { echo "Missing SSH key $KEY. Never fall back to a password." >&2; exit 1; }

echo "==> Deploying origin/main to $HOST"

ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" '
  set -e
  cd /opt/tepa/app

  echo "--- backup ---"
  tar czf /root/tepa-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
      --exclude=node_modules --exclude=.next app lib public package.json 2>/dev/null || true
  ls -lh /root/tepa-backup-*.tar.gz | tail -1

  echo "--- fetch + reset live ---"
  git fetch origin main
  git checkout -B live origin/main
  echo "server HEAD: $(git rev-parse --short HEAD)"

  echo "--- npm ci (as tepa) ---"
  sudo -u tepa npm ci --no-audit --no-fund 2>&1 | tail -3

  echo "--- build (as tepa) ---"
  sudo -u tepa npm run build 2>&1 | tail -30

  echo "--- restart ---"
  systemctl restart tepa.service
  sleep 5
  systemctl is-active tepa.service
' 2>&1 | grep -v "Warning: Permanently added"

echo
echo "==> Deployed. Now run verify_live.sh — the deploy is not done until it passes."
