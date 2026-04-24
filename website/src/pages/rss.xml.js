import rss from '@astrojs/rss';

export async function GET(context) {
  const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.customapps.fr';
  let posts = [];
  try {
    const res = await fetch(`${API_URL}/api/blog`);
    if (res.ok) posts = await res.json();
  } catch {}

  return rss({
    title: 'Blog customApps',
    description: "Guides, actualités et décryptages sur la digitalisation des équipes terrain — force de vente mobile, achats, expéditions, apps métier Android et ERP WaveSoft.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      description: post.description,
      author: post.author,
      categories: [...(post.tags || []), post.category].filter(Boolean),
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>fr-fr</language>`,
  });
}
