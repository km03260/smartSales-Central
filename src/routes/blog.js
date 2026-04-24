import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function toPublic(post) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    content: post.content,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
    category: post.category,
    tags: post.tags,
    coverImage: post.coverImage || null,
    featured: post.featured,
  };
}

/**
 * GET /api/blog
 * Liste des articles publiés (non-drafts), triés par date desc.
 * Option ?category=guide pour filtrer.
 */
router.get('/', async (req, res) => {
  try {
    const where = { draft: false };
    if (req.query.category) where.category = String(req.query.category);

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });

    res.set('Cache-Control', 'public, max-age=60');
    res.json(posts.map(toPublic));
  } catch (error) {
    console.error('[BLOG:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/blog/:slug
 * Détail d'un article (publié uniquement).
 */
router.get('/:slug', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
    });

    if (!post || post.draft) return res.status(404).json({ error: 'Article non trouvé' });

    res.set('Cache-Control', 'public, max-age=60');
    res.json(toPublic(post));
  } catch (error) {
    console.error('[BLOG:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
