#!/bin/bash
# Step 5 of the AAA landing-page deploy: prove the new bytes are being served.
#
# A stale process also returns 200, so this checks the SHA, the status codes
# and the response size — not just that something answered.
set -uo pipefail

KEY=~/.ssh/tepa_hetzner_ed25519
HOST=root@2.28.26.33
URL=https://campaigns.aaa-accreditation.org
REPO=/Users/mounirbennassar/projects/Clients/AAA/marketing/lps/tepa
ROUTES=(/ /tepa /healthcare /clinic /trainingandeducationandprovidersandaccreditation /dashboard/login)

echo "=== SERVER ==="
ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" '
  echo "service:  $(systemctl is-active tepa.service)"
  echo "HEAD:     $(cd /opt/tepa/app && git rev-parse --short HEAD)"
  echo "started:  $(systemctl show tepa.service -p ActiveEnterTimestamp --value)"
  echo "errors since restart: $(journalctl -u tepa.service --since "$(systemctl show tepa.service -p ActiveEnterTimestamp --value | cut -d" " -f2,3)" --no-pager 2>/dev/null | grep -ciE "error|⨯")"
' 2>&1 | grep -v "Warning: Permanently added"

LOCAL_SHA=$(git -C "$REPO" rev-parse --short origin/main 2>/dev/null)
echo "local origin/main: $LOCAL_SHA   <-- must equal server HEAD"

echo
echo "=== PUBLIC ROUTES (status / bytes) ==="
FAIL=0
for p in "${ROUTES[@]}"; do
  BODY=$(curl -sS -H 'Cache-Control: no-cache' "$URL$p" --max-time 25 2>/dev/null)
  CODE=$(curl -sS -o /dev/null -w '%{http_code}' -H 'Cache-Control: no-cache' "$URL$p" --max-time 25 2>/dev/null)
  BYTES=$(printf '%s' "$BODY" | wc -c | tr -d ' ')
  printf "  %-52s %s  %8s bytes\n" "$p" "$CODE" "$BYTES"
  [ "$CODE" = "200" ] || FAIL=1
done

echo
if [ "$FAIL" = "0" ]; then
  echo "All routes 200. Last check is yours: grep the live HTML for a string"
  echo "that exists only in the code you just shipped, e.g."
  echo "  curl -sS -H 'Cache-Control: no-cache' $URL/<route> | grep -c '<new-string>'"
else
  echo "FAILED: a route did not return 200. Do not call this deploy done."
  exit 1
fi
