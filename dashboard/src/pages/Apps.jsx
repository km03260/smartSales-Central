import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Package, Upload, Trash2, Download, QrCode, Plus, X } from 'lucide-react';

export default function Apps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);

  const load = () =>
    api.getApps().then((data) => { setApps(data); setLoading(false); }).catch(console.error);

  useEffect(() => { load(); }, []);

  const handleApkUpload = async (appId, file, version) => {
    if (!file) return;
    setUploadingId(appId);
    try {
      await api.uploadApk(appId, file, version);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleApkDelete = async (appId) => {
    if (!confirm('Supprimer l\'APK et le QR code associé ?')) return;
    try {
      await api.deleteApk(appId);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nouvelle application
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            uploading={uploadingId === app.id}
            onUpload={(file, version) => handleApkUpload(app.id, file, version)}
            onDeleteApk={() => handleApkDelete(app.id)}
            onShowQr={() => setQrPreview(app)}
          />
        ))}
      </div>

      {apps.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          Aucune application. Créez-en une pour commencer.
        </div>
      )}

      {showCreate && <CreateAppModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {qrPreview && <QrModal app={qrPreview} onClose={() => setQrPreview(null)} />}
    </div>
  );
}

function AppCard({ app, uploading, onUpload, onDeleteApk, onShowQr }) {
  const fileRef = useRef(null);
  const [version, setVersion] = useState('');
  const hasApk = !!app.apkFileName;

  const triggerUpload = () => fileRef.current?.click();
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, version);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-900">{app.name}</h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{app.code}</span>
          </div>
          {app.description && <p className="text-sm text-gray-500">{app.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{app.totalLicenses ?? 0} licence(s)</p>
        </div>
      </div>

      {hasApk ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{app.apkFileName}</div>
              <div className="text-xs text-gray-500">
                {app.apkVersion && <span>v{app.apkVersion} · </span>}
                {app.apkUpdatedAt && <span>{new Date(app.apkUpdatedAt).toLocaleDateString()}</span>}
              </div>
            </div>
            <button
              onClick={onShowQr}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
              title="Voir le QR code"
            >
              <QrCode size={18} />
            </button>
            <a
              href={app.apkUrl}
              download
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
              title="Télécharger"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onDeleteApk}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Nouvelle version (ex: 1.2.3)"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={triggerUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Upload size={16} />
              {uploading ? 'Upload...' : 'Remplacer'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
            Aucun APK uploadé
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Version (ex: 1.2.3)"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={triggerUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Upload size={16} />
              {uploading ? 'Upload...' : 'Uploader APK'}
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".apk,application/vnd.android.package-archive"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}

function QrModal({ app, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="font-bold text-gray-900 mb-1">{app.name}</h3>
        <p className="text-sm text-gray-500 mb-6">Scanner pour télécharger l'APK</p>
        <div className="flex justify-center mb-4">
          <img src={app.qrcodeUrl} alt="QR Code" className="w-64 h-64" />
        </div>
        <div className="text-xs text-center text-gray-500 break-all bg-gray-50 p-3 rounded-lg">
          {app.apkUrl}
        </div>
      </div>
    </div>
  );
}

function CreateAppModal({ onClose, onCreated }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createApp({ code, name, description });
      onCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="font-bold text-gray-900 mb-6">Nouvelle application</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input
              required
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SS"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SmartSales"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
