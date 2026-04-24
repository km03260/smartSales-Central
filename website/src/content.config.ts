import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    author: z.string().default('Équipe customApps'),
    category: z.enum(['guide', 'actualites', 'etude-de-cas', 'produit', 'sous-le-capot']).default('guide'),
    tags: z.array(z.string()).default([]),
    coverImage: image().optional(),
    coverAlt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
