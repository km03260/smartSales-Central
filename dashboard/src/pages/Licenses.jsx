import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, KeyRound, ChevronRight } from 'lucide-react';

export default function Licenses() {
  const [licenses, setLicenses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [apps, setApps] = useState([]);
  const [filterAppId, setFilterAppId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ appId: '', companyId: '', syncServiceUrl: '', databaseName: '', apiKey: '', maxDevices: 5, plan: 'professional', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getLicenses(filterAppId || undefined).then(setLicenses).catch(console.error);

  useEffect(() => {
    load();
    api.getCompanies().then(setCompanies).catch(console.error);
    api.getApps().then(setApps).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [filterAppId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLicense(form);
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (license) => {
    if (!license.isActive) return { cls: 'bg-red-100 text-red-700', label: 'Révoquée' };
    if (new Date(license.expiresAt) < new Date()) return { cls: 'bg-red-100 text-red-700', label: 'Expirée' };
    const daysLeft = Math.ceil((new Date(license.expiresAt) - new Date()) / 86400000);
    if (daysLeft <= 30) return { cls: 'bg-orange-100 text-orange-700', label: `Expire dans ${daysLeft}j` };
    return { cls: 'bg-green-100 text-green-700', label: 'Active' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Licences</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
          <Plus size={16} /> Nouvelle licence
        </button>
      </div>

      {/* Filtre par app */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilterAppId('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            !filterAppId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          Toutes
        </button>
        {apps.map((a) => (
          <button key={a.id} onClick={() => setFilterAppId(a.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filterAppId === a.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {a.name}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle licence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application *</label>
              <select value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Sélectionner...</option>
                {apps.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
              <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Sélectionner...</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.legalName})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL SyncService *</label>
              <input value={form.syncServiceUrl} onChange={(e) => setForm({ ...form, syncServiceUrl: e.target.value })}
                placeholder="https://213.56.180.33"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dossier (base WaveSoft)</label>
              <input value={form.databaseName} onChange={(e) => setForm({ ...form, databaseName: e.target.value })}
                placeholder="TESTS_MAURER"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clé API SyncService *</label>
              <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max appareils</label>
              <input type="number" value={form.maxDevices} onChange={(e) => setForm({ ...form, maxDevices: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration *</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              {saving ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">Annuler</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {licenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune licence</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Clé</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">App</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Appareils</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expiration</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {licenses.map((l) => {
                const badge = statusBadge(l);
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{l.licenseKey}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {l.app?.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{l.company?.name}</td>
                    <td className="px-6 py-4 text-sm capitalize">{l.plan}</td>
                    <td className="px-6 py-4 text-sm">{l.activeDevices}/{l.maxDevices}</td>
                    <td className="px-6 py-4 text-sm">{new Date(l.expiresAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/licenses/${l.id}`} className="text-blue-600 hover:text-blue-800"><ChevronRight size={18} /></Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
