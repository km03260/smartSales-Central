import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Server } from 'lucide-react';

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyId: '', name: '', publicUrl: '', localUrl: '', apiKey: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getDeployments().then(setDeployments).catch(console.error);

  useEffect(() => {
    load();
    api.getCompanies().then(setCompanies).catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createDeployment(form);
      setForm({ companyId: '', name: '', publicUrl: '', localUrl: '', apiKey: '' });
      setShowForm(false);
      load();
      return created;
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Déploiements SyncService</h1>
          <p className="text-sm text-gray-500 mt-1">
            Une installation Windows physique par déploiement. Peut regrouper plusieurs licences/bases WaveSoft.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          <Plus size={16} />
          Nouveau déploiement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouveau déploiement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
              <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">-- Sélectionner --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex: Serveur principal Maurer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL publique *</label>
              <input value={form.publicUrl} onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
                placeholder="https://213.56.180.33"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL locale <span className="text-gray-400 font-normal">— optionnelle</span>
              </label>
              <input value={form.localUrl} onChange={(e) => setForm({ ...form, localUrl: e.target.value })}
                placeholder="https://10.0.6.22"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <p className="text-xs text-gray-500 mt-1">
                IP interne du SyncService. Le mobile l'essaie en premier (2s timeout) sur le réseau local, sinon fallback sur l'URL publique.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé API (X-API-Key) <span className="text-gray-400 font-normal">— optionnelle</span>
              </label>
              <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="Laisser vide pour générer automatiquement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" />
              <p className="text-xs text-gray-500 mt-1">
                Laissée vide, une clé aléatoire 256 bits est générée. Partagée par toutes les licences du déploiement.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              {saving ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-gray-600 hover:text-gray-900 text-sm cursor-pointer">Annuler</button>
          </div>
        </form>
      )}

      {deployments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Server size={40} className="mx-auto mb-3 text-gray-300" />
          Aucun déploiement
        </div>
      ) : (
        <>
          {/* Vue table — desktop ≥md */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Nom</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Entreprise</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">URL publique</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Licences</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deployments.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <Link to={`/deployments/${d.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{d.company?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{d.publicUrl}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{d.licensesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue cards — mobile <md */}
          <div className="md:hidden space-y-3">
            {deployments.map((d) => (
              <Link key={d.id} to={`/deployments/${d.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0"><Server size={16} className="text-blue-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-blue-600 truncate">{d.name}</div>
                    <div className="text-xs text-gray-500 truncate">{d.company?.name}</div>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                    {d.licensesCount} licence{d.licensesCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-500 truncate pl-11">{d.publicUrl}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
