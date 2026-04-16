/**
 * Migration : LicenseDatabase (plat) → LicenseSqlInstance + LicenseDatabase (hiérarchique)
 *
 * USAGE
 * =====
 * 1. BACKUP (avant db push) — sauvegarde les bases actuelles + leurs overrides SQL :
 *      node prisma/migrate-licenses-to-instances.js backup
 *
 * 2. Changer de schéma :
 *      npx prisma db push --accept-data-loss
 *
 * 3. RESTORE — recrée les instances + bases :
 *      node prisma/migrate-licenses-to-instances.js restore
 *
 * Logique de restore :
 *  - Pour chaque licence, on regroupe les anciennes bases par (sqlHost, sqlUser, sqlPassword).
 *  - Chaque groupe devient 1 LicenseSqlInstance.
 *  - La key de l'instance est dérivée de sqlHost ou "DEFAULT" si hérité.
 *  - isDefault de l'instance = true pour la 1ère créée.
 *  - isDefault de chaque base = valeur d'origine.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_FILE = join(__dirname, 'databases-backup.json');

const prisma = new PrismaClient();

async function backup() {
  console.log('→ Backup des bases existantes…');

  // $queryRawUnsafe : lit l'ancienne structure (licenseId sur license_databases) même si le client Prisma a déjà été régénéré
  const rows = await prisma.$queryRawUnsafe(`
    SELECT id, licenseId, name, label, isDefault, sqlHost, sqlUser, sqlPassword, clientsDiversTircode
    FROM license_databases
    ORDER BY licenseId, createdAt
  `);

  writeFileSync(BACKUP_FILE, JSON.stringify(rows, null, 2));
  console.log(`✓ ${rows.length} bases sauvegardées dans ${BACKUP_FILE}`);
  console.log('→ Tu peux maintenant lancer : npx prisma db push --accept-data-loss');
}

function slugFromHost(host) {
  if (!host) return 'DEFAULT';
  return String(host)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || 'DEFAULT';
}

async function restore() {
  if (!existsSync(BACKUP_FILE)) {
    console.error(`✗ Fichier ${BACKUP_FILE} introuvable. Lance d'abord 'backup'.`);
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(BACKUP_FILE, 'utf-8'));
  console.log(`→ Restore : ${rows.length} bases à migrer…`);

  // Regrouper par licenseId
  const byLicense = {};
  for (const r of rows) {
    if (!byLicense[r.licenseId]) byLicense[r.licenseId] = [];
    byLicense[r.licenseId].push(r);
  }

  let instancesCreated = 0;
  let dbsCreated = 0;

  for (const [licenseId, dbs] of Object.entries(byLicense)) {
    // Regrouper par signature SQL (host, user, password)
    const groups = {};
    for (const db of dbs) {
      const sig = `${db.sqlHost || ''}|${db.sqlUser || ''}|${db.sqlPassword || ''}`;
      if (!groups[sig]) {
        groups[sig] = {
          sqlHost: db.sqlHost || null,
          sqlUser: db.sqlUser || null,
          sqlPassword: db.sqlPassword || null,
          databases: [],
        };
      }
      groups[sig].databases.push(db);
    }

    const groupKeys = Object.keys(groups);
    const usedInstanceKeys = new Set();
    let isFirstInstance = true;

    for (const sig of groupKeys) {
      const g = groups[sig];
      // Générer un slug unique pour cette instance au sein de la licence
      let baseKey = slugFromHost(g.sqlHost);
      let key = baseKey;
      let suffix = 1;
      while (usedInstanceKeys.has(key)) {
        suffix++;
        key = `${baseKey}_${suffix}`;
      }
      usedInstanceKeys.add(key);

      try {
        const instance = await prisma.licenseSqlInstance.create({
          data: {
            licenseId,
            key,
            label: g.sqlHost || 'Par défaut',
            isDefault: isFirstInstance,
            sqlHost: g.sqlHost,
            sqlUser: g.sqlUser,
            sqlPassword: g.sqlPassword,
          },
        });
        instancesCreated++;
        console.log(`  ✓ Licence ${licenseId} → instance '${key}' (${g.databases.length} base(s))`);

        // Créer les bases de cette instance
        for (const db of g.databases) {
          await prisma.licenseDatabase.create({
            data: {
              instanceId: instance.id,
              name: db.name,
              label: db.label || db.name,
              isDefault: !!db.isDefault,
              clientsDiversTircode: db.clientsDiversTircode || '',
            },
          });
          dbsCreated++;
          console.log(`    · base '${db.name}' ${db.isDefault ? '★' : ''}`);
        }
      } catch (err) {
        console.error(`  ✗ Licence ${licenseId} / instance '${key}' : ${err.message}`);
      }

      isFirstInstance = false;
    }
  }

  console.log(`\n✓ Terminé : ${instancesCreated} instance(s) et ${dbsCreated} base(s) créées.`);
  console.log(`  Fichier ${BACKUP_FILE} peut être supprimé.`);
}

const cmd = process.argv[2];
if (cmd === 'backup') {
  await backup();
} else if (cmd === 'restore') {
  await restore();
} else {
  console.error('Usage: node prisma/migrate-licenses-to-instances.js [backup|restore]');
  process.exit(1);
}

await prisma.$disconnect();
