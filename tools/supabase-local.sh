#!/usr/bin/env bash
#
# Bring the local Supabase stack up and wire the workspace to it.
#
#   tools/supabase-local.sh            # start, apply pending migrations, sync keys, gen types
#   tools/supabase-local.sh --reset    # same, but wipe the local DB and re-run seed.sql first
#
# Everything here is idempotent except --reset, which drops local data on purpose:
# it is the only way to re-run supabase/seed.sql (the role -> permission map).
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"
TYPES="libs/shared/database-types/src/lib/database.types.ts"
RESET=0
[[ "${1:-}" == "--reset" ]] && RESET=1

# --- preflight ----------------------------------------------------------------
# supabase start is Docker-only. Failing here with the fix beats a wall of
# container errors thirty seconds in.
if ! docker info >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Cannot reach the Docker daemon.

If Docker is installed but your user is not in the docker group:

    sudo usermod -aG docker "$USER"
    newgrp docker          # or log out and back in

Then re-run this script.
MSG
  exit 1
fi

# --- stack --------------------------------------------------------------------
echo "==> supabase start"
npx supabase start

if [[ $RESET -eq 1 ]]; then
  echo "==> supabase db reset (drops local data, re-runs migrations + seed.sql)"
  npx supabase db reset
else
  # start only applies migrations when it first creates the database, so a
  # migration added since the last start needs this.
  echo "==> supabase migration up"
  npx supabase migration up
fi

# --- keys ---------------------------------------------------------------------
# Read the keys back from the running stack rather than hardcoding them, so this
# keeps working if the local JWT secret is ever changed in config.toml.
echo "==> syncing .env"
STATUS="$(npx supabase status -o env)"
# -o env prints KEY="value"; tolerate the unquoted form too.
get() { printf '%s\n' "$STATUS" | sed -n "s/^$1=//p" | tr -d '"' | head -n 1; }

API_URL_VALUE="$(get API_URL)"
ANON_KEY="$(get ANON_KEY)"
SERVICE_KEY="$(get SERVICE_ROLE_KEY)"

if [[ -z "$API_URL_VALUE" || -z "$ANON_KEY" || -z "$SERVICE_KEY" ]]; then
  echo "Could not read keys from 'supabase status -o env'." >&2
  exit 1
fi

[[ -f .env ]] || cp .env.example .env
# Rewrite the three Supabase lines in place; leave everything else in .env alone.
python3 - "$API_URL_VALUE" "$ANON_KEY" "$SERVICE_KEY" <<'PY'
import pathlib, re, sys

url, anon, service = sys.argv[1:4]
path = pathlib.Path('.env')
text = path.read_text()

for key, value in (
    ('SUPABASE_URL', url),
    ('SUPABASE_ANON_KEY', anon),
    ('SUPABASE_SERVICE_ROLE_KEY', service),
):
    line = f'{key}={value}'
    pattern = re.compile(rf'^{key}=.*$', re.MULTILINE)
    text, n = pattern.subn(line, text)
    if n == 0:
        text = text.rstrip('\n') + f'\n{line}\n'

path.write_text(text)
PY

# The Angular apps bundle the anon key as a literal — process.env does not exist
# in the browser — so they cannot read .env. Flag drift instead of rewriting TS.
for env_file in apps/web/src/environments/environment.ts apps/admin/src/environments/environment.ts; do
  if ! grep -qF "$ANON_KEY" "$env_file"; then
    echo "WARNING: $env_file does not carry the current anon key. Paste it into supabaseAnonKey:" >&2
    echo "  $ANON_KEY" >&2
  fi
done

# --- types --------------------------------------------------------------------
echo "==> regenerating $TYPES"
npx supabase gen types typescript --local > "$TYPES.tmp"
mv "$TYPES.tmp" "$TYPES"

cat <<MSG

Local Supabase is up.

  Studio     http://127.0.0.1:54323
  API        $API_URL_VALUE
  Inbucket   http://127.0.0.1:54324   (all local mail lands here)

Next: create an account at /auth/signup, then grant yourself admin —
roles are service_role-only, so the first grant cannot come from the app:

  npx supabase db query "insert into public.user_roles (user_id, role)
    select id, 'admin' from auth.users where email = 'you@example.com'
    on conflict do nothing;"

Sign out and back in: permissions are stamped into the JWT at token issue time.

Stop the stack with: npx supabase stop
MSG
