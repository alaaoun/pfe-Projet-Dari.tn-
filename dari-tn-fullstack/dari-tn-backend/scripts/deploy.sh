#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║   deploy.sh — Déploiement Dari.tn sur OVH VPS Ubuntu 25.04 ║
# ║   Usage : bash scripts/deploy.sh [--fresh]                  ║
# ║   --fresh : Installation complète depuis zéro               ║
# ╚══════════════════════════════════════════════════════════════╝

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
APP_DIR="/var/www/dari-tn"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DIST_DIR="$APP_DIR/dist"
APP_USER="dari"
NODE_VERSION="22"
PG_VERSION="16"
DOMAIN="dari.tn"
API_DOMAIN="api.dari.tn"
REPO_BACKEND="https://github.com/VOTRE_ORG/dari-tn-backend.git"
REPO_FRONTEND="https://github.com/VOTRE_ORG/dari-tn-frontend.git"

GREEN='\033[0;32m' YELLOW='\033[1;33m' RED='\033[0;31m' NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

FRESH=false
[[ "${1:-}" == "--fresh" ]] && FRESH=true

# ─── Vérifications préalables ─────────────────────────────────
[[ $EUID -ne 0 ]] && error "Ce script doit être exécuté en tant que root (sudo)."
[[ ! -f .env ]] && error "Fichier .env manquant. Copiez .env.example et remplissez les valeurs."

info "=== DÉMARRAGE DU DÉPLOIEMENT DARI.TN ==="

# ═══════════════════════════════════════════════════════════════
# PHASE 1 : Installation système (--fresh seulement)
# ═══════════════════════════════════════════════════════════════
if $FRESH; then
  info "--- Phase 1 : Préparation système ---"

  # Mise à jour
  apt-get update -qq
  apt-get upgrade -y -qq

  # Dépendances essentielles
  apt-get install -y -qq \
    curl wget gnupg2 ca-certificates lsb-release \
    git build-essential \
    nginx certbot python3-certbot-nginx \
    ufw fail2ban \
    htop ncdu jq

  # ── Node.js via NodeSource ─────────────────────────────────
  info "Installation Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
  node -v && npm -v

  # ── PostgreSQL ─────────────────────────────────────────────
  info "Installation PostgreSQL $PG_VERSION..."
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list'
  wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt-get update -qq
  apt-get install -y postgresql-$PG_VERSION postgresql-contrib-$PG_VERSION

  systemctl enable postgresql
  systemctl start postgresql

  # ── Utilisateur système ────────────────────────────────────
  info "Création de l'utilisateur système '$APP_USER'..."
  id "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
  mkdir -p "$APP_DIR" "$DIST_DIR"
  chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

  # ── PM2 (gestionnaire de processus) ───────────────────────
  info "Installation PM2..."
  npm install -g pm2
  pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"

  # ── UFW (pare-feu) ─────────────────────────────────────────
  info "Configuration UFW..."
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable

  # ── Fail2ban ───────────────────────────────────────────────
  info "Configuration Fail2ban..."
  cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled  = true
filter   = nginx-botsearch
logpath  = /var/log/nginx/dari-api-error.log
EOF
  systemctl enable fail2ban
  systemctl restart fail2ban

  # ── Base de données ────────────────────────────────────────
  info "Configuration PostgreSQL..."
  DB_NAME=$(grep DB_NAME .env | cut -d= -f2)
  DB_USER=$(grep DB_USER .env | cut -d= -f2)
  DB_PASS=$(grep DB_PASSWORD .env | cut -d= -f2)

  sudo -u postgres psql << EOSQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
EOSQL
  info "✅ Base de données '$DB_NAME' créée."

  # ── Nginx cache ────────────────────────────────────────────
  mkdir -p /var/cache/nginx/dari
  chown www-data:www-data /var/cache/nginx/dari

  # ── Nginx config ───────────────────────────────────────────
  cp nginx/dari.tn.conf /etc/nginx/sites-available/dari.tn
  ln -sf /etc/nginx/sites-available/dari.tn /etc/nginx/sites-enabled/dari.tn
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  # ── Certificat SSL ─────────────────────────────────────────
  warn "⚡ Obtention du certificat SSL Let's Encrypt..."
  warn "Assurez-vous que les DNS $DOMAIN et $API_DOMAIN pointent vers ce serveur."
  read -rp "Appuyez sur Entrée quand les DNS sont configurés..."
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_DOMAIN" --non-interactive --agree-tos \
    --email "admin@$DOMAIN" --redirect
  systemctl enable certbot.timer

  info "✅ Phase 1 terminée."
fi

# ═══════════════════════════════════════════════════════════════
# PHASE 2 : Déploiement de l'application
# ═══════════════════════════════════════════════════════════════
info "--- Phase 2 : Déploiement de l'application ---"

# ── Back-end ───────────────────────────────────────────────────
info "Déploiement du back-end..."
mkdir -p "$BACKEND_DIR"

if [ -d "$BACKEND_DIR/.git" ]; then
  cd "$BACKEND_DIR"
  sudo -u "$APP_USER" git pull origin main
else
  sudo -u "$APP_USER" git clone "$REPO_BACKEND" "$BACKEND_DIR"
  cd "$BACKEND_DIR"
fi

# Copier le .env
cp "$(pwd)/.env" "$BACKEND_DIR/.env"
chown "$APP_USER":"$APP_USER" "$BACKEND_DIR/.env"
chmod 600 "$BACKEND_DIR/.env"

# Installer les dépendances
sudo -u "$APP_USER" npm ci --omit=dev

# Migrations
info "Exécution des migrations..."
sudo -u "$APP_USER" node src/config/migrate.js

# Seeder uniquement si --fresh
if $FRESH; then
  info "Insertion des données initiales..."
  sudo -u "$APP_USER" node src/config/seed.js
fi

# Créer les dossiers nécessaires
mkdir -p "$BACKEND_DIR/logs" "$BACKEND_DIR/tmp"
chown -R "$APP_USER":"$APP_USER" "$BACKEND_DIR/logs" "$BACKEND_DIR/tmp"

# ── PM2 : (re)démarrer l'API ───────────────────────────────────
info "Démarrage de l'API avec PM2..."
sudo -u "$APP_USER" pm2 delete dari-api 2>/dev/null || true
sudo -u "$APP_USER" pm2 start "$BACKEND_DIR/src/server.js" \
  --name dari-api \
  --instances 2 \
  --exec-mode cluster \
  --max-memory-restart 512M \
  --env production \
  --log "$BACKEND_DIR/logs/pm2.log" \
  --error "$BACKEND_DIR/logs/pm2-error.log"

sudo -u "$APP_USER" pm2 save

# ── Front-end (si repo fourni) ─────────────────────────────────
if [ -n "$REPO_FRONTEND" ] && [[ "$REPO_FRONTEND" != *"VOTRE_ORG"* ]]; then
  info "Déploiement du front-end..."
  mkdir -p "$FRONTEND_DIR"

  if [ -d "$FRONTEND_DIR/.git" ]; then
    cd "$FRONTEND_DIR" && sudo -u "$APP_USER" git pull origin main
  else
    sudo -u "$APP_USER" git clone "$REPO_FRONTEND" "$FRONTEND_DIR"
    cd "$FRONTEND_DIR"
  fi

  # Créer le .env front
  cat > "$FRONTEND_DIR/.env.production" << EOF
VITE_API_URL=https://api.$DOMAIN
VITE_APP_NAME=Dari.tn
EOF

  sudo -u "$APP_USER" npm ci
  sudo -u "$APP_USER" npm run build

  # Copier le build dans le dossier servi par Nginx
  rsync -a --delete "$FRONTEND_DIR/dist/" "$DIST_DIR/"
  chown -R www-data:www-data "$DIST_DIR"
  info "✅ Front-end déployé."
else
  warn "Variable REPO_FRONTEND non configurée — front-end ignoré."
  warn "Déployez manuellement votre build dans : $DIST_DIR"
fi

# ═══════════════════════════════════════════════════════════════
# PHASE 3 : Vérifications finales
# ═══════════════════════════════════════════════════════════════
info "--- Phase 3 : Vérifications ---"

nginx -t && systemctl reload nginx
info "✅ Nginx OK"

sleep 2
if curl -sf "http://localhost:3000/health" > /dev/null; then
  info "✅ API répond sur localhost:3000"
else
  error "❌ L'API ne répond pas ! Vérifiez : sudo -u $APP_USER pm2 logs dari-api"
fi

info ""
info "╔══════════════════════════════════════════════════════╗"
info "║        🎉 DÉPLOIEMENT DARI.TN RÉUSSI !              ║"
info "╠══════════════════════════════════════════════════════╣"
info "║  Site     : https://$DOMAIN                    ║"
info "║  API      : https://$API_DOMAIN              ║"
info "║  Santé    : https://$API_DOMAIN/health       ║"
info "║  PM2      : sudo -u $APP_USER pm2 status          ║"
info "║  Logs API : sudo -u $APP_USER pm2 logs dari-api   ║"
info "╚══════════════════════════════════════════════════════╝"
