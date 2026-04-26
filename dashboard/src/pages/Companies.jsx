import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Building2 } from 'lucide-react';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', legalName: '', contactEmail: '', contactPhone: '', siret: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getCompanies().then(setCompanies).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCompany(form);
      setForm({ name: '', legalName: '', contactEmail: '', contactPhone: '', siret: '' });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Nouvelle entreprise
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle entreprise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom commercial *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale *</label>
              <input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
              <input value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              {saving ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {companies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune entreprise</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Licences</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Config</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/companies/${c.id}`} className="flex items-center gap-3 group">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><Building2 size={16} className="text-blue-600" /></div>
                      <div>
                        <div className="font-semibold text-blue-600 group-hover:text-blue-800 group-hover:underline">{c.name}</div>
                        <div className="text-sm text-gray-500">{c.legalName}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.contactEmail}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.activeLicenses > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.activeLicenses} active{c.activeLicenses > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.hasConfig ? (
                      <span className="text-green-600 text-sm">Configuré</span>
                    ) : (
                      <span className="text-orange-500 text-sm">Non configuré</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
