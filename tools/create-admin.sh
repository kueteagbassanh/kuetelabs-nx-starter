#!/usr/bin/env bash
#
# Create the first admin user against the local Supabase stack.
#
#   tools/create-admin.sh                          # email from git config, generated password
#   tools/create-admin.sh you@example.com          # explicit email, generated password
#   ADMIN_PASSWORD=hunter2 tools/create-admin.sh you@example.com
#
# Roles are service_role-only — no client write policy exists on public.user_roles —
# so the very first grant cannot come from the app. This is that bootstrap.
# Re-runnable: an existing account is reused and the grant is upserted.
#
# tools/supabase-local.sh --reset drops auth.users, so expect to run this again
# after every reset.
set -euo pipefail

cd "$(dirname "$0")/.."

[[ -f .env ]] || { echo "No .env — run tools/supabase-local.sh first." >&2; exit 1; }
# Parsed, never sourced: .env holds unquoted values with spaces (APP_NAME=Web App),
# which bash would try to execute.
env_get() {
  sed -n "s/^[[:space:]]*$1=//p" .env | tail -n 1 \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

SUPABASE_URL="$(env_get SUPABASE_URL)"
SUPABASE_SERVICE_ROLE_KEY="$(env_get SUPABASE_SERVICE_ROLE_KEY)"

: "${SUPABASE_URL:?missing in .env}"
: "${SUPABASE_SERVICE_ROLE_KEY:?missing in .env}"

EMAIL="${1:-$(git config user.email || true)}"
[[ -n "$EMAIL" ]] || { echo "No email given and git config user.email is unset." >&2; exit 1; }

# Local stack only. This script sends the service_role key, which bypasses RLS —
# pointing it at a hosted project would hand an admin role out over the network.
case "$SUPABASE_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "SUPABASE_URL is not local ($SUPABASE_URL). Refusing to bootstrap an admin remotely." >&2; exit 1 ;;
esac

PASSWORD="${ADMIN_PASSWORD:-$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | head -c 20)}"
GENERATED=$([[ -n "${ADMIN_PASSWORD:-}" ]] && echo 0 || echo 1)

echo "==> creating $EMAIL"
# email_confirm skips the confirmation mail: this account has to be usable now.
RESPONSE="$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$(EMAIL="$EMAIL" PASSWORD="$PASSWORD" python3 -c '
import json, os
print(json.dumps({
    "email": os.environ["EMAIL"],
    "password": os.environ["PASSWORD"],
    "email_confirm": True,
    "user_metadata": {"full_name": "Admin"},
}))')")"

USER_ID="$(printf '%s' "$RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("id") or "")' 2>/dev/null || true)"

if [[ -z "$USER_ID" ]]; then
  # Already registered is the expected re-run path; page through and match the email.
  echo "    account exists or was not created, looking it up"
  USER_ID="$(curl -sS "$SUPABASE_URL/auth/v1/admin/users?per_page=1000" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    | EMAIL="$EMAIL" python3 -c '
import json, os, sys
email = os.environ["EMAIL"].lower()
users = json.load(sys.stdin).get("users", [])
print(next((u["id"] for u in users if (u.get("email") or "").lower() == email), ""))')"
  GENERATED=0
fi

if [[ -z "$USER_ID" ]]; then
  echo "Could not create or find $EMAIL. Response was:" >&2
  printf '%s\n' "$RESPONSE" >&2
  exit 1
fi

echo "==> granting admin to $USER_ID"
npx supabase db query "
  insert into public.user_roles (user_id, role)
  values ('$USER_ID', 'admin')
  on conflict (user_id, role) do nothing;" >/dev/null

# Prove the grant landed and that role_permissions was seeded, rather than
# trusting the insert: an unseeded role_permissions yields a role with no
# permissions, which looks identical to a broken login from the UI.
npx supabase db query "
  select u.email,
         r.role,
         (select count(*) from public.role_permissions p where p.role = r.role) as permissions
  from public.user_roles r
  join auth.users u on u.id = r.user_id
  where r.user_id = '$USER_ID';" -o table

cat <<MSG

Admin ready.

  email     $EMAIL
MSG
if [[ $GENERATED -eq 1 ]]; then
  echo "  password  $PASSWORD"
  echo "            (generated — change it after signing in)"
else
  echo "  password  unchanged (existing account, or ADMIN_PASSWORD was set)"
fi
cat <<'MSG'

Sign in at http://localhost:4300 (admin) or http://localhost:4200 (web).
Permissions are stamped into the JWT at token issue time, so if you were
already signed in somewhere, sign out and back in.
MSG
