import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Trash2, Save, Upload } from 'lucide-react';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({});
  const [configForm, setConfigForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    api.getCompany(id).then((data) => {
      setCompany(data);
      setForm({ name: data.name, legalName: data.legalName, contactEmail: data.contactEmail, contactPhone: data.contactPhone, siret: data.siret, notes: data.notes });
      if (data.config) setConfigForm(data.config);
    }).catch(console.error);
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCompany(id, form);
      alert('Entreprise mise à jour');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const { id: _id, companyId: _cid, company: _comp, ...data } = configForm;
      await api.updateCompanyConfig(id, data);
      alert('Configuration mise à jour');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer ${company.name} ?\n\nTout sera supprimé :\n- Licences et appareils activés\n- Déploiements SyncService\n- Configuration branding\n\nCette action est irréversible.`)) return;
    try {
      await api.deleteCompany(id);
      navigate('/companies');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!company) return <div className="text-gray-500">Chargement...</div>;

  const tabs = [
    { key: 'info', label: 'Informations' },
    { key: 'config', label: 'Branding / Config' },
    { key: 'licenses', label: `Licences (${company.licenses?.length || 0})` },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/companies" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nom commercial', key: 'name' },
              { label: 'Raison sociale', key: 'legalName' },
              { label: 'Email', key: 'contactEmail', type: 'email' },
              { label: 'Téléphone', key: 'contactPhone' },
              { label: 'SIRET', key: 'siret' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type || 'text'} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={handleDelete} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm cursor-pointer">
              <Trash2 size={16} /> Supprimer
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">Configuration branding et infos légales (remplace companyInfo.js dans l'app mobile)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Sous-titre', key: 'subtitle' },
              { label: 'Email', key: 'email' },
              { label: 'Téléphone', key: 'phone' },
              { label: 'Site web', key: 'website' },
              { label: 'Adresse', key: 'addressStreet' },
              { label: 'Code postal', key: 'addressZipCode' },
              { label: 'Ville', key: 'addressCity' },
              { label: 'Pays', key: 'addressCountry' },
              { label: 'SIRET', key: 'siret' },
              { label: 'N° TVA', key: 'tva' },
              { label: 'Capital', key: 'capital' },
              { label: 'RCS', key: 'rcs' },
              { label: 'Code APE', key: 'ape' },
              { label: 'Conditions de paiement', key: 'paymentTerms' },
              { label: 'Validité devis (jours)', key: 'quotationValidityDays', type: 'number' },
              { label: 'Taux TVA', key: 'tvaRate', type: 'number', step: '0.01' },
            ].map(({ label, key, type, step }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type || 'text'} step={step} value={configForm[key] ?? ''} onChange={(e) => setConfigForm({ ...configForm, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            {/* Logo upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <div className="flex items-center gap-4">
                {configForm.logoUrl && (
                  <img src={configForm.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-gray-200" />
                )}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Upload size={16} />
                  {uploading ? 'Upload...' : 'Choisir un fichier'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const result = await api.uploadLogo(id, file);
                        setConfigForm({ ...configForm, logoUrl: result.logoUrl });
                      } catch (err) {
                        alert(err.message);
                      } finally {
                        setUploading(false);
                        e.target.value = '';
                      }
                    }} />
                </label>
                <span className="text-xs text-gray-400">PNG, JPG ou WebP, max 2 MB</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">CGV</label>
              <textarea value={configForm.termsAndConditions ?? ''} onChange={(e) => setConfigForm({ ...configForm, termsAndConditions: e.target.value })} rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleSaveConfig} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer la config'}
            </button>
          </div>
        </div>
      )}

      {tab === 'licenses' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {company.licenses?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune licence</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Clé</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expiration</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {company.licenses.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">
                      <Link to={`/licenses/${l.id}`} className="text-blue-600 hover:underline">{l.licenseKey}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{l.plan}</td>
                    <td className="px-6 py-4 text-sm">{new Date(l.expiresAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        l.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {l.isActive ? 'Active' : 'Révoquée'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
