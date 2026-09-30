# 🚀 Dari.tn — Configuration locale (Windows)

## ⚠️ Prérequis OBLIGATOIRES

Avant de continuer, vous **DEVEZ** avoir installé :

1. **Node.js 22 LTS** → [https://nodejs.org](https://nodejs.org)
   - ✅ Vérifié (vous avez npm 9.9.4, Node v22.14.0)

2. **PostgreSQL 16** → [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - ❌ **À INSTALLER** (non trouvé sur votre machine)

---

## 📥 Installation de PostgreSQL

### Option 1 : Installation automatique (recommandée)

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\21652\Downloads\dari-tn-fullstack-20260605T175113Z-3-001\install_postgres.ps1"
```

L'installateur téléchargera et lancera PostgreSQL 16.

**Paramètres à retenir :**
- Port : `5432` (par défaut)
- Choisissez un mot de passe PostgreSQL fort et unique pendant l'installation.

### Option 2 : Installation manuelle

1. Allez sur https://www.postgresql.org/download/windows/
2. Téléchargez **PostgreSQL 16 LTS**
3. Lancez l'installateur `.exe`
4. Suivez les étapes (port 5432, mot de passe libre)
5. **Redémarrez Windows** après installation

---

## ✅ Configuration après PostgreSQL

Une fois PostgreSQL installé, exécutez :

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\21652\Downloads\dari-tn-fullstack-20260605T175113Z-3-001\setup_local.ps1"
```

Ce script automatisera :
- ✅ Vérification de PostgreSQL
- ✅ Création de la base de données `dari_tn`
- ✅ Exécution des migrations
- ✅ Insertion des données de test

---

## 🚀 Lancer l'application

### Terminal 1 : Backend (API)

```powershell
cd "C:\Users\21652\Downloads\dari-tn-fullstack-20260605T175113Z-3-001\dari-tn-fullstack\dari-tn-backend"
npm run dev
```

Vous devez voir :
```
✅ Connexion PostgreSQL établie
✅ Modèles synchronisés (dev)
🚀 Dari.tn API démarrée sur le port 3000
```

### Terminal 2 : Frontend (Interface)

```powershell
cd "C:\Users\21652\Downloads\dari-tn-fullstack-20260605T175113Z-3-001\dari-tn-fullstack\dari-tn-frontend"
npm run dev
```

Vous devez voir :
```
VITE v5.4.8  ready in 234 ms
➜  Local:   http://localhost:5173/
```

---

## 🌐 Accès à l'application

**URL** : http://localhost:5173

### Comptes initiaux

Avant d'exécuter le seed, définissez `SEED_ADMIN_PASSWORD`, `SEED_AGENT_PASSWORD` et `SEED_USER_PASSWORD` dans le fichier `.env` du backend. Choisissez des mots de passe uniques et ne les partagez pas.

---

## 🛠️ Commandes utiles

### Backend

```powershell
# Dev (hot reload)
npm run dev

# Logs
pm2 logs (si vous utilisez PM2)

# Vérifier la santé
curl http://localhost:3000/health
```

### Frontend

```powershell
# Dev (Vite hot reload)
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

---

## 🐛 Dépannage

### ❌ "PostgreSQL command not found"

**Solution** : Installez PostgreSQL via l'option automatique ou manuelle ci-dessus.

### ❌ "Port 3000 déjà utilisé"

**Solution** : Changez le port dans `dari-tn-backend/.env`
```dotenv
PORT=3001
```
Et mettez à jour le frontend `.env` :
```dotenv
VITE_API_URL=http://localhost:3001
```

### ❌ "npm ERR! ERESOLVE unable to resolve dependency tree"

**Solution** : Le problème a été résolu avec `--legacy-peer-deps`. Les dépendances sont déjà installées.

### ❌ "Cannot connect to database"

**Solution** : Vérifiez que PostgreSQL tourne :
```powershell
Get-Service postgresql-* | Select-Object Name, Status
```

Si l'état est "Stopped", redémarrez :
```powershell
Start-Service "postgresql-x64-16"
```

---

## 📁 Structure du projet

```
C:\Users\21652\Downloads\dari-tn-fullstack\
├── dari-tn-backend/
│   ├── .env              ← Configuré pour dev local
│   ├── src/
│   ├── package.json
│   └── ...
└── dari-tn-frontend/
    ├── .env              ← Configuré pour dev local
    ├── src/
    ├── package.json
    └── ...
```

---

## ✨ Prochaines étapes

1. **Installer PostgreSQL** (si pas fait)
2. **Lancer le script `setup_local.ps1`**
3. **Ouvrir 2 terminaux** pour backend + frontend
4. **Accéder à http://localhost:5173**
5. **Tester avec `admin@dari.tn`**

---

**Besoin d'aide ?** Vérifiez que :
- ✅ Node.js 22+ est installé
- ✅ PostgreSQL 16 est installé et running
- ✅ Les ports 3000 et 5173 sont libres
