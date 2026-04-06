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
 * Body: { companyId, syncServiceUrl, apiKey, maxDevices?, features?, plan?, expiresAt }
 */
router.post('/', async (req, res) => {
  try {
    const { appId, companyId, syncServiceUrl, apiKey, maxDevices, features, plan, expiresAt } = req.body;

    if (!appId || !companyId || !syncServiceUrl || !apiKey || !expiresAt) {
      return res.status(400).json({ error: 'appId, companyId, syncServiceUrl, apiKey et expiresAt requis' });
    }

    // Vérifier que l'app existe
    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (!app) {
      return res.status(404).json({ error: 'Application non trouvée' });
    }

    // Vérifier que l'entreprise existe
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const license = await prisma.license.create({
      data: {
        appId,
        companyId,
        licenseKey: generateLicenseKey(app.code),
        syncServiceUrl,
        apiKey,
        maxDevices: maxDevices || 5,
        features: features || ['orders', 'quotations', 'invoices'],
        plan: plan || 'professional',
        expiresAt: new Date(expiresAt),
      },
      include: { app: { select: { code: true, name: true } }, company: { select: { name: true } } },
    });

    res.status(201).json(license);
  } catch (error) {
    console.error('[LICENSES:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/licenses/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { syncServiceUrl, apiKey, maxDevices, features, plan, expiresAt, isActive } = req.body;

    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: {
        ...(syncServiceUrl !== undefined && { syncServiceUrl }),
        ...(apiKey !== undefined && { apiKey }),
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

export default router;
