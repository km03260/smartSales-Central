// Convertit le contenu markdown des articles existants en HTML.
// À exécuter une seule fois, après déploiement du nouveau RichEditor (TipTap).
//
// Idempotent : détecte si le contenu est déjà du HTML (commence par <) et skip.
//
// Usage : docker exec -it customapps-api node prisma/convert-blog-md-to-html.js

import { PrismaClient } from '@prisma/client';
import { marked } from 'marked';

const prisma = new PrismaClient();

function looksLikeHtml(content) {
  const trimmed = String(content || '').trim();
  // Si ça commence par un tag HTML évident (p, h2, h3, ul, ol, blockquote, div), c'est déjà converti
  return /^<(p|h[1-6]|ul|ol|blockquote|div|strong|em|table|section|article|figure|pre)\b/i.test(trimmed);
}

async function main() {
  const posts = await prisma.blogPost.findMany();
  console.log(`${posts.length} articles trouvés.\n`);

  let converted = 0, skipped = 0, errors = 0;

  for (const post of posts) {
    if (looksLikeHtml(post.content)) {
      console.log(`⊝ Skip (déjà HTML) : ${post.slug}`);
      skipped++;
      continue;
    }

    try {
      const html = marked.parse(post.content || '', { breaks: false, gfm: true });
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: html },
      });
      converted++;
      console.log(`✓ Converti : ${post.slug} (${post.content.length} → ${html.length} chars)`);
    } catch (err) {
      errors++;
      console.error(`✗ Erreur ${post.slug} :`, err.message);
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Converted : ${converted}`);
  console.log(`Skipped   : ${skipped} (déjà HTML)`);
  console.log(`Errors    : ${errors}`);
  console.log(`─────────────────────────────────────`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
