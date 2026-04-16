import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Ban, RefreshCw, Smartphone, Save, Server, Settings } from 'lucide-react';

const DEFAULT_SYNC_CONFIG = {
  sqlHost: '',
  sqlUser: '',
  sqlPassword: '',
  clientsDiversTircode: '',
};

export default function LicenseDetail() {
  const { id } = useParams();
  const [license, setLicense] = useState(null);
  const [editForm, setEditForm] = useState({ syncServiceUrl: '', databaseName: '', maxDevices: 5, deploymentId: '' });
  const [renewDate, setRenewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncConfig, setSyncConfig] = useState(DEFAULT_SYNC_CONFIG);
  const [savingSyncConfig, setSavingSyncConfig] = useState(false);
  const [deployments, setDeployments] = useState([]);

  const load = () => api.getLicense(id).then((data) => {
    setLicense(data);
    setEditForm({
      syncServiceUrl: data.syncServiceUrl,
      syncServiceUrlLocal: data.syncServiceUrlLocal || '',
      databaseName: data.databaseName || '',
      maxDevices: data.maxDevices,
      deploymentId: data.deploymentId || '',
    });
    // Charger les déploiements de la même entreprise
    if (data.companyId) {
      api.getDeployments(data.companyId).then(setDeployments).catch(console.error);
    }
  }).catch(console.error);

  const loadSyncConfig = () => api.getSyncConfig(id).then((cfg) => {
    setSyncConfig(cfg ? { ...DEFAULT_SYNC_CONFIG, ...cfg } : DEFAULT_SYNC_CONFIG);
  }).catch(console.error);

  useEffect(() => { load(); loadSyncConfig(); }, [id]);

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

  const handleSaveSyncConfig = async () => {
    setSavingSyncConfig(true);
    try {
      await api.updateSyncConfig(id, syncConfig);
      await loadSyncConfig();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSyncConfig(false);
    }
  };

  const bindSync = (field) => ({
    value: syncConfig[field] ?? '',
    onChange: (e) => setSyncConfig({ ...syncConfig, [field]: e.target.value }),
  });

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
                <label className="block text-xs text-gray-500 mb-1">Déploiement SyncService</label>
                <select value={editForm.deploymentId}
                  onChange={(e) => setEditForm({ ...editForm, deploymentId: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Aucun --</option>
                  {deployments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.publicUrl})</option>
                  ))}
                </select>
                {license.deployment && (
                  <Link to={`/deployments/${license.deployment.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1">
                    <Server size={12} /> Ouvrir le déploiement
                  </Link>
                )}
              </div>
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
                <label className="block text-xs text-gray-500 mb-1">Base WaveSoft (= header X-Database)</label>
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

      {/* Overrides par base (SyncService) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Configuration par base</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Valeurs spécifiques à cette base WaveSoft. Le reste (Kestrel, EDI, sync settings, connexion SQL par défaut,
          clé API) vient du{' '}
          {license.deployment ? (
            <Link to={`/deployments/${license.deployment.id}`} className="text-blue-600 hover:underline">
              déploiement {license.deployment.name}
            </Link>
          ) : (
            <span className="text-orange-600">déploiement (non associé — sélectionne-en un ci-dessus)</span>
          )}.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">
              Tircode « Clients divers »
            </label>
            <input {...bindSync('clientsDiversTircode')} placeholder="ex: DIVERS001"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" />
            <p className="text-xs text-gray-400 mt-1">Propre à cette base. Utilisé par WaveSoft pour identifier les ventes comptoir.</p>
          </div>

          <div className="md:col-span-2 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Override SQL (optionnel)</h3>
            <p className="text-xs text-gray-500 mb-2">
              À remplir uniquement si cette base tourne sur une instance SQL Server différente du déploiement.
              Laissé vide = hérite des valeurs du déploiement.
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Serveur SQL (host / IP)</label>
            <input {...bindSync('sqlHost')} placeholder="(hérité du déploiement)"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Utilisateur SQL</label>
            <input {...bindSync('sqlUser')} placeholder="(hérité du déploiement)"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Mot de passe SQL</label>
            <input {...bindSync('sqlPassword')} type="password" placeholder="(hérité du déploiement)"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <button onClick={handleSaveSyncConfig} disabled={savingSyncConfig}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            <Save size={14} /> {savingSyncConfig ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
