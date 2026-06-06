#!/usr/bin/env bash
# mongo-backup.sh — NomadMe local MongoDB snapshot
# Runs via cron every 6 hours; keeps the newest 28 archives (7 days).
set -euo pipefail

# ── Config (adjust if your VPS layout differs) ────────────────────────────────
APPNAME="nomadme"
ENV_FILE="/var/www/nomadme/backend/.env"
BACKUP_DIR="/var/backups/${APPNAME}/mongodb"
RETENTION=28   # 7 days × 4 snapshots/day

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

# ── Prepare backup directory ──────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Run mongodump ─────────────────────────────────────────────────────────────
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
DUMP_NAME="${APPNAME}-mongo-${TIMESTAMP}"
DUMP_DIR="${BACKUP_DIR}/${DUMP_NAME}"
ARCHIVE="${BACKUP_DIR}/${DUMP_NAME}.tar.gz"

mongodump --uri="$MONGO_URI" --gzip --out="$DUMP_DIR"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "$DUMP_NAME"
rm -rf "$DUMP_DIR"

# ── Retention: keep newest RETENTION archives, delete the rest ────────────────
# File names are YYYY-MM-DD_HH-MM timestamped, so alphabetical = chronological.
# `sort | head -n -N` yields the oldest files (candidates for deletion).
find "$BACKUP_DIR" -maxdepth 1 -name "*.tar.gz" \
  | sort \
  | head -n -"$RETENTION" \
  | xargs -r rm -f

# ── Log ───────────────────────────────────────────────────────────────────────
REMAINING=$(find "$BACKUP_DIR" -maxdepth 1 -name "*.tar.gz" | wc -l)
SIZE=$(du -sh "$ARCHIVE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK  archive=${ARCHIVE}  size=${SIZE}  kept=${REMAINING}"
