import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save, Trash2, Eye, FileText, Star } from 'lucide-react';

const CATEGORIES = [
  { v: 'guide',          label: 'Guide' },
  { v: 'actualites',     label: 'Actualités' },
  { v: 'etude-de-cas',   label: 'Étude de cas' },
  { v: 'produit',        label: 'Produit' },
  { v: 'sous-le-capot',  label: 'Sous le capot' },
];

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

// Markdown preview très basique (pas de dépendance) — juste pour vérifier la structure
function previewMarkdown(md) {
  if (!md) return '<p class="text-gray-400 italic">Aperçu vide</p>';
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-extrabold text-xl mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-extrabold text-2xl mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-blue-600 px-1 rounded text-sm">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 font-semibold">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul class="list-disc pl-5 my-2">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="my-3">');
  return `<p class="my-3">${html}</p>`;
}

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    slug: '',
    title: '',
    description: '',
    content: '',
    coverImage: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    author: 'Équipe customApps',
    category: 'guide',
    tags: '',
    featured: false,
    draft: true,
  });

  useEffect(() => {
    if (isNew) return;
    api.getBlogPost(id).then((post) => {
      setForm({
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        coverImage: post.coverImage || '',
        publishedAt: new Date(post.publishedAt).toISOString().slice(0, 10),
        author: post.author || 'Équipe customApps',
        category: post.category || 'guide',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
        featured: !!post.featured,
        draft: !!post.draft,
      });
      setLoading(false);
    }).catch((err) => { alert(err.message); navigate('/blog'); });
  }, [id]);

  const save = async () => {
    if (!form.title || !form.description || !form.content) {
      alert('Titre, description et contenu sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const finalSlug = form.slug || slugify(form.title);
      const payload = {
        slug: finalSlug,
        title: form.title,
        description: form.description,
        content: form.content,
        coverImage: form.coverImage || `/blog/covers/${finalSlug}.svg`,  // défaut = cover SVG auto-généré
        publishedAt: new Date(form.publishedAt).toISOString(),
        author: form.author,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: form.featured,
        draft: form.draft,
      };
      if (isNew) {
        const created = await api.createBlogPost(payload);
        navigate(`/blog/${created.id}`);
      } else {
        await api.updateBlogPost(id, payload);
        alert('Article enregistré.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Supprimer définitivement cet article ?')) return;
    try { await api.deleteBlogPost(id); navigate('/blog'); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/blog" className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isNew ? 'Nouvel article' : 'Éditer l\'article'}
            </h1>
            {form.slug && !isNew && (
              <a href={`https://customapps.fr/blog/${form.slug}`} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 hover:text-blue-600 font-mono">
                https://customapps.fr/blog/{form.slug} ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              onClick={remove}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye size={16} /> {showPreview ? 'Masquer aperçu' : 'Aperçu'}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Formulaire */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
              placeholder="Titre de l'article"
              className="w-full px-3 py-2 text-lg font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 px-3 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg">/blog/</span>
              <input
                type="text" value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="mon-article"
                className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (150-200 caractères) *
            </label>
            <textarea
              rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Meta description SEO + hook pour la liste d'articles"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length} caractères</p>
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image de couverture (URL)</label>
            <div className="flex items-center gap-3">
              <input
                type="text" value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder={form.slug ? `/blog/covers/${form.slug}.svg (défaut auto)` : '/blog/covers/mon-article.svg'}
                className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(form.coverImage || form.slug) && (
                <div className="flex-shrink-0 w-24 h-[54px] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  <img src={form.coverImage || `/blog/covers/${form.slug || slugify(form.title)}.svg`}
                    alt="Aperçu" className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Laisse vide pour utiliser le cover par défaut (généré à <code className="bg-gray-100 px-1 rounded">/blog/covers/{form.slug || slugify(form.title) || 'slug'}.svg</code>). Ou colle une URL d'image personnalisée.
            </p>
          </div>

          {/* Métadonnées en grille */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de publication</label>
              <input
                type="date" value={form.publishedAt}
                onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
              <input
                type="text" value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par virgule)</label>
              <input
                type="text" value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="force de vente, ROI, digitalisation"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox" checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              <Star size={14} className={form.featured ? 'text-yellow-500' : 'text-gray-400'} fill={form.featured ? 'currentColor' : 'none'} />
              Mis à la une
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox" checked={!form.draft}
                onChange={(e) => setForm({ ...form, draft: !e.target.checked })}
              />
              Publié (visible sur le site)
            </label>
          </div>

          {/* Contenu markdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu (markdown) *
            </label>
            <textarea
              rows={30} value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="## Titre de section&#10;&#10;Paragraphe avec **gras**, *italique*, et [liens](/apps/custom-sales).&#10;&#10;- Liste à puces&#10;- Deuxième point&#10;&#10;## Autre section..."
              className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Markdown standard supporté : #, ##, ###, **gras**, *italique*, [liens](url), listes, tableaux, blockquotes, `code`
            </p>
          </div>
        </div>

        {/* Aperçu */}
        {showPreview && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Aperçu rapide</span>
              <span className="text-xs text-gray-400 ml-auto">Rendu simplifié, non final</span>
            </div>
            <div className="mb-4">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{form.title || 'Titre'}</h1>
              <p className="text-base text-gray-500 mb-4">{form.description}</p>
              <div className="text-xs text-gray-400 mb-4">
                Par {form.author} · {new Date(form.publishedAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: previewMarkdown(form.content) }} />
          </div>
        )}
      </div>
    </div>
  );
}
