// Migre les articles markdown de website/src/content/blog/ vers la table blog_posts.
// Usage : docker exec -it customapps-api node prisma/migrate-blog-from-md.js
//
// Idempotent : upsert par slug. Le nom du fichier .md devient le slug.
// Après succès, vous pouvez supprimer website/src/content/blog/ et src/content.config.ts

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dirname, '..', 'website', 'src', 'content', 'blog');

const prisma = new PrismaClient();

/**
 * Parser basique YAML frontmatter → { data, body }.
 * Supporte strings (avec ou sans guillemets), dates (YYYY-MM-DD), booleans,
 * et tableaux ["a", "b"].
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const [, fm, body] = match;
  const data = {};
  const lines = fm.split('\n');

  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    let v = rawValue.trim();

    // bool
    if (v === 'true')  { data[key] = true;  continue; }
    if (v === 'false') { data[key] = false; continue; }

    // array
    if (v.startsWith('[') && v.endsWith(']')) {
      data[key] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      continue;
    }

    // strings
    v = v.replace(/^["']|["']$/g, '');

    // date
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { data[key] = new Date(v); continue; }

    data[key] = v;
  }

  return { data, body };
}

async function main() {
  console.log(`Reading markdown from ${blogDir}`);
  let files;
  try {
    files = readdirSync(blogDir).filter(f => f.endsWith('.md'));
  } catch (e) {
    console.error('Directory not found:', blogDir);
    console.error('Run this script from the customapps root, and ensure website/src/content/blog exists.');
    process.exit(1);
  }

  let created = 0, updated = 0, errors = 0;

  for (const file of files) {
    const slug = basename(file, extname(file));
    const raw = readFileSync(join(blogDir, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);

    if (!data.title || !data.description) {
      console.warn(`⚠ Skipping ${file}: missing title or description`);
      errors++;
      continue;
    }

    try {
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      // Cover image : convention = /blog/covers/{slug}.svg, servi directement par Astro depuis public/
      const coverImage = `/blog/covers/${slug}.svg`;
      // Convertir le markdown en HTML (stockage HTML depuis la v2 de l'éditeur)
      const htmlContent = marked.parse(body.trim(), { breaks: false, gfm: true });
      const payload = {
        slug,
        title: data.title,
        description: data.description,
        content: htmlContent,
        publishedAt: data.publishedAt || new Date(),
        author: data.author || 'Équipe customApps',
        category: data.category || 'guide',
        tags: Array.isArray(data.tags) ? data.tags : [],
        coverImage,
        featured: !!data.featured,
        draft: !!data.draft,
      };

      if (existing) {
        await prisma.blogPost.update({ where: { slug }, data: payload });
        updated++;
        console.log(`✓ Updated : ${slug}`);
      } else {
        await prisma.blogPost.create({ data: payload });
        created++;
        console.log(`+ Created : ${slug}`);
      }
    } catch (e) {
      console.error(`✗ Error on ${file}:`, e.message);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Created : ${created}`);
  console.log(`Updated : ${updated}`);
  console.log(`Errors  : ${errors}`);
  console.log(`─────────────────────────────────────`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
