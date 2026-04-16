import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  ArrowLeft, Ban, RefreshCw, Smartphone, Save, Server, Database, ServerCog,
  Plus, Trash2, Star, StarOff, Pencil, X, Check,
} from 'lucide-react';

export default function LicenseDetail() {
  const { id } = useParams();
  const [license, setLicense] = useState(null);
  const [editForm, setEditForm] = useState({ deploymentId: '', maxDevices: 5 });
  const [renewDate, setRenewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deployments, setDeployments] = useState([]);

  // Instances : ajout / édition
  const [newInst, setNewInst] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [editingInstForm, setEditingInstForm] = useState({});
  const [savingInst, setSavingInst] = useState(false);

  // Bases (par instance) : ajout / édition
  const [newDbForInstance, setNewDbForInstance] = useState(null); // { instanceId, form }
  const [editingDbId, setEditingDbId] = useState(null);
  const [editingDbForm, setEditingDbForm] = useState({});
  const [savingDb, setSavingDb] = useState(false);

  const load = () => api.getLicense(id).then((data) => {
    setLicense(data);
    setEditForm({
      deploymentId: data.deploymentId || '',
      maxDevices: data.maxDevices,
    });
    if (data.companyId) {
      api.getDeployments(data.companyId).then(setDeployments).catch(console.error);
    }
  }).catch(console.error);

  useEffect(() => { load(); }, [id]);

  // ─── Actions licence ─────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    setSaving(true);
    try { await api.updateLicense(id, editForm); load(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleRevoke = async () => {
    if (!confirm('Révoquer cette licence ? Tous les appareils seront désactivés.')) return;
    await api.revokeLicense(id); load();
  };

  const handleRenew = async () => {
    if (!renewDate) return alert('Sélectionnez une date');
    await api.renewLicense(id, { expiresAt: renewDate });
    setRenewDate(''); load();
  };

  const handleToggleBlock = async () => {
    if (license.isBlocked) {
      await api.unblockLicense(id);
    } else {
      if (!confirm('Bloquer cette licence ?')) return;
      await api.blockLicense(id);
    }
    load();
  };

  const handleDeactivateDevice = async (deviceId) => {
    if (!confirm('Désactiver cet appareil ?')) return;
    await api.deactivateDevice(id, deviceId); load();
  };

  // ─── Actions instances ──────────────────────────────────────────────────
  const openAddInstance = () => setNewInst({
    key: '', label: '', isDefault: false,
    sqlHost: '', sqlUser: '', sqlPassword: '',
  });

  const handleCreateInstance = async () => {
    if (!newInst.key?.trim()) return alert('La key de l\'instance est requise');
    setSavingInst(true);
    try {
      await api.createLicenseInstance(id, newInst);
      setNewInst(null);
      await load();
    } catch (err) { alert(err.message); }
    finally { setSavingInst(false); }
  };

  const startEditInstance = (inst) => {
    setEditingInstId(inst.id);
    setEditingInstForm({
      key: inst.key,
      label: inst.label || '',
      sqlHost: inst.sqlHost || '',
      sqlUser: inst.sqlUser || '',
      sqlPassword: inst.sqlPassword || '',
    });
  };

  const handleUpdateInstance = async () => {
    setSavingInst(true);
    try {
      await api.updateLicenseInstance(id, editingInstId, editingInstForm);
      setEditingInstId(null); setEditingInstForm({});
      await load();
    } catch (err) { alert(err.message); }
    finally { setSavingInst(false); }
  };

  const handleDeleteInstance = async (inst) => {
    if (!confirm(`Supprimer l'instance "${inst.key}" et TOUTES ses bases ?`)) return;
    try {
      await api.deleteLicenseInstance(id, inst.id);
      await load();
    } catch (err) { alert(err.message); }
  };

  const handleToggleDefaultInstance = async (inst) => {
    try {
      await api.updateLicenseInstance(id, inst.id, { isDefault: !inst.isDefault });
      await load();
    } catch (err) { alert(err.message); }
  };

  // ─── Actions bases ──────────────────────────────────────────────────────
  const openAddDb = (instanceId) => setNewDbForInstance({
    instanceId,
    form: { name: '', label: '', isDefault: false, clientsDiversTircode: '' },
  });

  const handleCreateDb = async () => {
    const { instanceId, form } = newDbForInstance;
    if (!form.name?.trim()) return alert('Le nom de la base est requis');
    setSavingDb(true);
    try {
      await api.createLicenseDatabase(id, instanceId, form);
      setNewDbForInstance(null);
      await load();
    } catch (err) { alert(err.message); }
    finally { setSavingDb(false); }
  };

  const startEditDb = (db) => {
    setEditingDbId(db.id);
    setEditingDbForm({
      instanceId: db.instanceId,
      name: db.name,
      label: db.label || '',
      clientsDiversTircode: db.clientsDiversTircode || '',
    });
  };

  const handleUpdateDb = async () => {
    setSavingDb(true);
    try {
      await api.updateLicenseDatabase(id, editingDbForm.instanceId, editingDbId, {
        name: editingDbForm.name,
        label: editingDbForm.label,
        clientsDiversTircode: editingDbForm.clientsDiversTircode,
      });
      setEditingDbId(null); setEditingDbForm({});
      await load();
    } catch (err) { alert(err.message); }
    finally { setSavingDb(false); }
  };

  const handleDeleteDb = async (db) => {
    if (!confirm(`Supprimer la base "${db.name}" ?`)) return;
    try {
      await api.deleteLicenseDatabase(id, db.instanceId, db.id);
      await load();
    } catch (err) { alert(err.message); }
  };

  const handleToggleDefaultDb = async (db) => {
    try {
      await api.updateLicenseDatabase(id, db.instanceId, db.id, { isDefault: !db.isDefault });
      await load();
    } catch (err) { alert(err.message); }
  };

  if (!license) return <div className="text-gray-500">Chargement...</div>;

  const isExpired = new Date(license.expiresAt) < new Date();
  const instances = license.instances || [];

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
                <label className="block text-xs text-gray-500 mb-1">Déploiement SyncService *</label>
                <select value={editForm.deploymentId}
                  onChange={(e) => setEditForm({ ...editForm, deploymentId: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required>
                  <option value="">-- Sélectionner --</option>
                  {deployments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.publicUrl})</option>
                  ))}
                </select>
                {license.deployment && (
                  <Link to={`/deployments/${license.deployment.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1">
                    <Server size={12} /> Ouvrir le déploiement ({license.deployment.publicUrl})
                  </Link>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max appareils (global toutes instances/bases)</label>
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

      {/* Instances SQL + bases */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ServerCog size={18} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Instances SQL &amp; bases</h2>
            <span className="text-sm text-gray-500">({instances.length} instance(s))</span>
          </div>
          <button onClick={openAddInstance} disabled={!!newInst}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            <Plus size={14} /> Ajouter une instance
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          L'app mobile envoie <code className="font-mono bg-gray-100 px-1 rounded">X-Instance</code> (key) + <code className="font-mono bg-gray-100 px-1 rounded">X-Database</code> (nom de base).
          L'<Star size={12} className="inline text-yellow-500" /> marque l'instance et la base par défaut.
        </p>

        {/* Form création instance */}
        {newInst && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Nouvelle instance SQL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Key *</label>
                <input value={newInst.key}
                  onChange={(e) => setNewInst({ ...newInst, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  placeholder="ex: SIEGE, FILIALE"
                  autoFocus
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono" />
                <p className="text-xs text-gray-400 mt-0.5">Envoyé dans X-Instance</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Libellé</label>
                <input value={newInst.label}
                  onChange={(e) => setNewInst({ ...newInst, label: e.target.value })}
                  placeholder="Siège de Lyon"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Serveur SQL (host/IP)</label>
                <input value={newInst.sqlHost}
                  onChange={(e) => setNewInst({ ...newInst, sqlHost: e.target.value })}
                  placeholder="(hérité du déploiement)"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Utilisateur SQL</label>
                <input value={newInst.sqlUser}
                  onChange={(e) => setNewInst({ ...newInst, sqlUser: e.target.value })}
                  placeholder="(hérité du déploiement)"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Mot de passe SQL</label>
                <input type="password" value={newInst.sqlPassword}
                  onChange={(e) => setNewInst({ ...newInst, sqlPassword: e.target.value })}
                  placeholder="(hérité du déploiement)"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input id="newInstDefault" type="checkbox" checked={!!newInst.isDefault}
                  onChange={(e) => setNewInst({ ...newInst, isDefault: e.target.checked })} />
                <label htmlFor="newInstDefault" className="text-sm text-gray-700">
                  Instance par défaut (forcée à vrai si c'est la première)
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleCreateInstance} disabled={savingInst}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {savingInst ? 'Création...' : 'Créer l\'instance'}
              </button>
              <button onClick={() => setNewInst(null)} className="text-gray-600 hover:text-gray-900 text-sm cursor-pointer">
                Annuler
              </button>
            </div>
          </div>
        )}

        {instances.length === 0 && !newInst ? (
          <div className="text-center text-gray-500 text-sm py-8 border border-dashed border-gray-300 rounded-lg">
            Aucune instance. Clique « Ajouter une instance » pour en créer une.
          </div>
        ) : (
          <div className="space-y-4">
            {instances.map((inst) => {
              const isEditingInst = editingInstId === inst.id;
              const isAddingDbHere = newDbForInstance?.instanceId === inst.id;
              return (
                <div key={inst.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Entête instance */}
                  {isEditingInst ? (
                    <div className="bg-blue-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Key</label>
                          <input value={editingInstForm.key}
                            onChange={(e) => setEditingInstForm({ ...editingInstForm, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Libellé</label>
                          <input value={editingInstForm.label}
                            onChange={(e) => setEditingInstForm({ ...editingInstForm, label: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Serveur SQL</label>
                          <input value={editingInstForm.sqlHost}
                            onChange={(e) => setEditingInstForm({ ...editingInstForm, sqlHost: e.target.value })}
                            placeholder="(hérité)"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">User SQL</label>
                          <input value={editingInstForm.sqlUser}
                            onChange={(e) => setEditingInstForm({ ...editingInstForm, sqlUser: e.target.value })}
                            placeholder="(hérité)"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Mdp SQL</label>
                          <input type="password" value={editingInstForm.sqlPassword}
                            onChange={(e) => setEditingInstForm({ ...editingInstForm, sqlPassword: e.target.value })}
                            placeholder="(hérité — laisser vide pour ne pas changer)"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={handleUpdateInstance} disabled={savingInst}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                          <Check size={14} /> Enregistrer
                        </button>
                        <button onClick={() => { setEditingInstId(null); setEditingInstForm({}); }}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm cursor-pointer">
                          <X size={14} /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleDefaultInstance(inst)}
                          title={inst.isDefault ? 'Instance par défaut' : 'Définir comme défaut'}
                          className="cursor-pointer">
                          {inst.isDefault ? (
                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff size={16} className="text-gray-300 hover:text-yellow-500" />
                          )}
                        </button>
                        <ServerCog size={16} className="text-gray-500" />
                        <div>
                          <span className="font-mono text-sm font-medium text-gray-900">{inst.key}</span>
                          {inst.label && inst.label !== inst.key && (
                            <span className="ml-2 text-sm text-gray-600">— {inst.label}</span>
                          )}
                        </div>
                        {inst.sqlHost && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-mono">
                            {inst.sqlHost}
                          </span>
                        )}
                        {!inst.sqlHost && (
                          <span className="text-xs text-gray-400">SQL hérité</span>
                        )}
                        <span className="text-xs text-gray-500">· {(inst.databases || []).length} base(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openAddDb(inst.id)} disabled={!!newDbForInstance}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 cursor-pointer disabled:opacity-50">
                          <Plus size={12} /> Base
                        </button>
                        <button onClick={() => startEditInstance(inst)}
                          className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteInstance(inst)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bases de cette instance */}
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 w-10"></th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Base (X-Database)</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Libellé</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Tircode Divers</th>
                        <th className="w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(inst.databases || []).map((db) => (
                        editingDbId === db.id ? (
                          <tr key={db.id} className="bg-blue-50">
                            <td></td>
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
                              <button onClick={() => handleToggleDefaultDb(db)}
                                title={db.isDefault ? 'Base par défaut' : 'Définir comme défaut'}
                                className="cursor-pointer">
                                {db.isDefault ? (
                                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                ) : (
                                  <StarOff size={14} className="text-gray-300 hover:text-yellow-500" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-sm font-mono font-medium text-gray-900 flex items-center gap-1">
                              <Database size={12} className="text-gray-400" /> {db.name}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700">{db.label || <span className="text-gray-400">—</span>}</td>
                            <td className="px-3 py-2 text-sm font-mono text-gray-700">
                              {db.clientsDiversTircode || <span className="text-gray-400">—</span>}
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

                      {/* Form ajout base pour cette instance */}
                      {isAddingDbHere && (
                        <tr className="bg-blue-50">
                          <td className="px-3 py-2">
                            <button onClick={() => setNewDbForInstance({
                              ...newDbForInstance,
                              form: { ...newDbForInstance.form, isDefault: !newDbForInstance.form.isDefault },
                            })} className="cursor-pointer">
                              {newDbForInstance.form.isDefault ? (
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              ) : (
                                <StarOff size={14} className="text-gray-300 hover:text-yellow-500" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <input value={newDbForInstance.form.name}
                              onChange={(e) => setNewDbForInstance({
                                ...newDbForInstance,
                                form: { ...newDbForInstance.form, name: e.target.value },
                              })}
                              placeholder="PROD"
                              autoFocus
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={newDbForInstance.form.label}
                              onChange={(e) => setNewDbForInstance({
                                ...newDbForInstance,
                                form: { ...newDbForInstance.form, label: e.target.value },
                              })}
                              placeholder="(défaut = nom)"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                          </td>
                          <td className="px-3 py-2">
                            <input value={newDbForInstance.form.clientsDiversTircode}
                              onChange={(e) => setNewDbForInstance({
                                ...newDbForInstance,
                                form: { ...newDbForInstance.form, clientsDiversTircode: e.target.value },
                              })}
                              placeholder="DIV001"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono" />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={handleCreateDb} disabled={savingDb}
                              className="text-green-600 hover:text-green-800 p-1 cursor-pointer disabled:opacity-50">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setNewDbForInstance(null)}
                              className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer">
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      )}

                      {(inst.databases || []).length === 0 && !isAddingDbHere && (
                        <tr>
                          <td colSpan={5} className="px-3 py-3 text-sm text-gray-400 text-center italic">
                            Aucune base. Clique « + Base » ci-dessus.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
