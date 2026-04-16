import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save, Download, Trash2, KeyRound } from 'lucide-react';

const DEPLOYMENT_FIELDS = [
  'name', 'publicUrl', 'localUrl', 'apiKey',
  'sqlHost', 'sqlUser', 'sqlPassword', 'trustServerCertificate',
  'kestrelUrl', 'certPath', 'certPassword',
  'ediOutputFolder', 'ediSeparator',
  'batchSize', 'timeoutSeconds', 'retryAttempts', 'histoPiece',
];

export default function DeploymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = () => api.getDeployment(id).then((d) => {
    setDeployment(d);
    const f = {};
    for (const k of DEPLOYMENT_FIELDS) f[k] = d[k];
    setForm(f);
  }).catch(console.error);

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateDeployment(id, form);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce déploiement ? Les licences associées seront détachées.')) return;
    try {
      await api.deleteDeployment(id);
      navigate('/deployments');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await api.downloadDeploymentAppsettings(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const bind = (field, { number = false, bool = false } = {}) => ({
    value: bool ? undefined : (form[field] ?? ''),
    checked: bool ? !!form[field] : undefined,
    onChange: (e) => {
      const v = bool ? e.target.checked : (number ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value);
      setForm({ ...form, [field]: v });
    },
  });

  if (!deployment) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/deployments" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{deployment.name}</h1>
          <p className="text-sm text-gray-500">
            {deployment.company?.name} &mdash; {deployment.licenses?.length || 0} licence(s) associée(s)
          </p>
        </div>
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer">
          <Download size={16} /> {downloading ? 'Téléchargement...' : 'Télécharger appsettings.json'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration partagée</h2>
        <p className="text-xs text-gray-500 mb-4">
          Ces valeurs s'appliquent à tout le SyncService. Les licences associées peuvent surcharger la connexion SQL
          si leur base tourne sur une instance différente, et définissent leur propre Tircode « Clients divers ».
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Identité */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Identité</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom</label>
            <input {...bind('name')} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">URL publique</label>
            <input {...bind('publicUrl')} placeholder="https://213.56.180.33"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">URL locale</label>
            <input {...bind('localUrl')} placeholder="https://10.0.6.22"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Clé API (X-API-Key)</label>
            <input {...bind('apiKey')} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" />
          </div>

          {/* SQL Server par défaut */}
          <div className="md:col-span-2 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              SQL Server (connexion par défaut)
            </h3>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Serveur (host / IP)</label>
            <input {...bind('sqlHost')} placeholder="localhost ou 10.0.6.22"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Utilisateur SQL</label>
            <input {...bind('sqlUser')} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mot de passe SQL</label>
            <input type="password" {...bind('sqlPassword')}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input id="tsc" type="checkbox" {...bind('trustServerCertificate', { bool: true })}
              className="rounded border-gray-300" />
            <label htmlFor="tsc" className="text-sm text-gray-700">TrustServerCertificate</label>
          </div>

          {/* HTTPS */}
          <div className="md:col-span-2 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">HTTPS (Kestrel)</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">URL d'écoute</label>
            <input {...bind('kestrelUrl')} placeholder="https://*:443"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Chemin du certificat .pfx</label>
            <input {...bind('certPath')} placeholder="certificate.pfx"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Mot de passe du certificat</label>
            <input type="password" {...bind('certPassword')}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>

          {/* EDI */}
          <div className="md:col-span-2 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">WaveSoft EDI</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Dossier de sortie EDI</label>
            <input {...bind('ediOutputFolder')} placeholder="C:\DATA_Wavesoft\AutomateIE"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Séparateur EDI</label>
            <input {...bind('ediSeparator')} placeholder=";"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>

          {/* Sync settings */}
          <div className="md:col-span-2 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Paramètres de synchronisation</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">BatchSize</label>
            <input type="number" {...bind('batchSize', { number: true })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">TimeoutSeconds</label>
            <input type="number" {...bind('timeoutSeconds', { number: true })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">RetryAttempts</label>
            <input type="number" {...bind('retryAttempts', { number: true })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              HistoPiece <span className="text-gray-400">(années, -1 = tout)</span>
            </label>
            <input type="number" {...bind('histoPiece', { number: true })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            <Save size={14} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium ml-auto cursor-pointer">
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      {/* Licences associées */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Licences / bases associées</h2>
        {(deployment.licenses?.length || 0) === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucune licence associée. Attache des licences à ce déploiement depuis le détail d'une licence.
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Licence</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Base WaveSoft</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Tircode Clients divers</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Override SQL ?</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deployment.licenses.map((l) => {
                const c = l.syncConfig || {};
                const hasSqlOverride = !!(c.sqlHost || c.sqlUser || c.sqlPassword);
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono text-gray-700">{l.licenseKey}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{l.databaseName || <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-700">
                      {c.clientsDiversTircode || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {hasSqlOverride ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Oui
                        </span>
                      ) : (
                        <span className="text-gray-400">Hérite du déploiement</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/licenses/${l.id}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 justify-end">
                        <KeyRound size={14} /> Ouvrir
                      </Link>
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
