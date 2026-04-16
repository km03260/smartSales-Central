/**
 * Migration : License (1-base) → License (N-bases via LicenseDatabase)
 *
 * USAGE
 * =====
 * 1. BACKUP (avant changement de schéma) — sauvegarde les licences actuelles
 *    et leur SyncServiceConfig dans un fichier JSON :
 *      node prisma/migrate-licenses-to-multibase.js backup
 *
 * 2. Changer de schéma (schema.prisma déjà modifié) :
 *      npx prisma db push --accept-data-loss
 *    ou en prod :
 *      npx prisma migrate deploy
 *
 * 3. RESTORE — recharge les données dans la nouvelle structure
 *    (LicenseDatabase créé pour chaque License) :
 *      node prisma/migrate-licenses-to-multibase.js restore
 *
 * Le fichier JSON intermédiaire (licenses-backup.json) peut être supprimé
 * après restauration réussie.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_FILE = join(__dirname, 'licenses-backup.json');

const prisma = new PrismaClient();

async function backup() {
  console.log('→ Backup des licences existantes…');

  // $queryRawUnsafe pour contourner le schéma Prisma actuel (qui ne connaît plus databaseName / syncServiceConfig)
  const licenses = await prisma.$queryRawUnsafe(`
    SELECT
      l.id, l.databaseName,
      c.id AS syncConfigId, c.sqlHost, c.sqlUser, c.sqlPassword, c.clientsDiversTircode
    FROM licenses l
    LEFT JOIN sync_service_configs c ON c.licenseId = l.id
  `);

  writeFileSync(BACKUP_FILE, JSON.stringify(licenses, null, 2));
  console.log(`✓ ${licenses.length} licences sauvegardées dans ${BACKUP_FILE}`);
  console.log('→ Tu peux maintenant lancer : npx prisma db push --accept-data-loss');
}

async function restore() {
  if (!existsSync(BACKUP_FILE)) {
    console.error(`✗ Fichier ${BACKUP_FILE} introuvable. Lance d'abord 'backup'.`);
    process.exit(1);
  }

  const licenses = JSON.parse(readFileSync(BACKUP_FILE, 'utf-8'));
  console.log(`→ Restore : ${licenses.length} licences à migrer…`);

  let created = 0;
  for (const l of licenses) {
    if (!l.databaseName) {
      console.warn(`  · License ${l.id} — pas de databaseName, skip`);
      continue;
    }

    try {
      await prisma.licenseDatabase.create({
        data: {
          licenseId: l.id,
          name: l.databaseName,
          label: l.databaseName,
          isDefault: true,
          sqlHost: l.sqlHost || null,
          sqlUser: l.sqlUser || null,
          sqlPassword: l.sqlPassword || null,
          clientsDiversTircode: l.clientsDiversTircode || '',
        },
      });
      created++;
      console.log(`  ✓ License ${l.id} → base '${l.databaseName}'`);
    } catch (err) {
      console.error(`  ✗ License ${l.id} : ${err.message}`);
    }
  }

  console.log(`\n✓ Terminé : ${created}/${licenses.length} bases créées.`);
  console.log(`  Fichier ${BACKUP_FILE} peut être supprimé.`);
}

const cmd = process.argv[2];
if (cmd === 'backup') {
  await backup();
} else if (cmd === 'restore') {
  await restore();
} else {
  console.error('Usage: node prisma/migrate-licenses-to-multibase.js [backup|restore]');
  process.exit(1);
}

await prisma.$disconnect();
