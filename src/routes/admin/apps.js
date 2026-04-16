import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import QRCode from 'qrcode';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsRoot = join(__dirname, '../../../uploads/apps');
if (!existsSync(uploadsRoot)) mkdirSync(uploadsRoot, { recursive: true });

const router = Router();
const prisma = new PrismaClient();

function appDir(code) {
  return join(uploadsRoot, code);
}

function buildPublicUrl(req, relativePath) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}${relativePath}`;
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const app = await prisma.app.findUnique({ where: { id: req.params.id } });
      if (!app) return cb(new Error('Application non trouvée'));
      const dir = appDir(app.code);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      // Stocker le code de l'app pour le filename et la suite
      req._appRecord = app;
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // On conserve le nom original (contient souvent la version), nettoyé
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
  fileFilter: (req, file, cb) => {
    const isApk =
      file.mimetype === 'application/vnd.android.package-archive' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.toLowerCase().endsWith('.apk');
    cb(null, isApk);
  },
});

/**
 * GET /api/admin/apps
 */
router.get('/', async (req, res) => {
  try {
    const apps = await prisma.app.findMany({
      include: { _count: { select: { licenses: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json(apps.map(a => ({
      ...a,
      totalLicenses: a._count.licenses,
      apkUrl: a.apkFileName ? buildPublicUrl(req, `/uploads/apps/${a.code}/${a.apkFileName}`) : null,
      qrcodeUrl: a.apkFileName ? buildPublicUrl(req, `/uploads/apps/${a.code}/qrcode.svg`) : null,
      _count: undefined,
    })));
  } catch (error) {
    console.error('[APPS:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/apps/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const app = await prisma.app.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { licenses: true } } },
    });

    if (!app) return res.status(404).json({ error: 'Application non trouvée' });

    res.json({
      ...app,
      apkUrl: app.apkFileName ? buildPublicUrl(req, `/uploads/apps/${app.code}/${app.apkFileName}`) : null,
      qrcodeUrl: app.apkFileName ? buildPublicUrl(req, `/uploads/apps/${app.code}/qrcode.svg`) : null,
    });
  } catch (error) {
    console.error('[APPS:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/apps
 * Body: { code, name, description? }
 */
router.post('/', async (req, res) => {
  try {
    const { code, name, description } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code et name requis' });
    }

    const app = await prisma.app.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        description: description || '',
      },
    });

    res.status(201).json(app);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce code application existe déjà' });
    }
    console.error('[APPS:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/apps/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const app = await prisma.app.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(app);
  } catch (error) {
    console.error('[APPS:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/apps/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (app) {
      const dir = appDir(app.code);
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    }
    await prisma.app.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[APPS:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/apps/:id/apk
 * Upload de l'APK associé à une application. Génère le QR code automatiquement.
 * Body (multipart): apk (file), version (optional string field)
 */
router.post('/:id/apk', upload.single('apk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier APK requis (max 200 MB)' });
    }

    const app = req._appRecord;
    const dir = appDir(app.code);

    // Supprimer l'ancien APK s'il existe et a un nom différent
    if (app.apkFileName && app.apkFileName !== req.file.filename) {
      const oldPath = join(dir, app.apkFileName);
      if (existsSync(oldPath)) {
        try { rmSync(oldPath); } catch { /* ignore */ }
      }
    }

    const apkPublicUrl = buildPublicUrl(req, `/uploads/apps/${app.code}/${req.file.filename}`);

    // Générer le QR code SVG
    const qrSvg = await QRCode.toString(apkPublicUrl, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });
    writeFileSync(join(dir, 'qrcode.svg'), qrSvg);

    const updated = await prisma.app.update({
      where: { id: app.id },
      data: {
        apkFileName: req.file.filename,
        apkVersion: req.body.version || '',
        apkUpdatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      app: {
        ...updated,
        apkUrl: apkPublicUrl,
        qrcodeUrl: buildPublicUrl(req, `/uploads/apps/${app.code}/qrcode.svg`),
      },
    });
  } catch (error) {
    console.error('[APPS:APK_UPLOAD]', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/apps/:id/apk
 * Supprime l'APK et le QR code associé à une application.
 */
router.delete('/:id/apk', async (req, res) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: 'Application non trouvée' });

    const dir = appDir(app.code);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }

    const updated = await prisma.app.update({
      where: { id: app.id },
      data: { apkFileName: '', apkVersion: '', apkUpdatedAt: null },
    });

    res.json({ success: true, app: updated });
  } catch (error) {
    console.error('[APPS:APK_DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
