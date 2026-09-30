#!/usr/bin/env bash
# Sauvegarde quotidienne de la BDD — à planifier avec cron
# Exemple crontab : 0 3 * * * /var/www/dari-tn/backend/scripts/backup.sh >> /var/log/dari-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/var/backups/dari-tn"
RETENTION_DAYS=14
DATE=$(date +%Y%m%d_%H%M%S)

# Charger les variables d'environnement
source /var/www/dari-tn/backend/.env

mkdir -p "$BACKUP_DIR"

FILENAME="$BACKUP_DIR/dari_tn_${DATE}.sql.gz"

PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" -p "$DB_PORT" \
  -U "$DB_USER" -d "$DB_NAME" \
  --no-password --clean --if-exists \
  | gzip > "$FILENAME"

echo "[$(date)] ✅ Sauvegarde créée : $FILENAME ($(du -sh "$FILENAME" | cut -f1))"

# Supprimer les sauvegardes plus anciennes que RETENTION_DAYS jours
find "$BACKUP_DIR" -name "dari_tn_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] 🧹 Anciennes sauvegardes supprimées (rétention : ${RETENTION_DAYS}j)"
