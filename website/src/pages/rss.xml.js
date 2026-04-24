import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: 'Blog customApps',
    description: "Guides, actualités et décryptages sur la digitalisation des équipes terrain — force de vente mobile, achats, expéditions, apps métier Android et ERP WaveSoft.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      author: post.data.author,
      categories: [...post.data.tags, post.data.category],
      link: `/blog/${post.id}/`,
    })),
    customData: `<language>fr-fr</language>`,
  });
}
