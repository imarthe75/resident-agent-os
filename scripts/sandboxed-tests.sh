#!/usr/bin/env bash
# Run this repository's tests inside sandbox-runtime (srt): no network except an explicit allowlist, no inherited environment,
# writes only to the repository and /tmp, and no read access to the usual credential folders.
#
#   scripts/sandboxed-tests.sh [extra pytest args]
#
# Why: a test once inherited a production Valkey address from the environment and ran flushdb on it. A written rule depends on
# the agent obeying it; this makes the mistake impossible instead (ADR-0004, C1).
#
# Requires: srt (npm i -g @anthropic-ai/sandbox-runtime), bubblewrap (Linux) and socat. Inside a Docker container bubblewrap
# additionally needs --security-opt seccomp=unconfined, apparmor=unconfined and systempaths=unconfined.
#
# Environment: only PATH, HOME, LANG/LC_ALL, TERM and ROS_TEST_* variables cross into the sandbox (srt itself passes the whole
# environment through, hence env -i). ROS_SANDBOX_ALLOW="pypi.org,files.pythonhosted.org:443" opens HTTP(S) destinations.
#
# Limits measured in the pilot (ADR-0004):
#  - Only HTTP(S)/SOCKS traffic leaves, through srt's proxy; the network namespace is removed. Raw-TCP services (Valkey, PostgreSQL)
#    are unreachable even when listed, so tests that need them are skipped here and run outside the sandbox with their own guards.
#  - Allowlist entries must be a domain with a dot or an IP literal; a bare container name ("valkey") is rejected.
#  - srt sets TMPDIR=/tmp/claude without creating it; the command below creates it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for tool in srt bwrap socat python3; do
  command -v "$tool" >/dev/null || { echo "sandboxed-tests: falta '$tool'; las pruebas NO se ejecutaron aisladas." >&2; exit 2; }
done

SETTINGS="$(mktemp "${TMPDIR:-/tmp}/srt-tests.XXXXXX.json")"
trap 'rm -f "$SETTINGS"' EXIT
python3 - "$ROOT/templates/sandbox/srt-tests.json" "$SETTINGS" <<'PY'
import json, os, sys
cfg = json.load(open(sys.argv[1]))
extra = [d.strip() for d in os.environ.get("ROS_SANDBOX_ALLOW", "").split(",") if d.strip()]
cfg["network"]["allowedDomains"] += extra
json.dump(cfg, open(sys.argv[2], "w"))
PY

KEEP=(PATH HOME LANG LC_ALL TERM)
if [ -n "${ROS_TEST_VALKEY_HOST:-}" ]; then
  echo "sandboxed-tests: las pruebas de Valkey se saltarán aquí (el aislamiento solo deja salir HTTP); córrelas fuera: python3 -m pytest tests/test_semantic_cache.py" >&2
fi
ENV_ARGS=(ROS_SANDBOXED=1 PYTHONDONTWRITEBYTECODE=1)
for v in "${KEEP[@]}"; do [ -n "${!v:-}" ] && ENV_ARGS+=("$v=${!v}"); done
while IFS='=' read -r name _; do
  [[ "$name" == ROS_TEST_* ]] && ENV_ARGS+=("$name=${!name}")
done < <(env)

PYTEST_ARGS=""
[ $# -gt 0 ] && PYTEST_ARGS=$(printf ' %q' "$@")
CMD="mkdir -p \"\${TMPDIR:-/tmp}\" && python3 -m pytest -q -p no:cacheprovider tests${PYTEST_ARGS}"
if command -v node >/dev/null; then CMD="$CMD && node --test tests/hooks/ tests/evals/"; else echo "sandboxed-tests: sin node, las pruebas de hooks no se ejecutan." >&2; fi
exec env -i "${ENV_ARGS[@]}" srt --settings "$SETTINGS" -c "$CMD"
