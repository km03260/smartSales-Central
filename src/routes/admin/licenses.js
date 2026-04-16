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
        instances: {
          include: { databases: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        },
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
 * Body: { appId, companyId, deploymentId, maxDevices?, features?, plan?, expiresAt }
 *
 * Les instances et bases s'ajoutent ensuite via les routes dédiées.
 */
router.post('/', async (req, res) => {
  try {
    const {
      appId, companyId, deploymentId,
      maxDevices, features, plan, expiresAt,
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
      },
      include: {
        app: { select: { code: true, name: true } },
        company: { select: { name: true } },
      },
    });

    res.status(201).json(license);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une licence existe déjà pour cette application et ce client' });
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

// ─── Instances SQL & bases WaveSoft de la licence ─────────────────────────
// Hiérarchie : License ─ N instances ─ N bases (par instance).
// Chaque instance a ses credentials SQL propres (optionnels — sinon hérite du déploiement).
// Unicité :
//  - (licenseId, instance.key)   — slug instance unique au sein d'une licence
//  - (instanceId, database.name) — nom de base unique au sein d'une instance
//  - 1 seule instance isDefault par licence
//  - 1 seule base isDefault par instance

const INSTANCE_FIELDS = [
  'key', 'label', 'isDefault',
  'sqlHost', 'sqlUser', 'sqlPassword',
];
const DATABASE_FIELDS = [
  'name', 'label', 'isDefault',
  'clientsDiversTircode',
];

function pickInstance(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => INSTANCE_FIELDS.includes(k))
  );
}
function pickDatabase(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => DATABASE_FIELDS.includes(k))
  );
}

async function enforceSingleDefaultInstance(licenseId, exceptId = null) {
  await prisma.licenseSqlInstance.updateMany({
    where: {
      licenseId,
      isDefault: true,
      ...(exceptId && { NOT: { id: exceptId } }),
    },
    data: { isDefault: false },
  });
}

async function enforceSingleDefaultDatabase(instanceId, exceptId = null) {
  await prisma.licenseDatabase.updateMany({
    where: {
      instanceId,
      isDefault: true,
      ...(exceptId && { NOT: { id: exceptId } }),
    },
    data: { isDefault: false },
  });
}

/**
 * GET /api/admin/licenses/:id/instances
 */
router.get('/:id/instances', async (req, res) => {
  try {
    const instances = await prisma.licenseSqlInstance.findMany({
      where: { licenseId: req.params.id },
      include: { databases: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(instances);
  } catch (error) {
    console.error('[LICENSES:INSTANCES:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/licenses/:id/instances
 * Body: { key, label?, isDefault?, sqlHost?, sqlUser?, sqlPassword? }
 */
router.post('/:id/instances', async (req, res) => {
  try {
    const licenseId = req.params.id;
    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) return res.status(404).json({ error: 'Licence non trouvée' });

    const data = pickInstance(req.body);
    if (!data.key) return res.status(400).json({ error: 'key requis' });

    // Premier ajout → forcer isDefault à true
    const count = await prisma.licenseSqlInstance.count({ where: { licenseId } });
    if (count === 0) data.isDefault = true;

    const created = await prisma.licenseSqlInstance.create({
      data: { licenseId, ...data, label: data.label || data.key },
    });

    if (created.isDefault) {
      await enforceSingleDefaultInstance(licenseId, created.id);
    }

    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une instance porte déjà cette key pour cette licence' });
    }
    console.error('[LICENSES:INSTANCES:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/licenses/:licenseId/instances/:instanceId
 */
router.put('/:licenseId/instances/:instanceId', async (req, res) => {
  try {
    const { licenseId, instanceId } = req.params;
    const data = pickInstance(req.body);

    const existing = await prisma.licenseSqlInstance.findUnique({ where: { id: instanceId } });
    if (!existing || existing.licenseId !== licenseId) {
      return res.status(404).json({ error: 'Instance non trouvée' });
    }

    const updated = await prisma.licenseSqlInstance.update({
      where: { id: instanceId },
      data,
    });

    if (data.isDefault === true) {
      await enforceSingleDefaultInstance(licenseId, instanceId);
    }

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une instance porte déjà cette key' });
    }
    console.error('[LICENSES:INSTANCES:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/licenses/:licenseId/instances/:instanceId
 * Supprime l'instance ET ses bases (cascade).
 */
router.delete('/:licenseId/instances/:instanceId', async (req, res) => {
  try {
    const { licenseId, instanceId } = req.params;
    const existing = await prisma.licenseSqlInstance.findUnique({ where: { id: instanceId } });
    if (!existing || existing.licenseId !== licenseId) {
      return res.status(404).json({ error: 'Instance non trouvée' });
    }

    await prisma.licenseSqlInstance.delete({ where: { id: instanceId } });

    // Si on vient de supprimer l'instance par défaut, en promouvoir une autre
    if (existing.isDefault) {
      const remaining = await prisma.licenseSqlInstance.findFirst({
        where: { licenseId },
        orderBy: { createdAt: 'asc' },
      });
      if (remaining) {
        await prisma.licenseSqlInstance.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[LICENSES:INSTANCES:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Bases au sein d'une instance ───────────────────────────────────────

/**
 * POST /api/admin/licenses/:licenseId/instances/:instanceId/databases
 * Body: { name, label?, isDefault?, clientsDiversTircode? }
 */
router.post('/:licenseId/instances/:instanceId/databases', async (req, res) => {
  try {
    const { licenseId, instanceId } = req.params;
    const instance = await prisma.licenseSqlInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.licenseId !== licenseId) {
      return res.status(404).json({ error: 'Instance non trouvée' });
    }

    const data = pickDatabase(req.body);
    if (!data.name) return res.status(400).json({ error: 'name requis' });

    const count = await prisma.licenseDatabase.count({ where: { instanceId } });
    if (count === 0) data.isDefault = true;

    const created = await prisma.licenseDatabase.create({
      data: { instanceId, ...data, label: data.label || data.name },
    });

    if (created.isDefault) {
      await enforceSingleDefaultDatabase(instanceId, created.id);
    }

    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une base porte déjà ce nom pour cette instance' });
    }
    console.error('[LICENSES:DATABASES:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/licenses/:licenseId/instances/:instanceId/databases/:databaseId
 */
router.put('/:licenseId/instances/:instanceId/databases/:databaseId', async (req, res) => {
  try {
    const { licenseId, instanceId, databaseId } = req.params;
    const data = pickDatabase(req.body);

    const db = await prisma.licenseDatabase.findUnique({
      where: { id: databaseId },
      include: { instance: true },
    });
    if (!db || db.instanceId !== instanceId || db.instance.licenseId !== licenseId) {
      return res.status(404).json({ error: 'Base non trouvée' });
    }

    const updated = await prisma.licenseDatabase.update({
      where: { id: databaseId },
      data,
    });

    if (data.isDefault === true) {
      await enforceSingleDefaultDatabase(instanceId, databaseId);
    }

    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Une base porte déjà ce nom pour cette instance' });
    }
    console.error('[LICENSES:DATABASES:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/licenses/:licenseId/instances/:instanceId/databases/:databaseId
 */
router.delete('/:licenseId/instances/:instanceId/databases/:databaseId', async (req, res) => {
  try {
    const { licenseId, instanceId, databaseId } = req.params;

    const db = await prisma.licenseDatabase.findUnique({
      where: { id: databaseId },
      include: { instance: true },
    });
    if (!db || db.instanceId !== instanceId || db.instance.licenseId !== licenseId) {
      return res.status(404).json({ error: 'Base non trouvée' });
    }

    await prisma.licenseDatabase.delete({ where: { id: databaseId } });

    if (db.isDefault) {
      const remaining = await prisma.licenseDatabase.findFirst({
        where: { instanceId },
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
