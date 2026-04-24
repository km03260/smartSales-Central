import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FileText, Plus, Trash2, Edit2, Eye, EyeOff, Star } from 'lucide-react';

const CATEGORY_LABELS = {
  'guide': 'Guide',
  'actualites': 'Actualités',
  'etude-de-cas': 'Étude de cas',
  'produit': 'Produit',
  'sous-le-capot': 'Sous le capot',
};
const CATEGORY_COLORS = {
  'guide':          'bg-blue-50 text-blue-700',
  'actualites':     'bg-pink-50 text-pink-700',
  'etude-de-cas':   'bg-emerald-50 text-emerald-700',
  'produit':        'bg-violet-50 text-violet-700',
  'sous-le-capot':  'bg-orange-50 text-orange-700',
};

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const load = () =>
    api.getBlogPosts().then((data) => { setPosts(data); setLoading(false); }).catch(console.error);

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Supprimer définitivement cet article ?')) return;
    try { await api.deleteBlogPost(id); await load(); }
    catch (err) { alert(err.message); }
  };

  const togglePublish = async (post) => {
    try { await api.updateBlogPost(post.id, { draft: !post.draft }); await load(); }
    catch (err) { alert(err.message); }
  };

  const toggleFeature = async (post) => {
    try { await api.updateBlogPost(post.id, { featured: !post.featured }); await load(); }
    catch (err) { alert(err.message); }
  };

  const filtered = filter === 'all' ? posts
    : filter === 'drafts' ? posts.filter(p => p.draft)
    : filter === 'published' ? posts.filter(p => !p.draft)
    : posts.filter(p => p.category === filter);

  if (loading) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posts.length} article(s) · {posts.filter(p => !p.draft).length} publié(s) · {posts.filter(p => p.draft).length} brouillon(s)
          </p>
        </div>
        <Link to="/blog/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Nouvel article
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { v: 'all',        label: `Tous (${posts.length})` },
          { v: 'published',  label: `Publiés (${posts.filter(p => !p.draft).length})` },
          { v: 'drafts',     label: `Brouillons (${posts.filter(p => p.draft).length})` },
          ...Object.entries(CATEGORY_LABELS).map(([v, label]) => ({
            v, label: `${label} (${posts.filter(p => p.category === v).length})`,
          })),
        ].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === v
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          Aucun article pour ce filtre.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.guide}`}>
                    {CATEGORY_LABELS[post.category] || 'Guide'}
                  </span>
                  {post.featured && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> À la une
                    </span>
                  )}
                  {post.draft ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Brouillon
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      Publié
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(post.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <Link to={`/blog/${post.id}`} className="block">
                  <h3 className="font-bold text-gray-900 hover:text-blue-600 transition-colors truncate">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{post.description}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">/blog/{post.slug}</p>
                </Link>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleFeature(post)}
                  className={`p-2 rounded-lg transition-colors ${
                    post.featured
                      ? 'text-yellow-600 hover:bg-yellow-50'
                      : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                  title={post.featured ? 'Retirer de la une' : 'Mettre à la une'}
                >
                  <Star size={16} fill={post.featured ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => togglePublish(post)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={post.draft ? 'Publier' : 'Dépublier (repasser en brouillon)'}
                >
                  {post.draft ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <Link to={`/blog/${post.id}`}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Éditer">
                  <Edit2 size={16} />
                </Link>
                <button
                  onClick={() => remove(post.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
