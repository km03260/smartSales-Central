import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function buildPublicUrl(req, relativePath) {
  const base = process.env.PUBLIC_API_URL;
  if (base) return `${base.replace(/\/$/, '')}${relativePath}`;

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}${relativePath}`;
}

function appToPublic(app, req) {
  return {
    code: app.code,
    slug: app.slug,
    name: app.name,
    description: app.description,
    tagline: app.tagline,
    longDescription: app.longDescription,
    color: app.color,
    iconSvgPath: app.iconSvgPath,
    order: app.order,
    apkVersion: app.apkVersion || null,
    apkUpdatedAt: app.apkUpdatedAt,
    apkUrl: app.apkFileName ? buildPublicUrl(req, `/uploads/apps/${app.code}/${app.apkFileName}`) : null,
    qrcodeUrl: app.apkFileName ? buildPublicUrl(req, `/uploads/apps/${app.code}/qrcode.svg`) : null,
    features: (app.features || []).map(f => ({
      title: f.title,
      description: f.description,
      iconSvgPath: f.iconSvgPath,
    })),
    pricingPlans: (app.pricingPlans || []).map(p => ({
      name: p.name,
      price: p.price,
      period: p.period,
      features: p.features,
      isFeatured: p.isFeatured,
      ctaLabel: p.ctaLabel,
    })),
  };
}

/**
 * GET /api/apps
 * Liste publique des applications actives — utilisée par le catalogue du site vitrine.
 */
router.get('/', async (req, res) => {
  try {
    const apps = await prisma.app.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        features: { orderBy: { order: 'asc' } },
        pricingPlans: { orderBy: { order: 'asc' } },
      },
    });
    res.set('Cache-Control', 'public, max-age=60');
    res.json(apps.map(a => appToPublic(a, req)));
  } catch (error) {
    console.error('[APPS:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/apps/:slug
 * Détail d'une application par slug — utilisée par la page produit du site vitrine.
 * Accepte aussi le code (fallback) pour rétro-compatibilité.
 */
router.get('/:slug', async (req, res) => {
  try {
    const key = req.params.slug;
    const app = await prisma.app.findFirst({
      where: {
        isActive: true,
        OR: [{ slug: key }, { code: key.toUpperCase() }],
      },
      include: {
        features: { orderBy: { order: 'asc' } },
        pricingPlans: { orderBy: { order: 'asc' } },
      },
    });

    if (!app) return res.status(404).json({ error: 'Application non trouvée' });

    res.set('Cache-Control', 'public, max-age=60');
    res.json(appToPublic(app, req));
  } catch (error) {
    console.error('[APPS:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/apps/:code/download
 * Infos de téléchargement APK + QR code (legacy, utilisé par l'ancien index.astro).
 */
router.get('/:code/download', async (req, res) => {
  try {
    const app = await prisma.app.findUnique({
      where: { code: req.params.code.toUpperCase() },
      select: { code: true, name: true, apkFileName: true, apkVersion: true, apkUpdatedAt: true, isActive: true },
    });

    if (!app || !app.isActive) {
      return res.status(404).json({ error: 'Application non trouvée' });
    }

    if (!app.apkFileName) {
      return res.status(404).json({ error: 'Aucun APK disponible' });
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      code: app.code,
      name: app.name,
      version: app.apkVersion,
      updatedAt: app.apkUpdatedAt,
      apkUrl: buildPublicUrl(req, `/uploads/apps/${app.code}/${app.apkFileName}`),
      qrcodeUrl: buildPublicUrl(req, `/uploads/apps/${app.code}/qrcode.svg`),
    });
  } catch (error) {
    console.error('[APPS:DOWNLOAD]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
