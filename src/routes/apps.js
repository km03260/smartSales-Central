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

/**
 * GET /api/apps/:code/download
 * Retourne les infos de téléchargement publiques d'une app (APK + QR code).
 * Utilisé par le site vitrine pour pointer vers la dernière version.
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
