import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  ArrowLeft, Ban, RefreshCw, Smartphone, Save, Server, Database,
  Plus, Trash2, Star, StarOff, Pencil, X, Check,
} from 'lucide-react';

export default function LicenseDetail() {
  const { id } = useParams();
  const [license, setLicense] = useState(null);
  const [editForm, setEditForm] = useState({
    deploymentId: '',
    syncServiceUrl: '',
    syncServiceUrlLocal: '',
    maxDevices: 5,
  });
  const [renewDate, setRenewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deployments, setDeployments] = useState([]);

  // Nouveau : liste des bases + formulaire d'ajout
  const [newDb, setNewDb] = useState(null); // null = form fermé, {} = form ouvert
  const [editingDbId, setEditingDbId] = useState(null);
  const [editingDbForm, setEditingDbForm] = useState({});
  const [savingDb, setSavingDb] = useState(false);

  const load = () => api.getLicense(id).then((data) => {
    setLicense(data);
    setEditForm({
      deploymentId: data.deploymentId || '',
      syncServiceUrl: data.syncServiceUrl,
      syncServiceUrlLocal: data.syncServiceUrlLocal || '',
      maxDevices: data.maxDevices,
    });
    if (data.companyId) {
      api.getDeployments(data.companyId).then(setDeployments).catch(console.error);
    }
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

  // ─── Bases (LicenseDatabase) ────────────────────────────────────────────
  const openAddDb = () => setNewDb({
    name: '', label: '', isDefault: false,
    sqlHost: '', sqlUser: '', sqlPassword: '',
    clientsDiversTircode: '',
  });

  const handleCreateDb = async () => {
    if (!newDb.name?.trim()) return alert('Le nom de la base est requis');
    setSavingDb(true);
    try {
      await api.createLicenseDatabase(id, newDb);
      setNewDb(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingDb(false);
    }
  };

  const startEditDb = (db) => {
    setEditingDbId(db.id);
    setEditingDbForm({
      name: db.name,
      label: db.label || '',
      sqlHost: db.sqlHost || '',
      sqlUser: db.sqlUser || '',
      sqlPassword: db.sqlPassword || '',
      clientsDiversTircode: db.clientsDiversTircode || '',
    });
  };

  const handleUpdateDb = async () => {
    setSavingDb(true);
    try {
      await api.updateLicenseDatabase(id, editingDbId, editingDbForm);
      setEditingDbId(null);
      setEditingDbForm({});
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingDb(false);
    }
  };

  const handleDeleteDb = async (db) => {
    if (!confirm(`Supprimer la base "${db.name}" ?`)) return;
    try {
      await api.deleteLicenseDatabase(id, db.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleDefault = async (db) => {
    try {
      await api.updateLicenseDatabase(id, db.id, { isDefault: !db.isDefault });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!license) return <div className="text-gray-500">Chargement...</div>;

  const isExpired = new Date(license.expiresAt) < new Date();
  const databases = license.databases || [];

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
                <label className="block text-xs text-gray-500 mb-1">Max appareils (global toutes bases)</label>
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

      {/* Bases WaveSoft rattachées à cette licence */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Bases WaveSoft</h2>
            <span className="text-sm text-gray-500">({databases.length})</span>
          </div>
          <button onClick={openAddDb} disabled={!!newDb}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            <Plus size={14} /> Ajouter une base
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Chaque base = une valeur envoyée dans le header <code className="font-mono bg-gray-100 px-1 rounded">X-Database</code>.
          La <strong>base par défaut</strong> (<Star size={12} className="inline text-yellow-500" />) est utilisée automatiquement par l'app mobile.
          Les overrides SQL ne sont nécessaires que si la base tourne sur une instance SQL Server différente du déploiement.
          {!license.deployment && (
            <span className="block mt-1 text-orange-600">
              Licence non associée à un déploiement — sélectionne-en un pour que les paramètres Kestrel/EDI/SQL par défaut soient utilisés.
            </span>
          )}
        </p>

        {databases.length === 0 && !newDb ? (
          <div className="text-center text-gray-500 text-sm py-8 border border-dashed border-gray-300 rounded-lg">
            Aucune base. Clique « Ajouter une base » pour en créer une.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 w-12"></th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Nom (X-Database)</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Libellé</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Tircode Divers</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Instance SQL</th>
                <th className="w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {databases.map((db) => (
                editingDbId === db.id ? (
                  <tr key={db.id} className="bg-blue-50">
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2">
                      <input value={editingDbForm.name}
                        onChange={(e) => setEditingDbForm({ ...editingDbForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={editingDbForm.label}
                        onChange={(e) => setEditingDbForm({ ...editingDbForm, label: e.target.value })}
                        placeholder="(défaut = nom)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={editingDbForm.clientsDiversTircode}
                        onChange={(e) => setEditingDbForm({ ...editingDbForm, clientsDiversTircode: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={editingDbForm.sqlHost}
                        onChange={(e) => setEditingDbForm({ ...editingDbForm, sqlHost: e.target.value })}
                        placeholder="(hérité)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono mb-1" />
                      <input value={editingDbForm.sqlUser}
                        onChange={(e) => setEditingDbForm({ ...editingDbForm, sqlUser: e.target.value })}
                        placeholder="user SQL"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono mb-1" />
                      <input type="password" value={editingDbForm.sqlPassword}
                        onChange={(e) => setEditingDbForm({ ...editingDbForm, sqlPassword: e.target.value })}
                        placeholder="mdp SQL"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={handleUpdateDb} disabled={savingDb}
                        className="text-green-600 hover:text-green-800 p-1 cursor-pointer disabled:opacity-50">
                        <Check size={16} />
                      </button>
                      <button onClick={() => { setEditingDbId(null); setEditingDbForm({}); }}
                        className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer">
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={db.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <button onClick={() => handleToggleDefault(db)}
                        title={db.isDefault ? 'Base par défaut' : 'Définir comme défaut'}
                        className="cursor-pointer">
                        {db.isDefault ? (
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff size={16} className="text-gray-300 hover:text-yellow-500" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm font-mono font-medium text-gray-900">{db.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{db.label || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-2 text-sm font-mono text-gray-700">
                      {db.clientsDiversTircode || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {db.sqlHost ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-mono">
                          {db.sqlHost}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Hérite du déploiement</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => startEditDb(db)}
                        className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteDb(db)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              ))}

              {newDb && (
                <tr className="bg-blue-50">
                  <td className="px-3 py-2">
                    <button onClick={() => setNewDb({ ...newDb, isDefault: !newDb.isDefault })} className="cursor-pointer">
                      {newDb.isDefault ? (
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff size={16} className="text-gray-300 hover:text-yellow-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <input value={newDb.name}
                      onChange={(e) => setNewDb({ ...newDb, name: e.target.value })}
                      placeholder="ex: TESTS_MAURER"
                      autoFocus
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={newDb.label}
                      onChange={(e) => setNewDb({ ...newDb, label: e.target.value })}
                      placeholder="(défaut = nom)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={newDb.clientsDiversTircode}
                      onChange={(e) => setNewDb({ ...newDb, clientsDiversTircode: e.target.value })}
                      placeholder="DIV001"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={newDb.sqlHost}
                      onChange={(e) => setNewDb({ ...newDb, sqlHost: e.target.value })}
                      placeholder="(hérité)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono mb-1" />
                    <input value={newDb.sqlUser}
                      onChange={(e) => setNewDb({ ...newDb, sqlUser: e.target.value })}
                      placeholder="user SQL"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono mb-1" />
                    <input type="password" value={newDb.sqlPassword}
                      onChange={(e) => setNewDb({ ...newDb, sqlPassword: e.target.value })}
                      placeholder="mdp SQL"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={handleCreateDb} disabled={savingDb}
                      className="text-green-600 hover:text-green-800 p-1 cursor-pointer disabled:opacity-50">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setNewDb(null)}
                      className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer">
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
