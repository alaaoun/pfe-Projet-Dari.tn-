-- Créer l'utilisateur si nécessaire
\prompt -s 'Mot de passe fort pour le role dari_user: ' dari_password
SELECT format('CREATE USER dari_user WITH PASSWORD %L', :'dari_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dari_user')\gexec

-- Créer la base de données si nécessaire
SELECT 'CREATE DATABASE dari_tn OWNER dari_user'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'dari_tn')\gexec

-- S'assurer que le propriétaire est correct
ALTER DATABASE dari_tn OWNER TO dari_user;

-- Accorder les permissions
GRANT ALL PRIVILEGES ON DATABASE dari_tn TO dari_user;

-- Connecter à la base et créer les extensions
\c dari_tn
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Confirmer
\dt
