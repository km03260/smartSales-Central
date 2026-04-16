import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { signLicenseToken } from '../services/licenseService.js';
import licenseAuth from '../middleware/licenseAuth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/licenses/activate
 * Échange un code d'activation contre un JWT licence + config entreprise.
 * Body: { activationCode, deviceId, deviceName, platform }
 */
router.post('/activate', async (req, res) => {
  try {
    const { activationCode, deviceId, deviceName, platform } = req.body;

    if (!activationCode || !deviceId) {
      return res.status(400).json({ error: 'activationCode et deviceId requis' });
    }

    // Trouver la licence par code d'activation
    const license = await prisma.license.findUnique({
      where: { licenseKey: activationCode.toUpperCase().trim() },
      include: {
        app: true,
        company: { include: { config: true } },
        deployment: true,
        instances: {
          include: { databases: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!license) {
      return res.status(404).json({ error: 'Code d\'activation invalide' });
    }

    if (!license.isActive) {
      return res.status(403).json({ error: 'Licence désactivée' });
    }

    if (license.isBlocked) {
      return res.status(403).json({ error: 'Licence bloquée. Contactez votre administrateur.' });
    }

    if (new Date(license.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Licence expirée' });
    }

    // Vérifier le nombre d'appareils actifs
    const activeDevices = await prisma.deviceActivation.count({
      where: { licenseId: license.id, isActive: true },
    });

    // Vérifier si cet appareil est déjà activé
    const existingDevice = await prisma.deviceActivation.findUnique({
      where: { licenseId_deviceId: { licenseId: license.id, deviceId } },
    });

    if (!existingDevice && activeDevices >= license.maxDevices) {
      return res.status(403).json({
        error: `Nombre maximum d'appareils atteint (${license.maxDevices})`,
      });
    }

    // Enregistrer ou mettre à jour l'appareil
    await prisma.deviceActivation.upsert({
      where: { licenseId_deviceId: { licenseId: license.id, deviceId } },
      create: {
        licenseId: license.id,
        deviceId,
        deviceName: deviceName || '',
        platform: platform || 'android',
      },
      update: {
        deviceName: deviceName || undefined,
        platform: platform || undefined,
        isActive: true,
        lastHeartbeat: new Date(),
      },
    });

    // Générer le JWT licence
    const token = await signLicenseToken(license, license.company, license.app?.code);

    // Préparer la config entreprise
    const config = license.company.config;
    const companyConfig = config ? {
      name: license.company.name,
      legalName: license.company.legalName,
      subtitle: config.subtitle,
      email: config.email,
      phone: config.phone,
      website: config.website,
      address: {
        street: config.addressStreet,
        zipCode: config.addressZipCode,
        city: config.addressCity,
        country: config.addressCountry,
      },
      legal: {
        siret: config.siret,
        tva: config.tva,
        capital: config.capital,
        rcs: config.rcs,
        ape: config.ape,
      },
      billing: {
        paymentTerms: config.paymentTerms,
        quotationValidityDays: config.quotationValidityDays,
        tvaRate: config.tvaRate,
      },
      logoUrl: config.logoUrl,
      termsAndConditions: config.termsAndConditions,
    } : null;

    // Log d'usage
    await prisma.usageLog.create({
      data: {
        licenseId: license.id,
        deviceId,
        eventType: 'activation',
        eventData: { deviceName, platform },
      },
    });

    res.json({
      success: true,
      token,
      appCode: license.app?.code,
      appName: license.app?.name,
      companyConfig,
    });
  } catch (error) {
    console.error('[ACTIVATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/licenses/heartbeat
 * Rafraîchit le JWT licence et met à jour le lastHeartbeat de l'appareil.
 * Headers: Authorization: Bearer <licenseToken>
 * Body: { deviceId }
 */
router.post('/heartbeat', licenseAuth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const licenseId = req.license.sub;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId requis' });
    }

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        app: true,
        company: true,
        deployment: true,
        instances: {
          include: { databases: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!license || !license.isActive) {
      return res.status(403).json({ error: 'Licence invalide ou désactivée' });
    }

    // Mettre à jour le heartbeat de l'appareil
    await prisma.deviceActivation.updateMany({
      where: { licenseId, deviceId },
      data: { lastHeartbeat: new Date() },
    });

    // Générer un nouveau JWT (rafraîchi)
    const token = await signLicenseToken(license, license.company, license.app?.code);

    // Log
    await prisma.usageLog.create({
      data: { licenseId, deviceId, eventType: 'heartbeat', eventData: {} },
    });

    res.json({ success: true, token, isBlocked: license.isBlocked || false });
  } catch (error) {
    console.error('[HEARTBEAT]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/licenses/config
 * Retourne la config branding de l'entreprise liée à la licence.
 * Headers: Authorization: Bearer <licenseToken>
 */
router.get('/config', licenseAuth, async (req, res) => {
  try {
    const licenseId = req.license.sub;

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { company: { include: { config: true } } },
    });

    if (!license) {
      return res.status(404).json({ error: 'Licence non trouvée' });
    }

    const config = license.company.config;
    if (!config) {
      return res.status(404).json({ error: 'Configuration non trouvée' });
    }

    res.json({
      name: license.company.name,
      legalName: license.company.legalName,
      subtitle: config.subtitle,
      email: config.email,
      phone: config.phone,
      website: config.website,
      address: {
        street: config.addressStreet,
        zipCode: config.addressZipCode,
        city: config.addressCity,
        country: config.addressCountry,
      },
      legal: {
        siret: config.siret,
        tva: config.tva,
        capital: config.capital,
        rcs: config.rcs,
        ape: config.ape,
      },
      billing: {
        paymentTerms: config.paymentTerms,
        quotationValidityDays: config.quotationValidityDays,
        tvaRate: config.tvaRate,
      },
      logoUrl: config.logoUrl,
      termsAndConditions: config.termsAndConditions,
    });
  } catch (error) {
    console.error('[CONFIG]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
