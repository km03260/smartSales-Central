import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
    res.json(app);
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
    await prisma.app.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[APPS:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
