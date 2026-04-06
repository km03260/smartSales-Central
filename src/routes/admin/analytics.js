import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/analytics/overview
 * KPIs globaux : total clients, licences actives, appareils, etc.
 */
router.get('/overview', async (req, res) => {
  try {
    const [
      totalCompanies,
      totalLicenses,
      activeLicenses,
      totalDevices,
      activeDevices,
      expiringSoon,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.license.count(),
      prisma.license.count({ where: { isActive: true } }),
      prisma.deviceActivation.count(),
      prisma.deviceActivation.count({ where: { isActive: true } }),
      prisma.license.count({
        where: {
          isActive: true,
          expiresAt: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            gte: new Date(),
          },
        },
      }),
    ]);

    res.json({
      totalCompanies,
      totalLicenses,
      activeLicenses,
      totalDevices,
      activeDevices,
      expiringSoon,
    });
  } catch (error) {
    console.error('[ANALYTICS:OVERVIEW]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/analytics/usage?days=30
 * Logs d'usage agrégés par jour et par type d'événement.
 */
router.get('/usage', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await prisma.usageLog.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: since } },
      _count: true,
    });

    res.json({
      period: `${days}d`,
      events: logs.map(l => ({
        type: l.eventType,
        count: l._count,
      })),
    });
  } catch (error) {
    console.error('[ANALYTICS:USAGE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
