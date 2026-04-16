import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateLicenseKey } from '../../services/licenseService.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/licenses
 * Liste toutes les licences avec infos entreprise.
 */
router.get('/', async (req, res) => {
  try {
    const { appId } = req.query;
    const licenses = await prisma.license.findMany({
      where: appId ? { appId } : undefined,
      include: {
        app: { select: { id: true, code: true, name: true } },
        company: { select: { id: true, name: true, legalName: true } },
        _count: { select: { devices: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(licenses.map(l => ({
      ...l,
      activeDevices: l._count.devices,
      _count: undefined,
    })));
  } catch (error) {
    console.error('[LICENSES:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/licenses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id: req.params.id },
      include: {
        app: { select: { id: true, code: true, name: true } },
        company: true,
        deployment: { select: { id: true, name: true, publicUrl: true } },
        databases: { orderBy: { createdAt: 'asc' } },
        devices: { orderBy: { lastHeartbeat: 'desc' } },
      },
    });

    if (!license) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    res.json(license);
  } catch (error) {
    console.error('[LICENSES:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses
 * Body: { appId, companyId, deploymentId, maxDevices?, features?, plan?, expiresAt,
 *         databases?: [{ name, label?, isDefault?, ... }] }
 *
 * - Unicité : 1 seule licence par (appId, companyId).
 * - deploymentId obligatoire : URLs + apiKey héritées du déploiement.
 * - databases est optionnel : tu peux créer la licence nue puis ajouter les bases après.
 */
router.post('/', async (req, res) => {
  try {
    const {
      appId, companyId, deploymentId,
      maxDevices, features, plan, expiresAt,
      databases,
    } = req.body;

    if (!appId || !companyId || !deploymentId || !expiresAt) {
      return res.status(400).json({ error: 'appId, companyId, deploymentId et expiresAt requis' });
    }

    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (!app) return res.status(404).json({ error: 'Application non trouvée' });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: 'Entreprise non trouvée' });

    const deployment = await prisma.syncServiceDeployment.findUnique({ where: { id: deploymentId } });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });
    if (deployment.companyId !== companyId) {
      return res.status(400).json({ error: 'Le déploiement appartient à une autre entreprise' });
    }

    // Unicité (appId, companyId)
    const existing = await prisma.license.findUnique({
      where: { appId_companyId: { appId, companyId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Une licence existe déjà pour cette application et ce client' });
    }

    const license = await prisma.license.create({
      data: {
        appId,
        companyId,
        deploymentId,
        licenseKey: generateLicenseKey(app.code),
        maxDevices: maxDevices || 5,
        features: features || ['orders', 'quotations', 'invoices'],
        plan: plan || 'professional',
        expiresAt: new Date(expiresAt),
        ...(Array.isArray(databases) && databases.length > 0 && {
          databases: {
            create: databases.map((d, i) => ({
              name: d.name,
              label: d.label || d.name,
              isDefault: d.isDefault ?? (i === 0),
              sqlHost: d.sqlHost || null,
              sqlUser: d.sqlUser || null,
              sqlPassword: d.sqlPassword || null,
              clientsDiversTircode: d.clientsDiversTircode || '',
            })),
          },
        }),
      },
      include: {
        app: { select: { code: true, name: true } },
        company: { select: { name: true } },
        databases: true,
      },
    });

    res.status(201).json(license);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Conflit d\'unicité (app+client ou base déjà existante)' });
    }
    console.error('[LICENSES:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/licenses/:id
 * Les bases (databases) se gèrent via les routes /databases dédiées ci-dessous.
 * deploymentId est obligatoire — il ne peut plus être mis à null.
 */
router.put('/:id', async (req, res) => {
  try {
    const { deploymentId, maxDevices, features, plan, expiresAt, isActive } = req.body;

    if (deploymentId !== undefined) {
      if (!deploymentId) {
        return res.status(400).json({ error: 'deploymentId ne peut pas être vide' });
      }
      const current = await prisma.license.findUnique({ where: { id: req.params.id }, select: { companyId: true } });
      const deployment = await prisma.syncServiceDeployment.findUnique({ where: { id: deploymentId } });
      if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });
      if (current && deployment.companyId !== current.companyId) {
        return res.status(400).json({ error: 'Le déploiement appartient à une autre entreprise' });
      }
    }

    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: {
        ...(deploymentId !== undefined && { deploymentId }),
        ...(maxDevices !== undefined && { maxDevices }),
        ...(features !== undefined && { features }),
        ...(plan !== undefined && { plan }),
        ...(expiresAt !== undefined && { expiresAt: new Date(expiresAt) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { company: { select: { name: true } } },
    });

    res.json(license);
  } catch (error) {
    console.error('[LICENSES:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:id/revoke
 * Désactive une licence et tous ses appareils.
 */
router.post('/:id/revoke', async (req, res) => {
  try {
    const licenseId = req.params.id;

    await prisma.$transaction([
      prisma.license.update({
        where: { id: licenseId },
        data: { isActive: false },
      }),
      prisma.deviceActivation.updateMany({
        where: { licenseId },
        data: { isActive: false },
      }),
    ]);

    res.json({ success: true, message: 'Licence révoquée' });
  } catch (error) {
    console.error('[LICENSES:REVOKE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:id/renew
 * Body: { expiresAt }
 */
router.post('/:id/renew', async (req, res) => {
  try {
    const { expiresAt } = req.body;

    if (!expiresAt) {
      return res.status(400).json({ error: 'expiresAt requis' });
    }

    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: {
        expiresAt: new Date(expiresAt),
        isActive: true,
      },
      include: { company: { select: { name: true } } },
    });

    res.json(license);
  } catch (error) {
    console.error('[LICENSES:RENEW]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/licenses/:id/devices
 */
router.get('/:id/devices', async (req, res) => {
  try {
    const devices = await prisma.deviceActivation.findMany({
      where: { licenseId: req.params.id },
      orderBy: { lastHeartbeat: 'desc' },
    });

    res.json(devices);
  } catch (error) {
    console.error('[LICENSES:DEVICES]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:licenseId/devices/:deviceId/deactivate
 */
router.post('/:licenseId/devices/:deviceId/deactivate', async (req, res) => {
  try {
    await prisma.deviceActivation.updateMany({
      where: {
        licenseId: req.params.licenseId,
        deviceId: req.params.deviceId,
      },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[DEVICES:DEACTIVATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:id/block
 * Bloque une licence (l'app mobile sera bloquée au prochain heartbeat).
 */
router.post('/:id/block', async (req, res) => {
  try {
    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: { isBlocked: true },
      include: { company: { select: { name: true } } },
    });
    res.json({ success: true, message: 'Licence bloquée', license });
  } catch (error) {
    console.error('[LICENSES:BLOCK]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:id/unblock
 * Débloque une licence.
 */
router.post('/:id/unblock', async (req, res) => {
  try {
    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: { isBlocked: false },
      include: { company: { select: { name: true } } },
    });
    res.json({ success: true, message: 'Licence débloquée', license });
  } catch (error) {
    console.error('[LICENSES:UNBLOCK]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Bases WaveSoft de la licence (N-1 avec License) ─────────────────────
// Chaque base peut être sur une instance SQL différente (overrides SQL),
// a son propre Tircode "Clients divers", et un flag isDefault (1 max par licence).

const DATABASE_FIELDS = [
  'name', 'label', 'isDefault',
  'sqlHost', 'sqlUser', 'sqlPassword',
  'clientsDiversTircode',
];

function pickDatabase(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => DATABASE_FIELDS.includes(k))
  );
}

/**
 * S'assure qu'il n'y ait qu'une seule base isDefault par licence.
 */
async function enforceSingleDefault(licenseId, exceptDatabaseId = null) {
  await prisma.licenseDatabase.updateMany({
    where: {
      licenseId,
      isDefault: true,
      ...(exceptDatabaseId && { NOT: { id: exceptDatabaseId } }),
    },
    data: { isDefault: false },
  });
}

/**
 * GET /api/admin/licenses/:id/databases
 */
router.get('/:id/databases', async (req, res) => {
  try {
    const databases = await prisma.licenseDatabase.findMany({
      where: { licenseId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(databases);
  } catch (error) {
    console.error('[LICENSES:DATABASES:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:id/databases
 * Body: { name, label?, isDefault?, sqlHost?, sqlUser?, sqlPassword?, clientsDiversTircode? }
 */
router.post('/:id/databases', async (req, res) => {
  try {
    const licenseId = req.params.id;
    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) return res.status(404).json({ error: 'Licence non trouvée' });

    const data = pickDatabase(req.body);
    if (!data.name) return res.status(400).json({ error: 'name requis' });

    // Premier ajout → forcer isDefault à true
    const existingCount = await prisma.licenseDatabase.count({ where: { licenseId } });
    if (existingCount === 0) data.isDefault = true;

    const created = await prisma.licenseDatabase.create({
      data: { licenseId, ...data, label: data.label || data.name },
    });

    if (created.isDefault) {
      await enforceSingleDefault(licenseId, created.id);
    }

    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une base porte déjà ce nom pour cette licence' });
    }
    console.error('[LICENSES:DATABASES:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/licenses/:licenseId/databases/:databaseId
 */
router.put('/:licenseId/databases/:databaseId', async (req, res) => {
  try {
    const { licenseId, databaseId } = req.params;
    const data = pickDatabase(req.body);

    const updated = await prisma.licenseDatabase.update({
      where: { id: databaseId },
      data,
    });

    if (updated.licenseId !== licenseId) {
      return res.status(400).json({ error: 'La base ne fait pas partie de cette licence' });
    }

    if (data.isDefault === true) {
      await enforceSingleDefault(licenseId, databaseId);
    }

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une base porte déjà ce nom pour cette licence' });
    }
    console.error('[LICENSES:DATABASES:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/licenses/:licenseId/databases/:databaseId
 */
router.delete('/:licenseId/databases/:databaseId', async (req, res) => {
  try {
    const { licenseId, databaseId } = req.params;

    const db = await prisma.licenseDatabase.findUnique({ where: { id: databaseId } });
    if (!db || db.licenseId !== licenseId) {
      return res.status(404).json({ error: 'Base non trouvée' });
    }

    await prisma.licenseDatabase.delete({ where: { id: databaseId } });

    // Si on vient de supprimer la base par défaut, en promouvoir une autre
    if (db.isDefault) {
      const remaining = await prisma.licenseDatabase.findFirst({
        where: { licenseId },
        orderBy: { createdAt: 'asc' },
      });
      if (remaining) {
        await prisma.licenseDatabase.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[LICENSES:DATABASES:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
