#!/usr/bin/env bash
# vps-backup-setup.sh — one-time installer for NomadMe MongoDB backups.
# Run as root on the VPS: sudo bash vps-backup-setup.sh
# Safe to re-run (idempotent).
set -euo pipefail

APPNAME="nomadme"
BACKUP_DIR="/var/backups/${APPNAME}/mongodb"
LOG_FILE="/var/log/${APPNAME}-backup.log"
CRON_ENTRY="0 */6 * * * /usr/local/bin/${APPNAME}-mongo-backup.sh >> ${LOG_FILE} 2>&1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== NomadMe MongoDB backup setup ==="
echo ""

# ── 1. Backup directory ───────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
chmod 750 "$BACKUP_DIR"
echo "[1/4] Backup dir ready: $BACKUP_DIR"

# ── 2. Install scripts into /usr/local/bin ────────────────────────────────────
install -m 750 "${SCRIPT_DIR}/mongo-backup.sh"  "/usr/local/bin/${APPNAME}-mongo-backup.sh"
install -m 750 "${SCRIPT_DIR}/mongo-restore.sh" "/usr/local/bin/${APPNAME}-mongo-restore.sh"
echo "[2/4] Scripts installed:"
echo "      /usr/local/bin/${APPNAME}-mongo-backup.sh"
echo "      /usr/local/bin/${APPNAME}-mongo-restore.sh"

# ── 3. Cron entry (idempotent) ────────────────────────────────────────────────
# Capture first so set -e doesn't trip on the non-zero exit when no crontab exists.
EXISTING_CRON=$(crontab -l 2>/dev/null || true)
if echo "$EXISTING_CRON" | grep -qF "${APPNAME}-mongo-backup.sh"; then
  echo "[3/4] Cron entry already present — skipped"
else
  if [[ -n "$EXISTING_CRON" ]]; then
    printf '%s\n%s\n' "$EXISTING_CRON" "$CRON_ENTRY" | crontab -
  else
    printf '%s\n' "$CRON_ENTRY" | crontab -
  fi
  echo "[3/4] Cron entry added: $CRON_ENTRY"
fi

# ── 4. First backup ───────────────────────────────────────────────────────────
echo "[4/4] Running first backup now..."
"/usr/local/bin/${APPNAME}-mongo-backup.sh" | tee -a "$LOG_FILE"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Useful commands:"
echo "  List backups   ls -lh ${BACKUP_DIR}"
echo "  Tail log       tail -f ${LOG_FILE}"
echo "  Manual backup  /usr/local/bin/${APPNAME}-mongo-backup.sh"
echo "  Restore        /usr/local/bin/${APPNAME}-mongo-restore.sh <archive>"
echo "  Edit cron      crontab -e"
