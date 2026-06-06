#!/usr/bin/env bash
# mongo-restore.sh — NomadMe MongoDB restore from a local snapshot
# Usage: mongo-restore.sh <path/to/archive.tar.gz>
# WARNING: uses --drop; every listed collection is replaced from the archive.
set -euo pipefail

# ── Config (must match mongo-backup.sh) ──────────────────────────────────────
APPNAME="nomadme"
ENV_FILE="/var/www/nomadme/backend/.env"
BACKUP_DIR="/var/backups/${APPNAME}/mongodb"

# ── Resolve MONGO_URI ─────────────────────────────────────────────────────────
if [[ -z "${MONGO_URI:-}" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[ERROR] MONGO_URI not set and .env not found at $ENV_FILE" >&2
    exit 1
  fi
  MONGO_URI=$(grep -E '^MONGO_URI=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed "s/^['\"]//; s/['\"]$//")
  if [[ -z "$MONGO_URI" ]]; then
    echo "[ERROR] MONGO_URI not found in $ENV_FILE" >&2
    exit 1
  fi
fi

# ── Validate argument ─────────────────────────────────────────────────────────
ARCHIVE="${1:-}"
if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "Usage: $0 <archive.tar.gz>"
  echo ""
  echo "Available backups (newest first):"
  find "$BACKUP_DIR" -maxdepth 1 -name "*.tar.gz" 2>/dev/null \
    | sort -r \
    | while read -r f; do
        printf "  %-60s  %s\n" "$f" "$(du -sh "$f" | cut -f1)"
      done
  exit 1
fi

# ── Summary + confirmation ────────────────────────────────────────────────────
echo "Archive : $ARCHIVE  ($(du -sh "$ARCHIVE" | cut -f1))"
echo "Target  : $MONGO_URI"
echo ""
echo "WARNING: --drop will replace all backed-up collections in the target database."
read -rp "Type 'yes' to proceed: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

# ── Extract into a temp dir, then restore ────────────────────────────────────
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

tar -xzf "$ARCHIVE" -C "$TMP_DIR"

DUMP_DIR=$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -1)
if [[ -z "$DUMP_DIR" ]]; then
  echo "[ERROR] Could not find a dump directory inside the archive." >&2
  exit 1
fi

mongorestore --uri="$MONGO_URI" --gzip --drop --dir="$DUMP_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore complete from $ARCHIVE"
