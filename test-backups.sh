#!/usr/bin/env bash
# Local integration test for the server-backups feature.
#
# Run this against a `npm run dev` instance backed by a disposable PostgreSQL
# database. Register an owner account and add a node before running the test.
#
# Usage:
#   1. In one terminal:  npm run dev        (make sure DATABASE_URL is set)
#   2. In another:       IDENTIFIER=test-owner PASSWORD=... BASE_URL=http://localhost:3001 ./test-backups.sh
#
# Requires: curl, jq (brew install jq / apt install jq)

set -uo pipefail
BASE_URL="${BASE_URL:-http://localhost:3001}"
IDENTIFIER="${IDENTIFIER:-}"
PASSWORD="${PASSWORD:-}"
if [ -z "$IDENTIFIER" ] || [ -z "$PASSWORD" ]; then
  echo "Set IDENTIFIER and PASSWORD to an existing test account; BT Panel no longer seeds demo users."
  exit 2
fi
COOKIES=$(mktemp)
trap 'rm -f "$COOKIES"' EXIT

pass=0; fail=0
check() { # check "description" <expected> <actual>
  if [ "$2" = "$3" ]; then
    echo "  ✅ $1 (got $3)"; pass=$((pass+1))
  else
    echo "  ❌ $1 — expected $2, got $3"; fail=$((fail+1))
  fi
}

echo "== 0. Health check (DB reachable at all) =="
health_headers=$(mktemp)
health_body=$(mktemp)
trap 'rm -f "$COOKIES" "$health_headers" "$health_body"' EXIT
health=$(curl -sS -D "$health_headers" -o "$health_body" -w '%{http_code}' "$BASE_URL/api/health" || true)
check "GET /api/health" 200 "$health"
if [ "$health" != "200" ]; then
  location=$(awk 'BEGIN{IGNORECASE=1} /^Location:/{sub(/\r$/,""); print $2; exit}' "$health_headers")
  echo "     response body: $(tr '\n' ' ' < "$health_body" | cut -c1-500)"
  [ -n "$location" ] && echo "     redirect Location: $location"
fi

echo
echo "== 1. Database self-heal: table creation happens on first real query =="
echo "   (ensureDatabase() runs the CREATE TABLE IF NOT EXISTS DDL lazily on"
echo "    first request that needs it — /api/health's 'select 1' doesn't touch it,"
echo "    so bootstrap below is really the first thing that triggers it.)"

echo
echo "== 2. Log in as the supplied test owner =="
login_resp=$(curl -s -c "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' \
  -d "{\"identifier\":\"$IDENTIFIER\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/login")
ok=$(echo "$login_resp" | jq -r '.ok // false')
if [ "$ok" != "true" ]; then
  echo "  ❌ Login failed — check the supplied IDENTIFIER/PASSWORD and account status."
  echo "     Response: $login_resp"
  exit 1
fi
echo "  ✅ logged in"

echo
echo "== 3. Pick a server to test against (or create one) =="
servers_resp=$(curl -s -b "$COOKIES" "$BASE_URL/api/servers")
server_id=$(echo "$servers_resp" | jq -r '.servers[0].id // empty')
if [ -z "$server_id" ]; then
  echo "  no existing server, creating one..."
  create_resp=$(curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' \
    -d '{"name":"backup-test","template":"minecraft","memoryMb":4096,"cpuLimit":200,"diskMb":20480}' \
    "$BASE_URL/api/servers")
  server_id=$(echo "$create_resp" | jq -r '.server.id')
fi
echo "  using server: $server_id"

echo
echo "== 4. Make sure the server is OFFLINE before backup tests (kill if needed) =="
curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -d '{"action":"kill"}' \
  "$BASE_URL/api/servers/$server_id" > /dev/null
sleep 1

echo
echo "== 5. Create a backup — table gets created here if it wasn't already =="
create_backup=$(curl -s -w '\n%{http_code}' -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' \
  -d '{"name":"integration-test-snap"}' \
  "$BASE_URL/api/servers/$server_id/backups")
backup_status=$(echo "$create_backup" | tail -1)
backup_body=$(echo "$create_backup" | sed '$d')
check "POST backups → 200" 200 "$backup_status"
backup_id=$(echo "$backup_body" | jq -r '.backup.id // empty')
initial_status=$(echo "$backup_body" | jq -r '.backup.status // empty')
check "backup starts as 'creating'" "creating" "$initial_status"
echo "     backup_id=$backup_id  sizeMb=$(echo "$backup_body" | jq -r '.backup.sizeMb')"

echo
echo "== 6. Lazy 5-second transition: re-GET immediately, then after >5s =="
list_now=$(curl -s -b "$COOKIES" "$BASE_URL/api/servers/$server_id/backups")
status_now=$(echo "$list_now" | jq -r --arg id "$backup_id" '.backups[] | select(.id==$id) | .status')
check "still 'creating' immediately after" "creating" "$status_now"

echo "  waiting 6 seconds..."
sleep 6
list_later=$(curl -s -b "$COOKIES" "$BASE_URL/api/servers/$server_id/backups")
status_later=$(echo "$list_later" | jq -r --arg id "$backup_id" '.backups[] | select(.id==$id) | .status')
check "flips to 'ready' after BACKUP_MS elapses" "ready" "$status_later"

echo
echo "== 7. Error guard: restoring while server is RUNNING should 409 =="
curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -d '{"action":"start"}' \
  "$BASE_URL/api/servers/$server_id" > /dev/null
echo "  waiting for boot (BOOT_MS ~4.2s)..."
sleep 5
restore_while_running=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -X POST \
  "$BASE_URL/api/servers/$server_id/backups/$backup_id")
check "restore on running server → 409" 409 "$restore_while_running"

echo
echo "== 8. Error guard: restore succeeds once server is OFFLINE =="
curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -d '{"action":"kill"}' \
  "$BASE_URL/api/servers/$server_id" > /dev/null
sleep 1
restore_ok=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -X POST \
  "$BASE_URL/api/servers/$server_id/backups/$backup_id")
check "restore on offline server → 200" 200 "$restore_ok"

echo
echo "== 9. Error guard: the 5-backups-per-server cap =="
# We already have 1 (possibly 'creating') backup; create up to the cap, then one more.
for i in 2 3 4 5; do
  curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -d "{\"name\":\"snap-$i\"}" \
    "$BASE_URL/api/servers/$server_id/backups" > /dev/null
done
sixth=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' \
  -d '{"name":"snap-6-should-fail"}' \
  "$BASE_URL/api/servers/$server_id/backups")
check "6th backup on same server → 403" 403 "$sixth"

echo
echo "== 10. Error guard: restoring a not-yet-ready backup should 409 =="
# Free one slot (we're at the 5-backup cap after step 9) so this fresh
# snapshot can actually be created while still 'creating'.
curl -s -o /dev/null -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -X DELETE \
  "$BASE_URL/api/servers/$server_id/backups/$backup_id" > /dev/null
fresh=$(curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -d '{"name":"not-ready-yet"}' \
  "$BASE_URL/api/servers/$server_id/backups")
fresh_id=$(echo "$fresh" | jq -r '.backup.id')
curl -s -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -d '{"action":"kill"}' \
  "$BASE_URL/api/servers/$server_id" > /dev/null
restore_too_early=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIES" -H 'Content-Type: application/json' -H 'x-btp-csrf: 1' -X POST \
  "$BASE_URL/api/servers/$server_id/backups/$fresh_id")
check "restore a 'creating' backup → 409" 409 "$restore_too_early"

echo
echo "== 11. Cleanup: delete the backups we made =="
for id in "$backup_id" "$fresh_id"; do
  curl -s -H 'x-btp-csrf: 1' -o /dev/null -b "$COOKIES" -X DELETE "$BASE_URL/api/servers/$server_id/backups/$id"
done

echo
echo "======================================"
echo "  Passed: $pass   Failed: $fail"
echo "======================================"
[ "$fail" -eq 0 ]
