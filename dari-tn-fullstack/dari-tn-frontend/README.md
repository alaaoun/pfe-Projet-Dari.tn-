# Dari.tn — Front-end

Application React + Vite pour la plateforme immobilière Dari.tn.

---

## Stack technique

| Composant | Technologie |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Router | React Router v6 |
| Data fetching | React Query v3 |
| HTTP client | Axios (+ intercepteurs JWT auto-refresh) |
| State global | Zustand (persisté localStorage) |
| Formulaires | React Hook Form |
| Carte | Leaflet + React Leaflet |
| Notifications | React Hot Toast |
| Styles | CSS Modules |

---

## Architecture

```
src/
├── api/
│   ├── client.js          # Axios + intercepteurs JWT + auto-refresh
│   ├── auth.api.js        # Endpoints auth
│   └── listings.api.js    # Endpoints annonces, favoris, upload
├── components/
│   ├── common/            # Button, Spinner
│   ├── layout/            # Navbar, Footer, Layout
│   ├── listings/          # ListingCard, SearchFilters, ListingForm
│   └── map/               # MapView (Leaflet)
├── hooks/
│   ├── useListings.js     # React Query hooks annonces
│   └── useAuth.js         # React Query hooks auth
├── pages/
│   ├── HomePage.jsx       # Accueil avec hero + recherche
│   ├── SearchPage.jsx     # Recherche avec carte + filtres
│   ├── ListingPage.jsx    # Détail annonce
│   ├── NewListingPage.jsx # Publication annonce
│   ├── EditListingPage.jsx# Modification annonce
│   ├── FavoritesPage.jsx  # Favoris utilisateur
│   ├── ProfilePage.jsx    # Profil + mes annonces + sécurité
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── NotFoundPage.jsx
├── store/
│   └── auth.store.js      # Zustand store (token, user)
├── styles/
│   └── global.css         # Design system + variables CSS
└── utils/
    └── format.js          # formatPrice, formatDate, gouvernorats
```

---

## Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → Éditer VITE_API_URL pour pointer vers votre back-end

# 3. Démarrer le serveur de dev
npm run dev
# → http://localhost:5173

# 4. Build de production
npm run build
# → Génère dist/ à déployer
```

---

## Variables d'environnement

```bash
VITE_API_URL=https://api.dari.tn   # URL du back-end
VITE_APP_NAME=Dari.tn
```

En développement, le proxy Vite redirige automatiquement `/api/*` vers `localhost:3000`.

---

## Fonctionnalités

- **Accueil** : Hero avec recherche, statistiques, types de biens, annonces populaires
- **Recherche** : Vue liste / carte / split, filtres avancés, pagination
- **Carte interactive** : Leaflet + OpenStreetMap, pins de prix par bien
- **Détail annonce** : Galerie photos, infos complètes, formulaire de contact
- **Authentification** : Inscription, connexion, refresh token automatique
- **Favoris** : Toggle favoris, page de gestion
- **Profil** : Gestion annonces, modification profil, changement mot de passe
- **Publication** : Formulaire complet avec upload photos (Cloudinary)
- **Responsive** : Mobile-first, adapté tablette et desktop

---

## Déploiement (OVH VPS)

Le script `../dari-tn-backend/scripts/deploy.sh` gère le build et le déploiement automatiquement :

```bash
# Build manuel
npm run build

# Copier dans le dossier Nginx
rsync -a --delete dist/ /var/www/dari-tn/dist/
```

Nginx sert les fichiers statiques depuis `/var/www/dari-tn/dist` (voir `../dari-tn-backend/nginx/dari.tn.conf`).
