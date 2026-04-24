import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/**
 * GET /api/admin/blog
 * Liste complète (y compris drafts), tri date desc.
 */
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    res.json(posts);
  } catch (error) {
    console.error('[ADMIN:BLOG:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/blog/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(post);
  } catch (error) {
    console.error('[ADMIN:BLOG:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/blog
 * Body: { slug?, title, description, content, publishedAt?, author?, category?, tags?, featured?, draft? }
 */
router.post('/', async (req, res) => {
  try {
    const {
      slug, title, description, content, publishedAt, author,
      category, tags, coverImage, featured, draft,
    } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({ error: 'title, description et content requis' });
    }

    const post = await prisma.blogPost.create({
      data: {
        slug: slug || slugify(title),
        title,
        description,
        content,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        author: author || 'Équipe customApps',
        category: category || 'guide',
        tags: Array.isArray(tags) ? tags : [],
        coverImage: coverImage || '',
        featured: !!featured,
        draft: draft === undefined ? true : !!draft,  // par défaut en draft
      },
    });
    res.status(201).json(post);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce slug existe déjà' });
    }
    console.error('[ADMIN:BLOG:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/blog/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      slug, title, description, content, publishedAt, author,
      category, tags, coverImage, featured, draft,
    } = req.body;

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
        ...(author !== undefined && { author }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        ...(coverImage !== undefined && { coverImage }),
        ...(featured !== undefined && { featured: !!featured }),
        ...(draft !== undefined && { draft: !!draft }),
      },
    });
    res.json(post);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce slug existe déjà' });
    }
    console.error('[ADMIN:BLOG:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/blog/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN:BLOG:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
