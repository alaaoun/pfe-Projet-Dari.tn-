# Dari.tn — Back-end API

API REST Node.js + Express + PostgreSQL pour la plateforme immobilière Dari.tn (Tunisie).

---

## Stack technique

| Composant | Technologie |
|---|---|
| Runtime | Node.js 22 LTS |
| Framework | Express 4 |
| Base de données | PostgreSQL 16 |
| ORM | Sequelize 6 |
| Auth | JWT (access + refresh tokens) |
| Upload photos | Cloudinary |
| Process manager | PM2 (mode cluster) |
| Reverse proxy | Nginx |
| Serveur | OVH VPS Ubuntu 25.04 |

---

## Architecture du projet

```
dari-tn-backend/
├── src/
│   ├── server.js              # Point d'entrée
│   ├── app.js                 # Configuration Express
│   ├── config/
│   │   ├── database.js        # Connexion Sequelize/PostgreSQL
│   │   ├── migrate.js         # Script de migration SQL
│   │   └── seed.js            # Données initiales
│   ├── models/
│   │   └── index.js           # Modèles Sequelize + associations
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── listing.controller.js
│   │   ├── search.controller.js
│   │   ├── favorite.controller.js
│   │   ├── user.controller.js
│   │   ├── appointment.controller.js
│   │   ├── payment.controller.js
│   │   └── upload.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── listing.routes.js
│   │   ├── search.routes.js
│   │   ├── favorite.routes.js
│   │   ├── user.routes.js
│   │   ├── appointment.routes.js
│   │   ├── payment.routes.js
│   │   └── upload.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   └── utils/
│       ├── logger.js
│       ├── jwt.js
│       └── slugify.js
├── nginx/
│   └── dari.tn.conf           # Config Nginx complète
├── scripts/
│   ├── deploy.sh              # Script déploiement OVH
│   └── backup.sh              # Sauvegarde PostgreSQL
├── ecosystem.config.js        # Config PM2
├── .env.example
└── package.json
```

---

## Installation locale (développement)

```bash
# 1. Cloner le repo
git clone https://github.com/VOTRE_ORG/dari-tn-backend.git
cd dari-tn-backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# → Éditer .env avec vos valeurs

# 4. Créer la base de données PostgreSQL
createdb dari_tn
# ou : sudo -u postgres createdb dari_tn

# 5. Exécuter les migrations
node src/config/migrate.js

# 6. Insérer les données initiales
# Définir SEED_ADMIN_PASSWORD, SEED_AGENT_PASSWORD et SEED_USER_PASSWORD dans .env
node src/config/seed.js

# 7. Démarrer en mode dev
npm run dev
```

L'API sera accessible sur `http://localhost:3000`.

### Paiement Flouci des visites

Le formulaire de visite redirige le client vers Flouci. Le rendez-vous est
marque `paid` uniquement apres verification serveur du retour Flouci.
Configurer dans `.env` : `FLOUCI_APP_TOKEN`, `FLOUCI_APP_SECRET`,
`BACKEND_PUBLIC_URL`, `FRONTEND_URL` et `APPOINTMENT_FEE_TND`.
`BACKEND_PUBLIC_URL` doit etre accessible publiquement par Flouci pour le
callback. Le reversement automatique au proprietaire n'est pas active dans
cette version et doit etre valide avec l'offre marketplace de Flouci.

---

## Déploiement sur OVH VPS Ubuntu 25.04

### Prérequis
- VPS OVH avec Ubuntu 25.04 (accès root SSH)
- Domaine `dari.tn` avec DNS configurés vers l'IP du VPS
- Compte Cloudinary (gratuit)

### Étapes

```bash
# Sur le VPS, cloner le repo
git clone https://github.com/VOTRE_ORG/dari-tn-backend.git /tmp/dari-deploy
cd /tmp/dari-deploy

# Remplir le .env
cp .env.example .env
nano .env

# Lancer le déploiement complet (première fois)
sudo bash scripts/deploy.sh --fresh

# Mises à jour suivantes (sans réinstaller)
sudo bash scripts/deploy.sh
```

### Sauvegarde automatique

```bash
# Rendre le script exécutable
chmod +x scripts/backup.sh

# Ajouter au crontab (sauvegarde à 3h chaque nuit)
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/dari-tn/backend/scripts/backup.sh >> /var/log/dari-backup.log 2>&1") | crontab -
```

---

## Endpoints API

### Auth — `/api/auth`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | Non | Inscription |
| POST | `/login` | Non | Connexion |
| POST | `/refresh` | Non | Nouveau token |
| POST | `/logout` | Non | Déconnexion |
| GET | `/me` | Oui | Profil actuel |
| PUT | `/change-password` | Oui | Changer mot de passe |

### Annonces — `/api/listings`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | Opt. | Liste avec filtres |
| GET | `/:id` | Opt. | Détail (UUID ou slug) |
| POST | `/` | Oui | Créer une annonce |
| PUT | `/:id` | Oui | Modifier |
| DELETE | `/:id` | Oui | Supprimer |
| PATCH | `/:id/status` | Oui | Changer le statut |
| GET | `/user/me` | Oui | Mes annonces |
| POST | `/:id/message` | Non | Contacter l'annonceur |

**Filtres GET `/api/listings` :**
`transaction`, `property_type`, `city`, `governorate`, `min_price`, `max_price`, `min_surface`, `max_surface`, `rooms`, `is_new`, `is_furnished`, `has_parking`, `has_pool`, `sort`, `order`, `page`, `limit`

### Recherche — `/api/search`

| Méthode | Route | Description |
|---|---|---|
| GET | `/?q=tunis appartement` | Recherche full-text |
| GET | `/suggest?q=tu` | Auto-complétion |
| GET | `/map-stats` | Stats par ville pour carte |

### Favoris — `/api/favorites`

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Mes favoris |
| POST | `/:listingId` | Toggle favori |

### Utilisateurs — `/api/users`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Oui | Mon profil |
| PUT | `/profile` | Oui | Modifier profil |
| GET | `/:id/listings` | Non | Annonces d'un agent |
| GET | `/` | Admin | Liste utilisateurs |
| PATCH | `/:id/status` | Admin | Activer/désactiver |

### Upload — `/api/upload`

| Méthode | Route | Description |
|---|---|---|
| POST | `/listings/:id/images` | Upload photos (multipart) |
| DELETE | `/images/:imageId` | Supprimer une photo |
| PATCH | `/images/:imageId/cover` | Définir la couverture |

### Rendez-vous — `/api/appointments`

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | Oui | Créer un rendez-vous de visite |
| GET | `/me` | Oui | Lister mes rendez-vous |
| GET | `/agent` | Agent/Admin | Lister les rendez-vous reçus |
| PATCH | `/:id/status` | Oui | Mettre à jour le statut |
| PATCH | `/:id/cancel` | Oui | Annuler un rendez-vous |

**Logique métier du module rendez-vous :**
- le champ propriétaire de `Listing` utilisé par le module est `user_id` ;
- un rendez-vous relie une annonce, un demandeur et l’agent propriétaire ;
- le module réutilise le middleware JWT existant via `../middlewares/auth.middleware` ;
- les rôles exploitables sont `user`, `agent` et `admin`.

---

## Commandes PM2 utiles

```bash
# Statut des processus
pm2 status

# Logs en temps réel
pm2 logs dari-api

# Redémarrer
pm2 restart dari-api

# Recharger sans downtime (graceful reload)
pm2 reload dari-api

# Monitoring CPU/RAM
pm2 monit
```

---

## Variables d'environnement

Voir `.env.example` pour la liste complète. Variables critiques :

- `DB_PASSWORD` : mot de passe PostgreSQL (fort)
- `JWT_SECRET` : secret JWT (64+ caractères aléatoires)
- `JWT_REFRESH_SECRET` : secret refresh token (différent du JWT_SECRET)
- `CLOUDINARY_*` : identifiants Cloudinary pour les photos

---

## Sécurité

- HTTPS obligatoire (Let's Encrypt via Certbot)
- Rate limiting sur toutes les routes (global + auth)
- Helmet.js (headers sécurisés)
- BCrypt (hash des mots de passe, salt 12)
- Rotation des refresh tokens
- Fail2ban (protection SSH + Nginx)
- UFW (pare-feu : ports 22, 80, 443 seulement)
- Validation stricte de toutes les entrées (express-validator)
