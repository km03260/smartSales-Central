import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save, Download, Trash2, KeyRound, RefreshCw, ShieldCheck, Plus, X } from 'lucide-react';

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
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certHostnames, setCertHostnames] = useState(['']);
  const [certValidityYears, setCertValidityYears] = useState(10);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);

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

  const openCertModal = () => {
    // Pré-remplir avec les hostnames déjà utilisés ou déduits des URLs
    if (deployment?.certHostnames) {
      setCertHostnames(deployment.certHostnames.split(',').filter(Boolean));
    } else {
      const guess = [];
      const extractHost = (url) => {
        try { return new URL(url).hostname; } catch { return null; }
      };
      const pub = extractHost(deployment?.publicUrl);
      const loc = extractHost(deployment?.localUrl);
      if (pub) guess.push(pub);
      if (loc && loc !== pub) guess.push(loc);
      setCertHostnames(guess.length ? guess : ['']);
    }
    setCertValidityYears(10);
    setCertModalOpen(true);
  };

  const handleGenerateCertificate = async () => {
    const hostnames = certHostnames.map((h) => h.trim()).filter(Boolean);
    if (hostnames.length === 0) {
      alert('Ajoute au moins une IP ou un DNS.');
      return;
    }
    setGeneratingCert(true);
    try {
      await api.generateDeploymentCertificate(id, {
        hostnames,
        validityYears: Number(certValidityYears) || 10,
      });
      await load();
      setCertModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingCert(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloadingCert(true);
    try {
      await api.downloadDeploymentCertificate(id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloadingCert(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!confirm(
      'Regénérer la clé API ?\n\n' +
      'Le SyncService actuellement installé continuera de fonctionner avec l\'ancienne clé ' +
      'jusqu\'à ce que tu télécharges le nouvel appsettings.json et redémarres le service.'
    )) return;
    try {
      const { apiKey } = await api.regenerateDeploymentApiKey(id);
      setForm((f) => ({ ...f, apiKey }));
      await load();
    } catch (err) {
      alert(err.message);
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
            <div className="flex gap-2">
              <input {...bind('apiKey')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" />
              <button type="button" onClick={handleRegenerateApiKey}
                title="Regénérer une nouvelle clé aléatoire"
                className="flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                <RefreshCw size={12} /> Regénérer
              </button>
            </div>
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

          {/* Certificat auto-signé */}
          <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-gray-700" />
                  <span className="text-sm font-semibold text-gray-900">Certificat auto-signé</span>
                </div>
                {deployment.certPfxBase64 || deployment.certHostnames ? (
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>
                      <span className="text-gray-500">Hostnames :</span>{' '}
                      <span className="font-mono">{deployment.certHostnames || '—'}</span>
                    </div>
                    {deployment.certValidUntil && (
                      <div>
                        <span className="text-gray-500">Valide jusqu'au :</span>{' '}
                        {new Date(deployment.certValidUntil).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Aucun certificat généré. Clique sur « Générer » ci-contre pour créer un certificat auto-signé.</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button type="button" onClick={openCertModal}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer">
                  <ShieldCheck size={12} /> {deployment.certHostnames ? 'Regénérer' : 'Générer'}
                </button>
                {deployment.certHostnames && (
                  <button type="button" onClick={handleDownloadCertificate} disabled={downloadingCert}
                    className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer">
                    <Download size={12} /> {downloadingCert ? '...' : 'Télécharger .pfx'}
                  </button>
                )}
              </div>
            </div>
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

      {/* Modal génération certificat */}
      {certModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !generatingCert && setCertModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {deployment.certHostnames ? 'Regénérer' : 'Générer'} un certificat auto-signé
                </h3>
              </div>
              <button onClick={() => setCertModalOpen(false)} disabled={generatingCert}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Le certificat couvrira les IPs et DNS que tu listes ci-dessous (SAN). Il sera stocké en base et
              téléchargeable ensuite au format <code className="font-mono bg-gray-100 px-1 rounded">.pfx</code>.
              Un mot de passe aléatoire est généré automatiquement et injecté dans l'appsettings.json.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IPs / DNS à couvrir (Subject Alternative Names)
              </label>
              <div className="space-y-2">
                {certHostnames.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={h}
                      onChange={(e) => {
                        const next = [...certHostnames];
                        next[i] = e.target.value;
                        setCertHostnames(next);
                      }}
                      placeholder="213.56.180.33 ou srv-maurer.local"
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono" />
                    <button type="button"
                      onClick={() => setCertHostnames(certHostnames.filter((_, j) => j !== i))}
                      disabled={certHostnames.length === 1}
                      className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setCertHostnames([...certHostnames, ''])}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Validité (années)</label>
              <input type="number" value={certValidityYears} min={1} max={30}
                onChange={(e) => setCertValidityYears(e.target.value)}
                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
            </div>

            {deployment.certHostnames && (
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2 mb-4">
                Un certificat existe déjà. Regénérer le remplacera définitivement ; il faudra retélécharger
                le <code className="font-mono">.pfx</code> et le <code className="font-mono">appsettings.json</code>,
                puis redémarrer le SyncService.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCertModalOpen(false)} disabled={generatingCert}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm cursor-pointer disabled:opacity-50">
                Annuler
              </button>
              <button type="button" onClick={handleGenerateCertificate} disabled={generatingCert}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                <ShieldCheck size={14} /> {generatingCert ? 'Génération...' : 'Générer le certificat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
