-- ============================================================
-- Rebranding : smartsales_central → customapps_central
-- User MariaDB : smartsales → customapps
-- ============================================================
--
-- USAGE (à exécuter avec un user root MariaDB qui a les droits CREATE DATABASE) :
--
--   docker exec -i db mariadb -u root -p < prisma/rename-db-to-customapps.sql
--
-- Ou bien :
--   docker exec -it db mariadb -u root -p
--   SOURCE /chemin/vers/rename-db-to-customapps.sql;
--
-- ⚠ ARRÊTER L'API avant d'exécuter :
--   docker stop customapps-api
--
-- MariaDB ne supporte pas RENAME DATABASE nativement.
-- On crée la nouvelle base, on déplace chaque table, puis on supprime l'ancienne.
-- ============================================================

-- 1. Créer la nouvelle base et le nouveau user
CREATE DATABASE IF NOT EXISTS customapps_central
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Remplace 'MOT_DE_PASSE' par le mot de passe actuel de l'ancien user smartsales
-- (pour conserver la même auth côté app). Garde-le identique à celui dans .env !
CREATE USER IF NOT EXISTS 'customapps'@'%' IDENTIFIED BY 'MOT_DE_PASSE';
GRANT ALL ON customapps_central.* TO 'customapps'@'%';
FLUSH PRIVILEGES;

-- 2. Déplacer toutes les tables de smartsales_central vers customapps_central
-- (RENAME TABLE est atomique et préserve toutes les données)
RENAME TABLE
  smartsales_central.admin_users              TO customapps_central.admin_users,
  smartsales_central.apps                     TO customapps_central.apps,
  smartsales_central.companies                TO customapps_central.companies,
  smartsales_central.company_configs          TO customapps_central.company_configs,
  smartsales_central.contact_requests         TO customapps_central.contact_requests,
  smartsales_central.device_activations       TO customapps_central.device_activations,
  smartsales_central.license_alerts           TO customapps_central.license_alerts,
  smartsales_central.license_databases        TO customapps_central.license_databases,
  smartsales_central.license_sql_instances    TO customapps_central.license_sql_instances,
  smartsales_central.licenses                 TO customapps_central.licenses,
  smartsales_central.sync_service_deployments TO customapps_central.sync_service_deployments,
  smartsales_central.usage_logs               TO customapps_central.usage_logs;

-- Prisma migrations (présente seulement si tu utilises prisma migrate, sinon supprime)
-- RENAME TABLE smartsales_central._prisma_migrations TO customapps_central._prisma_migrations;

-- 3. Supprimer l'ancienne base (vide à ce stade)
DROP DATABASE smartsales_central;

-- 4. Optionnel : révoquer et supprimer l'ancien user smartsales
-- REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'smartsales'@'%';
-- DROP USER 'smartsales'@'%';

-- 5. Vérifier
SHOW DATABASES LIKE 'customapps%';
USE customapps_central;
SHOW TABLES;
