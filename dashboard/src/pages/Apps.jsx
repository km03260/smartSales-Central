import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Package, Plus, X, Check, AlertCircle } from 'lucide-react';

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export default function Apps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = () =>
    api.getApps().then((data) => { setApps(data); setLoading(false); }).catch(console.error);

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nouvelle application
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          Aucune application. Créez-en une pour commencer.
        </div>
      ) : (
        <>
          {/* Vue table — desktop ≥md */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Application</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Licences</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">APK</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bundle</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/apps/${app.id}`} className="flex items-center gap-3 group">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-600 group-hover:text-blue-800 group-hover:underline">{app.name}</div>
                          {app.tagline && (
                            <div className="text-xs text-gray-500 italic line-clamp-1 max-w-md">« {app.tagline} »</div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono px-2 py-0.5 bg-purple-50 text-purple-700 rounded">{app.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      {app.slug && <span className="text-xs font-mono text-gray-500">/apps/{app.slug}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.totalLicenses > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {app.totalLicenses ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {app.apkFileName ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <Check size={14} />
                          {app.apkVersion ? `v${app.apkVersion}` : 'Présent'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                          <AlertCircle size={14} />
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {app.serviceBundlePath ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <Check size={14} />
                          {app.serviceBundleVersion ? `v${app.serviceBundleVersion}` : 'Présent'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                          <AlertCircle size={14} />
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {app.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Désactivée
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue cards — mobile <md */}
          <div className="md:hidden space-y-3">
            {apps.map((app) => (
              <Link key={app.id} to={`/apps/${app.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <Package size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-blue-600">{app.name}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">{app.code}</span>
                    </div>
                    {app.tagline && <div className="text-xs text-gray-500 italic line-clamp-2 mt-0.5">« {app.tagline} »</div>}
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    app.isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {app.isActive ? 'Active' : 'Désactivée'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 pl-11">
                  <span>{app.totalLicenses ?? 0} licence{(app.totalLicenses ?? 0) > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    APK
                    {app.apkFileName ? (
                      <span className="text-green-600 font-medium">{app.apkVersion ? `v${app.apkVersion}` : '✓'}</span>
                    ) : (
                      <span className="text-gray-400">absent</span>
                    )}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    Bundle
                    {app.serviceBundlePath ? (
                      <span className="text-green-600 font-medium">{app.serviceBundleVersion ? `v${app.serviceBundleVersion}` : '✓'}</span>
                    ) : (
                      <span className="text-gray-400">absent</span>
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {showCreate && (
        <CreateAppModal
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            navigate(`/apps/${created.id}`);
          }}
        />
      )}
    </div>
  );
}

function CreateAppModal({ onClose, onCreated }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.createApp({ code, name, slug: slug || slugify(name), description });
      onCreated(created);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="font-bold text-gray-900 mb-6">Nouvelle application</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input required maxLength={10} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SS"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            <p className="text-xs text-gray-400 mt-1">2-10 caractères majuscules. Préfixe des licenses.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="customSales"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={name ? slugify(name) : 'custom-sales (auto si vide)'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
