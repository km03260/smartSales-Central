import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Ban, RefreshCw, Smartphone, Save } from 'lucide-react';

export default function LicenseDetail() {
  const { id } = useParams();
  const [license, setLicense] = useState(null);
  const [editForm, setEditForm] = useState({ syncServiceUrl: '', databaseName: '', maxDevices: 5 });
  const [renewDate, setRenewDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getLicense(id).then((data) => {
    setLicense(data);
    setEditForm({ syncServiceUrl: data.syncServiceUrl, syncServiceUrlLocal: data.syncServiceUrlLocal || '', databaseName: data.databaseName || '', maxDevices: data.maxDevices });
  }).catch(console.error);
  useEffect(() => { load(); }, [id]);

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await api.updateLicense(id, editForm);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Révoquer cette licence ? Tous les appareils seront désactivés.')) return;
    await api.revokeLicense(id);
    load();
  };

  const handleRenew = async () => {
    if (!renewDate) return alert('Sélectionnez une date');
    await api.renewLicense(id, { expiresAt: renewDate });
    setRenewDate('');
    load();
  };

  const handleToggleBlock = async () => {
    if (license.isBlocked) {
      await api.unblockLicense(id);
    } else {
      if (!confirm('Bloquer cette licence ? L\'application sera bloquée au prochain heartbeat.')) return;
      await api.blockLicense(id);
    }
    load();
  };

  const handleDeactivateDevice = async (deviceId) => {
    if (!confirm('Désactiver cet appareil ?')) return;
    await api.deactivateDevice(id, deviceId);
    load();
  };

  if (!license) return <div className="text-gray-500">Chargement...</div>;

  const isExpired = new Date(license.expiresAt) < new Date();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/licenses" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{license.licenseKey}</h1>
            {license.app && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {license.app.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{license.company?.name} &mdash; {license.company?.legalName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos licence */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
          <dl className="space-y-3">
            {[
              { label: 'Plan', value: license.plan, capitalize: true },
              { label: 'Features', value: Array.isArray(license.features) ? license.features.join(', ') : '' },
              { label: 'Début', value: new Date(license.startsAt).toLocaleDateString('fr-FR') },
              { label: 'Expiration', value: new Date(license.expiresAt).toLocaleDateString('fr-FR') },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className={`text-sm font-medium text-gray-900 ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
              </div>
            ))}

            {/* Champs éditables */}
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL SyncService (publique)</label>
                <input value={editForm.syncServiceUrl} onChange={(e) => setEditForm({ ...editForm, syncServiceUrl: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">URL SyncService (locale)</label>
                <input value={editForm.syncServiceUrlLocal} onChange={(e) => setEditForm({ ...editForm, syncServiceUrlLocal: e.target.value })}
                  placeholder="https://10.0.6.22"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dossier (base WaveSoft)</label>
                <input value={editForm.databaseName} onChange={(e) => setEditForm({ ...editForm, databaseName: e.target.value })}
                  placeholder="TESTS_MAURER"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max appareils</label>
                <input type="number" value={editForm.maxDevices} onChange={(e) => setEditForm({ ...editForm, maxDevices: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer w-full justify-center">
                <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Statut</dt>
              <dd className="flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  !license.isActive ? 'bg-red-100 text-red-700' :
                  isExpired ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {!license.isActive ? 'Révoquée' : isExpired ? 'Expirée' : 'Active'}
                </span>
                {license.isBlocked && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Bloquée
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            {license.isActive && (
              <button onClick={handleRevoke}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer">
                <Ban size={16} /> Révoquer
              </button>
            )}
            {license.isActive && (
              <button onClick={handleToggleBlock}
                className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${
                  license.isBlocked ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'
                }`}>
                {license.isBlocked ? 'Débloquer' : 'Bloquer'}
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleRenew}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer">
                <RefreshCw size={14} /> Renouveler
              </button>
            </div>
          </div>
        </div>

        {/* Appareils */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appareils ({license.devices?.filter(d => d.isActive).length}/{license.maxDevices})
          </h2>
          {license.devices?.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun appareil activé</p>
          ) : (
            <div className="space-y-3">
              {license.devices.map((d) => (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg ${d.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} className={d.isActive ? 'text-blue-600' : 'text-gray-400'} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.deviceName || 'Appareil'}</div>
                      <div className="text-xs text-gray-500 font-mono">{d.deviceId}</div>
                      <div className="text-xs text-gray-400">
                        {d.platform} &mdash; Dernier contact : {new Date(d.lastHeartbeat).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  {d.isActive && (
                    <button onClick={() => handleDeactivateDevice(d.deviceId)}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer">Désactiver</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
