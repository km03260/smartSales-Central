import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../../../uploads/logos');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${req.params.id}${extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/companies
 * Liste toutes les entreprises avec le nombre de licences actives.
 */
router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        licenses: { select: { id: true, isActive: true, expiresAt: true, plan: true } },
        config: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(companies.map(c => ({
      ...c,
      activeLicenses: c.licenses.filter(l => l.isActive).length,
      hasConfig: !!c.config,
    })));
  } catch (error) {
    console.error('[COMPANIES:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/companies/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { licenses: true, config: true },
    });

    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    res.json(company);
  } catch (error) {
    console.error('[COMPANIES:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/companies
 * Body: { name, legalName, contactEmail, contactPhone?, address?, siret?, notes? }
 * Crée aussi la CompanyConfig associée si configData est fourni.
 */
router.post('/', async (req, res) => {
  try {
    const { name, legalName, contactEmail, contactPhone, address, siret, notes, configData } = req.body;

    if (!name || !legalName || !contactEmail) {
      return res.status(400).json({ error: 'name, legalName et contactEmail requis' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        legalName,
        contactEmail,
        contactPhone: contactPhone || '',
        address: address || '',
        siret: siret || '',
        notes: notes || '',
        ...(configData ? {
          config: {
            create: configData,
          },
        } : {}),
      },
      include: { config: true },
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('[COMPANIES:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/companies/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, legalName, contactEmail, contactPhone, address, siret, notes } = req.body;

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(legalName !== undefined && { legalName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(address !== undefined && { address }),
        ...(siret !== undefined && { siret }),
        ...(notes !== undefined && { notes }),
      },
      include: { config: true },
    });

    res.json(company);
  } catch (error) {
    console.error('[COMPANIES:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/companies/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[COMPANIES:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Company Config ─────────────────────────────────────────────────────────

/**
 * PUT /api/admin/companies/:id/config
 * Crée ou met à jour la config branding d'une entreprise.
 */
router.put('/:id/config', async (req, res) => {
  try {
    const companyId = req.params.id;
    const data = req.body;

    const config = await prisma.companyConfig.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });

    res.json(config);
  } catch (error) {
    console.error('[COMPANIES:CONFIG]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/companies/:id/logo
 * Upload du logo de l'entreprise.
 */
router.post('/:id/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier logo requis (PNG, JPG, WebP, max 2 MB)' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const logoUrl = `${protocol}://${host}/uploads/logos/${req.file.filename}`;

    // Mettre à jour le logoUrl dans la config
    await prisma.companyConfig.upsert({
      where: { companyId: req.params.id },
      create: { companyId: req.params.id, logoUrl },
      update: { logoUrl },
    });

    res.json({ success: true, logoUrl });
  } catch (error) {
    console.error('[COMPANIES:LOGO]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
