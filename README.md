# customApps

Plateforme centrale de gestion des licences, clients et branding pour customSales.

## Architecture

```
customapps/
├── src/            # API Node.js/Express (port 3500)
├── prisma/         # Schema + migrations + seed MariaDB
├── dashboard/      # Dashboard admin (React + Vite + Tailwind)
├── website/        # Site vitrine (Astro + Tailwind)
├── keys/           # Clés RSA pour signature JWT licences
└── docker-compose.yml
```

## Services & domaines

| Service   | Domaine               | Description                        |
|-----------|------------------------|------------------------------------|
| api       | api.${DOMAIN}          | API REST (licences, admin, contact)|
| dashboard | admin.${DOMAIN}        | Dashboard admin React              |
| website   | ${DOMAIN}              | Site vitrine Astro                 |
| db        | interne (dbnet)        | MariaDB 11                         |

Le domaine est configurable via la variable `DOMAIN` dans `.env` (par defaut : `customapps.fr`).

## Installation sur le VPS

### Prérequis

- Docker + Docker Compose
- Traefik configuré avec le réseau `traefik` et le certresolver `letsencrypt`
- Stack MariaDB existant accessible via le réseau `dbtesting` (host: `db`)

### 1. Cloner et configurer

```bash
git clone <repo-url> customapps
cd customapps
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
nano .env
```

Adapter les variables :

```env
# Base de données (host = db sur le réseau dbtesting)
DATABASE_URL="mysql://customapps:MOT_DE_PASSE@db:3306/customapps_central"

# Domaine
DOMAIN=customapps.fr

# Serveur
PORT=3500
NODE_ENV=production

# Secret JWT admin (générer avec: openssl rand -hex 32)
ADMIN_JWT_SECRET="votre-secret-aleatoire"

# Clés RSA licence
LICENSE_PRIVATE_KEY_PATH="./keys/private.pem"
LICENSE_PUBLIC_KEY_PATH="./keys/public.pem"
```

### 3. Créer la base dans le stack MariaDB existant

```bash
docker exec -it db mariadb -u root -p -e "
  CREATE DATABASE IF NOT EXISTS customapps_central;
  CREATE USER IF NOT EXISTS 'customapps'@'%' IDENTIFIED BY 'MOT_DE_PASSE';
  GRANT ALL ON customapps_central.* TO 'customapps'@'%';
  FLUSH PRIVILEGES;
"
```

### 4. Générer les clés RSA (première installation uniquement)

```bash
# Installer les dépendances localement pour le script
npm install
node src/utils/generateKeys.js
```

Les fichiers `keys/private.pem` et `keys/public.pem` sont créés.
Le fichier `public.pem` sera aussi embarqué dans l'app mobile pour la vérification offline.

### 5. Lancer les services

```bash
docker compose up -d --build
```

### 6. Exécuter les migrations et le seed

```bash
# Migration de la base
docker exec customapps-api npx prisma migrate deploy

# Seed (admin + premier client Maurer)
docker exec customapps-api node prisma/seed.js
```

Identifiants admin par défaut :
- Email : `admin@customapps.fr`
- Mot de passe : `admin123`
- Code licence Maurer : `SS-MAUR-INIT-0001`

### 7. Vérifier

```bash
# Health check
curl https://api.customapps.fr/api/health

# Dashboard
open https://admin.customapps.fr

# Site vitrine
open https://customapps.fr
```

## Développement local

```bash
# Installer les dépendances
npm install

# Lancer MariaDB (ou utiliser une instance existante)
docker compose up db -d

# Adapter DATABASE_URL dans .env pour pointer vers localhost:3306

# Migrations
npx prisma migrate dev

# Seed
node prisma/seed.js

# Lancer l'API
npm run dev

# Lancer le dashboard (dans un autre terminal)
cd dashboard && npm run dev

# Lancer le site vitrine (dans un autre terminal)
cd website && npm run dev
```

## Commandes utiles

```bash
# Voir les logs
docker compose logs -f api

# Relancer après modification
docker compose up -d --build api

# Ouvrir Prisma Studio (exploration de la base)
npx prisma studio

# Créer une nouvelle migration
npx prisma migrate dev --name description_changement
```

## API Endpoints

### Publics (app mobile)
- `POST /api/licenses/activate` — activer une licence
- `POST /api/licenses/heartbeat` — rafraîchir le token
- `GET  /api/licenses/config` — récupérer la config branding

### Publics (site vitrine)
- `POST /api/contact` — envoyer une demande de contact/démo

### Admin (JWT requis)
- `POST /api/admin/auth/login` — connexion admin
- `CRUD /api/admin/companies` — gestion entreprises
- `CRUD /api/admin/licenses` — gestion licences
- `POST /api/admin/licenses/:id/revoke` — révoquer
- `POST /api/admin/licenses/:id/renew` — renouveler
- `GET  /api/admin/analytics/overview` — KPIs
- `GET  /api/admin/analytics/usage` — usage
- `GET  /api/admin/contacts` — demandes de contact
