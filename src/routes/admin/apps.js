import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import QRCode from 'qrcode';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsRoot = join(__dirname, '../../../uploads/apps');
const servicesRoot = join(__dirname, '../../../uploads/services');
if (!existsSync(uploadsRoot)) mkdirSync(uploadsRoot, { recursive: true });
if (!existsSync(servicesRoot)) mkdirSync(servicesRoot, { recursive: true });

const router = Router();
const prisma = new PrismaClient();

function appDir(code) {
  return join(uploadsRoot, code);
}

function buildPublicUrl(req, relativePath) {
  // PUBLIC_API_URL doit pointer vers l'API accessible publiquement (ex: https://api.smartapps.fr)
  // Nécessaire pour que les QR codes soient scannables depuis un téléphone.
  const base = process.env.PUBLIC_API_URL;
  if (base) return `${base.replace(/\/$/, '')}${relativePath}`;

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

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * GET /api/admin/apps
 */
router.get('/', async (req, res) => {
  try {
    const apps = await prisma.app.findMany({
      include: {
        _count: { select: { licenses: true } },
        features: { orderBy: { order: 'asc' } },
        pricingPlans: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
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
      include: {
        _count: { select: { licenses: true } },
        features: { orderBy: { order: 'asc' } },
        pricingPlans: { orderBy: { order: 'asc' } },
      },
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
 * Body: { code, name, slug?, description?, tagline?, longDescription?, color?, iconSvgPath?, order? }
 */
router.post('/', async (req, res) => {
  try {
    const { code, name, slug, description, tagline, longDescription, color, iconSvgPath, order } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code et name requis' });
    }

    const app = await prisma.app.create({
      data: {
        code: code.toUpperCase().trim(),
        slug: slug || slugify(name),
        name,
        description: description || '',
        tagline: tagline || '',
        longDescription: longDescription || '',
        color: color || 'blue',
        iconSvgPath: iconSvgPath || '',
        order: order ?? 0,
      },
    });

    res.status(201).json(app);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce code ou slug existe déjà' });
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
    const { name, slug, description, tagline, longDescription, color, iconSvgPath, order, isActive } = req.body;

    const app = await prisma.app.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug: slug || slugify(name || '') }),
        ...(description !== undefined && { description }),
        ...(tagline !== undefined && { tagline }),
        ...(longDescription !== undefined && { longDescription }),
        ...(color !== undefined && { color }),
        ...(iconSvgPath !== undefined && { iconSvgPath }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(app);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce slug existe déjà' });
    }
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
        apkReleaseNotes: req.body.releaseNotes || '',
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
      data: { apkFileName: '', apkVersion: '', apkReleaseNotes: '', apkUpdatedAt: null },
    });

    res.json({ success: true, app: updated });
  } catch (error) {
    console.error('[APPS:APK_DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Service Bundle (ZIP des binaires SyncService .NET) ────────────────────

const serviceBundleStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const app = await prisma.app.findUnique({ where: { id: req.params.id } });
      if (!app) return cb(new Error('Application non trouvée'));
      const dir = join(servicesRoot, app.code);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      req._appRecord = app;
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, 'service-bundle.zip');
  },
});

const uploadServiceBundle = multer({
  storage: serviceBundleStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max (binaires .NET self-contained)
  fileFilter: (req, file, cb) => {
    const isZip =
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.toLowerCase().endsWith('.zip');
    if (!isZip) return cb(new Error('Seuls les fichiers ZIP sont acceptés'));
    cb(null, true);
  },
});

/**
 * POST /api/admin/apps/:id/service-bundle
 * Upload du ZIP contenant les binaires du SyncService (.exe + DLLs).
 * Body (multipart): bundle (file), version (optional string field)
 */
router.post('/:id/service-bundle', uploadServiceBundle.single('bundle'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier ZIP requis (max 500 MB)' });
    }

    const app = req._appRecord;
    const relativePath = `uploads/services/${app.code}/service-bundle.zip`;

    const updated = await prisma.app.update({
      where: { id: app.id },
      data: {
        serviceBundlePath: relativePath,
        serviceBundleVersion: req.body.version || '',
        serviceBundleUpdatedAt: new Date(),
      },
    });

    res.json({ success: true, app: updated });
  } catch (error) {
    console.error('[APPS:SERVICE_BUNDLE_UPLOAD]', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/apps/:id/service-bundle
 */
router.delete('/:id/service-bundle', async (req, res) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (!app) return res.status(404).json({ error: 'Application non trouvée' });

    const dir = join(servicesRoot, app.code);
    const bundlePath = join(dir, 'service-bundle.zip');
    if (existsSync(bundlePath)) rmSync(bundlePath);

    const updated = await prisma.app.update({
      where: { id: app.id },
      data: { serviceBundlePath: '', serviceBundleVersion: '', serviceBundleUpdatedAt: null },
    });

    res.json({ success: true, app: updated });
  } catch (error) {
    console.error('[APPS:SERVICE_BUNDLE_DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Features (contenu marketing) ──────────────────────────────────────────

/**
 * POST /api/admin/apps/:id/features
 * Body: { title, description, iconSvgPath, order }
 */
router.post('/:id/features', async (req, res) => {
  try {
    const { title, description, iconSvgPath, order } = req.body;
    if (!title) return res.status(400).json({ error: 'title requis' });

    const feature = await prisma.appFeature.create({
      data: {
        appId: req.params.id,
        title,
        description: description || '',
        iconSvgPath: iconSvgPath || '',
        order: order ?? 0,
      },
    });
    res.status(201).json(feature);
  } catch (error) {
    console.error('[APPS:FEATURE_CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/apps/:id/features/:featureId
 */
router.put('/:id/features/:featureId', async (req, res) => {
  try {
    const { title, description, iconSvgPath, order } = req.body;
    const feature = await prisma.appFeature.update({
      where: { id: req.params.featureId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(iconSvgPath !== undefined && { iconSvgPath }),
        ...(order !== undefined && { order }),
      },
    });
    res.json(feature);
  } catch (error) {
    console.error('[APPS:FEATURE_UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/apps/:id/features/:featureId
 */
router.delete('/:id/features/:featureId', async (req, res) => {
  try {
    await prisma.appFeature.delete({ where: { id: req.params.featureId } });
    res.json({ success: true });
  } catch (error) {
    console.error('[APPS:FEATURE_DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Pricing Plans (contenu marketing) ─────────────────────────────────────

/**
 * POST /api/admin/apps/:id/plans
 * Body: { name, price, period, features[], isFeatured, ctaLabel, order }
 */
router.post('/:id/plans', async (req, res) => {
  try {
    const { name, price, period, features, isFeatured, ctaLabel, order } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'name et price requis' });

    const plan = await prisma.appPricingPlan.create({
      data: {
        appId: req.params.id,
        name,
        price,
        period: period ?? '/mois',
        features: Array.isArray(features) ? features : [],
        isFeatured: !!isFeatured,
        ctaLabel: ctaLabel || 'Demander une démo',
        order: order ?? 0,
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error('[APPS:PLAN_CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/apps/:id/plans/:planId
 */
router.put('/:id/plans/:planId', async (req, res) => {
  try {
    const { name, price, period, features, isFeatured, ctaLabel, order } = req.body;
    const plan = await prisma.appPricingPlan.update({
      where: { id: req.params.planId },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(period !== undefined && { period }),
        ...(features !== undefined && { features: Array.isArray(features) ? features : [] }),
        ...(isFeatured !== undefined && { isFeatured: !!isFeatured }),
        ...(ctaLabel !== undefined && { ctaLabel }),
        ...(order !== undefined && { order }),
      },
    });
    res.json(plan);
  } catch (error) {
    console.error('[APPS:PLAN_UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/apps/:id/plans/:planId
 */
router.delete('/:id/plans/:planId', async (req, res) => {
  try {
    await prisma.appPricingPlan.delete({ where: { id: req.params.planId } });
    res.json({ success: true });
  } catch (error) {
    console.error('[APPS:PLAN_DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
